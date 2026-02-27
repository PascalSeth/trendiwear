"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Calendar, Plus, Pencil, Trash2, Tag, Loader2 } from "lucide-react";
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
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

// Valid Season enum values from Prisma schema
const SEASON_OPTIONS = [
  { value: "SPRING", label: "Spring" },
  { value: "SUMMER", label: "Summer" },
  { value: "FALL", label: "Fall" },
  { value: "WINTER", label: "Winter" },
  { value: "ALL_SEASON", label: "All Season" },
] as const;

interface TrendEvent {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  dressCodes: string[];
  seasonality: string[];
  _count: {
    outfitInspirations: number;
  };
}

interface EventFormData {
  name: string;
  description: string;
  imageUrl: string;
  dressCodes: string;
  seasonality: string[];
}

const getDefaultEventForm = (): EventFormData => ({
  name: "",
  description: "",
  imageUrl: "",
  dressCodes: "",
  seasonality: [],
});

export default function EventsTrendsPage() {
  const [events, setEvents] = useState<TrendEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<TrendEvent | null>(null);
  const [formData, setFormData] = useState<EventFormData>(getDefaultEventForm());
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/events");
      if (!res.ok) throw new Error("Failed to load events");
      const data: TrendEvent[] = await res.json();
      setEvents(data || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setSelectedEvent(null);
    setFormData(getDefaultEventForm());
    setImageFile(null);
    setImagePreview(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (event: TrendEvent) => {
    setSelectedEvent(event);
    setFormData({
      name: event.name,
      description: event.description || "",
      imageUrl: event.imageUrl || "",
      dressCodes: (event.dressCodes || []).join(", "),
      seasonality: event.seasonality || [],
    });
    setImageFile(null);
    setImagePreview(event.imageUrl || null);
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
    if (!formData.name) {
      toast.error("Name is required");
      return;
    }

    let imageUrl = formData.imageUrl;

    if (imageFile) {
      try {
        const uploadData = new FormData();
        uploadData.append("file", imageFile);
        uploadData.append("bucket", "images");
        uploadData.append("folder", "events");

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: uploadData,
        });

        if (!uploadRes.ok) {
          const err = await uploadRes.json().catch(() => null);
          throw new Error(err?.error || "Failed to upload image");
        }

        const uploaded = await uploadRes.json();
        imageUrl = uploaded.url;
      } catch (error) {
        console.error(error);
        toast.error(error instanceof Error ? error.message : "Image upload failed");
        return;
      }
    }

    const payload = {
      name: formData.name,
      description: formData.description || undefined,
      imageUrl: imageUrl || undefined,
      dressCodes: formData.dressCodes
        .split(",")
        .map((d) => d.trim())
        .filter(Boolean),
      seasonality: formData.seasonality,
    };

    try {
      setSaving(true);
      const isEdit = Boolean(selectedEvent);
      const url = isEdit ? `/api/events/${selectedEvent!.id}` : "/api/events";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Failed to save event");
      }

      toast.success(isEdit ? "Event updated" : "Event created");
      setIsDialogOpen(false);
      setSelectedEvent(null);
      setFormData(getDefaultEventForm());
      setImageFile(null);
      setImagePreview(null);
      fetchEvents();
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Failed to save event");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (event: TrendEvent) => {
    if (!confirm(`Delete event "${event.name}"?`)) return;

    try {
      setDeletingId(event.id);
      const res = await fetch(`/api/events/${event.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Failed to delete event");
      }
      toast.success("Event deleted");
      fetchEvents();
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Failed to delete event");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto py-8 px-4 md:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5" /> Events & Occasions
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Curate events that power your fashion inspiration gallery.
          </p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2">
          <Plus className="h-4 w-4" /> New Event
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : events.length === 0 ? (
        <div className="border border-dashed rounded-lg p-10 text-center text-sm text-muted-foreground">
          No events yet. Create your first event to start organizing outfit inspirations.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <Card key={event.id} className="overflow-hidden flex flex-col group">
              <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                {event.imageUrl ? (
                  <Image
                    src={event.imageUrl}
                    alt={event.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                    No image
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-white/70 uppercase tracking-[0.2em] mb-1">
                      {event.seasonality.length > 0 ? event.seasonality.join(" • ") : "All Seasons"}
                    </p>
                    <p className="text-white font-semibold text-lg line-clamp-1">{event.name}</p>
                  </div>
                  <Badge variant="secondary" className="bg-white/90 text-xs font-mono">
                    {event._count?.outfitInspirations ?? 0} looks
                  </Badge>
                </div>
              </div>

              <CardContent className="flex-1 flex flex-col p-4 space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {event.description || "No description"}
                </p>

                {event.dressCodes && event.dressCodes.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {event.dressCodes.map((code) => (
                      <Badge key={code} variant="outline" className="text-[10px] flex items-center gap-1">
                        <Tag className="h-3 w-3" /> {code}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-3 mt-auto border-t text-xs text-muted-foreground">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => openEditDialog(event)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(event)}
                    disabled={deletingId === event.id}
                  >
                    {deletingId === event.id ? (
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
            <DialogTitle>{selectedEvent ? "Edit Event" : "New Event"}</DialogTitle>
            <DialogDescription>
              Events power the public fashion trends gallery. Use clear names and strong imagery.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Romantic Dinner, Office Edit, Streetwear Night"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Event Image</label>
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
              />
              {imagePreview && (
                <div className="mt-2 relative w-full h-32 rounded-md overflow-hidden border">
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Upload an image file (max 5MB). Existing URL will be kept if no file is selected.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
                placeholder="Short editorial description of the event or occasion."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Dress Codes</label>
                <Input
                  value={formData.dressCodes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, dressCodes: e.target.value }))}
                  placeholder="Comma separated, e.g. smart casual, black tie"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Seasons</label>
                <div className="flex flex-wrap gap-3 pt-1">
                  {SEASON_OPTIONS.map((season) => (
                    <label key={season.value} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={formData.seasonality.includes(season.value)}
                        onCheckedChange={(checked) => {
                          setFormData((prev) => ({
                            ...prev,
                            seasonality: checked
                              ? [...prev.seasonality, season.value]
                              : prev.seasonality.filter((s) => s !== season.value),
                          }));
                        }}
                      />
                      {season.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
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
