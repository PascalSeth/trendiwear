"use client";

import React, { useCallback, useEffect, useState, useMemo } from "react";
import Image from "next/image";
import {
  Sparkles,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Search,
  LayoutGrid,
  List,
  Eye,
  Heart,
  Bookmark,
  Copy,
  Wand2,
  UploadCloud,
  FolderPlus,
  Image as ImageIcon,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  User,
  ExternalLink,
  Layers,
  ArrowUpDown,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface TrendEventOption {
  id: string;
  name: string;
}

interface ApiEvent {
  id: string;
  name: string;
}

interface OutfitProductItem {
  product: {
    id: string;
    name?: string;
    price?: number;
    currency?: string;
    images?: string[];
  };
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
  products: OutfitProductItem[];
  _count: {
    savedByUsers: number;
  };
  createdAt?: string;
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

function OutfitCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-2.5 space-y-2.5 shadow-xs overflow-hidden">
      <Skeleton className="w-full aspect-[4/5] rounded-lg" />
      <div className="space-y-1.5 px-0.5">
        <Skeleton className="h-4 w-4/5 rounded" />
        <Skeleton className="h-3 w-1/2 rounded" />
        <div className="flex gap-1 pt-1">
          <Skeleton className="h-3.5 w-10 rounded" />
          <Skeleton className="h-3.5 w-12 rounded" />
        </div>
      </div>
    </div>
  );
}

export default function OutfitInspirationsTrendsPage() {
  const [events, setEvents] = useState<TrendEventOption[]>([]);
  const [outfits, setOutfits] = useState<OutfitInspiration[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // --- View Mode (Grid vs Table) ---
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // --- Multi-Select & Bulk Deletion State ---
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleting, setBulkDeleting] = useState<boolean>(false);
  const [deduplicating, setDeduplicating] = useState<boolean>(false);

  // --- Filtering & Sorting State ---
  const [filterEventId, setFilterEventId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"featured" | "likes" | "saves" | "newest">("featured");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(12);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);

  // --- Lookbook Inspector Preview Drawer / Modal ---
  const [inspectingOutfit, setInspectingOutfit] = useState<OutfitInspiration | null>(null);

  // --- Creation & Bulk Import Modal State ---
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
      if (mapped.length > 0 && !bulkEventId) setBulkEventId(mapped[0].id);
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

  // Client-side sorting for fine-grained ranking
  const sortedOutfits = useMemo(() => {
    const list = [...outfits];
    if (sortBy === "featured") {
      return list.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0) || b.likes - a.likes);
    }
    if (sortBy === "likes") {
      return list.sort((a, b) => b.likes - a.likes);
    }
    if (sortBy === "saves") {
      return list.sort((a, b) => (b._count?.savedByUsers || 0) - (a._count?.savedByUsers || 0));
    }
    if (sortBy === "newest") {
      return list.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
    }
    return list;
  }, [outfits, sortBy]);

  // Computed summary metrics
  const totalLikes = useMemo(() => {
    return outfits.reduce((acc, o) => acc + (o.likes || 0), 0);
  }, [outfits]);

  const totalSaves = useMemo(() => {
    return outfits.reduce((acc, o) => acc + (o._count?.savedByUsers || 0), 0);
  }, [outfits]);

  const featuredCount = useMemo(() => {
    return outfits.filter((o) => o.isFeatured).length;
  }, [outfits]);

  const activeCategoriesCount = useMemo(() => {
    const set = new Set<string>();
    outfits.forEach((o) => {
      if (o.event?.name) set.add(o.event.name);
    });
    return set.size;
  }, [outfits]);

  // Toggle selection for a single outfit
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Toggle selection for all visible outfits on the current page
  const handleSelectAllPage = () => {
    const pageIds = outfits.map((o) => o.id);
    const isAllPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
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
      toast.success(`Found & selected ${dupIds.length} duplicate looks. Use Bulk Delete to clean them.`);
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
    if (!window.confirm(`Delete ${selectedIds.length} selected outfit inspirations? This action cannot be undone.`)) return;

    try {
      setBulkDeleting(true);
      const res = await fetch("/api/outfit-inspirations", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to bulk delete");

      toast.success(`Deleted ${data.countDeleted || selectedIds.length} outfit inspirations`);
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
      totalPrice: outfit.totalPrice ? outfit.totalPrice.toString() : "",
      tags: outfit.tags ? outfit.tags.join(", ") : "",
      isFeatured: outfit.isFeatured,
      isActive: outfit.isActive,
    });
    setSingleFiles([]);
    setSinglePreviews(outfit.outfitImageUrl ? [outfit.outfitImageUrl] : []);
    setActiveTab("single");
    setIsDialogOpen(true);
  };

  // Handle single computer file upload selections
  const handleSingleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSingleFiles((prev) => [...prev, ...filesArray]);
      const newPreviews = filesArray.map((file) => URL.createObjectURL(file));
      setSinglePreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const removeSinglePreview = (index: number) => {
    setSinglePreviews((prev) => prev.filter((_, i) => i !== index));
    setSingleFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle bulk computer file selection
  const handleBulkFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setBulkFiles(filesArray);
      const previews = filesArray.map((file) => URL.createObjectURL(file));
      setBulkPreviews(previews);
    }
  };

  const removeBulkPreview = (index: number) => {
    setBulkPreviews((prev) => prev.filter((_, i) => i !== index));
    setBulkFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // --- SUBMIT SINGLE LOOKBOOK FORM ---
  const handleSubmitSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.eventId) {
      toast.error("Please select a target event category");
      return;
    }

    if (!formData.title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    try {
      setSaving(true);
      let finalImageUrl = formData.outfitImageUrl.trim();

      // If user selected files from computer, upload them
      if (singleFiles.length > 0) {
        const uploadFormData = new FormData();
        uploadFormData.append("file", singleFiles[0]);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: uploadFormData,
        });

        if (!uploadRes.ok) {
          const err = await uploadRes.json().catch(() => null);
          throw new Error(err?.error || "Failed to upload image file");
        }

        const uploadData = await uploadRes.json();
        if (uploadData.url) {
          finalImageUrl = uploadData.url;
        }
      }

      if (!finalImageUrl) {
        toast.error("Please provide an image URL or upload an image file");
        return;
      }

      const payload = {
        eventId: formData.eventId,
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        outfitImageUrl: finalImageUrl,
        totalPrice: formData.totalPrice ? parseFloat(formData.totalPrice) : undefined,
        tags: formData.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        isFeatured: formData.isFeatured,
        isActive: formData.isActive,
      };

      const url = selectedOutfit
        ? `/api/outfit-inspirations/${selectedOutfit.id}`
        : "/api/outfit-inspirations";

      const method = selectedOutfit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Failed to save inspiration");
      }

      toast.success(selectedOutfit ? "Look updated" : "Look created");
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
      toast.error("Please select at least 1 image file from your computer");
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

      toast.success(importData.message || `Successfully created ${uploadedItems.length} lookbook inspirations!`);
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
    if (!window.confirm(`Delete "${outfit.title}"?`)) return;

    try {
      setDeletingId(outfit.id);
      const res = await fetch(`/api/outfit-inspirations?id=${outfit.id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete inspiration");
      toast.success("Inspiration deleted");
      if (inspectingOutfit?.id === outfit.id) {
        setInspectingOutfit(null);
      }
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
    <div className="w-full max-w-7xl mx-auto space-y-4 sm:space-y-5 relative p-3 sm:p-5 font-sans">
      {/* 1. HEADER BANNER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">
              Fashion Lookbook &amp; Trend Radar
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-600" />
            Outfit Inspirations{" "}
            <span className="text-slate-400 font-medium text-sm">({totalItems})</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Curate editorial trend styles, street looks, and occasion outfits linked with your catalogue products.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {outfits.length > 0 && (
            <>
              <Button
                variant="outline"
                onClick={handleAutoSelectDuplicates}
                className="rounded-lg border-amber-200 bg-amber-50 text-amber-900 font-semibold text-xs flex items-center gap-1.5 hover:bg-amber-100 h-8 px-2.5 shadow-2xs"
                title="Find and check all duplicate images/titles on this page"
              >
                <Copy className="h-3.5 w-3.5 text-amber-600" />
                Duplicates
              </Button>

              <Button
                variant="outline"
                onClick={handleDeduplicateDatabase}
                disabled={deduplicating}
                className="rounded-lg border-slate-200 bg-white font-semibold text-xs flex items-center gap-1.5 hover:bg-slate-50 h-8 px-2.5 shadow-2xs"
                title="Scan DB and permanently delete duplicate looks"
              >
                {deduplicating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-900" />
                ) : (
                  <Wand2 className="h-3.5 w-3.5 text-indigo-600" />
                )}
                Clean DB
              </Button>
            </>
          )}

          <Button
            onClick={openCreateDialog}
            className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-3 sm:px-3.5 h-8 sm:h-9 rounded-lg shadow-xs transition-all flex items-center gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            New Look / Import
          </Button>
        </div>
      </div>

      {/* 2. STATS KPI OVERVIEW STRIP */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase text-slate-500">
            <span>Total Looks</span>
            <Sparkles className="h-3.5 w-3.5 text-slate-400" />
          </div>
          <div className="text-base sm:text-lg lg:text-xl font-bold font-mono text-slate-900">
            {totalItems}
          </div>
        </div>

        <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase text-slate-500">
            <span>Featured Editorials</span>
            <Bookmark className="h-3.5 w-3.5 text-amber-500" />
          </div>
          <div className="text-base sm:text-lg lg:text-xl font-bold font-mono text-amber-600">
            {featuredCount}
          </div>
        </div>

        <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase text-slate-500">
            <span>Community Likes</span>
            <Heart className="h-3.5 w-3.5 text-rose-500" />
          </div>
          <div className="text-base sm:text-lg lg:text-xl font-bold font-mono text-rose-600">
            {totalLikes}
          </div>
        </div>

        <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase text-slate-500">
            <span>Active Occasions</span>
            <Layers className="h-3.5 w-3.5 text-emerald-500" />
          </div>
          <div className="text-base sm:text-lg lg:text-xl font-bold font-mono text-emerald-600">
            {activeCategoriesCount || events.length}
          </div>
        </div>
      </div>

      {/* 3. COMMAND & FILTER TOOLBAR */}
      <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
        {/* Category Pills Carousel */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => {
              setFilterEventId("all");
              setCurrentPage(1);
            }}
            className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              filterEventId === "all"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All Occasions
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                filterEventId === "all" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
              }`}
            >
              {totalItems}
            </span>
          </button>

          {events.map((ev) => (
            <button
              key={ev.id}
              onClick={() => {
                setFilterEventId(ev.id);
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                filterEventId === ev.id
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {ev.name}
            </button>
          ))}
        </div>

        {/* Search, Sort, Items/Page, and View Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-100">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search looks by title, designer, tag..."
              className="h-8 pl-8 pr-7 text-xs rounded-lg border-slate-200 bg-slate-50/50 focus:bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setCurrentPage(1);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
            {/* Sort Dropdown */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg">
              <ArrowUpDown className="h-3 w-3 text-slate-400" />
              <Select
                value={sortBy}
                onValueChange={(val: "featured" | "likes" | "saves" | "newest") => setSortBy(val)}
              >
                <SelectTrigger className="w-[110px] border-none bg-transparent shadow-none text-xs h-6 p-0 focus:ring-0">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="featured" className="text-xs">Featured First</SelectItem>
                  <SelectItem value="likes" className="text-xs">Most Liked</SelectItem>
                  <SelectItem value="saves" className="text-xs">Most Saved</SelectItem>
                  <SelectItem value="newest" className="text-xs">Newest Added</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Per Page Dropdown */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg">
              <span className="text-[10px] uppercase font-semibold text-slate-400">Show:</span>
              <Select
                value={perPage.toString()}
                onValueChange={(val) => {
                  setPerPage(Number(val));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[60px] border-none bg-transparent shadow-none text-xs font-semibold h-6 p-0 focus:ring-0">
                  <SelectValue placeholder="12" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12" className="text-xs">12 / pg</SelectItem>
                  <SelectItem value="24" className="text-xs">24 / pg</SelectItem>
                  <SelectItem value="48" className="text-xs">48 / pg</SelectItem>
                  <SelectItem value="96" className="text-xs">96 / pg</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* View Mode Toggle */}
            <div className="p-0.5 bg-slate-100 rounded-lg border border-slate-200 flex items-center gap-0.5">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-md text-xs transition-all ${
                  viewMode === "grid"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-400 hover:text-slate-600"
                }`}
                title="Lookbook Grid View"
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
                title="Editorial Table View"
              >
                <List className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. MAIN GALLERY CONTENT */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {Array.from({ length: Math.min(perPage, 10) }).map((_, idx) => (
            <OutfitCardSkeleton key={idx} />
          ))}
        </div>
      ) : sortedOutfits.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center space-y-3 shadow-xs">
          <ImageIcon className="h-10 w-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No outfit inspirations found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search query, selecting another occasion category, or add a fresh editorial look.
          </p>
          <Button
            onClick={openCreateDialog}
            className="rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs h-8 px-3.5 shadow-xs"
          >
            Create Lookbook Item
          </Button>
        </div>
      ) : viewMode === "grid" ? (
        /* --- LOOKBOOK GRID (COMPACT EDITORIAL CARDS) --- */
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {sortedOutfits.map((outfit) => {
            const isSelected = selectedIds.includes(outfit.id);
            const productsCount = outfit.products?.length || 0;

            return (
              <div
                key={outfit.id}
                className={`group relative bg-white border rounded-xl overflow-hidden shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col ${
                  isSelected ? "border-indigo-600 ring-2 ring-indigo-500/30" : "border-slate-200/90"
                }`}
              >
                {/* Image Frame */}
                <div className="relative aspect-[4/5] bg-slate-100 overflow-hidden cursor-pointer" onClick={() => setInspectingOutfit(outfit)}>
                  <Image
                    src={outfit.outfitImageUrl}
                    alt={outfit.title}
                    fill
                    unoptimized
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />

                  {/* Gradient Overlay on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                  {/* Top-Left: Checkbox & Event Tag */}
                  <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(outfit.id)}
                      className="h-4 w-4 rounded border-slate-300 accent-indigo-600 bg-white/90 shadow-xs cursor-pointer"
                    />
                    <span className="px-2 py-0.5 bg-slate-900/80 backdrop-blur-md text-white text-[9px] font-semibold rounded-md shadow-xs truncate max-w-[110px]">
                      {outfit.event?.name || "Occasion"}
                    </span>
                  </div>

                  {/* Top-Right: Featured Star */}
                  {outfit.isFeatured && (
                    <div className="absolute top-2 right-2 z-20 pointer-events-none">
                      <span className="px-1.5 py-0.5 bg-amber-500 text-white text-[9px] font-bold rounded-md shadow-xs flex items-center gap-1">
                        ★
                      </span>
                    </div>
                  )}

                  {/* Quick Action Overlay (Center/Bottom on hover) */}
                  <div
                    className="absolute inset-x-2 bottom-2 z-20 flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => setInspectingOutfit(outfit)}
                      className="p-1.5 bg-white/95 text-slate-800 hover:text-indigo-600 rounded-lg shadow-md transition-colors"
                      title="Inspect look details"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => openEditDialog(outfit)}
                      className="p-1.5 bg-white/95 text-slate-800 hover:text-slate-900 rounded-lg shadow-md transition-colors"
                      title="Edit inspiration"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(outfit)}
                      disabled={deletingId === outfit.id}
                      className="p-1.5 bg-white/95 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg shadow-md transition-colors"
                      title="Delete look"
                    >
                      {deletingId === outfit.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Card Content Footer */}
                <div className="p-2.5 flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    <h3
                      onClick={() => setInspectingOutfit(outfit)}
                      className="text-xs font-semibold text-slate-900 line-clamp-1 hover:text-indigo-600 cursor-pointer transition-colors"
                      title={outfit.title}
                    >
                      {outfit.title}
                    </h3>
                    <p className="text-[10px] text-slate-500 truncate mt-0.5 flex items-center gap-1">
                      <User className="h-2.5 w-2.5 text-slate-400 shrink-0" />
                      {outfit.stylist?.firstName?.startsWith("Photo by")
                        ? `${outfit.stylist.firstName} ${outfit.stylist.lastName}`
                        : outfit.stylist?.professionalProfile?.businessName ||
                          `${outfit.stylist?.firstName || "Stylist"}`}
                    </p>
                  </div>

                  {/* Tags Preview */}
                  {outfit.tags && outfit.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {outfit.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-medium rounded truncate max-w-[80px]"
                        >
                          #{tag}
                        </span>
                      ))}
                      {outfit.tags.length > 2 && (
                        <span className="text-[9px] text-slate-400 font-medium">
                          +{outfit.tags.length - 2}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Metrics Strip */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-0.5 text-rose-500">
                        <Heart className="h-3 w-3 fill-rose-500/20" /> {outfit.likes}
                      </span>
                      <span className="flex items-center gap-0.5 text-slate-400">
                        <Bookmark className="h-3 w-3" /> {outfit._count?.savedByUsers || 0}
                      </span>
                    </div>

                    {productsCount > 0 && (
                      <span className="flex items-center gap-1 px-1.5 py-0.2 bg-indigo-50 text-indigo-700 text-[9px] font-semibold rounded">
                        <ShoppingBag className="h-2.5 w-2.5" />
                        {productsCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* --- DENSE EDITORIAL TABLE VIEW --- */
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="p-3 w-8">
                    <input
                      type="checkbox"
                      checked={isAllCurrentPageSelected}
                      onChange={handleSelectAllPage}
                      className="h-3.5 w-3.5 rounded border-slate-300 accent-indigo-600 cursor-pointer"
                    />
                  </th>
                  <th className="p-3 w-16">Look</th>
                  <th className="p-3">Title &amp; Notes</th>
                  <th className="p-3">Occasion</th>
                  <th className="p-3">Stylist / Creator</th>
                  <th className="p-3">Vibe Tags</th>
                  <th className="p-3 text-center">Products</th>
                  <th className="p-3 text-center">Engagement</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {sortedOutfits.map((outfit) => {
                  const isSelected = selectedIds.includes(outfit.id);
                  const productsCount = outfit.products?.length || 0;

                  return (
                    <tr
                      key={outfit.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? "bg-indigo-50/40" : ""
                      }`}
                    >
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(outfit.id)}
                          className="h-3.5 w-3.5 rounded border-slate-300 accent-indigo-600 cursor-pointer"
                        />
                      </td>
                      <td className="p-3">
                        <div
                          className="relative h-12 w-10 rounded-md overflow-hidden bg-slate-100 border border-slate-200 cursor-pointer shrink-0"
                          onClick={() => setInspectingOutfit(outfit)}
                        >
                          <Image
                            src={outfit.outfitImageUrl}
                            alt={outfit.title}
                            fill
                            unoptimized
                            className="object-cover"
                          />
                        </div>
                      </td>
                      <td className="p-3 max-w-xs">
                        <div
                          onClick={() => setInspectingOutfit(outfit)}
                          className="font-semibold text-slate-900 hover:text-indigo-600 cursor-pointer truncate"
                          title={outfit.title}
                        >
                          {outfit.title}
                        </div>
                        {outfit.description && (
                          <div className="text-[11px] text-slate-400 line-clamp-1">
                            {outfit.description}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className="text-[10px] font-medium border-slate-200 bg-slate-50">
                          {outfit.event?.name || "Occasion"}
                        </Badge>
                      </td>
                      <td className="p-3 text-slate-600 text-[11px] truncate max-w-[140px]">
                        {outfit.stylist?.firstName?.startsWith("Photo by")
                          ? `${outfit.stylist.firstName} ${outfit.stylist.lastName}`
                          : outfit.stylist?.professionalProfile?.businessName ||
                            `${outfit.stylist?.firstName || "Stylist"}`}
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {outfit.tags?.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[9px] rounded font-medium"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        {productsCount > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-semibold rounded-full">
                            <ShoppingBag className="h-3 w-3" /> {productsCount}
                          </span>
                        ) : (
                          <span className="text-slate-300 text-[11px]">—</span>
                        )}
                      </td>
                      <td className="p-3 text-center font-mono text-[11px]">
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-rose-600 flex items-center gap-0.5">
                            <Heart className="h-3 w-3 fill-rose-500/20" /> {outfit.likes}
                          </span>
                          <span className="text-slate-400 flex items-center gap-0.5">
                            <Bookmark className="h-3 w-3" /> {outfit._count?.savedByUsers || 0}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        {outfit.isFeatured ? (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full">
                            Featured
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] rounded-full">
                            Standard
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-slate-500 hover:text-indigo-600 rounded-md"
                            onClick={() => setInspectingOutfit(outfit)}
                            title="Inspect details"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-slate-500 hover:text-slate-900 rounded-md"
                            onClick={() => openEditDialog(outfit)}
                            title="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md"
                            onClick={() => handleDelete(outfit)}
                            disabled={deletingId === outfit.id}
                            title="Delete"
                          >
                            {deletingId === outfit.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. CLEAN PAGINATION CONTROLS */}
      {totalPages > 1 && (
        <div className="bg-white border border-slate-200/80 p-3 sm:p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
          <div className="text-xs text-slate-500">
            Showing <strong className="text-slate-900">{startItem}–{endItem}</strong> of{" "}
            <strong className="text-slate-900">{totalItems}</strong> inspirations
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1 || loading}
              className="h-8 px-2.5 text-xs rounded-lg border-slate-200 text-slate-700 font-medium disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Prev
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .map((pageNum, idx, arr) => {
                  const showEllipsis = idx > 0 && pageNum - arr[idx - 1] > 1;
                  return (
                    <React.Fragment key={pageNum}>
                      {showEllipsis && <span className="px-1 text-slate-400 text-xs">...</span>}
                      <button
                        onClick={() => setCurrentPage(pageNum)}
                        className={`h-7 w-7 text-xs rounded-lg transition-all font-medium ${
                          currentPage === pageNum
                            ? "bg-slate-900 text-white font-bold shadow-xs"
                            : "bg-slate-50 text-slate-600 hover:bg-slate-100"
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
              className="h-8 px-2.5 text-xs rounded-lg border-slate-200 text-slate-700 font-medium disabled:opacity-40"
            >
              Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* 6. FLOATING BATCH SELECTION ACTION BAR */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl border border-slate-800 flex items-center gap-4 animate-in slide-in-from-bottom-5">
          <span className="text-xs text-slate-300 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-indigo-400" />
            <strong className="text-white font-bold">{selectedIds.length}</strong> selected
          </span>

          <div className="h-4 w-px bg-slate-700" />

          <button
            onClick={handleSelectAllPage}
            className="text-xs text-slate-300 hover:text-white underline font-medium"
          >
            {isAllCurrentPageSelected ? "Deselect Page" : "Select Page"}
          </button>

          <Button
            onClick={handleBulkDelete}
            disabled={bulkDeleting}
            className="bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold px-3.5 h-8 flex items-center gap-1.5 shadow-xs"
          >
            {bulkDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            Bulk Delete ({selectedIds.length})
          </Button>

          <button
            onClick={() => setSelectedIds([])}
            className="p-1 text-slate-400 hover:text-white transition-colors"
            title="Clear Selection"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 7. INTERACTIVE LOOKBOOK INSPECTOR MODAL */}
      <Dialog open={Boolean(inspectingOutfit)} onOpenChange={(open) => !open && setInspectingOutfit(null)}>
        {inspectingOutfit && (
          <DialogContent className="max-w-4xl p-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* Left Column: Full-Height Image View */}
              <div className="relative aspect-[4/5] md:aspect-auto bg-slate-900 min-h-[380px] md:min-h-[500px]">
                <Image
                  src={inspectingOutfit.outfitImageUrl}
                  alt={inspectingOutfit.title}
                  fill
                  unoptimized
                  className="object-cover"
                />

                {/* Event Occasion Badge Overlay */}
                <div className="absolute top-4 left-4 z-10">
                  <span className="px-2.5 py-1 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-semibold rounded-lg shadow-md">
                    {inspectingOutfit.event?.name || "Occasion"}
                  </span>
                </div>

                {inspectingOutfit.isFeatured && (
                  <div className="absolute top-4 right-4 z-10">
                    <span className="px-2 py-0.5 bg-amber-500 text-white text-[10px] font-bold rounded-lg shadow-md flex items-center gap-1">
                      ★ Featured Look
                    </span>
                  </div>
                )}

                <div className="absolute bottom-4 left-4 right-4 z-10 flex items-center justify-between">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(inspectingOutfit.outfitImageUrl);
                      toast.success("Image URL copied to clipboard");
                    }}
                    className="px-2.5 py-1 bg-black/60 hover:bg-black/80 backdrop-blur-md text-white text-[11px] font-medium rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    <Copy className="h-3 w-3" /> Copy Image URL
                  </button>
                </div>
              </div>

              {/* Right Column: Look Details, Styling, and Products */}
              <div className="p-6 flex flex-col justify-between space-y-6 max-h-[85vh] overflow-y-auto">
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 leading-tight">
                        {inspectingOutfit.title}
                      </h2>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <User className="h-3 w-3 text-slate-400" />
                        {inspectingOutfit.stylist?.firstName?.startsWith("Photo by")
                          ? `${inspectingOutfit.stylist.firstName} ${inspectingOutfit.stylist.lastName}`
                          : inspectingOutfit.stylist?.professionalProfile?.businessName ||
                            `${inspectingOutfit.stylist?.firstName || "Stylist"} ${inspectingOutfit.stylist?.lastName || ""}`}
                      </p>
                    </div>

                    {inspectingOutfit.totalPrice && (
                      <div className="text-right shrink-0">
                        <div className="text-[10px] uppercase font-mono text-slate-400">Valuation</div>
                        <div className="text-base font-bold font-mono text-indigo-600">
                          GHS {inspectingOutfit.totalPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Styling Notes */}
                  {inspectingOutfit.description && (
                    <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Styling Guide</div>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        {inspectingOutfit.description}
                      </p>
                    </div>
                  )}

                  {/* Vibe Tags */}
                  {inspectingOutfit.tags && inspectingOutfit.tags.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Tags &amp; Keywords</div>
                      <div className="flex flex-wrap gap-1.5">
                        {inspectingOutfit.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-medium rounded-md border border-slate-200/60"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Linked Products Section */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between text-[11px] font-bold uppercase text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <ShoppingBag className="h-3.5 w-3.5 text-indigo-600" />
                        Linked Catalogue Products ({inspectingOutfit.products?.length || 0})
                      </span>
                    </div>

                    {inspectingOutfit.products && inspectingOutfit.products.length > 0 ? (
                      <div className="space-y-2">
                        {inspectingOutfit.products.map((item, idx) => {
                          const p = item.product;
                          const thumb = p?.images?.[0];
                          return (
                            <div
                              key={p?.id || idx}
                              className="flex items-center justify-between p-2.5 bg-white border border-slate-200/80 rounded-xl shadow-2xs"
                            >
                              <div className="flex items-center gap-3">
                                {thumb ? (
                                  <div className="relative h-10 w-10 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                                    <Image src={thumb} alt={p.name || "Product"} fill className="object-cover" />
                                  </div>
                                ) : (
                                  <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                                    <ShoppingBag className="h-4 w-4" />
                                  </div>
                                )}
                                <div>
                                  <h4 className="text-xs font-semibold text-slate-900 line-clamp-1">{p?.name || "Product Item"}</h4>
                                  <p className="text-[11px] font-mono text-slate-500">
                                    {p?.currency || "GHS"} {p?.price?.toFixed(2) || "0.00"}
                                  </p>
                                </div>
                              </div>

                              <a
                                href={`/catalogue/products/${p?.id}`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-50 transition-colors"
                                title="View in store"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
                        <p className="text-xs text-slate-500">No catalogue items linked directly to this look yet.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Engagement and Action Buttons */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 text-xs font-mono text-slate-500">
                    <span className="flex items-center gap-1 text-rose-500">
                      <Heart className="h-3.5 w-3.5 fill-rose-500/20" /> {inspectingOutfit.likes} Likes
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-slate-500">
                      <Bookmark className="h-3.5 w-3.5" /> {inspectingOutfit._count?.savedByUsers || 0} Saves
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const target = inspectingOutfit;
                        setInspectingOutfit(null);
                        openEditDialog(target);
                      }}
                      className="h-8 text-xs px-3 rounded-lg border-slate-200 font-semibold text-slate-800"
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1" /> Edit Look
                    </Button>

                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(inspectingOutfit)}
                      className="h-8 text-xs px-3 rounded-lg font-semibold"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* 8. CREATION & BULK IMPORT MODAL STUDIO */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl bg-white border border-slate-200 p-6 sm:p-7 rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-2 border-b border-slate-100 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <DialogTitle className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-600" />
                {selectedOutfit ? "Edit Lookbook Item" : "Lookbook Studio"}
              </DialogTitle>

              {!selectedOutfit && (
                <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setActiveTab("single")}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      activeTab === "single"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <ImageIcon className="h-3.5 w-3.5" /> Studio Editor
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("bulk")}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      activeTab === "bulk"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <FolderPlus className="h-3.5 w-3.5 text-amber-500" /> Bulk Computer Import
                  </button>
                </div>
              )}
            </div>

            <DialogDescription className="text-xs text-slate-500">
              {activeTab === "single"
                ? "Configure editorial look details, image assets, occasion linkage, and tags."
                : "Batch upload multiple image files directly from your PC into an occasion category."}
            </DialogDescription>
          </DialogHeader>

          {/* TAB 1: SINGLE STUDIO EDITOR */}
          {activeTab === "single" && (
            <form onSubmit={handleSubmitSingle} className="space-y-4 py-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Target Occasion *</label>
                    <Select
                      value={formData.eventId}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, eventId: value }))}
                    >
                      <SelectTrigger className="h-9 text-xs rounded-lg border-slate-200">
                        <SelectValue placeholder="Select target occasion" />
                      </SelectTrigger>
                      <SelectContent>
                        {events.map((event) => (
                          <SelectItem key={event.id} value={event.id} className="text-xs">
                            {event.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Title / Headline *</label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g. Traditional Velvet Owambe Look"
                      className="h-9 text-xs rounded-lg border-slate-200"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Styling Guide / Description</label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="Style notes, fabric details, or creator credits..."
                      rows={3}
                      className="text-xs rounded-lg border-slate-200 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">Valuation Price (GHS)</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.totalPrice}
                        onChange={(e) => setFormData((prev) => ({ ...prev, totalPrice: e.target.value }))}
                        placeholder="0.00"
                        className="h-9 text-xs rounded-lg border-slate-200"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">Tags (Comma Separated)</label>
                      <Input
                        value={formData.tags}
                        onChange={(e) => setFormData((prev) => ({ ...prev, tags: e.target.value }))}
                        placeholder="Owambe, Velvet, Gele"
                        className="h-9 text-xs rounded-lg border-slate-200"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-5 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                      <input
                        type="checkbox"
                        checked={formData.isFeatured}
                        onChange={(e) => setFormData((prev) => ({ ...prev, isFeatured: e.target.checked }))}
                        className="h-4 w-4 rounded border-slate-300 accent-indigo-600 cursor-pointer"
                      />
                      <span>Feature on Frontpage</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
                        className="h-4 w-4 rounded border-slate-300 accent-indigo-600 cursor-pointer"
                      />
                      <span>Active in Catalog</span>
                    </label>
                  </div>
                </div>

                {/* Right Column: Image File Upload & Multi-Image Gallery */}
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Image Source (Upload or URL)</label>
                    <Input
                      type="text"
                      value={formData.outfitImageUrl}
                      onChange={(e) => setFormData((prev) => ({ ...prev, outfitImageUrl: e.target.value }))}
                      placeholder="Image URL (e.g. https://...)"
                      className="h-9 text-xs rounded-lg border-slate-200"
                    />

                    {/* Drag & Drop File Upload Box */}
                    <div className="border-2 border-dashed border-slate-300 bg-slate-50/70 rounded-xl p-5 text-center hover:bg-slate-100 transition-colors relative cursor-pointer group mt-2">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleSingleFilesChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <UploadCloud className="h-7 w-7 text-slate-400 mx-auto group-hover:text-slate-700 transition-colors" />
                      <p className="text-xs text-slate-800 font-semibold mt-1">
                        Click or Drop Computer Photo
                      </p>
                      <p className="text-[10px] text-slate-400">Supports .jpg, .png, .webp formats</p>
                    </div>
                  </div>

                  {/* Uploaded Image Previews Grid */}
                  {singlePreviews.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-semibold text-slate-500">
                        Image Preview ({singlePreviews.length})
                      </span>
                      <div className="grid grid-cols-3 gap-2 max-h-[160px] overflow-y-auto p-1.5 border border-slate-200 rounded-xl bg-slate-50">
                        {singlePreviews.map((prev, idx) => (
                          <div key={idx} className="relative aspect-[4/5] bg-slate-200 rounded-lg border border-slate-300 group overflow-hidden">
                            <Image src={prev} alt="Preview" fill className="object-cover" />
                            <button
                              type="button"
                              onClick={() => removeSinglePreview(idx)}
                              className="absolute top-1 right-1 bg-slate-900/80 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-3 w-3" />
                            </button>
                            {idx === 0 && (
                              <span className="absolute bottom-1 left-1 bg-amber-500 text-white text-[8px] font-bold uppercase px-1 rounded">
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

              <DialogFooter className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="h-8 text-xs px-3 rounded-lg border-slate-200"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="h-8 text-xs px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold"
                >
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                  Save Inspiration
                </Button>
              </DialogFooter>
            </form>
          )}

          {/* TAB 2: BULK COMPUTER IMAGE UPLOADER */}
          {activeTab === "bulk" && (
            <form onSubmit={handleBulkComputerUploadSubmit} className="space-y-4 py-3">
              <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3 flex items-center gap-2.5">
                <FolderPlus className="h-4 w-4 text-amber-600 shrink-0" />
                <p className="text-xs text-amber-900">
                  Select multiple photos from your PC. Each photo will automatically be imported as a look in the selected occasion.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Target Occasion *</label>
                    <Select
                      value={bulkEventId}
                      onValueChange={(val) => setBulkEventId(val)}
                    >
                      <SelectTrigger className="h-9 text-xs rounded-lg border-slate-200">
                        <SelectValue placeholder="Select target occasion" />
                      </SelectTrigger>
                      <SelectContent>
                        {events.map((event) => (
                          <SelectItem key={event.id} value={event.id} className="text-xs">
                            {event.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Base Title Prefix (Optional)</label>
                    <Input
                      value={bulkBaseTitle}
                      onChange={(e) => setBulkBaseTitle(e.target.value)}
                      placeholder="e.g. Lagos Fashion Week Look"
                      className="h-9 text-xs rounded-lg border-slate-200"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Default Tags (Comma Separated)</label>
                    <Input
                      value={bulkTags}
                      onChange={(e) => setBulkTags(e.target.value)}
                      placeholder="Traditional, Gele, AsoEbi"
                      className="h-9 text-xs rounded-lg border-slate-200"
                    />
                  </div>
                </div>

                {/* Bulk Computer Dropzone */}
                <div className="space-y-3">
                  <label className="text-xs font-semibold text-slate-700">Select Files *</label>
                  <div className="border-2 border-dashed border-slate-300 bg-slate-50/70 rounded-xl p-6 text-center hover:bg-slate-100 transition-colors relative cursor-pointer group">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleBulkFilesChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <UploadCloud className="h-8 w-8 text-slate-400 mx-auto group-hover:text-slate-700 transition-colors" />
                    <p className="text-xs font-semibold text-slate-800 mt-1.5">
                      Click to Select Multiple Files
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Select up to 50 photos directly from your device</p>
                  </div>

                  {bulkFiles.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600 font-medium">{bulkFiles.length} files selected</span>
                        <button
                          type="button"
                          onClick={() => {
                            setBulkFiles([]);
                            setBulkPreviews([]);
                          }}
                          className="text-rose-600 hover:underline text-[11px] font-semibold"
                        >
                          Clear All
                        </button>
                      </div>

                      <div className="grid grid-cols-4 gap-1.5 max-h-[140px] overflow-y-auto p-1.5 border border-slate-200 rounded-xl bg-slate-50">
                        {bulkPreviews.map((prev, idx) => (
                          <div key={idx} className="relative aspect-[4/5] bg-slate-200 rounded-md border border-slate-300 group overflow-hidden">
                            <Image src={prev} alt="Bulk preview" fill className="object-cover" />
                            <button
                              type="button"
                              onClick={() => removeBulkPreview(idx)}
                              className="absolute top-1 right-1 bg-slate-900/80 text-white p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-2.5 w-2.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {uploadProgress && (
                <div className="p-3 bg-slate-900 text-white text-xs font-medium rounded-xl flex items-center justify-between animate-pulse">
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400" /> {uploadProgress}
                  </span>
                </div>
              )}

              <DialogFooter className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="h-8 text-xs px-3 rounded-lg border-slate-200"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={bulkUploading || bulkFiles.length === 0}
                  className="h-8 text-xs px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold flex items-center gap-1.5"
                >
                  {bulkUploading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <>
                      <UploadCloud className="h-3.5 w-3.5" />
                      Import Looks ({bulkFiles.length})
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
