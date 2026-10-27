"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import {
  Calendar,
  Plus,
  Pencil,
  Trash2,
  Tag,
  Loader2,
  Search,
  LayoutGrid,
  List,
  Sparkles,
  Layers,
  Image as ImageIcon,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Skeleton } from "@/components/ui/skeleton";

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

function EventCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-3 flex gap-3 items-center shadow-xs">
      <Skeleton className="w-20 h-20 sm:w-22 sm:h-22 rounded-lg shrink-0" />
      <div className="flex-1 space-y-2 min-w-0">
        <div className="flex justify-between items-center">
          <Skeleton className="h-3.5 w-16 rounded" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
        <Skeleton className="h-4 w-3/4 rounded" />
        <Skeleton className="h-3 w-5/6 rounded" />
        <div className="flex gap-1 pt-1">
          <Skeleton className="h-4 w-12 rounded" />
          <Skeleton className="h-4 w-14 rounded" />
        </div>
      </div>
    </div>
  );
}

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

  // Search, filtering, and view mode
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSeason, setSelectedSeason] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

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

  const toggleSeasonalityInForm = (seasonValue: string) => {
    setFormData((prev) => {
      const exists = prev.seasonality.includes(seasonValue);
      return {
        ...prev,
        seasonality: exists
          ? prev.seasonality.filter((s) => s !== seasonValue)
          : [...prev.seasonality, seasonValue],
      };
    });
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

  // Computed metrics
  const totalLooks = useMemo(() => {
    return events.reduce((acc, ev) => acc + (ev._count?.outfitInspirations || 0), 0);
  }, [events]);

  const uniqueDressCodesCount = useMemo(() => {
    const codes = new Set<string>();
    events.forEach((ev) => ev.dressCodes?.forEach((c) => codes.add(c.toLowerCase())));
    return codes.size;
  }, [events]);

  const activeSeasonsCount = useMemo(() => {
    const seasons = new Set<string>();
    events.forEach((ev) => ev.seasonality?.forEach((s) => seasons.add(s)));
    return seasons.size;
  }, [events]);

  // Filtered list
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (event.description && event.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        event.dressCodes?.some((dc) => dc.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesSeason =
        selectedSeason === "ALL" ||
        event.seasonality?.includes(selectedSeason) ||
        (selectedSeason === "ALL_SEASON" && (event.seasonality?.length === 0 || event.seasonality?.includes("ALL_SEASON")));

      return matchesSearch && matchesSeason;
    });
  }, [events, searchQuery, selectedSeason]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 sm:space-y-5 p-3 sm:p-5 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">
              Occasions &amp; Moments
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Calendar className="h-4 w-4 text-indigo-600" />
            Events &amp; Occasions
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Curate fashion moments, dress codes, and seasonal styles that organize the outfit inspiration catalog.
          </p>
        </div>
        <Button
          onClick={openCreateDialog}
          className="h-8 sm:h-9 text-xs px-3 sm:px-3.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="h-3.5 w-3.5" />
          New Event
        </Button>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase text-slate-500">
            <span>Total Occasions</span>
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
          </div>
          <div className="text-base sm:text-lg lg:text-xl font-bold font-mono text-slate-900">
            {events.length}
          </div>
        </div>

        <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase text-slate-500">
            <span>Catalog Looks</span>
            <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
          </div>
          <div className="text-base sm:text-lg lg:text-xl font-bold font-mono text-indigo-600">
            {totalLooks}
          </div>
        </div>

        <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase text-slate-500">
            <span>Active Seasons</span>
            <Layers className="h-3.5 w-3.5 text-emerald-500" />
          </div>
          <div className="text-base sm:text-lg lg:text-xl font-bold font-mono text-emerald-600">
            {activeSeasonsCount}
          </div>
        </div>

        <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase text-slate-500">
            <span>Dress Codes</span>
            <Tag className="h-3.5 w-3.5 text-amber-500" />
          </div>
          <div className="text-base sm:text-lg lg:text-xl font-bold font-mono text-slate-900">
            {uniqueDressCodesCount}
          </div>
        </div>
      </div>

      {/* Filter & View Toolbar */}
      <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 flex-1">
          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Search occasions or dress codes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 text-xs rounded-lg border-slate-200"
            />
          </div>

          {/* Season Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedSeason("ALL")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedSeason === "ALL"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All
            </button>
            {SEASON_OPTIONS.map((season) => (
              <button
                key={season.value}
                onClick={() => setSelectedSeason(season.value)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedSeason === season.value
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {season.label}
              </button>
            ))}
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center justify-between sm:justify-end gap-2 border-t md:border-t-0 pt-2 md:pt-0 border-slate-100">
          <span className="text-[11px] text-slate-400 font-mono">
            {filteredEvents.length} {filteredEvents.length === 1 ? "event" : "events"}
          </span>
          <div className="p-0.5 bg-slate-100 rounded-lg border border-slate-200 flex items-center gap-0.5">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md text-xs transition-all ${
                viewMode === "grid"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-400 hover:text-slate-600"
              }`}
              title="Compact Card View"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-md text-xs transition-all ${
                viewMode === "table"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-400 hover:text-slate-600"
              }`}
              title="Table View"
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Content Rendering: Loading / Empty / Grid / Table */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <EventCardSkeleton key={idx} />
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="border border-dashed border-slate-200 rounded-xl p-10 text-center bg-white">
          <Calendar className="h-8 w-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-700">No matching events found</p>
          <p className="text-[11px] text-slate-400 mt-0.5 max-w-sm mx-auto">
            Try adjusting your search terms or seasonal filters, or create a new event occasion.
          </p>
          {searchQuery && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setSelectedSeason("ALL");
              }}
              className="mt-3 h-7 text-xs rounded-lg"
            >
              Clear filters
            </Button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        /* Creative Compact Horizontal Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredEvents.map((event) => (
            <div
              key={event.id}
              className="group bg-white rounded-xl border border-slate-200/80 shadow-xs hover:border-indigo-300 hover:shadow-sm transition-all p-3 flex gap-3 items-center relative overflow-hidden"
            >
              {/* Left Compact Square Thumbnail */}
              <div className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200/80 shadow-2xs">
                {event.imageUrl ? (
                  <Image
                    src={event.imageUrl}
                    alt={event.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50">
                    <ImageIcon className="h-5 w-5 stroke-1" />
                    <span className="text-[9px] mt-0.5 font-mono">No Image</span>
                  </div>
                )}
                {/* Look count overlay badge */}
                <div className="absolute bottom-1 right-1 bg-slate-900/80 backdrop-blur-xs text-white text-[9px] font-mono font-bold px-1.5 py-0.2 rounded flex items-center gap-0.5">
                  <Sparkles className="h-2.5 w-2.5 text-indigo-400" />
                  {event._count?.outfitInspirations ?? 0}
                </div>
              </div>

              {/* Right Content */}
              <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch">
                <div>
                  {/* Top row: Season & Actions */}
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="text-[10px] font-mono font-semibold uppercase text-indigo-600 truncate">
                      {event.seasonality.length > 0 ? event.seasonality.join(" • ") : "All Season"}
                    </span>
                    <div className="flex items-center gap-0.5 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-slate-400 hover:text-slate-900 rounded-md"
                        onClick={() => openEditDialog(event)}
                        title="Edit Event"
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md"
                        onClick={() => handleDelete(event)}
                        disabled={deletingId === event.id}
                        title="Delete Event"
                      >
                        {deletingId === event.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="font-bold text-slate-900 text-xs sm:text-sm truncate group-hover:text-indigo-600 transition-colors">
                    {event.name}
                  </h3>

                  {/* Description snippet */}
                  <p className="text-[11px] text-slate-500 line-clamp-1 leading-snug mt-0.5">
                    {event.description || "No description provided."}
                  </p>
                </div>

                {/* Bottom Dress Codes Tags */}
                <div className="flex flex-wrap gap-1 mt-1.5 pt-1.5 border-t border-slate-100">
                  {event.dressCodes && event.dressCodes.length > 0 ? (
                    event.dressCodes.slice(0, 3).map((code) => (
                      <span
                        key={code}
                        className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-slate-50 border border-slate-200 text-slate-600 truncate max-w-[90px]"
                      >
                        {code}
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-slate-400 italic">Casual / Open</span>
                  )}
                  {event.dressCodes && event.dressCodes.length > 3 && (
                    <span className="text-[9px] font-medium text-slate-400 self-center">
                      +{event.dressCodes.length - 3}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* High-Density Administrative Table View */
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50/70 border-b border-slate-200">
                <tr className="h-9 text-[10px] font-mono uppercase text-slate-500">
                  <th className="text-left py-2 px-3.5 font-semibold">Occasion</th>
                  <th className="text-left py-2 px-3 font-semibold">Seasonality</th>
                  <th className="text-left py-2 px-3 font-semibold">Dress Codes</th>
                  <th className="text-center py-2 px-3 font-semibold">Looks</th>
                  <th className="text-right py-2 px-3.5 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredEvents.map((event) => (
                  <tr key={event.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="relative w-8 h-8 rounded-md bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                          {event.imageUrl ? (
                            <Image src={event.imageUrl} alt={event.name} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                              <ImageIcon className="h-3.5 w-3.5" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate">{event.name}</p>
                          <p className="text-[10px] text-slate-400 truncate max-w-xs">
                            {event.description || "No description"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-[10px] font-mono uppercase font-semibold text-indigo-600">
                        {event.seasonality.length > 0 ? event.seasonality.join(", ") : "All Season"}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex flex-wrap gap-1">
                        {event.dressCodes && event.dressCodes.length > 0 ? (
                          event.dressCodes.map((code) => (
                            <span
                              key={code}
                              className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600"
                            >
                              {code}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 text-[10px]">-</span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <Badge variant="secondary" className="text-[10px] font-mono font-semibold px-2 py-0.5">
                        {event._count?.outfitInspirations ?? 0}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-slate-500 hover:text-slate-900 rounded-md"
                          onClick={() => openEditDialog(event)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md"
                          onClick={() => handleDelete(event)}
                          disabled={deletingId === event.id}
                        >
                          {deletingId === event.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Dialog Modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md p-4 sm:p-5 rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              {selectedEvent ? "Edit Occasion" : "Create New Occasion"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Occasions help shoppers discover inspirations tailored for specific events and dress codes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2">
            {/* Occasion Name */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Occasion Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Traditional Wedding, Sunday Brunch, Red Carpet"
                className="h-8 sm:h-9 text-xs rounded-lg border-slate-200"
              />
            </div>

            {/* Image Upload / Preview */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Cover Image</label>
              <div className="flex gap-2.5 items-center">
                {imagePreview ? (
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-200 shrink-0">
                    <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-400">
                    <ImageIcon className="h-5 w-5" />
                  </div>
                )}
                <div className="flex-1">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="h-8 text-xs file:mr-2 file:h-6 file:px-2 file:rounded-md file:border-0 file:bg-slate-100 file:text-xs file:font-medium"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">JPG, PNG or WEBP up to 5MB.</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                rows={2}
                placeholder="Short styling context or mood summary..."
                className="text-xs rounded-lg border-slate-200 resize-none min-h-[54px]"
              />
            </div>

            {/* Dress Codes */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Dress Codes</label>
              <Input
                value={formData.dressCodes}
                onChange={(e) => setFormData((prev) => ({ ...prev, dressCodes: e.target.value }))}
                placeholder="Comma-separated: Smart Casual, Traditional Glam, Black Tie"
                className="h-8 sm:h-9 text-xs rounded-lg border-slate-200"
              />
            </div>

            {/* Seasonality Interactive Toggle Pills */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Applicable Seasons</label>
              <div className="flex flex-wrap gap-1.5">
                {SEASON_OPTIONS.map((season) => {
                  const isSelected = formData.seasonality.includes(season.value);
                  return (
                    <button
                      type="button"
                      key={season.value}
                      onClick={() => toggleSeasonalityInForm(season.value)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-all ${
                        isSelected
                          ? "bg-indigo-50 border-indigo-300 text-indigo-700 font-semibold shadow-2xs"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3 text-indigo-600" />}
                      {season.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2 border-t border-slate-100 flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsDialogOpen(false)}
              className="h-8 px-3 text-xs rounded-lg"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={saving}
              className="h-8 px-3.5 text-xs rounded-lg bg-slate-900 hover:bg-slate-800 text-white gap-1.5"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {selectedEvent ? "Save Changes" : "Create Occasion"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

