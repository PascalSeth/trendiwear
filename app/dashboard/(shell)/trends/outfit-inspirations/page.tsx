"use client";

import React, { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { 
  Plus, Loader2, Trash2, Pencil, Filter, Search, X, 
  ChevronLeft, ChevronRight, Sparkles, Heart, Bookmark, CheckSquare, Square, Copy, Wand2,
  UploadCloud, FolderPlus, Image as ImageIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  additionalImageUrls: string[];
  totalPrice: string;
  tags: string;
  isFeatured: boolean;
  isActive: boolean;
}

const getDefaultOutfitForm = (): OutfitFormData => ({
  eventId: "",
  title: "",
  description: "",
  outfitImageUrl: "",
  additionalImageUrls: [],
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

  // --- Multi-Select & Bulk Deletion State ---
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleting, setBulkDeleting] = useState<boolean>(false);
  const [deduplicating, setDeduplicating] = useState<boolean>(false);

  // --- Filtering & Pagination State ---
  const [filterEventId, setFilterEventId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(12);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);

  // --- Modal Form & Bulk Computer Upload State ---
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"single" | "bulk">("single");
  const [selectedOutfit, setSelectedOutfit] = useState<OutfitInspiration | null>(null);
  const [formData, setFormData] = useState<OutfitFormData>(getDefaultOutfitForm());

  // Computer File Uploads for Single Mode
  const [singleFiles, setSingleFiles] = useState<File[]>([]);
  const [singlePreviews, setSinglePreviews] = useState<string[]>([]);

  // Bulk Computer Upload Mode State
  const [bulkEventId, setBulkEventId] = useState<string>("");
  const [bulkBaseTitle, setBulkBaseTitle] = useState<string>("");
  const [bulkTags, setBulkTags] = useState<string>("");
  const [bulkFiles, setBulkFiles] = useState<File[]>([]);
  const [bulkPreviews, setBulkPreviews] = useState<string[]>([]);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");

  const fetchEvents = async () => {
    try {
      const res = await fetch("/api/events");
      if (!res.ok) throw new Error("Failed to load events");
      const data: ApiEvent[] = await res.json();
      const mapped = (data || []).map((e) => ({ id: e.id, name: e.name }));
      setEvents(mapped);
      if (mapped.length > 0) setBulkEventId(mapped[0].id);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load events");
    }
  };

  const fetchOutfits = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("page", currentPage.toString());
      params.set("limit", perPage.toString());
      if (filterEventId && filterEventId !== "all") params.set("eventId", filterEventId);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());

      const res = await fetch(`/api/outfit-inspirations?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load outfit inspirations");
      const data = await res.json();
      setOutfits(data.outfits || []);
      if (data.pagination) {
        setTotalPages(data.pagination.pages || 1);
        setTotalItems(data.pagination.total || 0);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load outfit inspirations");
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage, filterEventId, searchQuery]);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    fetchOutfits();
  }, [fetchOutfits]);

  // Toggle selection for a single outfit
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Toggle selection for all visible outfits on the current page
  const handleSelectAllPage = () => {
    const pageIds = outfits.map((o) => o.id);
    const isAllPageSelected = pageIds.every((id) => selectedIds.includes(id));
    if (isAllPageSelected) {
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  // --- AUTO-IDENTIFY & SELECT DUPLICATE IMAGES/TITLES ---
  const handleAutoSelectDuplicates = () => {
    const seenMap = new Map<string, string>();
    const dupIds: string[] = [];

    outfits.forEach((outfit) => {
      const baseUrl = outfit.outfitImageUrl.split("?")[0].split("&v=")[0];
      const baseTitle = outfit.title.replace(/\s*#\d+$/i, "").trim();
      const compositeKey = `${outfit.event?.id || ""}_${baseUrl}_${baseTitle.toLowerCase()}`;

      if (seenMap.has(compositeKey)) {
        dupIds.push(outfit.id);
      } else {
        seenMap.set(compositeKey, outfit.id);
      }
    });

    if (dupIds.length === 0) {
      toast.info("No duplicates detected among visible items.");
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...dupIds])));
      toast.success(`Found & selected ${dupIds.length} duplicate looks! Click 'Bulk Delete Selected' to clean them up.`);
    }
  };

  // --- 1-CLICK AUTOMATIC DATABASE DEDUPLICATION ---
  const handleDeduplicateDatabase = async () => {
    if (!window.confirm("Scan database and automatically clean up all duplicate outfit inspirations sharing the same image or title?")) return;

    try {
      setDeduplicating(true);
      const res = await fetch(`/api/outfit-inspirations/deduplicate?eventId=${filterEventId}`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to deduplicate database");

      toast.success(data.message || `Cleaned up ${data.countDeleted || 0} duplicate items.`);
      setSelectedIds([]);
      fetchOutfits();
    } catch (err: unknown) {
      console.error(err);
      const errObj = err as { message?: string };
      toast.error(errObj.message || "Failed to deduplicate database");
    } finally {
      setDeduplicating(false);
    }
  };

  // Bulk Delete Selected Outfits
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} selected outfit inspirations? This action cannot be undone.`)) return;

    try {
      setBulkDeleting(true);
      const res = await fetch("/api/outfit-inspirations", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to bulk delete");

      toast.success(`Successfully deleted ${data.countDeleted || selectedIds.length} outfit inspirations`);
      setSelectedIds([]);
      fetchOutfits();
    } catch (err: unknown) {
      console.error(err);
      const errObj = err as { message?: string };
      toast.error(errObj.message || "Failed to bulk delete");
    } finally {
      setBulkDeleting(false);
    }
  };

  const openCreateDialog = () => {
    setSelectedOutfit(null);
    setFormData({
      ...getDefaultOutfitForm(),
      eventId: events[0]?.id || "",
    });
    setSingleFiles([]);
    setSinglePreviews([]);
    setBulkFiles([]);
    setBulkPreviews([]);
    setActiveTab("single");
    setIsDialogOpen(true);
  };

  const openEditDialog = (outfit: OutfitInspiration) => {
    setSelectedOutfit(outfit);
    setFormData({
      eventId: outfit.event.id,
      title: outfit.title,
      description: outfit.description || "",
      outfitImageUrl: outfit.outfitImageUrl,
      additionalImageUrls: [],
      totalPrice: outfit.totalPrice ? String(outfit.totalPrice) : "",
      tags: (outfit.tags || []).join(", "),
      isFeatured: outfit.isFeatured,
      isActive: outfit.isActive,
    });
    setSingleFiles([]);
    setSinglePreviews([outfit.outfitImageUrl]);
    setActiveTab("single");
    setIsDialogOpen(true);
  };

  // --- COMPUTER FILE SELECTION FOR SINGLE/MULTI-IMAGE MODE ---
  const handleSingleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setSingleFiles((prev) => [...prev, ...files]);
      files.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setSinglePreviews((prev) => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeSinglePreview = (index: number) => {
    setSingleFiles((prev) => prev.filter((_, i) => i !== index));
    setSinglePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // --- COMPUTER FILE SELECTION FOR BULK COMPUTER UPLOADER MODE ---
  const handleBulkFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setBulkFiles((prev) => [...prev, ...files]);
      files.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setBulkPreviews((prev) => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeBulkPreview = (index: number) => {
    setBulkFiles((prev) => prev.filter((_, i) => i !== index));
    setBulkPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit Single or Multiple Outfit Creation
  const handleSubmitSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.eventId) {
      toast.error("Please select an event category");
      return;
    }
    if (!formData.title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    try {
      setSaving(true);
      const uploadedUrls: string[] = [];

      // Upload files from computer if selected
      if (singleFiles.length > 0) {
        for (let i = 0; i < singleFiles.length; i++) {
          const uploadFormData = new FormData();
          uploadFormData.append("file", singleFiles[i]);
          const uploadRes = await fetch("/api/upload", {
            method: "POST",
            body: uploadFormData,
          });

          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            if (uploadData.url) uploadedUrls.push(uploadData.url);
          }
        }
      }

      // If user typed URL directly
      if (formData.outfitImageUrl.trim()) {
        uploadedUrls.unshift(formData.outfitImageUrl.trim());
      }

      if (uploadedUrls.length === 0 && !selectedOutfit) {
        toast.error("Please provide at least one image URL or select an image file from your computer");
        setSaving(false);
        return;
      }

      const primaryUrl = uploadedUrls[0] || formData.outfitImageUrl || selectedOutfit?.outfitImageUrl;
      if (!primaryUrl) {
        toast.error("Image is required");
        setSaving(false);
        return;
      }

      const tagsArray = formData.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const url = selectedOutfit
        ? `/api/outfit-inspirations/${selectedOutfit.id}`
        : "/api/outfit-inspirations";
      const method = selectedOutfit ? "PATCH" : "POST";

      const payload = {
        eventId: formData.eventId,
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        outfitImageUrl: primaryUrl,
        totalPrice: formData.totalPrice ? Number.parseFloat(formData.totalPrice) : undefined,
        tags: tagsArray,
        isFeatured: formData.isFeatured,
        isActive: formData.isActive,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to save inspiration");
      }

      // If additional images were uploaded in single mode, import them as well
      if (uploadedUrls.length > 1 && !selectedOutfit) {
        const extraItems = uploadedUrls.slice(1).map((u, idx) => ({
          outfitImageUrl: u,
          title: `${formData.title.trim()} Look #${idx + 2}`,
          description: formData.description.trim() || undefined,
          tags: tagsArray,
          totalPrice: formData.totalPrice ? Number.parseFloat(formData.totalPrice) : undefined,
        }));

        await fetch("/api/outfit-inspirations/bulk-import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId: formData.eventId, items: extraItems }),
        });
      }

      toast.success(selectedOutfit ? "Inspiration updated" : "Inspiration created");
      setIsDialogOpen(false);
      fetchOutfits();
    } catch (error: unknown) {
      console.error(error);
      const errObj = error as { message?: string };
      toast.error(errObj.message || "Failed to save inspiration");
    } finally {
      setSaving(false);
    }
  };

  // --- SUBMIT BULK COMPUTER IMAGE UPLOAD ---
  const handleBulkComputerUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkEventId) {
      toast.error("Please select a target event category");
      return;
    }

    if (bulkFiles.length === 0) {
      toast.error("Please select at least 1 image file from your computer to upload");
      return;
    }

    try {
      setBulkUploading(true);
      const uploadedItems: Array<{ outfitImageUrl: string; title: string; description: string; tags: string[] }> = [];
      const eventObj = events.find((e) => e.id === bulkEventId);
      const categoryName = eventObj?.name || "Event";
      const tagsArray = bulkTags.split(",").map((t) => t.trim()).filter(Boolean);

      for (let i = 0; i < bulkFiles.length; i++) {
        const file = bulkFiles[i];
        setUploadProgress(`Uploading photo ${i + 1} of ${bulkFiles.length}...`);

        const uploadFormData = new FormData();
        uploadFormData.append("file", file);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: uploadFormData,
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          if (uploadData.url) {
            const fileNameTitle = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
            const itemTitle = bulkBaseTitle.trim()
              ? `${bulkBaseTitle.trim()} #${i + 1}`
              : `${categoryName} ${fileNameTitle}`;

            uploadedItems.push({
              outfitImageUrl: uploadData.url,
              title: itemTitle,
              description: `Uploaded from computer lookbook for ${categoryName}`,
              tags: [categoryName, ...tagsArray],
            });
          }
        }
      }

      if (uploadedItems.length === 0) {
        throw new Error("Failed to upload computer images");
      }

      setUploadProgress(`Importing ${uploadedItems.length} photos into database...`);

      const importRes = await fetch("/api/outfit-inspirations/bulk-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: bulkEventId,
          items: uploadedItems,
        }),
      });

      const importData = await importRes.json();
      if (!importRes.ok) throw new Error(importData.error || "Failed to import uploaded looks");

      toast.success(importData.message || `Successfully uploaded and created ${uploadedItems.length} lookbook inspirations!`);
      setIsDialogOpen(false);
      setBulkFiles([]);
      setBulkPreviews([]);
      fetchOutfits();
    } catch (err: unknown) {
      console.error(err);
      const errObj = err as { message?: string };
      toast.error(errObj.message || "Failed to bulk upload computer images");
    } finally {
      setBulkUploading(false);
      setUploadProgress("");
    }
  };

  const handleDelete = async (outfit: OutfitInspiration) => {
    if (!window.confirm(`Are you sure you want to delete "${outfit.title}"?`)) return;

    try {
      setDeletingId(outfit.id);
      const res = await fetch(`/api/outfit-inspirations?id=${outfit.id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete inspiration");
      toast.success("Inspiration deleted");
      fetchOutfits();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete inspiration");
    } finally {
      setDeletingId(null);
    }
  };

  const isAllCurrentPageSelected = outfits.length > 0 && outfits.every((o) => selectedIds.includes(o.id));
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const endItem = Math.min(currentPage * perPage, totalItems);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-10 relative p-4 sm:p-6">
      
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">Trend Gallery &amp; Editorial</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Outfit Inspirations <span className="text-slate-400 font-medium text-xl">({totalItems})</span>
          </h1>
          <p className="text-xs font-medium text-slate-500 mt-1">
            Curated high-fashion lookbooks and style inspirations linked to event categories and store items.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {outfits.length > 0 && (
            <>
              <Button
                variant="outline"
                onClick={handleAutoSelectDuplicates}
                className="rounded-xl border-amber-200 bg-amber-50 text-amber-900 font-bold text-xs flex items-center gap-1.5 hover:bg-amber-100 px-3 py-2"
                title="Find and check all duplicate images/titles on this page"
              >
                <Copy className="h-3.5 w-3.5 text-amber-600" /> Select Duplicates
              </Button>

              <Button
                variant="outline"
                onClick={handleDeduplicateDatabase}
                disabled={deduplicating}
                className="rounded-xl border-slate-200 bg-white font-bold text-xs flex items-center gap-1.5 hover:bg-slate-50 px-3 py-2"
                title="Scan DB and permanently delete duplicate looks"
              >
                {deduplicating ? <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-900" /> : <Wand2 className="h-3.5 w-3.5 text-indigo-600" />}
                Clean DB Duplicates
              </Button>

              <Button
                variant="outline"
                onClick={handleSelectAllPage}
                className="rounded-xl border-slate-200 bg-white font-bold text-xs flex items-center gap-1.5 px-3 py-2"
              >
                {isAllCurrentPageSelected ? <CheckSquare className="h-4 w-4 text-indigo-600" /> : <Square className="h-4 w-4 text-slate-400" />}
                {isAllCurrentPageSelected ? "Deselect Page" : "Select Page"}
              </Button>
            </>
          )}

          <Button 
            onClick={openCreateDialog} 
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> New Inspiration / Import
          </Button>
        </div>
      </div>

      {/* --- SEARCH, FILTERS & CONTROLS TOOLBAR --- */}
      <div className="bg-white border border-stone-200 p-6 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 group-focus-within:text-stone-900 transition-colors" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search looks by title, description or tag..."
            className="w-full bg-stone-50 border border-stone-200 py-3 pl-11 pr-10 text-sm font-light text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-900 transition-all shadow-xs"
          />
          {searchQuery && (
            <button 
              onClick={() => {
                setSearchQuery("");
                setCurrentPage(1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-900 p-1"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 px-3 py-1.5">
            <Filter className="h-3.5 w-3.5 text-stone-400" />
            <Select 
              value={filterEventId} 
              onValueChange={(val) => {
                setFilterEventId(val);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[180px] border-none bg-transparent shadow-none text-xs font-mono uppercase tracking-wider focus:ring-0">
                <SelectValue placeholder="All events" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events ({events.length})</SelectItem>
                {events.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 px-3 py-1.5">
            <span className="text-[10px] font-mono uppercase text-stone-400">Show:</span>
            <Select 
              value={perPage.toString()} 
              onValueChange={(val) => {
                setPerPage(Number(val));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[80px] border-none bg-transparent shadow-none text-xs font-mono font-bold focus:ring-0">
                <SelectValue placeholder="12" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12">12 / pg</SelectItem>
                <SelectItem value="24">24 / pg</SelectItem>
                <SelectItem value="48">48 / pg</SelectItem>
                <SelectItem value="96">96 / pg</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* --- GALLERY GRID --- */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-28 gap-4 border border-dashed border-stone-200 bg-white">
          <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
          <p className="text-xs font-mono uppercase tracking-widest text-stone-400">Retrieving Editorial Lookbooks...</p>
        </div>
      ) : outfits.length === 0 ? (
        <div className="border border-dashed border-stone-300 bg-white p-20 text-center space-y-4">
          <Sparkles className="h-10 w-10 text-stone-300 mx-auto" />
          <h3 className="text-xl font-serif italic text-stone-700">No outfit inspirations match your search.</h3>
          <p className="text-xs font-mono uppercase tracking-widest text-stone-400 max-w-sm mx-auto">
            Try adjusting your category filter or create a new inspiration lookbook.
          </p>
          <Button 
            onClick={openCreateDialog} 
            variant="outline" 
            className="rounded-none border-stone-900 text-stone-900 font-mono text-xs uppercase tracking-widest mt-4"
          >
            Create Inspiration
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {outfits.map((outfit) => {
            const isSelected = selectedIds.includes(outfit.id);
            return (
              <div 
                key={outfit.id} 
                className={`group relative bg-white border transition-all duration-700 overflow-hidden flex flex-col ${
                  isSelected ? 'border-stone-900 ring-2 ring-stone-900 shadow-xl' : 'border-stone-200 shadow-xs hover:shadow-xl'
                }`}
              >
                {/* Image Frame */}
                <div className="relative aspect-[3/4] bg-stone-100 overflow-hidden">
                  <Image
                    src={outfit.outfitImageUrl}
                    alt={outfit.title}
                    fill
                    unoptimized
                    className="object-cover transition-transform duration-1000 group-hover:scale-105"
                  />

                  {/* Multi-Select Checkbox Overlay */}
                  <div className="absolute top-3 left-3 z-30">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(outfit.id)}
                      className="h-5 w-5 rounded-none border-stone-300 accent-stone-900 bg-white/90 shadow-md cursor-pointer"
                    />
                  </div>
                  
                  {/* Silk Glass Dark Overlay on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-900/90 via-stone-900/20 to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-700 pointer-events-none" />

                  {/* Top Right Badges */}
                  <div className="absolute top-3 right-3 flex items-center gap-2 z-10 pointer-events-none">
                    {outfit.isFeatured && (
                      <span className="px-3 py-1 bg-amber-400 text-stone-900 font-mono text-[9px] font-bold uppercase tracking-widest shadow-xs">
                        Featured
                      </span>
                    )}
                  </div>

                  {/* Event Name Tag */}
                  <div className="absolute top-10 left-3 z-10 pointer-events-none">
                    <span className="px-2.5 py-1 bg-stone-900/70 text-white backdrop-blur-md border border-white/20 text-[8px] font-mono uppercase tracking-[0.25em]">
                      {outfit.event?.name || 'Omni-Event'}
                    </span>
                  </div>

                  {/* Bottom Overlay Content */}
                  <div className="absolute bottom-4 left-4 right-4 z-10 space-y-2 pointer-events-none">
                    <h3 className="text-xl font-serif text-white italic font-medium leading-snug line-clamp-2">
                      {outfit.title}
                    </h3>
                    <p className="text-[10px] font-mono text-white/80 uppercase tracking-widest truncate">
                      {outfit.stylist?.firstName?.startsWith('Photo by')
                        ? `${outfit.stylist.firstName} ${outfit.stylist.lastName}`
                        : `By ${outfit.stylist?.professionalProfile?.businessName || outfit.stylist?.firstName || 'Stylist'}`}
                    </p>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  {outfit.description && (
                    <p className="text-xs font-light text-stone-600 line-clamp-2 leading-relaxed">
                      &quot;{outfit.description}&quot;
                    </p>
                  )}

                  {/* Tags */}
                  {outfit.tags && outfit.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {outfit.tags.slice(0, 3).map((tag) => (
                        <span 
                          key={tag} 
                          className="px-2 py-0.5 bg-stone-100 text-stone-600 text-[9px] font-mono uppercase tracking-wider border border-stone-200"
                        >
                          #{tag}
                        </span>
                      ))}
                      {outfit.tags.length > 3 && (
                        <span className="px-1.5 py-0.5 text-[9px] font-mono text-stone-400">
                          +{outfit.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Footer Info & Actions */}
                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-3 text-[10px] font-mono text-stone-400">
                      <span className="flex items-center gap-1">
                        <Heart size={12} className="text-rose-500" /> {outfit.likes}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Bookmark size={12} className="text-stone-400" /> {outfit._count?.savedByUsers || 0}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-none"
                        onClick={() => openEditDialog(outfit)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-none"
                        onClick={() => handleDelete(outfit)}
                        disabled={deletingId === outfit.id}
                      >
                        {deletingId === outfit.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* --- SLEEK PAGINATION CONTROLS --- */}
      {totalPages > 1 && (
        <div className="bg-white border border-stone-200 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
          <div className="text-xs font-mono text-stone-500 uppercase tracking-widest">
            Showing <span className="font-bold text-stone-900">{startItem}–{endItem}</span> of <span className="font-bold text-stone-900">{totalItems}</span> inspirations
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1 || loading}
              className="rounded-none border-stone-300 font-mono text-xs uppercase tracking-wider flex items-center gap-1 px-4 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" /> Prev
            </Button>

            {/* Page Number Chips */}
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .map((pageNum, idx, arr) => {
                  const showEllipsis = idx > 0 && pageNum - arr[idx - 1] > 1;
                  return (
                    <React.Fragment key={pageNum}>
                      {showEllipsis && <span className="px-1 text-stone-400 font-mono">...</span>}
                      <button
                        onClick={() => setCurrentPage(pageNum)}
                        className={`h-8 w-8 font-mono text-xs transition-all border ${
                          currentPage === pageNum
                            ? "bg-stone-900 text-white border-stone-900 font-bold shadow-xs"
                            : "bg-white text-stone-600 border-stone-200 hover:border-stone-400"
                        }`}
                      >
                        {pageNum}
                      </button>
                    </React.Fragment>
                  );
                })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || loading}
              className="rounded-none border-stone-300 font-mono text-xs uppercase tracking-wider flex items-center gap-1 px-4 disabled:opacity-40"
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* --- FLOATING BULK SELECTION ACTION TOOLBAR --- */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-stone-900 text-white px-8 py-4 shadow-2xl border border-stone-700 flex items-center gap-6 animate-in slide-in-from-bottom-5">
          <span className="font-mono text-xs uppercase tracking-widest text-stone-300">
            <strong className="text-white font-bold text-sm">{selectedIds.length}</strong> looks selected
          </span>

          <div className="h-4 w-px bg-stone-700" />

          <button
            onClick={handleSelectAllPage}
            className="text-xs font-mono uppercase tracking-wider text-stone-300 hover:text-white underline"
          >
            {isAllCurrentPageSelected ? "Deselect Page" : "Select Page"}
          </button>

          <Button
            onClick={handleBulkDelete}
            disabled={bulkDeleting}
            className="bg-rose-600 hover:bg-rose-700 text-white rounded-none font-mono text-xs uppercase tracking-widest px-6 py-2.5 flex items-center gap-2 shadow-md"
          >
            {bulkDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Bulk Delete ({selectedIds.length})
          </Button>

          <button
            onClick={() => setSelectedIds([])}
            className="p-1 text-stone-400 hover:text-white transition-colors"
            title="Clear Selection"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* --- HIGH-FASHION MODAL STUDIO (SINGLE & BULK COMPUTER UPLOAD) --- */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl bg-white border border-stone-200 p-8 rounded-none max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-3 border-b border-stone-100 pb-5">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl font-serif italic text-stone-900">
                {selectedOutfit ? "Edit Inspiration Lookbook" : "Inspiration Studio"}
              </DialogTitle>

              {/* Mode Toggle Tabs */}
              {!selectedOutfit && (
                <div className="flex items-center bg-stone-100 p-1 border border-stone-200">
                  <button
                    type="button"
                    onClick={() => setActiveTab("single")}
                    className={`px-4 py-1.5 font-mono text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                      activeTab === "single" ? "bg-stone-900 text-white shadow-xs font-bold" : "text-stone-600 hover:text-stone-900"
                    }`}
                  >
                    <ImageIcon className="h-3.5 w-3.5" /> Studio Editor
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("bulk")}
                    className={`px-4 py-1.5 font-mono text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                      activeTab === "bulk" ? "bg-stone-900 text-white shadow-xs font-bold" : "text-stone-600 hover:text-stone-900"
                    }`}
                  >
                    <FolderPlus className="h-3.5 w-3.5 text-amber-400" /> Computer Bulk Import
                  </button>
                </div>
              )}
            </div>

            <DialogDescription className="text-xs font-mono uppercase tracking-widest text-stone-400">
              {activeTab === "single"
                ? "Manage editorial lookbook concepts, tags, and product valuation."
                : "Upload multiple photo files directly from your computer for an event category in 1 click."}
            </DialogDescription>
          </DialogHeader>

          {/* TAB 1: SINGLE / MULTI-IMAGE STUDIO EDITOR */}
          {activeTab === "single" && (
            <form onSubmit={handleSubmitSingle} className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-mono uppercase tracking-widest text-stone-500">Target Event Category *</label>
                    <Select
                      value={formData.eventId}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, eventId: value }))}
                    >
                      <SelectTrigger className="rounded-none border-stone-200 focus:ring-0">
                        <SelectValue placeholder="Select target event" />
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
                    <label className="text-xs font-mono uppercase tracking-widest text-stone-500">Title / Headline *</label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g. Traditional Velvet Owambe Silhouette"
                      className="rounded-none border-stone-200 focus:border-stone-900"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-mono uppercase tracking-widest text-stone-500">Styling Notes / Description</label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="Styling ethos, fabric details, or creator credit line..."
                      rows={3}
                      className="rounded-none border-stone-200 focus:border-stone-900"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-mono uppercase tracking-widest text-stone-500">Valuation Price (GHS)</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.totalPrice}
                        onChange={(e) => setFormData((prev) => ({ ...prev, totalPrice: e.target.value }))}
                        placeholder="0.00"
                        className="rounded-none border-stone-200"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-mono uppercase tracking-widest text-stone-500">Vibe Tags (Comma Separated)</label>
                      <Input
                        value={formData.tags}
                        onChange={(e) => setFormData((prev) => ({ ...prev, tags: e.target.value }))}
                        placeholder="Owambe, Gele, Velvet"
                        className="rounded-none border-stone-200"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-6 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isFeatured}
                        onChange={(e) => setFormData((prev) => ({ ...prev, isFeatured: e.target.checked }))}
                        className="rounded-none border-stone-300"
                      />
                      <span className="text-xs font-mono uppercase tracking-widest text-stone-700">Feature on Frontpage</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
                        className="rounded-none border-stone-300"
                      />
                      <span className="text-xs font-mono uppercase tracking-widest text-stone-700">Active</span>
                    </label>
                  </div>
                </div>

                {/* Right Column: Image File Upload & Multi-Image Gallery */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-mono uppercase tracking-widest text-stone-500">Lookbook Images (Computer Upload / URL)</label>
                    <Input
                      type="text"
                      value={formData.outfitImageUrl}
                      onChange={(e) => setFormData((prev) => ({ ...prev, outfitImageUrl: e.target.value }))}
                      placeholder="Image URL (e.g. https://images.unsplash.com/...)"
                      className="rounded-none border-stone-200 text-xs font-mono"
                    />

                    {/* Drag & Drop Computer File Upload Box */}
                    <div className="border-2 border-dashed border-stone-300 bg-stone-50 p-6 text-center hover:bg-stone-100/80 transition-colors relative cursor-pointer group mt-2">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleSingleFilesChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <UploadCloud className="h-8 w-8 text-stone-400 mx-auto group-hover:text-stone-900 transition-colors" />
                      <p className="text-xs font-mono uppercase tracking-wider text-stone-700 mt-2 font-bold">
                        Click or Drag &amp; Drop Computer Images
                      </p>
                      <p className="text-[10px] font-mono text-stone-400 mt-1">Select one or multiple photos (.jpg, .png, .webp)</p>
                    </div>
                  </div>

                  {/* Uploaded Image Previews Grid */}
                  {singlePreviews.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400">
                        Image Gallery ({singlePreviews.length})
                      </span>
                      <div className="grid grid-cols-3 gap-2 max-h-[220px] overflow-y-auto p-1 border border-stone-200 bg-stone-50">
                        {singlePreviews.map((prev, idx) => (
                          <div key={idx} className="relative aspect-[3/4] bg-stone-200 border border-stone-300 group overflow-hidden">
                            <Image src={prev} alt="Preview" fill className="object-cover" />
                            <button
                              type="button"
                              onClick={() => removeSinglePreview(idx)}
                              className="absolute top-1 right-1 bg-stone-900/80 text-white p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X size={12} />
                            </button>
                            {idx === 0 && (
                              <span className="absolute bottom-1 left-1 bg-amber-400 text-stone-900 text-[8px] font-mono uppercase px-1 font-bold">
                                Cover
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter className="pt-6 border-t border-stone-100 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="rounded-none border-stone-300 font-mono text-xs uppercase tracking-widest"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="rounded-none bg-stone-900 text-white hover:bg-stone-800 font-mono text-xs uppercase tracking-widest px-8"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Inspiration"}
                </Button>
              </DialogFooter>
            </form>
          )}

          {/* TAB 2: BULK COMPUTER IMAGE UPLOADER */}
          {activeTab === "bulk" && (
            <form onSubmit={handleBulkComputerUploadSubmit} className="space-y-6 py-4">
              <div className="bg-amber-50/50 border border-amber-200 p-4 flex items-center gap-3">
                <FolderPlus className="h-5 w-5 text-amber-700 shrink-0" />
                <p className="text-xs font-mono text-amber-900 leading-relaxed">
                  <strong>Computer Bulk Importer:</strong> Select multiple high-res photos from your local drive. They will be uploaded and automatically assigned to your selected event category.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-mono uppercase tracking-widest text-stone-500">Target Event Category *</label>
                    <Select
                      value={bulkEventId}
                      onValueChange={(val) => setBulkEventId(val)}
                    >
                      <SelectTrigger className="rounded-none border-stone-200 focus:ring-0">
                        <SelectValue placeholder="Select target event" />
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
                    <label className="text-xs font-mono uppercase tracking-widest text-stone-500">Base Title Prefix (Optional)</label>
                    <Input
                      value={bulkBaseTitle}
                      onChange={(e) => setBulkBaseTitle(e.target.value)}
                      placeholder="e.g. Lagos Fashion Week Owambe"
                      className="rounded-none border-stone-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-mono uppercase tracking-widest text-stone-500">Default Vibe Tags (Comma Separated)</label>
                    <Input
                      value={bulkTags}
                      onChange={(e) => setBulkTags(e.target.value)}
                      placeholder="AsoEbi, Gele, Traditional"
                      className="rounded-none border-stone-200"
                    />
                  </div>
                </div>

                {/* Bulk Computer Dropzone */}
                <div className="space-y-4">
                  <label className="text-xs font-mono uppercase tracking-widest text-stone-500">Computer Photos Selection *</label>
                  
                  <div className="border-2 border-dashed border-stone-400 bg-stone-50 p-8 text-center hover:bg-stone-100 transition-colors relative cursor-pointer group">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleBulkFilesChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <UploadCloud className="h-10 w-10 text-stone-400 mx-auto group-hover:text-stone-900 transition-colors" />
                    <p className="text-xs font-mono uppercase tracking-wider text-stone-900 font-bold mt-3">
                      Click to Select Multiple Computer Files
                    </p>
                    <p className="text-[10px] font-mono text-stone-500 mt-1">Select 1 to 50 photos directly from your PC</p>
                  </div>

                  {bulkFiles.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-stone-600">{bulkFiles.length} files selected for upload</span>
                        <button
                          type="button"
                          onClick={() => {
                            setBulkFiles([]);
                            setBulkPreviews([]);
                          }}
                          className="text-rose-600 hover:underline text-[10px] uppercase font-bold"
                        >
                          Clear All
                        </button>
                      </div>

                      <div className="grid grid-cols-4 gap-2 max-h-[180px] overflow-y-auto p-2 border border-stone-200 bg-stone-50">
                        {bulkPreviews.map((prev, idx) => (
                          <div key={idx} className="relative aspect-[3/4] bg-stone-200 border border-stone-300 group overflow-hidden">
                            <Image src={prev} alt="Bulk preview" fill className="object-cover" />
                            <button
                              type="button"
                              onClick={() => removeBulkPreview(idx)}
                              className="absolute top-1 right-1 bg-stone-900/90 text-white p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {uploadProgress && (
                <div className="p-4 bg-stone-900 text-white font-mono text-xs uppercase tracking-widest flex items-center justify-between animate-pulse">
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-amber-400" /> {uploadProgress}
                  </span>
                </div>
              )}

              <DialogFooter className="pt-6 border-t border-stone-100 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="rounded-none border-stone-300 font-mono text-xs uppercase tracking-widest"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={bulkUploading || bulkFiles.length === 0}
                  className="rounded-none bg-stone-900 text-white hover:bg-stone-800 font-mono text-xs uppercase tracking-widest px-8 flex items-center gap-2"
                >
                  {bulkUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <UploadCloud className="h-4 w-4 text-amber-400" />
                      Upload &amp; Create Looks ({bulkFiles.length})
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
