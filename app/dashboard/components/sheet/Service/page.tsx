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

type ServiceCategory = {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    services: number;
  };
};

export type Service = {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration: number;
  imageUrl?: string;
  professionalId: string;
  categoryId: string;
  isHomeService: boolean;
  requirements?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  category: {
    name: string;
  };
  professional: {
    firstName: string;
    lastName: string;
    professionalProfile?: {
      businessName?: string;
    };
  };
  _count: {
    bookings: number;
  };
};

interface ServiceSheetProps {
  categories: ServiceCategory[];
  onServiceAdded: (service: Service) => void;
  serviceToEdit?: Service;
  onServiceUpdated?: (service: Service) => void;
  onClose?: () => void;
}

export default function ServiceSheet({
  categories = [],
  onServiceAdded,
  serviceToEdit,
  onServiceUpdated,
  onClose,
}: ServiceSheetProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    categoryId: "",
    name: "",
    description: "",
    price: "",
    duration: "",
    isHomeService: false,
    requirements: "",
    isActive: true,
  });

  React.useEffect(() => {
    if (serviceToEdit) {
      setFormData({
        categoryId: serviceToEdit.categoryId,
        name: serviceToEdit.name,
        description: serviceToEdit.description || "",
        price: serviceToEdit.price.toString(),
        duration: serviceToEdit.duration.toString(),
        isHomeService: serviceToEdit.isHomeService,
        requirements: serviceToEdit.requirements || "",
        isActive: serviceToEdit.isActive,
      });
      if (serviceToEdit.imageUrl) {
        setImagePreview(serviceToEdit.imageUrl);
      }
      setIsOpen(true);
    }
  }, [serviceToEdit]);

  const handleImageUpload = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", "services");
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
    if (!formData.name.trim() || !formData.categoryId || !formData.price || !formData.duration) {
      alert("Name, category, price, and duration are required");
      return;
    }

    setIsLoading(true);

    try {
      let imageUrl: string | undefined;

      if (imageFile) {
        imageUrl = await handleImageUpload(imageFile);
      }

      const serviceData = {
        categoryId: formData.categoryId,
        name: formData.name,
        description: formData.description || undefined,
        price: parseFloat(formData.price),
        duration: parseInt(formData.duration),
        imageUrl,
        isHomeService: formData.isHomeService,
        requirements: formData.requirements || undefined,
        isActive: formData.isActive,
      };

      const url = serviceToEdit ? `/api/services/${serviceToEdit.id}` : "/api/services";
      const method = serviceToEdit ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(serviceData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to ${serviceToEdit ? 'update' : 'create'} service`);
      }

      const serviceFromAPI = await response.json();

      if (serviceToEdit && onServiceUpdated) {
        onServiceUpdated(serviceFromAPI);
      } else {
        onServiceAdded(serviceFromAPI);
      }

      // Reset form only for new services
      if (!serviceToEdit) {
        setFormData({
          categoryId: "",
          name: "",
          description: "",
          price: "",
          duration: "",
          isHomeService: false,
          requirements: "",
          isActive: true,
        });
        setImageFile(null);
        setImagePreview(null);
      }

      alert(`Service ${serviceToEdit ? 'updated' : 'created'} successfully!`);
    } catch (error) {
      console.error(`Error ${serviceToEdit ? 'updating' : 'creating'} service:`, error);
      alert(error instanceof Error ? error.message : `Failed to ${serviceToEdit ? 'update' : 'create'} service`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Reset form when closing
      setFormData({
        categoryId: "",
        name: "",
        description: "",
        price: "",
        duration: "",
        isHomeService: false,
        requirements: "",
        isActive: true,
      });
      setImageFile(null);
      setImagePreview(null);
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
          Add Service
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{serviceToEdit ? 'Edit Service' : 'Add Service'}</SheetTitle>
          <SheetDescription>
            {serviceToEdit ? 'Update the service details.' : 'Create a new service offering.'}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label>Category *</Label>
            <Select
              value={formData.categoryId}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, categoryId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Service Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Custom Suit Tailoring"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Describe this service..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price ($) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes) *</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                value={formData.duration}
                onChange={(e) => setFormData((prev) => ({ ...prev, duration: e.target.value }))}
                placeholder="60"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Service Image</Label>
            {imagePreview ? (
              <div className="relative w-full h-48">
                <Image
                  src={imagePreview}
                  alt="Service preview"
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
            <Label htmlFor="requirements">Requirements</Label>
            <Textarea
              id="requirements"
              value={formData.requirements}
              onChange={(e) => setFormData((prev) => ({ ...prev, requirements: e.target.value }))}
              placeholder="What does the customer need to bring/prepare?"
              rows={2}
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isHomeService"
              checked={formData.isHomeService}
              onChange={(e) => setFormData((prev) => ({ ...prev, isHomeService: e.target.checked }))}
              className="rounded"
            />
            <Label htmlFor="isHomeService">Home service available</Label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
              className="rounded"
            />
            <Label htmlFor="isActive">Active</Label>
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
            disabled={isLoading || !formData.name.trim() || !formData.categoryId || !formData.price || !formData.duration}
          >
            {isLoading ? (serviceToEdit ? "Updating..." : "Creating...") : (serviceToEdit ? "Update Service" : "Create Service")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}