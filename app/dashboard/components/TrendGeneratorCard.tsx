"use client";

import { useEffect, useState } from "react";

import { 
  Trash2, Loader2, CheckCircle2, AlertCircle, ImageIcon, RefreshCw, 
  Wand2, Zap, X, Tag
} from "lucide-react";
import { toast } from "sonner";

interface EventWithCount {
  id: string;
  name: string;
  searchKeywords?: string[];
  dressCodes?: string[];
  _count?: {
    outfitInspirations: number;
  };
}

interface GeneratedOutfit {
  id: string;
  eventName: string;
  title: string;
  outfitImageUrl: string;
  description: string;
  likes: number;
}

const AFRO_FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80',
];

export function TrendGeneratorCard() {
  const [events, setEvents] = useState<EventWithCount[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("all");
  const [engine, setEngine] = useState<string>("dalle3");
  const [imagesPerCategory, setImagesPerCategory] = useState<number>(60);
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [reseeding, setReseeding] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Real-Time Generated Visual Outfits State
  const [generatedOutfits, setGeneratedOutfits] = useState<GeneratedOutfit[]>([]);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [zoomImage, setZoomImage] = useState<GeneratedOutfit | null>(null);

  const fetchEvents = async () => {
    try {
      const res = await fetch("/api/events");
      if (res.ok) {
        const data = await res.json();
        setEvents(data || []);
      }
    } catch (err) {
      console.error("Failed to load events for trend generator:", err);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleReseedKeywords = async () => {
    try {
      setReseeding(true);
      setStatusMessage("Updating popular African fashion keywords & dress codes for all event categories...");
      const res = await fetch("/api/admin/trends/reseed-event-keywords", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to re-seed event keywords");

      toast.success(data.message || `Successfully re-seeded keywords for ${data.countUpdated} events!`);
      setStatusMessage(data.message);
      await fetchEvents();
    } catch (err: unknown) {
      console.error(err);
      const errObj = err as { message?: string };
      toast.error(errObj.message || "Failed to re-seed event keywords");
    } finally {
      setReseeding(false);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setStatusMessage("Generating photorealistic AI high-fashion lookbooks...");
    setErrorMessage(null);

    try {
      const res = await fetch("/api/admin/trends/generate-inspirations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: selectedEventId,
          imagesPerEvent: imagesPerCategory,
          engine,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate trend images");
      }

      setStatusMessage(data.message || "Successfully stored AI trend images in database!");
      if (data.outfits && Array.isArray(data.outfits)) {
        setGeneratedOutfits(data.outfits);
      }
      await fetchEvents();
    } catch (err: unknown) {
      const errObj = err as { message?: string };
      setErrorMessage(errObj.message || "An unexpected error occurred during generation.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    const targetName = selectedEventId === "all" ? "ALL event categories" : events.find(e => e.id === selectedEventId)?.name || "this category";
    if (!window.confirm(`Are you sure you want to delete all stored trend outfit inspirations for ${targetName}? This action cannot be undone.`)) {
      return;
    }

    setResetting(true);
    setStatusMessage(`Clearing stored trend inspirations for ${targetName}...`);
    setErrorMessage(null);
    setGeneratedOutfits([]);

    try {
      const res = await fetch(`/api/admin/trends/generate-inspirations?eventId=${selectedEventId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to reset trend inspirations");
      }

      setStatusMessage(data.message || "Successfully reset trend inspirations.");
      await fetchEvents();
    } catch (err: unknown) {
      const errObj = err as { message?: string };
      setErrorMessage(errObj.message || "Failed to reset trend inspirations.");
    } finally {
      setResetting(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      const res = await fetch(`/api/outfit-inspirations?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setGeneratedOutfits((prev) => prev.filter((item) => item.id !== id));
        toast.success("Lookbook item removed from DB");
        fetchEvents();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete item");
    }
  };

  return (
    <div className="bg-white text-slate-900 border border-slate-200/80 p-6 sm:p-8 shadow-xs rounded-2xl space-y-8 relative overflow-hidden font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-800">Generative AI Studio</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            AI Trend Lookbook Generator
          </h2>
          <p className="text-xs font-medium text-slate-500 mt-1 max-w-xl leading-relaxed">
            Generate photorealistic 8k African fashion lookbooks (Owambe Aso-Ebi, Kente, Agbada, Modern African Streetwear, Corporate Ankara) stored directly in PostgreSQL.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleReseedKeywords}
            disabled={reseeding || loading}
            className="bg-amber-50 border border-amber-200/80 text-amber-900 hover:bg-amber-100 text-xs font-bold px-3.5 py-2 flex items-center gap-1.5 transition-all rounded-xl shadow-2xs"
            title="Update all database event categories with popular African fashion keywords"
          >
            {reseeding ? <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-600" /> : <Tag className="h-3.5 w-3.5 text-amber-600" />}
            Re-Seed Event Keywords
          </button>

          <div className="bg-stone-100 border border-stone-200 px-4 py-2 flex items-center gap-2 rounded-lg">
            <Zap className="h-4 w-4 text-amber-600" />
            <span className="text-xs font-mono uppercase tracking-wider text-stone-700 font-bold">Multi-AI Engine Active</span>
          </div>
        </div>
      </div>

      {/* Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 bg-stone-50 p-6 border border-stone-200 rounded-xl">
        <div>
          <label className="block text-[10px] font-mono text-stone-500 uppercase tracking-widest mb-2 font-bold">
            Image Generator &amp; AI Provider
          </label>
          <select
            value={engine}
            onChange={(e) => setEngine(e.target.value)}
            disabled={loading || resetting}
            className="w-full bg-white border border-stone-300 rounded-lg px-4 py-3 text-xs font-mono text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          >
            <option value="dalle3">🎨 OpenAI GPT-Image Studio (Ultra HD)</option>
            <option value="ai">✨ High-Speed AI Engine (Pollinations / Flux)</option>
            <option value="replicate">⚡ Replicate Flux 1.1 Pro</option>
            <option value="afrocentric_curated">🌍 African Fashion Library (Photo Bank)</option>
            <option value="unsplash">📷 Unsplash African Search API</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-mono text-stone-500 uppercase tracking-widest mb-2 font-bold">
            Target Category
          </label>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            disabled={loading || resetting}
            className="w-full bg-white border border-stone-300 rounded-lg px-4 py-3 text-xs font-mono text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          >
            <option value="all">✨ All Event Categories ({events.length})</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} ({e._count?.outfitInspirations || 0} in DB)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-mono text-stone-500 uppercase tracking-widest mb-2 font-bold">
            Images Per Category
          </label>
          <input
            type="number"
            value={imagesPerCategory}
            onChange={(e) => setImagesPerCategory(Math.max(5, Math.min(100, Number(e.target.value))))}
            disabled={loading || resetting}
            className="w-full bg-white border border-stone-300 rounded-lg px-4 py-3 text-xs font-mono text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />
        </div>

        <div className="flex items-end gap-3">
          <button
            onClick={handleGenerate}
            disabled={loading || resetting}
            className="flex-1 bg-stone-900 text-white font-mono text-xs font-bold uppercase tracking-widest py-3.5 px-4 rounded-lg hover:bg-stone-800 transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-white" />
                Generating AI...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 text-white" />
                Generate &amp; Preview
              </>
            )}
          </button>

          <button
            onClick={handleReset}
            disabled={loading || resetting}
            className="bg-rose-50 text-rose-700 border border-rose-200 font-mono text-xs font-bold uppercase tracking-widest py-3.5 px-4 rounded-lg hover:bg-rose-100 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
            title="Clear stored items"
          >
            {resetting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Reset
          </button>
        </div>
      </div>

      {/* Status Messages */}
      {statusMessage && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 text-xs font-mono uppercase tracking-wider flex items-center gap-3 rounded-lg font-bold animate-in fade-in-50">
          <CheckCircle2 className="h-5 w-5 text-amber-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-900 text-xs font-mono uppercase tracking-wider flex items-center gap-3 rounded-lg font-bold animate-in fade-in-50">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* REAL-TIME GENERATED AI LOOKBOOKS GALLERY GRID */}
      {generatedOutfits.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-stone-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-serif italic text-stone-900">
                Live Generated AI Lookbooks <span className="not-italic text-stone-500 text-sm font-mono">({generatedOutfits.length})</span>
              </h3>
              <p className="text-[10px] font-mono text-stone-500 uppercase tracking-widest">
                Real-time photorealistic AI model looks saved to database. Click any look to inspect full resolution.
              </p>
            </div>
            <button
              onClick={() => setGeneratedOutfits([])}
              className="text-[10px] font-mono uppercase tracking-wider text-stone-500 hover:text-stone-900"
            >
              Clear Preview Grid
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {generatedOutfits.map((item, idx) => {
              const isFailed = failedImages[item.id];
              const displaySrc = isFailed 
                ? AFRO_FALLBACK_IMAGES[idx % AFRO_FALLBACK_IMAGES.length]
                : item.outfitImageUrl;

              return (
                <div 
                  key={item.id}
                  className="group relative bg-white border border-stone-200 hover:border-amber-500 transition-all duration-300 overflow-hidden flex flex-col rounded-lg shadow-xs hover:shadow-md"
                >
                  <div className="relative aspect-[3/4] bg-stone-100 overflow-hidden cursor-pointer" onClick={() => setZoomImage({ ...item, outfitImageUrl: displaySrc })}>
                    {/* Fail-Safe Image Tag */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={displaySrc}
                      alt={item.title}
                      onError={() => setFailedImages((prev) => ({ ...prev, [item.id]: true }))}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-900/80 via-transparent to-transparent opacity-60 group-hover:opacity-90 transition-opacity" />
                    
                    <div className="absolute top-2 left-2 right-2 flex items-center justify-between z-10">
                      <span className="px-2 py-0.5 bg-stone-900/80 text-white border border-white/20 text-[8px] font-mono uppercase rounded">
                        {item.eventName}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteItem(item.id);
                        }}
                        className="p-1 bg-rose-600 text-white hover:bg-rose-700 transition-colors rounded"
                        title="Remove from DB"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>

                    <div className="absolute bottom-2 left-2 right-2 z-10">
                      <p className="text-white text-xs font-serif italic truncate">{item.title}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Event Database Inventory List */}
      <div className="space-y-4 pt-6 border-t border-stone-200">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono uppercase tracking-widest text-stone-500 font-bold">Current Database Inventory &amp; Seeded Keywords</h3>
          <button onClick={fetchEvents} className="text-xs font-mono text-amber-700 hover:underline flex items-center gap-1 font-bold">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh Inventory
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((e) => (
            <div key={e.id} className="p-4 bg-stone-50 border border-stone-200 space-y-2 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-stone-400" />
                  <span className="text-xs font-mono text-stone-900 font-bold">{e.name}</span>
                </div>
                <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded font-bold ${
                  (e._count?.outfitInspirations || 0) > 0 
                    ? "bg-amber-100 text-amber-900 border border-amber-300" 
                    : "bg-stone-200 text-stone-500"
                }`}>
                  {e._count?.outfitInspirations || 0} in DB
                </span>
              </div>
              {e.searchKeywords && e.searchKeywords.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {e.searchKeywords.slice(0, 3).map((kw, i) => (
                    <span key={i} className="text-[9px] font-mono bg-white text-stone-600 px-2 py-0.5 border border-stone-200 rounded truncate max-w-[140px]">
                      #{kw}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ZOOM IMAGE MODAL */}
      {zoomImage && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-6" onClick={() => setZoomImage(null)}>
          <div className="relative max-w-lg w-full bg-white border border-stone-200 p-6 space-y-4 rounded-xl shadow-xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setZoomImage(null)} className="absolute top-4 right-4 text-stone-400 hover:text-stone-700">
              <X size={20} />
            </button>
            <div className="relative aspect-[3/4] bg-stone-100 border border-stone-200 rounded-lg overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={zoomImage.outfitImageUrl} alt={zoomImage.title} className="w-full h-full object-cover" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-amber-700 font-bold">{zoomImage.eventName}</span>
              <h3 className="text-xl font-serif italic text-stone-900 mt-1">{zoomImage.title}</h3>
              <p className="text-xs font-mono text-stone-500 mt-2 leading-relaxed">{zoomImage.description}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TrendGeneratorCard;
