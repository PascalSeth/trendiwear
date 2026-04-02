"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Plus, Sparkles, Loader2, Trash2, Pencil, Tag, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface TrendEventOption {
  id: string;
  name: string;
}

interface ApiEvent {
  id: string;
  name: string;
}

interface OutfitInspiration {
  id: string;
  title: string;
  description: string | null;
  outfitImageUrl: string;
  totalPrice: number | null;
  tags: string[];
  isFeatured: boolean;
  isActive: boolean;
  likes: number;
  event: {
    id: string;
    name: string;
  };
  stylist: {
    firstName: string;
    lastName: string;
    professionalProfile?: {
      businessName: string | null;
    } | null;
  };
  products: Array<{
    product: {
      id: string;
      currency: string;
    };
  }>;
  _count: {
    savedByUsers: number;
  };
}

interface OutfitFormData {
  eventId: string;
  title: string;
  description: string;
  outfitImageUrl: string;
  totalPrice: string;
  tags: string;
  isFeatured: boolean;
  isActive: boolean;
}

interface OutfitPayload {
  eventId: string;
  title: string;
  description?: string;
  outfitImageUrl: string;
  totalPrice?: number;
  tags: string[];
  isFeatured?: boolean;
  isActive?: boolean;
}

const getDefaultOutfitForm = (): OutfitFormData => ({
  eventId: "",
  title: "",
  description: "",
  outfitImageUrl: "",
  totalPrice: "",
  tags: "",
  isFeatured: false,
  isActive: true,
});

export default function OutfitInspirationsTrendsPage() {
  const [events, setEvents] = useState<TrendEventOption[]>([]);
  const [outfits, setOutfits] = useState<OutfitInspiration[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filterEventId, setFilterEventId] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedOutfit, setSelectedOutfit] = useState<OutfitInspiration | null>(null);
  const [formData, setFormData] = useState<OutfitFormData>(getDefaultOutfitForm());
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const fetchEvents = async () => {
    try {
      const res = await fetch("/api/events");
      if (!res.ok) throw new Error("Failed to load events");
      const data: ApiEvent[] = await res.json();
      setEvents((data || []).map((e) => ({ id: e.id, name: e.name })));
    } catch (error) {
      console.error(error);
      toast.error("Failed to load events");
    }
  };

  const fetchOutfits = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("limit", "24");
      if (filterEventId) params.set("eventId", filterEventId);

      const res = await fetch(`/api/outfit-inspirations?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load outfit inspirations");
      const data: { outfits: OutfitInspiration[] } = await res.json();
      setOutfits(data.outfits || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load outfit inspirations");
    } finally {
      setLoading(false);
    }
  }, [filterEventId]);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    fetchOutfits();
  }, [fetchOutfits]);

  const openCreateDialog = () => {
    setSelectedOutfit(null);
    setFormData(getDefaultOutfitForm());
    setImageFile(null);
    setImagePreview(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (outfit: OutfitInspiration) => {
    setSelectedOutfit(outfit);
    setFormData({
      eventId: outfit.event.id,
      title: outfit.title,
      description: outfit.description || "",
      outfitImageUrl: outfit.outfitImageUrl,
      totalPrice: outfit.totalPrice?.toString() || "",
      tags: (outfit.tags || []).join(", "),
      isFeatured: outfit.isFeatured,
      isActive: outfit.isActive,
    });
    setImageFile(null);
    setImagePreview(outfit.outfitImageUrl || null);
    setIsDialogOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!formData.eventId || !formData.title) {
      toast.error("Event and title are required");
      return;
    }

    let outfitImageUrl = formData.outfitImageUrl;

    if (imageFile) {
      try {
        const uploadData = new FormData();
        uploadData.append("file", imageFile);
        uploadData.append("bucket", "images");
        uploadData.append("folder", "outfit-inspirations");

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: uploadData,
        });

        if (!uploadRes.ok) {
          const err = await uploadRes.json().catch(() => null);
          throw new Error(err?.error || "Failed to upload image");
        }

        const uploaded = await uploadRes.json();
        outfitImageUrl = uploaded.url;
      } catch (error) {
        console.error(error);
        toast.error(error instanceof Error ? error.message : "Image upload failed");
        return;
      }
    }

    const isEdit = Boolean(selectedOutfit);

    const payload: OutfitPayload = {
      eventId: formData.eventId,
      title: formData.title,
      description: formData.description || undefined,
      outfitImageUrl,
      totalPrice: formData.totalPrice ? Number.parseFloat(formData.totalPrice) : undefined,
      tags: formData.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      ...(isEdit
        ? {
            isFeatured: formData.isFeatured,
            isActive: formData.isActive,
          }
        : {}),
    };

    try {
      setSaving(true);
      const url = isEdit
        ? `/api/outfit-inspirations/${selectedOutfit!.id}`
        : "/api/outfit-inspirations";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Failed to save outfit inspiration");
      }

      toast.success(isEdit ? "Outfit inspiration updated" : "Outfit inspiration created");
      setIsDialogOpen(false);
      setSelectedOutfit(null);
      setFormData(getDefaultOutfitForm());
      setImageFile(null);
      setImagePreview(null);
      fetchOutfits();
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Failed to save outfit inspiration");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (outfit: OutfitInspiration) => {
    if (!confirm(`Delete outfit "${outfit.title}"?`)) return;

    try {
      setDeletingId(outfit.id);
      const res = await fetch(`/api/outfit-inspirations/${outfit.id}` , {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Failed to delete outfit inspiration");
      }
      toast.success("Outfit inspiration deleted");
      fetchOutfits();
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Failed to delete outfit inspiration");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto py-8 px-4 md:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5" /> Outfit Inspirations
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Curated Pinterest-style looks, linked to events and products.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select
              value={filterEventId}
              onValueChange={(value) => setFilterEventId(value)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All events" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All events</SelectItem>
                {events.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={openCreateDialog} className="gap-2">
            <Plus className="h-4 w-4" /> New Inspiration
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : outfits.length === 0 ? (
        <div className="border border-dashed rounded-lg p-10 text-center text-sm text-muted-foreground">
          No outfit inspirations yet. Create your first look to bring events to life.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {outfits.map((outfit) => (
            <Card key={outfit.id} className="overflow-hidden group flex flex-col">
              <div className="relative aspect-[3/4] bg-muted overflow-hidden">
                <Image
                  src={outfit.outfitImageUrl}
                  alt={outfit.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-full bg-white/90 text-[10px] uppercase tracking-[0.2em]">
                      {outfit.event.name}
                    </span>
                    {outfit.isFeatured && (
                      <Badge variant="secondary" className="bg-amber-400/90 text-xs">
                        Featured
                      </Badge>
                    )}
                  </div>
                  <p className="text-white font-semibold text-lg line-clamp-1">
                    {outfit.title}
                  </p>
                  <p className="text-xs text-white/80 line-clamp-1">
                    {outfit.stylist.professionalProfile?.businessName || `${outfit.stylist.firstName} ${outfit.stylist.lastName}`}
                  </p>
                </div>
              </div>

              <CardContent className="flex-1 flex flex-col p-4 space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {outfit.description || "No description"}
                </p>

                {outfit.tags && outfit.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {outfit.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-[10px] flex items-center gap-1">
                        <Tag className="h-3 w-3" /> {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-3 mt-auto border-t">
                  <span>
                    Saves: {outfit._count.savedByUsers} • Likes: {outfit.likes}
                  </span>
                  <span>
                    {outfit.totalPrice ? `${outfit.products?.[0]?.product?.currency || 'GHS'} ${outfit.totalPrice.toFixed(2)}` : ""}
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => openEditDialog(outfit)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(outfit)}
                    disabled={deletingId === outfit.id}
                  >
                    {deletingId === outfit.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedOutfit ? "Edit Inspiration" : "New Inspiration"}</DialogTitle>
            <DialogDescription>
              Link inspirations to events so the public fashion trends gallery can group looks by occasion.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Event</label>
              <Select
                value={formData.eventId}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, eventId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select event" />
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
              <label className="text-sm font-medium">Title</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="e.g. Sunset Rooftop Date Look"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Look Image</label>
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
              />
              {imagePreview && (
                <div className="mt-2 relative w-full h-40 rounded-md overflow-hidden border">
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Upload an image file (max 5MB). Existing image will be kept if no file is selected.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
                placeholder="Short editorial description of the look."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tags</label>
                <Input
                  value={formData.tags}
                  onChange={(e) => setFormData((prev) => ({ ...prev, tags: e.target.value }))}
                  placeholder="Comma separated, e.g. elegant, minimal"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Total Price (optional)</label>
                <Input
                  value={formData.totalPrice}
                  onChange={(e) => setFormData((prev) => ({ ...prev, totalPrice: e.target.value }))}
                  placeholder="e.g. 850"
                />
              </div>
            </div>

            {selectedOutfit && (
              <div className="flex items-center gap-4 pt-2">
                <div className="flex items-center gap-2 text-xs">
                  <input
                    id="featured"
                    type="checkbox"
                    className="h-3 w-3"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData((prev) => ({ ...prev, isFeatured: e.target.checked }))}
                  />
                  <label htmlFor="featured">Mark as featured</label>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <input
                    id="active"
                    type="checkbox"
                    className="h-3 w-3"
                    checked={formData.isActive}
                    onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
                  />
                  <label htmlFor="active">Active</label>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
