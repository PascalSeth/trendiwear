"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Plus, Upload, X } from "lucide-react";
import { Category } from "@/app/dashboard/types/category";
import Image from "next/image";
import { createSlug } from "@/lib/utils";

interface ProductCategorySheetProps {
  categories: Category[];
  onCategoryAdded: (category: Category) => void;
  categoryToEdit?: Category;
  onCategoryUpdated?: (category: Category) => void;
  onClose?: () => void;
}

const ProductCategorySheet: React.FC<ProductCategorySheetProps> = ({
  categories = [],
  onCategoryAdded,
  categoryToEdit,
  onCategoryUpdated,
  onClose,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    parentId: "",
    order: 0,
  });

  const isEditing = Boolean(categoryToEdit && categoryToEdit.id);

  React.useEffect(() => {
    if (categoryToEdit) {
      setFormData({
        name: categoryToEdit.name,
        slug: categoryToEdit.slug,
        description: categoryToEdit.description || "",
        parentId: categoryToEdit.parentId || "",
        order: categoryToEdit.order,
      });
      if (categoryToEdit.imageUrl) {
        setImagePreview(categoryToEdit.imageUrl);
      }
      setIsOpen(true);
    }
  }, [categoryToEdit]);

  // Auto-calculate order for new categories based on current parent selection
  React.useEffect(() => {
    if (!isEditing && isOpen) {
      const parentIdMatches = (c: Category) => 
        formData.parentId === "none" || formData.parentId === "" 
          ? !c.parentId 
          : c.parentId === formData.parentId;

      const siblings = categories.filter(parentIdMatches);
      const maxOrder = siblings.length > 0 ? Math.max(...siblings.map(c => c.order || 0)) : -1;
      
      setFormData(prev => ({ ...prev, order: maxOrder + 1 }));
    }
  }, [formData.parentId, isEditing, isOpen, categories]);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Reset form when closing
      setFormData({
        name: "",
        slug: "",
        description: "",
        parentId: "",
        order: 0,
      });
      setImageFile(null);
      setImagePreview(null);
      // Call onClose callback if provided
      if (onClose) {
        onClose();
      }
    }
  };


  const handleNameChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      name: value,
      slug: createSlug(value),
    }));
  };

  const handleImageUpload = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", "categories");
    formData.append("folder", "images");

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Image upload failed");
    }

    const { url } = await response.json();
    return url;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      alert("Category name is required");
      return;
    }

    setIsLoading(true);

    try {
      let imageUrl: string | undefined;

      if (imageFile) {
        imageUrl = await handleImageUpload(imageFile);
      }

      const categoryData = {
        name: formData.name,
        slug: formData.slug || createSlug(formData.name),
        description: formData.description || undefined,
        imageUrl,
        parentId: formData.parentId === "none" ? undefined : formData.parentId || undefined,
        order: formData.order,
        ...(isEditing ? {} : { isActive: true }), // Only set isActive for new categories
      };

      const url = isEditing ? `/api/categories/${categoryToEdit!.id}` : "/api/categories";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(categoryData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to ${isEditing ? 'update' : 'create'} category`);
      }

      const categoryFromAPI = await response.json();

      const category: Category = {
        ...categoryFromAPI,
        isActive: categoryFromAPI.isActive ?? true,
        parent: categoryFromAPI.parentId
          ? categories.find((cat) => cat.id === categoryFromAPI.parentId)
          : undefined,
        children: [],
        _count: { products: 0 },
      };

      if (isEditing && onCategoryUpdated) {
        onCategoryUpdated(category);
      } else {
        onCategoryAdded(category);
      }

      // Reset form only for new categories
      if (!isEditing) {
        setFormData({
          name: "",
          slug: "",
          description: "",
          parentId: "",
          order: 0,
        });
        setImageFile(null);
        setImagePreview(null);
      }

      alert(`Category ${isEditing ? 'updated' : 'created'} successfully!`);
    } catch (error) {
      console.error(`Error ${categoryToEdit?.id ? 'updating' : 'creating'} category:`, error);
      alert(error instanceof Error ? error.message : `Failed to ${categoryToEdit?.id ? 'update' : 'create'} category`);
    } finally {
      setIsLoading(false);
    }
  };

  const parentCategories = categories.filter((cat) => !cat.parentId);

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Product Category
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{categoryToEdit?.id ? 'Edit Product Category' : 'Add Product Category'}</SheetTitle>
          <SheetDescription>
            {categoryToEdit?.id ? 'Update the product category details.' : 'Create a new product category to organize your products.'}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Category Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g., Women's Dresses"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">URL Slug *</Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, slug: e.target.value }))
              }
              placeholder="womens-dresses"
              required
            />
            <p className="text-xs text-muted-foreground">
              Auto-generated from name, but editable.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Brief description of this category..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Parent Category</Label>
            <Select
              value={formData.parentId}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, parentId: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select parent category (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Parent (Top Level)</SelectItem>
                {parentCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="order">Display Order</Label>
            <Input
              id="order"
              type="number"
              value={formData.order}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  order: parseInt(e.target.value) || 0,
                }))
              }
              placeholder="0"
              min="0"
            />
            <p className="text-xs text-muted-foreground">
              Lower numbers appear first.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Category Image</Label>
            {imagePreview ? (
              <div className="relative w-full h-32">
                <Image
                  src={imagePreview}
                  alt="Category preview"
                  fill
                  className="object-cover rounded-lg border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-6 w-6 z-10"
                  onClick={removeImage}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <div className="text-center">
                  <Upload className="mx-auto h-8 w-8 text-gray-400" />
                  <div className="mt-2">
                    <Label htmlFor="image" className="cursor-pointer">
                      <span className="text-sm text-blue-600 hover:text-blue-500">
                        Click to upload
                      </span>
                      <span className="text-sm text-gray-500"> or drag and drop</span>
                    </Label>
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    PNG, JPG, GIF up to 5MB
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <SheetFooter className="gap-2">
          <SheetClose asChild>
            <Button type="button" variant="outline" disabled={isLoading}>
              Cancel
            </Button>
          </SheetClose>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !formData.name.trim()}
          >
            {isLoading ? (categoryToEdit?.id ? "Updating..." : "Creating...") : (categoryToEdit?.id ? "Update Category" : "Create Category")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default ProductCategorySheet;