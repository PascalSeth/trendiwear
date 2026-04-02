"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import { Plus, Upload, X, Clock, DollarSign, Home, FileText, Sparkles, ImageIcon } from "lucide-react";
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
  variants?: Array<{
    id: string;
    name: string;
    description?: string;
    price: number;
    durationMinutes: number;
    isActive: boolean;
  }>;
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

const ServiceSheet: React.FC<ServiceSheetProps> = ({
  categories = [],
  onServiceAdded,
  serviceToEdit,
  onServiceUpdated,
  onClose,
}) => {
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
    formData.append("bucket", "images");
    formData.append("folder", "services");

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
        isCustom: !serviceToEdit, // Professionals create custom services by default
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
        <Button className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/30">
          <Plus className="h-4 w-4" />
          Add Service
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-xl overflow-y-auto">
        <SheetHeader className="pb-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl">
              <Sparkles className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <SheetTitle className="text-xl">{serviceToEdit ? 'Edit Service' : 'Create New Service'}</SheetTitle>
              <SheetDescription className="text-sm">
                {serviceToEdit ? 'Update the service details below.' : 'Fill in the details to create a new service.'}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Category Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">Category *</Label>
            <Select
              value={formData.categoryId}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, categoryId: value }))}
            >
              <SelectTrigger className="h-11 bg-slate-50 border-slate-200 focus:bg-white">
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

          {/* Service Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-slate-700">Service Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Custom Suit Tailoring"
              className="h-11 bg-slate-50 border-slate-200 focus:bg-white"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <FileText size={14} className="text-slate-400" />
              Description
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Describe what this service includes..."
              className="bg-slate-50 border-slate-200 focus:bg-white resize-none"
              rows={3}
            />
          </div>

          {/* Price & Duration Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <DollarSign size={14} className="text-emerald-500" />
                Price ($) *
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
                placeholder="0.00"
                className="h-11 bg-slate-50 border-slate-200 focus:bg-white"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Clock size={14} className="text-blue-500" />
                Duration (min) *
              </Label>
              <Input
                id="duration"
                type="number"
                min="1"
                value={formData.duration}
                onChange={(e) => setFormData((prev) => ({ ...prev, duration: e.target.value }))}
                placeholder="60"
                className="h-11 bg-slate-50 border-slate-200 focus:bg-white"
                required
              />
            </div>
          </div>

          {/* Service Image */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <ImageIcon size={14} className="text-purple-500" />
              Service Image
            </Label>
            {imagePreview ? (
              <div className="relative w-full h-48 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                <Image
                  src={imagePreview}
                  alt="Service preview"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={removeImage}
                    className="gap-2"
                  >
                    <X className="h-4 w-4" />
                    Remove
                  </Button>
                </div>
              </div>
            ) : (
              <label htmlFor="image" className="block cursor-pointer">
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Upload className="h-5 w-5 text-slate-400" />
                    </div>
                    <p className="text-sm text-slate-600 font-medium">
                      Click to upload an image
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      PNG, JPG or WebP up to 5MB
                    </p>
                  </div>
                </div>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Requirements */}
          <div className="space-y-2">
            <Label htmlFor="requirements" className="text-sm font-medium text-slate-700">Requirements</Label>
            <Textarea
              id="requirements"
              value={formData.requirements}
              onChange={(e) => setFormData((prev) => ({ ...prev, requirements: e.target.value }))}
              placeholder="What does the customer need to bring or prepare?"
              className="bg-slate-50 border-slate-200 focus:bg-white resize-none"
              rows={2}
            />
          </div>

          {/* Toggle Options */}
          <div className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Home size={16} className="text-purple-600" />
                </div>
                <div>
                  <Label htmlFor="isHomeService" className="text-sm font-medium text-slate-700 cursor-pointer">
                    Home Service
                  </Label>
                  <p className="text-xs text-slate-500">Service can be provided at customer&apos;s location</p>
                </div>
              </div>
              <Switch
                id="isHomeService"
                checked={formData.isHomeService}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isHomeService: checked }))}
              />
            </div>

            <div className="border-t border-slate-200"></div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${formData.isActive ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                  <Sparkles size={16} className={formData.isActive ? 'text-emerald-600' : 'text-slate-400'} />
                </div>
                <div>
                  <Label htmlFor="isActive" className="text-sm font-medium text-slate-700 cursor-pointer">
                    Active Status
                  </Label>
                  <p className="text-xs text-slate-500">{formData.isActive ? 'Service is visible to customers' : 'Service is hidden from customers'}</p>
                </div>
              </div>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isActive: checked }))}
              />
            </div>
          </div>
        </div>

        <SheetFooter className="pt-6 border-t border-slate-100 gap-3">
          <SheetClose asChild>
            <Button type="button" variant="outline" disabled={isLoading} className="flex-1">
              Cancel
            </Button>
          </SheetClose>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !formData.name.trim() || !formData.categoryId || !formData.price || !formData.duration}
            className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
          >
            {isLoading ? (serviceToEdit ? "Updating..." : "Creating...") : (serviceToEdit ? "Update Service" : "Create Service")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default ServiceSheet;