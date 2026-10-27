"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Sparkles, Upload, Camera, X, Check, ArrowRight,
  RefreshCw, Download, Share2, Sliders, ShieldCheck,
  UserCheck, ShoppingBag, Wand2, Layers, AlertCircle,
  SunMedium, Store, Landmark, ChevronRight, ArrowLeftRight,
  RotateCcw, Eye, Zap, Scissors, Maximize2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export interface FitCheckOutfit {
  id: string;
  title: string;
  imageUrl: string;
  description?: string | null;
  tags?: string[];
  eventName?: string;
  price?: number | null;
  currency?: string;
}

interface FitCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  outfit: FitCheckOutfit | null;
}

const FIT_CUTS = [
  { id: "tailored", label: "Tailored Cut", desc: "Bespoke lines conforming to posture" },
  { id: "relaxed", label: "Relaxed Drape", desc: "Easy, comfortable movement" },
  { id: "oversized", label: "Street Oversized", desc: "Lagos & Tokyo streetwear silhouette" },
  { id: "slim", label: "Fitted Slim", desc: "Sharply tapered contour" },
];

const BACKGROUND_PRESETS = [
  { id: "original", label: "Exact Lookbook", icon: Layers, desc: "Exact photoshoot scene & dress environment" },
  { id: "studio", label: "Boutique Studio", icon: Store, desc: "Softbox lighting & warm marble" },
  { id: "luxury", label: "Luxury Gallery", icon: Landmark, desc: "Mahogany & ambient velvet" },
  { id: "outdoor", label: "Golden Terrace", icon: SunMedium, desc: "Sunlit coastal warm hour" },
];

/**
 * Client-side image compression & optimization helper
 * Ensures large camera photos (5MB - 20MB) are resized swiftly in-browser
 * before uploading, keeping network latency near zero.
 */
async function compressImageInBrowser(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (event) => {
      const img = new window.Image();
      img.onerror = reject;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        const maxDim = 1280;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.92);
        resolve(compressedDataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export default function FitCheckModal({ isOpen, onClose, outfit }: FitCheckModalProps) {
  // Reliable outfit reference image URL with fallback
  const refImageUrl = outfit?.imageUrl || "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80";

  // Image states
  const [userImage, setUserImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Styling Settings
  const [fitCut, setFitCut] = useState("tailored");
  const [backgroundSetting, setBackgroundSetting] = useState("original");
  const [customStyling, setCustomStyling] = useState("");
  const [showOptions, setShowOptions] = useState(false);

  // Generation status & steps
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Stylist verdict & metadata
  const [fitAnalysis, setFitAnalysis] = useState<{
    fitScore: number;
    skinToneSynergy: string;
    silhouetteDrape: string;
    stylistAdvice: string;
  } | null>(null);
  const [engineUsed, setEngineUsed] = useState<string>("");

  // Interactive slider state
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);
  const [comparisonMode, setComparisonMode] = useState<"slider" | "side-by-side" | "single">("slider");

  // DOM refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const sliderContainerRef = useRef<HTMLDivElement>(null);

  // Clear states when closed
  useEffect(() => {
    if (!isOpen) {
      setGeneratedImage(null);
      setFitAnalysis(null);
      setGenerationError(null);
      setIsGenerating(false);
      setGenerationStep(0);
    }
  }, [isOpen]);

  // Animated blending step progression
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isGenerating) {
      setGenerationStep(1);
      timer = setInterval(() => {
        setGenerationStep((prev) => (prev < 4 ? prev + 1 : prev));
      }, 3500);
    }
    return () => clearInterval(timer);
  }, [isGenerating]);

  // Comparison slider movement
  const handleSliderMove = useCallback((clientX: number) => {
    if (!sliderContainerRef.current) return;
    const rect = sliderContainerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percentage = (x / rect.width) * 100;
    setSliderPosition(percentage);
  }, []);

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDraggingSlider && e.touches[0]) {
      handleSliderMove(e.touches[0].clientX);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingSlider) {
      handleSliderMove(e.clientX);
    }
  };

  const handleFileProcess = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (JPG, PNG, WebP).");
      return;
    }

    try {
      toast.loading("Optimizing photo for AI Fit Check...", { id: "photo-opt" });
      const optimizedDataUrl = await compressImageInBrowser(file);
      setUserImage(optimizedDataUrl);
      setGeneratedImage(null);
      setFitAnalysis(null);
      setGenerationError(null);
      toast.success("Your photo is loaded and ready for virtual try-on!", { id: "photo-opt" });
    } catch (err) {
      console.warn("Client compression fallback:", err);
      const reader = new FileReader();
      reader.onload = (e) => {
        setUserImage(e.target?.result as string);
        setGeneratedImage(null);
        setFitAnalysis(null);
        toast.success("Photo loaded successfully!");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveUserImage = () => {
    setUserImage(null);
    setGeneratedImage(null);
    setFitAnalysis(null);
    setGenerationError(null);
  };

  // Run AI Fit Check
  const handleGenerateFitCheck = async () => {
    if (!userImage) {
      toast.error("Please upload your photo or take a selfie first.");
      return;
    }
    if (!outfit) {
      toast.error("No fashion outfit selected.");
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);
    setGeneratedImage(null);
    setFitAnalysis(null);

    try {
      const res = await fetch("/api/ai/fit-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          humanImageUrl: userImage,
          outfitImageUrl: refImageUrl,
          outfitTitle: outfit.title,
          outfitDescription: outfit.description || "",
          outfitTags: outfit.tags || [],
          fitCut,
          backgroundSetting,
          customStyling,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to generate fit check.");
      }

      setGeneratedImage(data.fitCheckImageUrl);
      setFitAnalysis(data.fitAnalysis);
      setEngineUsed(data.engineUsed || "AI Virtual Try-On");
      setSliderPosition(50);
      toast.success("Fit Check complete! Exact reference scene, background & pose preserved.");
    } catch (err: any) {
      console.error("[Fit Check Error]", err);
      setGenerationError(err?.message || "An unexpected error occurred during generation.");
      toast.error(err?.message || "Generation failed. Please try again.");
    } finally {
      setIsGenerating(false);
      setGenerationStep(0);
    }
  };

  const handleDownloadResult = async () => {
    if (!generatedImage) return;
    try {
      const res = await fetch(generatedImage);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fit-check-${outfit?.title ? outfit.title.toLowerCase().replace(/\s+/g, "-") : "trend"}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Fit Check image saved to downloads!");
    } catch {
      window.open(generatedImage, "_blank");
    }
  };

  const handleShareResult = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Lookbook link copied to clipboard!");
    }
  };

  if (!isOpen || !outfit) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl w-[94vw] max-h-[90vh] p-0 border border-stone-300 bg-[#FDFCF9] rounded-2xl overflow-hidden shadow-2xl flex flex-col filter drop-shadow-[0_20px_40px_rgba(0,0,0,0.22)] [&>button]:hidden">
        {/* Subtle Canvas Dot Grid Texture */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-30 z-0" 
          style={{ backgroundImage: "radial-gradient(#cfc7bd 1px, transparent 1px)", backgroundSize: "16px 16px" }}
        />

        {/* ========================================================= */}
        {/* MODAL HEADER (CUTE & COMPACT) */}
        {/* ========================================================= */}
        <div className="relative z-10 px-4 sm:px-5 py-2.5 border-b border-stone-200/90 flex items-center justify-between bg-white/85 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 flex items-center justify-center shadow-2xs shrink-0">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <DialogTitle className="font-['Caveat',cursive] text-xl sm:text-2xl font-bold text-stone-900 leading-none">
                  Wear This Fit
                </DialogTitle>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono uppercase tracking-wider bg-stone-900 text-white shadow-2xs">
                  AI Fit Check
                </span>
              </div>
              <p className="text-[11px] text-stone-500 font-serif italic">
                Exact reference scene & pose with your real face and skin tone
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="h-7 w-7 rounded-full bg-stone-100 hover:bg-stone-900 hover:text-white text-stone-600 flex items-center justify-center transition-all shadow-2xs"
            aria-label="Close fit check"
          >
            <X size={14} />
          </button>
        </div>

        {/* ========================================================= */}
        {/* MAIN BODY CONTENT */}
        {/* ========================================================= */}
        <div className="relative z-10 p-3 sm:p-4 md:p-5 overflow-y-auto max-h-[82vh] space-y-4">

          {/* ========================================================= */}
          {/* SIDE-BY-SIDE PRESENTATION: REFERENCE FIT vs YOUR PHOTO */}
          {/* ========================================================= */}
          <div className="relative">
            
            {/* Holographic Blend Wave Overlay active during generation */}
            {isGenerating && (
              <div className="absolute inset-0 z-30 pointer-events-none rounded-xl overflow-hidden border border-amber-400/60 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                {/* Horizontal scanning energy laser across both cards */}
                <motion.div
                  animate={{ y: ["0%", "100%", "0%"] }}
                  transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                  className="w-full h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_10px_#f59e0b]"
                />

                {/* Pulsing blend aura */}
                <div className="absolute inset-0 bg-amber-500/10 backdrop-blur-[1px] animate-pulse" />

                {/* Central AI Weaver Badge */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 bg-stone-950/90 text-white border border-amber-400/80 px-3 py-1.5 rounded-full shadow-xl flex items-center gap-1.5 backdrop-blur-md">
                  <Wand2 size={13} className="text-amber-400 animate-spin" />
                  <span className="text-[10px] font-mono tracking-wider uppercase font-semibold text-amber-200">
                    Blending Fit to Posture...
                  </span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 items-stretch">
              
              {/* ===================================================== */}
              {/* LEFT CARD: TARGET LOOKBOOK FIT REFERENCE */}
              {/* ===================================================== */}
              <div className="relative bg-white rounded-xl p-3 sm:p-3.5 border border-stone-200 shadow-2xs flex flex-col justify-between overflow-hidden group">
                {/* Active scan line when generating */}
                {isGenerating && (
                  <motion.div
                    animate={{ y: ["0%", "100%", "0%"] }}
                    transition={{ repeat: Infinity, duration: 2.2, ease: "linear" }}
                    className="absolute inset-x-0 h-0.5 bg-amber-500 z-20 shadow-[0_0_8px_#f59e0b]"
                  />
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] font-mono uppercase tracking-wider text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded-full border border-amber-300">
                      1. Reference Fit & Scene
                    </span>
                    <span className="text-[10px] font-serif italic text-stone-500">
                      Lookbook Aesthetic
                    </span>
                  </div>

                  {/* Reference Image Frame with full uncropped display */}
                  <div className="relative h-72 sm:h-80 md:h-88 w-full rounded-xl overflow-hidden bg-stone-900/[0.04] mb-2 border border-stone-200/90 shadow-2xs flex items-center justify-center p-1.5 group/img">
                    {/* Ambient blurred backdrop for aesthetic cohesion */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20 blur-md scale-110">
                      <Image src={refImageUrl} alt="" fill unoptimized className="object-cover" />
                    </div>

                    <Image
                      src={refImageUrl}
                      alt={outfit.title}
                      fill
                      unoptimized
                      className="object-contain transition-transform duration-300 group-hover/img:scale-[1.02] relative z-10"
                      priority
                      sizes="(max-width: 640px) 100vw, 50vw"
                    />

                    {/* Washi Tape Badge */}
                    <div className="absolute top-1.5 left-1.5 z-20 px-2 py-0.5 bg-[#EED571] border border-[#D8BF58] text-stone-900 rotate-[-2deg] shadow-2xs pointer-events-none font-['Permanent_Marker',cursive] text-[9px] uppercase">
                      THE FIT REF ✦
                    </div>

                    {isGenerating && (
                      <div className="absolute bottom-1.5 left-1.5 right-1.5 z-20 px-2 py-0.5 rounded bg-stone-950/80 text-amber-300 text-[9px] font-mono flex items-center justify-between backdrop-blur-md">
                        <span>Extracting cuts & scene</span>
                        <span className="animate-pulse">● Active</span>
                      </div>
                    )}
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-['Caveat',cursive] text-lg sm:text-xl font-bold text-stone-900 leading-tight">
                    {outfit.title}
                  </h3>
                  {outfit.description && (
                    <p className="text-[11px] text-stone-600 font-light italic mt-0.5 line-clamp-1">
                      &quot;{outfit.description}&quot;
                    </p>
                  )}
                </div>

                {/* Bottom Tags */}
                <div className="pt-2 border-t border-stone-100 mt-2 flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {outfit.tags && outfit.tags.length > 0 ? (
                      outfit.tags.slice(0, 3).map((t, idx) => (
                        <span key={idx} className="text-[9px] font-sans text-stone-600 bg-stone-100 px-1.5 py-0.5 rounded">
                          #{t}
                        </span>
                      ))
                    ) : (
                      <span className="text-[9px] text-stone-400">#Lookbook</span>
                    )}
                  </div>
                  {outfit.price && (
                    <span className="text-[11px] font-semibold text-stone-900">
                      {outfit.currency || "GHS"} {outfit.price.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>

              {/* ===================================================== */}
              {/* RIGHT CARD: YOUR UPLOADED PHOTO (CUTE COMPACT PREVIEW) */}
              {/* ===================================================== */}
              <div className="relative bg-white rounded-xl p-3 sm:p-3.5 border border-stone-200 shadow-2xs flex flex-col justify-between overflow-hidden group">
                {/* Active scan line when generating */}
                {isGenerating && (
                  <motion.div
                    animate={{ y: ["100%", "0%", "100%"] }}
                    transition={{ repeat: Infinity, duration: 2.2, ease: "linear" }}
                    className="absolute inset-x-0 h-0.5 bg-emerald-500 z-20 shadow-[0_0_8px_#10b981]"
                  />
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] font-mono uppercase tracking-wider text-emerald-900 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-300">
                      2. Your Photo
                    </span>
                    {userImage ? (
                      <span className="text-[10px] font-serif italic text-emerald-700 flex items-center gap-1">
                        <Check size={11} className="text-emerald-600" />
                        <span>Ready</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-serif italic text-stone-400">
                        Upload to Try On
                      </span>
                    )}
                  </div>

                  {/* ================================================= */}
                  {/* CASE A: USER HAS UPLOADED A PHOTO -> FULL DISPLAY */}
                  {/* ================================================= */}
                  {userImage ? (
                    <div className="relative h-72 sm:h-80 md:h-88 w-full rounded-xl overflow-hidden bg-stone-900/[0.04] mb-2 border border-stone-200/90 shadow-2xs flex items-center justify-center p-1.5 group/img">
                      {/* Ambient blurred backdrop so photo looks cohesive */}
                      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20 blur-md scale-110">
                        <Image src={userImage} alt="" fill unoptimized className="object-cover" />
                      </div>

                      <Image
                        src={userImage}
                        alt="Your uploaded photo"
                        fill
                        unoptimized
                        className="object-contain relative z-10"
                        priority
                        sizes="(max-width: 640px) 100vw, 50vw"
                      />

                      {/* Washi Tape Badge */}
                      <div className="absolute top-1.5 left-1.5 z-20 px-2 py-0.5 bg-[#BCD4B4] border border-[#A1C097] text-stone-900 rotate-[2deg] shadow-2xs pointer-events-none font-['Permanent_Marker',cursive] text-[9px] uppercase">
                        YOUR PHOTO ✌️
                      </div>

                      {/* Zero-drift lock indicators floating over photo */}
                      <div className="absolute top-1.5 right-1.5 z-20 flex flex-col gap-0.5 items-end pointer-events-none">
                        <span className="px-1.5 py-0.5 rounded-full text-[8px] font-mono bg-stone-950/80 text-emerald-300 backdrop-blur-md border border-white/20 flex items-center gap-0.5">
                          <Check size={8} /> Face Locked
                        </span>
                        <span className="px-1.5 py-0.5 rounded-full text-[8px] font-mono bg-stone-950/80 text-emerald-300 backdrop-blur-md border border-white/20 flex items-center gap-0.5">
                          <Check size={8} /> Skin Synced
                        </span>
                      </div>

                      {/* Loading status bar if generating */}
                      {isGenerating && (
                        <div className="absolute bottom-1.5 left-1.5 right-1.5 z-20 px-2 py-0.5 rounded bg-stone-950/80 text-emerald-300 text-[9px] font-mono flex items-center justify-between backdrop-blur-md">
                          <span>Locking landmarks</span>
                          <span className="animate-pulse">● Weaving</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* =============================================== */
                    /* CASE B: NO PHOTO YET -> CUTE CLICKABLE DROPZONE */
                    /* =============================================== */
                    <label
                      htmlFor="fit-check-user-upload-field"
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragOver(true);
                      }}
                      onDragLeave={() => setIsDragOver(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragOver(false);
                        if (e.dataTransfer.files?.[0]) {
                          handleFileProcess(e.dataTransfer.files[0]);
                        }
                      }}
                      className={cn(
                        "relative h-72 sm:h-80 md:h-88 w-full rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center p-3 text-center mb-2 cursor-pointer group/drop",
                        isDragOver
                          ? "border-amber-500 bg-amber-50/50 scale-[0.99]"
                          : "border-stone-300 bg-stone-50/70 hover:border-stone-900 hover:bg-stone-50"
                      )}
                    >
                      <div className="h-8 w-8 rounded-xl bg-white text-stone-700 border border-stone-200 flex items-center justify-center mb-2 shadow-2xs group-hover/drop:scale-105 transition-transform">
                        <Upload size={16} className="text-stone-600 group-hover/drop:text-stone-900" />
                      </div>

                      <h4 className="text-xs font-semibold text-stone-900 mb-0.5">
                        Upload Your Photo
                      </h4>
                      <p className="text-[10px] text-stone-500 max-w-xs mb-3 leading-tight">
                        Click or drag portrait. Full face & posture recommended.
                      </p>

                      <div className="flex flex-wrap gap-1.5 justify-center pointer-events-none">
                        <span className="px-3 py-1.5 rounded-lg bg-stone-900 text-white text-[10px] font-medium shadow-xs flex items-center gap-1">
                          <Upload size={11} />
                          <span>Browse Device</span>
                        </span>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            cameraInputRef.current?.click();
                          }}
                          className="pointer-events-auto px-3 py-1.5 rounded-lg bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 text-[10px] font-medium shadow-2xs transition-all flex items-center gap-1"
                        >
                          <Camera size={11} />
                          <span>Take Selfie</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setUserImage("https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=700&q=80");
                          setGeneratedImage(null);
                          setFitAnalysis(null);
                          toast.success("Loaded demo portrait! Ready for Fit Check.");
                        }}
                        className="pointer-events-auto mt-3 text-[10px] text-amber-800 hover:text-amber-950 underline font-medium"
                      >
                        ✨ Test with demo portrait
                      </button>
                    </label>
                  )}

                  {/* Photo Action Buttons when an image IS uploaded */}
                  {userImage && (
                    <div className="flex items-center justify-between pt-0.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isGenerating}
                          className="text-[11px] font-medium text-stone-700 hover:text-stone-950 underline flex items-center gap-1 transition-colors"
                        >
                          <RefreshCw size={10} />
                          <span>Change Photo</span>
                        </button>
                        <span className="text-stone-300">•</span>
                        <button
                          onClick={() => cameraInputRef.current?.click()}
                          disabled={isGenerating}
                          className="text-[11px] font-medium text-stone-700 hover:text-stone-950 underline flex items-center gap-1 transition-colors"
                        >
                          <Camera size={10} />
                          <span>Retake Selfie</span>
                        </button>
                      </div>

                      <button
                        onClick={handleRemoveUserImage}
                        disabled={isGenerating}
                        className="text-[11px] text-rose-600 hover:text-rose-800 underline transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                {/* Hidden File Inputs */}
                <input
                  id="fit-check-user-upload-field"
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleFileProcess(e.target.files[0]);
                  }}
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="user"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleFileProcess(e.target.files[0]);
                  }}
                />

                {/* Identity Guarantee Strip */}
                <div className="pt-2 border-t border-stone-100 mt-2 flex items-center justify-between text-[10px] text-stone-500">
                  <div className="flex items-center gap-1">
                    <ShieldCheck size={11} className="text-emerald-600" />
                    <span>Exact Features & Skin Synced</span>
                  </div>
                  <span className="font-mono text-[9px] text-emerald-700 font-semibold">100% Fidelity</span>
                </div>
              </div>

            </div>
          </div>

          {/* ========================================================= */}
          {/* THE NEURAL BLEND LOADING STATE (CUTE & COMPACT) */}
          {/* ========================================================= */}
          <AnimatePresence>
            {isGenerating && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-stone-900 via-stone-950 to-stone-900 text-white shadow-lg border border-stone-800 space-y-3 relative overflow-hidden"
              >
                {/* Background ambient glow pulse */}
                <div className="absolute -top-20 -left-20 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

                {/* Top Blend Headline */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-white/10 pb-2.5 relative z-10">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center shrink-0">
                      <Sparkles className="h-3.5 w-3.5 animate-spin" />
                    </div>
                    <div>
                      <h4 className="font-['Caveat',cursive] text-lg sm:text-xl font-bold text-amber-200 leading-tight">
                        Weaving Lookbook Fit Onto You...
                      </h4>
                      <p className="text-[10px] text-stone-400 font-serif italic">
                        Preserving exact scene & pose with your facial features and skin tone
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300 bg-amber-950/80 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                    Step {generationStep} of 4
                  </span>
                </div>

                {/* Dynamic Visual Cross-Image Blend Preview Animation */}
                <div className="relative h-20 sm:h-24 rounded-xl bg-black/75 border border-white/10 overflow-hidden flex items-center justify-between px-3 sm:px-6 relative z-10">
                  
                  {/* Left Ghost Thumbnail: Reference Outfit */}
                  <div className="relative h-14 w-14 sm:h-16 sm:w-16 rounded-lg overflow-hidden border border-amber-400/80 shadow-[0_0_10px_rgba(245,158,11,0.25)] shrink-0 bg-stone-900 flex items-center justify-center p-0.5">
                    <Image
                      src={refImageUrl}
                      alt="Outfit reference"
                      fill
                      unoptimized
                      className="object-contain"
                    />
                    <div className="absolute inset-0 bg-amber-500/20 animate-pulse pointer-events-none" />
                    <span className="absolute bottom-0.5 left-0.5 right-0.5 px-0.5 py-0.2 rounded text-[7px] font-mono bg-black/80 text-amber-200 text-center truncate z-10">
                      Ref Scene
                    </span>
                  </div>

                  {/* Energy Wave Particle Flow & Central Hologram Morph */}
                  <div className="flex-1 mx-2 sm:mx-4 flex flex-col items-center justify-center relative">
                    
                    {/* Pulsing Central Hologram Morph Orb */}
                    <div className="relative h-9 w-9 rounded-full overflow-hidden border border-amber-400/90 shadow-[0_0_12px_#f59e0b] mb-1.5 flex items-center justify-center bg-stone-900">
                      <div className="absolute inset-0 opacity-40 mix-blend-screen">
                        <Image src={refImageUrl} alt="Ref" fill unoptimized className="object-cover" />
                      </div>
                      {userImage && (
                        <div className="absolute inset-0 opacity-50 mix-blend-overlay animate-pulse">
                          <Image src={userImage} alt="User" fill unoptimized className="object-cover" />
                        </div>
                      )}
                      <Wand2 size={12} className="text-amber-300 animate-spin relative z-10" />
                    </div>

                    {/* Laser stream */}
                    <div className="w-full h-0.5 bg-stone-800 rounded-full relative overflow-hidden">
                      <motion.div
                        animate={{ x: ["-100%", "100%"] }}
                        transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
                        className="w-1/2 h-full bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_8px_#f59e0b]"
                      />
                    </div>
                    
                    <div className="mt-1 text-center">
                      <span className="text-[10px] font-mono text-stone-300">
                        {generationStep === 1 && "Scanning facial coordinates & melanin..."}
                        {generationStep === 2 && "Anchoring reference background & stance..."}
                        {generationStep === 3 && "Weaving lookbook tailoring onto posture..."}
                        {generationStep >= 4 && "Harmonizing photorealistic lighting & pores..."}
                      </span>
                    </div>
                  </div>

                  {/* Right Ghost Thumbnail: User */}
                  {userImage && (
                    <div className="relative h-14 w-14 sm:h-16 sm:w-16 rounded-lg overflow-hidden border border-emerald-400/80 shadow-[0_0_10px_rgba(16,185,129,0.25)] shrink-0 bg-stone-900 flex items-center justify-center p-0.5">
                      <Image
                        src={userImage}
                        alt="User photo"
                        fill
                        unoptimized
                        className="object-contain"
                      />
                      <div className="absolute inset-0 bg-emerald-500/20 animate-pulse pointer-events-none" />
                      <span className="absolute bottom-0.5 left-0.5 right-0.5 px-0.5 py-0.2 rounded text-[7px] font-mono bg-black/80 text-emerald-200 text-center truncate z-10">
                        Your Face
                      </span>
                    </div>
                  )}
                </div>

                {/* 4-Step Status Progress Bar */}
                <div className="grid grid-cols-4 gap-1.5 relative z-10">
                  {[1, 2, 3, 4].map((step) => (
                    <div key={step} className="space-y-0.5">
                      <div
                        className={cn(
                          "h-1 rounded-full transition-all duration-500",
                          generationStep >= step ? "bg-amber-400 shadow-[0_0_6px_#f59e0b]" : "bg-white/10"
                        )}
                      />
                      <span className="text-[8px] font-mono text-stone-400 block truncate">
                        {step === 1 && "1. Face"}
                        {step === 2 && "2. Scene"}
                        {step === 3 && "3. Weave"}
                        {step === 4 && "4. Polish"}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ========================================================= */}
          {/* STYLING OPTIONS & FIT TRIGGER BUTTON */}
          {/* ========================================================= */}
          {!generatedImage && !isGenerating && (
            <div className="space-y-3">
              
              {/* Optional Advanced Styling Toggle */}
              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => setShowOptions(!showOptions)}
                  className="inline-flex items-center gap-1 text-[11px] text-stone-600 hover:text-stone-900 transition-colors"
                >
                  <Sliders size={12} />
                  <span>{showOptions ? "Hide Fit Preferences" : "Customize Fit Cut & Studio Background"}</span>
                </button>

                {userImage && (
                  <span className="text-[11px] text-emerald-700 font-serif italic">
                    ✓ Both images locked
                  </span>
                )}
              </div>

              {/* Collapsible Preferences */}
              <AnimatePresence>
                {showOptions && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-white rounded-xl p-3 border border-stone-200 shadow-2xs space-y-3 overflow-hidden"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Fit Cut */}
                      <div>
                        <label className="block text-[11px] font-semibold text-stone-900 mb-1">
                          Tailoring Cut
                        </label>
                        <div className="grid grid-cols-2 gap-1">
                          {FIT_CUTS.map((cut) => (
                            <button
                              key={cut.id}
                              type="button"
                              onClick={() => setFitCut(cut.id)}
                              className={cn(
                                "p-1.5 text-left rounded-lg border text-[11px] transition-all",
                                fitCut === cut.id
                                  ? "bg-stone-900 text-white border-stone-900 shadow-2xs"
                                  : "bg-[#FDFCF9] text-stone-700 border-stone-200 hover:border-stone-300"
                              )}
                            >
                              <div className="font-medium text-[10px]">{cut.label}</div>
                              <div className={cn("text-[8px] line-clamp-1", fitCut === cut.id ? "text-stone-300" : "text-stone-400")}>
                                {cut.desc}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Background */}
                      <div>
                        <label className="block text-[11px] font-semibold text-stone-900 mb-1">
                          Studio Atmosphere
                        </label>
                        <div className="grid grid-cols-2 gap-1">
                          {BACKGROUND_PRESETS.map((bg) => {
                            const Icon = bg.icon;
                            return (
                              <button
                                key={bg.id}
                                type="button"
                                onClick={() => setBackgroundSetting(bg.id)}
                                className={cn(
                                  "p-1.5 text-left rounded-lg border text-[11px] transition-all flex items-center gap-1.5",
                                  backgroundSetting === bg.id
                                    ? "bg-stone-900 text-white border-stone-900 shadow-2xs"
                                    : "bg-[#FDFCF9] text-stone-700 border-stone-200 hover:border-stone-300"
                                )}
                              >
                                <Icon size={12} className={backgroundSetting === bg.id ? "text-amber-300" : "text-stone-400"} />
                                <div className="overflow-hidden">
                                  <div className="font-medium text-[10px] truncate">{bg.label}</div>
                                  <div className={cn("text-[8px] truncate", backgroundSetting === bg.id ? "text-stone-300" : "text-stone-400")}>
                                    {bg.desc}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Custom Styling adjustments input */}
                    <div>
                      <label className="block text-[10px] font-medium text-stone-700 mb-0.5">
                        Personal Styling Adjustment (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. untucked hem, gold watch on wrist, rolled-up sleeves..."
                        value={customStyling}
                        onChange={(e) => setCustomStyling(e.target.value)}
                        className="w-full text-[11px] p-2 rounded-lg border border-stone-200 bg-[#FDFCF9] focus:outline-none focus:border-stone-900"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Main Primary Action Bar (Cute & Compact) */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 p-2.5 sm:p-3 rounded-xl bg-amber-50/90 border border-amber-200/80">
                <div className="space-y-0.5 text-center sm:text-left">
                  <div className="text-xs font-semibold text-stone-900 flex items-center justify-center sm:justify-start gap-1">
                    <Sparkles size={13} className="text-amber-700" />
                    <span>Ready for Fit Check</span>
                  </div>
                  <p className="text-[10px] text-stone-600">
                    {userImage 
                      ? "Your photo is uploaded. Click below to generate your fit check." 
                      : "Upload your photo in the card above to wear this lookbook outfit."}
                  </p>
                </div>

                <button
                  onClick={handleGenerateFitCheck}
                  disabled={!userImage}
                  className="w-full sm:w-auto px-5 py-2 rounded-full bg-stone-900 hover:bg-stone-800 disabled:bg-stone-300 disabled:cursor-not-allowed text-white text-xs font-semibold tracking-normal transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-1.5 group shrink-0"
                >
                  <Wand2 size={13} className="group-hover:rotate-12 transition-transform text-amber-300" />
                  <span>Wear This Fit ✨</span>
                  <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>

            </div>
          )}

          {/* ERROR ALERT IF ANY */}
          {generationError && !isGenerating && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-800">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <div className="flex-1 text-[11px]">
                <div className="font-semibold">Fit Check Notice</div>
                <div>{generationError}</div>
                <button
                  onClick={handleGenerateFitCheck}
                  className="mt-1.5 text-[11px] font-semibold underline hover:text-rose-950"
                >
                  Click here to retry
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* THE GENERATED FIT CHECK REVEAL (COMPACT & CUTE) */}
          {/* ========================================================= */}
          {generatedImage && (
            <div className="space-y-4 pt-1">
              
              {/* Display Header Toolbar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-stone-200 pb-2.5">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-['Caveat',cursive] text-2xl font-bold text-stone-900">
                      Fit Check Complete ✦
                    </span>
                    <span className="text-[9px] font-mono uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300">
                      Face & Pose Locked
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 font-serif italic">
                    Drag the divider across your photo to compare before & after fitting.
                  </p>
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded-lg">
                  <button
                    onClick={() => setComparisonMode("slider")}
                    className={cn(
                      "px-2.5 py-0.5 rounded-md text-[11px] font-medium transition-all",
                      comparisonMode === "slider"
                        ? "bg-white text-stone-900 shadow-2xs"
                        : "text-stone-600 hover:text-stone-900"
                    )}
                  >
                    Split Slider
                  </button>
                  <button
                    onClick={() => setComparisonMode("side-by-side")}
                    className={cn(
                      "px-2.5 py-0.5 rounded-md text-[11px] font-medium transition-all",
                      comparisonMode === "side-by-side"
                        ? "bg-white text-stone-900 shadow-2xs"
                        : "text-stone-600 hover:text-stone-900"
                    )}
                  >
                    Side-by-Side
                  </button>
                  <button
                    onClick={() => setComparisonMode("single")}
                    className={cn(
                      "px-2.5 py-0.5 rounded-md text-[11px] font-medium transition-all",
                      comparisonMode === "single"
                        ? "bg-white text-stone-900 shadow-2xs"
                        : "text-stone-600 hover:text-stone-900"
                    )}
                  >
                    Fit Only
                  </button>
                </div>
              </div>

              {/* COMPARISON VIEWPORT */}
              <div className="relative rounded-2xl overflow-hidden bg-stone-950 shadow-xl border border-stone-800">
                
                {/* 1. SLIDER COMPARISON MODE */}
                {comparisonMode === "slider" && userImage && (
                  <div
                    ref={sliderContainerRef}
                    className="relative w-full h-[400px] sm:h-[480px] md:h-[540px] select-none cursor-ew-resize overflow-hidden bg-stone-950 flex items-center justify-center"
                    onMouseDown={() => setIsDraggingSlider(true)}
                    onMouseUp={() => setIsDraggingSlider(false)}
                    onMouseLeave={() => setIsDraggingSlider(false)}
                    onMouseMove={handleMouseMove}
                    onTouchStart={() => setIsDraggingSlider(true)}
                    onTouchEnd={() => setIsDraggingSlider(false)}
                    onTouchMove={handleTouchMove}
                  >
                    {/* Background Layer: Ambient Glow + Generated Fit Check (Right/After) */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20 blur-xl scale-110">
                      <Image src={generatedImage} alt="" fill unoptimized className="object-cover" />
                    </div>
                    <div className="absolute inset-0 w-full h-full flex items-center justify-center p-2">
                      <Image
                        src={generatedImage}
                        alt="AI Fit Check"
                        fill
                        unoptimized
                        className="object-contain object-center relative z-10"
                        priority
                      />
                      <span className="absolute bottom-3 right-3 z-30 px-2.5 py-1 rounded-full text-[9px] font-mono uppercase tracking-wider bg-stone-950/85 text-amber-300 backdrop-blur-md border border-amber-500/30 shadow-md flex items-center gap-1">
                        <Sparkles size={10} className="text-amber-400" />
                        <span>Wearing This Fit ✨</span>
                      </span>
                    </div>

                    {/* Foreground Layer: User's Original Image (Left/Before), clipped by slider */}
                    <div
                      className="absolute inset-0 h-full overflow-hidden z-20 border-r-2 border-white shadow-[2px_0_12px_rgba(0,0,0,0.6)]"
                      style={{ width: `${sliderPosition}%` }}
                    >
                      <div
                        className="relative h-full flex items-center justify-center p-2"
                        style={{
                          width: sliderContainerRef.current ? `${sliderContainerRef.current.clientWidth}px` : "100%",
                          minWidth: "100%",
                        }}
                      >
                        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20 blur-xl scale-110">
                          <Image src={userImage} alt="" fill unoptimized className="object-cover" />
                        </div>
                        <Image
                          src={userImage}
                          alt="Your original photo"
                          fill
                          unoptimized
                          className="object-contain object-center relative z-10"
                        />
                        <span className="absolute bottom-3 left-3 z-30 px-2.5 py-1 rounded-full text-[9px] font-mono uppercase tracking-wider bg-stone-950/85 text-white backdrop-blur-md border border-white/20 shadow-md">
                          Your Original Photo
                        </span>
                      </div>
                    </div>

                    {/* Draggable Divider Handle */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-white z-30 pointer-events-none"
                      style={{ left: `${sliderPosition}%` }}
                    >
                      <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-7 w-7 rounded-full bg-white text-stone-900 shadow-xl flex items-center justify-center text-[11px] font-bold font-mono border border-stone-200">
                        ‹ ›
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. SIDE BY SIDE MODE */}
                {comparisonMode === "side-by-side" && userImage && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-stone-950 p-2 sm:p-2.5">
                    <div className="relative h-[380px] sm:h-[480px] md:h-[520px] rounded-xl overflow-hidden bg-stone-900/90 flex items-center justify-center p-2 border border-stone-800">
                      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20 blur-xl scale-110">
                        <Image src={userImage} alt="" fill unoptimized className="object-cover" />
                      </div>
                      <Image
                        src={userImage}
                        alt="Original Photo"
                        fill
                        unoptimized
                        className="object-contain object-center relative z-10"
                        priority
                      />
                      <span className="absolute bottom-2.5 left-2.5 z-20 px-2.5 py-1 rounded-full text-[9px] font-mono uppercase tracking-wider bg-stone-950/85 text-white backdrop-blur-md border border-white/20 shadow-xs">
                        Original Photo
                      </span>
                    </div>

                    <div className="relative h-[380px] sm:h-[480px] md:h-[520px] rounded-xl overflow-hidden bg-stone-900/90 flex items-center justify-center p-2 border border-stone-800">
                      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20 blur-xl scale-110">
                        <Image src={generatedImage} alt="" fill unoptimized className="object-cover" />
                      </div>
                      <Image
                        src={generatedImage}
                        alt="AI Fit Check"
                        fill
                        unoptimized
                        className="object-contain object-center relative z-10"
                        priority
                      />
                      <span className="absolute bottom-2.5 right-2.5 z-20 px-2.5 py-1 rounded-full text-[9px] font-mono uppercase tracking-wider bg-stone-950/85 text-amber-300 backdrop-blur-md border border-amber-500/30 shadow-xs flex items-center gap-1">
                        <Sparkles size={10} className="text-amber-400" />
                        <span>Wearing This Fit ✨</span>
                      </span>
                    </div>
                  </div>
                )}

                {/* 3. FIT ONLY SINGLE MODE */}
                {comparisonMode === "single" && (
                  <div className="relative w-full h-[420px] sm:h-[520px] md:h-[580px] rounded-2xl overflow-hidden bg-stone-950 flex items-center justify-center p-2 sm:p-3">
                    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20 blur-xl scale-110">
                      <Image src={generatedImage} alt="" fill unoptimized className="object-cover" />
                    </div>
                    <Image
                      src={generatedImage}
                      alt="AI Fit Check"
                      fill
                      unoptimized
                      className="object-contain object-center relative z-10"
                      priority
                    />
                    <span className="absolute bottom-3 right-3 z-20 px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider bg-stone-950/85 text-amber-200 backdrop-blur-md border border-amber-500/30 flex items-center gap-1.5 shadow-md">
                      <Sparkles size={11} className="text-amber-400" />
                      <span>Editorial Fit Check ✨</span>
                    </span>
                  </div>
                )}
              </div>

              {/* AI STYLIST VERDICT & FIT METRICS */}
              {fitAnalysis && (
                <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-stone-200 shadow-2xs space-y-2.5">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                    <div className="flex items-center gap-1.5">
                      <Sparkles size={14} className="text-amber-600" />
                      <h4 className="font-['Caveat',cursive] text-xl font-bold text-stone-900">
                        Stylist Fit Analysis
                      </h4>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-stone-500 font-mono">Score</span>
                      <span className="font-['Caveat',cursive] text-2xl font-bold text-emerald-700">
                        {fitAnalysis.fitScore}/100
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-mono uppercase tracking-wider text-stone-400 block">
                        Skin Tone & Harmony
                      </span>
                      <p className="text-stone-700 leading-snug font-light italic">
                        &quot;{fitAnalysis.skinToneSynergy}&quot;
                      </p>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[9px] font-mono uppercase tracking-wider text-stone-400 block">
                        Drape & Posture
                      </span>
                      <p className="text-stone-700 leading-snug font-light italic">
                        &quot;{fitAnalysis.silhouetteDrape}&quot;
                      </p>
                    </div>
                  </div>

                  {fitAnalysis.stylistAdvice && (
                    <div className="pt-1.5 border-t border-stone-100 text-[11px] text-stone-600">
                      <span className="font-semibold text-stone-900">Styling Tip: </span>
                      {fitAnalysis.stylistAdvice}
                    </div>
                  )}
                </div>
              )}

              {/* ACTION TOOLBAR: Download, Share, Re-generate, Shop */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={handleDownloadResult}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-stone-900 hover:bg-stone-800 text-white text-[11px] font-medium transition-all shadow-2xs"
                  >
                    <Download size={12} />
                    <span>Download Fit Check</span>
                  </button>

                  <button
                    onClick={handleShareResult}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-stone-300 hover:bg-stone-100 text-stone-700 text-[11px] font-medium transition-all"
                  >
                    <Share2 size={11} />
                    <span>Share</span>
                  </button>

                  <button
                    onClick={() => {
                      if (generatedImage) window.open(generatedImage, "_blank");
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-stone-300 hover:bg-stone-100 text-stone-700 text-[11px] font-medium transition-all"
                    title="Open uncropped full-resolution photo in new tab"
                  >
                    <Maximize2 size={11} />
                    <span>Full HD</span>
                  </button>

                  <button
                    onClick={() => {
                      setGeneratedImage(null);
                      setFitAnalysis(null);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-stone-300 hover:bg-stone-100 text-stone-700 text-[11px] font-medium transition-all"
                  >
                    <RotateCcw size={11} />
                    <span>New Try-On</span>
                  </button>
                </div>

                <Link
                  href={`/shopping?search=${encodeURIComponent(outfit.title)}`}
                  onClick={onClose}
                  className="inline-flex items-center gap-1 px-4 py-1.5 rounded-full bg-amber-500 hover:bg-amber-600 text-stone-950 text-[11px] font-bold transition-all shadow-2xs"
                >
                  <ShoppingBag size={12} />
                  <span>Shop Look</span>
                  <ChevronRight size={12} />
                </Link>
              </div>

            </div>
          )}

        </div>

      </DialogContent>
    </Dialog>
  );
}
