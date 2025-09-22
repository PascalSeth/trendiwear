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
import Image from "next/image";

type Event = {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  dressCodes: string[];
  seasonality: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    outfitInspirations: number;
  };
};

export type OutfitInspiration = {
  id: string;
  title: string;
  description?: string;
  outfitImageUrl: string;
  totalPrice?: number;
  tags: string[];
  isFeatured: boolean;
  isActive: boolean;
  likes: number;
  createdAt: string;
  updatedAt: string;
  eventId?: string;
  event: {
    id: string;
    name: string;
  };
  stylist: {
    firstName: string;
    lastName: string;
    professionalProfile?: {
      businessName?: string;
    };
  };
  products: Array<{
    productId: string;
    position?: number;
    notes?: string;
    product: {
      id: string;
      name: string;
      price: number;
      images: string[];
    };
  }>;
  _count: {
    savedByUsers: number;
  };
};

type ProductItem = {
  productId: string;
  position?: number;
  notes?: string;
  product: {
    id: string;
    name: string;
    price: number;
    images: string[];
  };
};

interface OutfitInspirationSheetProps {
  events: Event[];
  onOutfitAdded: (outfit: OutfitInspiration) => void;
  outfitToEdit?: OutfitInspiration;
  onOutfitUpdated?: (outfit: OutfitInspiration) => void;
  onClose?: () => void;
}

const OutfitInspirationSheet: React.FC<OutfitInspirationSheetProps> = ({
  events = [],
  onOutfitAdded,
  outfitToEdit,
  onOutfitUpdated,
  onClose,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [formData, setFormData] = useState({
    eventId: "",
    title: "",
    description: "",
    tags: [] as string[],
    isFeatured: false,
    isActive: true,
  });

  React.useEffect(() => {
    if (outfitToEdit) {
      setFormData({
        eventId: outfitToEdit.eventId || outfitToEdit.event.id,
        title: outfitToEdit.title,
        description: outfitToEdit.description || "",
        tags: outfitToEdit.tags || [],
        isFeatured: outfitToEdit.isFeatured || false,
        isActive: outfitToEdit.isActive ?? true,
      });
      if (outfitToEdit.outfitImageUrl) {
        setImagePreview(outfitToEdit.outfitImageUrl);
      }
      setProducts(outfitToEdit.products || []);
      setIsOpen(true);
    }
  }, [outfitToEdit]);

  const handleImageUpload = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", "outfits");
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


  const removeProduct = (productId: string) => {
    setProducts(prev => prev.filter(p => p.productId !== productId));
  };

  const updateProductNotes = (productId: string, notes: string) => {
    setProducts(prev => prev.map(p =>
      p.productId === productId ? { ...p, notes } : p
    ));
  };

  const addTag = () => {
    setFormData(prev => ({
      ...prev,
      tags: [...prev.tags, ""]
    }));
  };

  const updateTag = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.map((tag, i) => i === index ? value : tag)
    }));
  };

  const removeTag = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.eventId) {
      alert("Title and event are required");
      return;
    }

    setIsLoading(true);

    try {
      let outfitImageUrl: string | undefined;

      if (imageFile) {
        outfitImageUrl = await handleImageUpload(imageFile);
      }

      const outfitData = {
        eventId: formData.eventId,
        title: formData.title,
        description: formData.description || undefined,
        outfitImageUrl,
        tags: formData.tags.filter(tag => tag.trim()),
        products: products.map(p => ({
          productId: p.productId,
          position: p.position,
          notes: p.notes || undefined,
        })),
        isFeatured: formData.isFeatured,
        isActive: formData.isActive,
      };

      const url = outfitToEdit ? `/api/outfit-inspirations/${outfitToEdit.id}` : "/api/outfit-inspirations";
      const method = outfitToEdit ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(outfitData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to ${outfitToEdit ? 'update' : 'create'} outfit inspiration`);
      }

      const outfitFromAPI = await response.json();

      if (outfitToEdit && onOutfitUpdated) {
        onOutfitUpdated(outfitFromAPI);
      } else {
        onOutfitAdded(outfitFromAPI);
      }

      // Reset form only for new outfits
      if (!outfitToEdit) {
        setFormData({
          eventId: "",
          title: "",
          description: "",
          tags: [],
          isFeatured: false,
          isActive: true,
        });
        setImageFile(null);
        setImagePreview(null);
        setProducts([]);
      }

      alert(`Outfit inspiration ${outfitToEdit ? 'updated' : 'created'} successfully!`);
    } catch (error) {
      console.error(`Error ${outfitToEdit ? 'updating' : 'creating'} outfit inspiration:`, error);
      alert(error instanceof Error ? error.message : `Failed to ${outfitToEdit ? 'update' : 'create'} outfit inspiration`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Reset form when closing
      setFormData({
        eventId: "",
        title: "",
        description: "",
        tags: [],
        isFeatured: false,
        isActive: true,
      });
      setImageFile(null);
      setImagePreview(null);
      setProducts([]);
      // Call onClose callback if provided
      if (onClose) {
        onClose();
      }
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Outfit Inspiration
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{outfitToEdit ? 'Edit Outfit Inspiration' : 'Add Outfit Inspiration'}</SheetTitle>
          <SheetDescription>
            {outfitToEdit ? 'Update the outfit inspiration details.' : 'Create a new outfit inspiration for an event.'}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label>Event *</Label>
            <Select
              value={formData.eventId}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, eventId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an event" />
              </SelectTrigger>
              <SelectContent>
                {events.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Elegant Summer Wedding Look"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Describe this outfit inspiration..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            {formData.tags.map((tag, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={tag}
                  onChange={(e) => updateTag(index, e.target.value)}
                  placeholder="e.g., wedding, summer, elegant"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => removeTag(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addTag}>
              Add Tag
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Outfit Image</Label>
            {imagePreview ? (
              <div className="relative w-full h-48">
                <Image
                  src={imagePreview}
                  alt="Outfit preview"
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

          <div className="space-y-2">
            <Label>Products</Label>
            <div className="space-y-2">
              {products.map((productItem) => (
                <div key={productItem.productId} className="flex items-center gap-2 p-2 border rounded">
                  <div className="w-8 h-8 relative">
                    <Image
                      src={productItem.product.images?.[0] || ""}
                      alt={productItem.product.name}
                      fill
                      className="object-cover rounded"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{productItem.product.name}</div>
                    <div className="text-xs text-gray-500">${productItem.product.price}</div>
                  </div>
                  <Input
                    placeholder="Notes (optional)"
                    value={productItem.notes}
                    onChange={(e) => updateProductNotes(productItem.productId, e.target.value)}
                    className="w-32 text-xs"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeProduct(productItem.productId)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="text-sm text-gray-600">
              Total: ${products.reduce((sum, p) => sum + p.product.price, 0).toFixed(2)}
            </div>
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
            disabled={isLoading || !formData.title.trim() || !formData.eventId}
          >
            {isLoading ? (outfitToEdit ? "Updating..." : "Creating...") : (outfitToEdit ? "Update Outfit" : "Create Outfit")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default OutfitInspirationSheet;