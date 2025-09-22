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
import type { Season } from "@prisma/client";
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
  _count?: {
    outfitInspirations: number;
  };
};

interface EventSheetProps {
  onEventAdded: (event: Event) => void;
  eventToEdit?: Event;
  onEventUpdated?: (event: Event) => void;
  onClose?: () => void;
}

const EventSheet: React.FC<EventSheetProps> = ({
  onEventAdded,
  eventToEdit,
  onEventUpdated,
  onClose,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    dressCodes: [] as string[],
    seasonality: [] as Season[],
  });

  React.useEffect(() => {
    if (eventToEdit) {
      setFormData({
        name: eventToEdit.name,
        description: eventToEdit.description || "",
        dressCodes: eventToEdit.dressCodes || [],
        seasonality: (eventToEdit.seasonality || []) as Season[],
      });
      if (eventToEdit.imageUrl) {
        setImagePreview(eventToEdit.imageUrl);
      }
      setIsOpen(true);
    }
  }, [eventToEdit]);

  const handleImageUpload = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", "events");
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
      alert("Event name is required");
      return;
    }

    setIsLoading(true);

    try {
      let imageUrl: string | undefined;

      if (imageFile) {
        imageUrl = await handleImageUpload(imageFile);
      }

      const eventData = {
        name: formData.name,
        description: formData.description || undefined,
        imageUrl,
        dressCodes: formData.dressCodes,
        seasonality: formData.seasonality,
      };

      const url = eventToEdit ? `/api/events/${eventToEdit.id}` : "/api/events";
      const method = eventToEdit ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to ${eventToEdit ? 'update' : 'create'} event`);
      }

      const eventFromAPI = await response.json();

      if (eventToEdit && onEventUpdated) {
        onEventUpdated(eventFromAPI);
      } else {
        onEventAdded(eventFromAPI);
      }

      // Reset form only for new events
      if (!eventToEdit) {
        setFormData({
          name: "",
          description: "",
          dressCodes: [],
          seasonality: [],
        });
        setImageFile(null);
        setImagePreview(null);
      }

      alert(`Event ${eventToEdit ? 'updated' : 'created'} successfully!`);
    } catch (error) {
      console.error(`Error ${eventToEdit ? 'updating' : 'creating'} event:`, error);
      alert(error instanceof Error ? error.message : `Failed to ${eventToEdit ? 'update' : 'create'} event`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Reset form when closing
      setFormData({
        name: "",
        description: "",
        dressCodes: [],
        seasonality: [],
      });
      setImageFile(null);
      setImagePreview(null);
      // Call onClose callback if provided
      if (onClose) {
        onClose();
      }
    }
  };

  const addDressCode = () => {
    setFormData(prev => ({
      ...prev,
      dressCodes: [...prev.dressCodes, ""]
    }));
  };

  const updateDressCode = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      dressCodes: prev.dressCodes.map((code, i) => i === index ? value : code)
    }));
  };

  const removeDressCode = (index: number) => {
    setFormData(prev => ({
      ...prev,
      dressCodes: prev.dressCodes.filter((_, i) => i !== index)
    }));
  };

  const addSeason = () => {
    setFormData(prev => ({
      ...prev,
      seasonality: [...prev.seasonality, "SPRING" as Season]
    }));
  };

  const updateSeason = (index: number, value: Season) => {
    setFormData(prev => ({
      ...prev,
      seasonality: prev.seasonality.map((season, i) => i === index ? value : season)
    }));
  };

  const removeSeason = (index: number) => {
    setFormData(prev => ({
      ...prev,
      seasonality: prev.seasonality.filter((_, i) => i !== index)
    }));
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Event
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{eventToEdit ? 'Edit Event' : 'Add Event'}</SheetTitle>
          <SheetDescription>
            {eventToEdit ? 'Update the event details.' : 'Create a new event for fashion trends.'}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Event Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Summer Wedding 2024"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of this event..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Dress Codes</Label>
            {formData.dressCodes.map((code, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={code}
                  onChange={(e) => updateDressCode(index, e.target.value)}
                  placeholder="e.g., Black Tie, Cocktail, Casual"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => removeDressCode(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addDressCode}>
              Add Dress Code
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Seasonality</Label>
            {formData.seasonality.map((season, index) => (
              <div key={index} className="flex gap-2">
                <Select
                  value={season}
                  onValueChange={(value: Season) => updateSeason(index, value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SPRING">Spring</SelectItem>
                    <SelectItem value="SUMMER">Summer</SelectItem>
                    <SelectItem value="FALL">Fall</SelectItem>
                    <SelectItem value="WINTER">Winter</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => removeSeason(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addSeason}>
              Add Season
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Event Image</Label>
            {imagePreview ? (
              <div className="relative w-full h-32">
                <Image
                  src={imagePreview}
                  alt="Event preview"
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
            {isLoading ? (eventToEdit ? "Updating..." : "Creating...") : (eventToEdit ? "Update Event" : "Create Event")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default EventSheet;