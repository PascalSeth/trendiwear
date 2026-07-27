"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Sparkles, Wand2, Palette, Loader2,
  Upload, Download, Plus, X, Key,
  Check, Layers, Settings2, ShoppingBag,
  Zap, Eye, EyeOff,
  Search, Shirt, Camera, ChevronDown,
  Lightbulb, BookOpen
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface ProductItem {
  id: string;
  name: string;
  images: string[];
  price: number;
}

const COLOR_SWATCHES = [
  { name: "Original", hex: "transparent", bgClass: "bg-slate-100 border-2 border-dashed border-slate-300" },
  { name: "Ruby Red", hex: "#dc2626", bgClass: "bg-red-600" },
  { name: "Emerald", hex: "#059669", bgClass: "bg-emerald-600" },
  { name: "Royal Blue", hex: "#2563eb", bgClass: "bg-blue-600" },
  { name: "Sunshine", hex: "#eab308", bgClass: "bg-yellow-500" },
  { name: "Orange", hex: "#ea580c", bgClass: "bg-orange-600" },
  { name: "Purple", hex: "#9333ea", bgClass: "bg-purple-600" },
  { name: "Hot Pink", hex: "#db2777", bgClass: "bg-pink-600" },
  { name: "Midnight Black", hex: "#0f172a", bgClass: "bg-slate-900" },
  { name: "Pure White", hex: "#ffffff", bgClass: "bg-white border border-slate-300" },
  { name: "Metallic Gold", hex: "#d97706", bgClass: "bg-amber-400" },
  { name: "Mocha Brown", hex: "#78350f", bgClass: "bg-amber-900" },
  { name: "Cream Beige", hex: "#fef3c7", bgClass: "bg-amber-100 border border-amber-300" },
];

const BACKGROUND_OPTIONS = [
  { id: "none", name: "Transparent", desc: "Isolated cutout background", icon: "✂️" },
  { id: "lagos", name: "Boutique Studio", desc: "Marble & indoor studio lighting", icon: "🏬" },
  { id: "beach", name: "Sunset Beach", desc: "Golden hour coastal breeze", icon: "🌅" },
  { id: "white", name: "Clean White", desc: "E-commerce cyclorama background", icon: "✨" },
  { id: "gallery", name: "Luxury Gallery", desc: "Mahogany & velvet drapery", icon: "🏛️" },
  { id: "runway", name: "Fashion Runway", desc: "Paris catwalk spotlights", icon: "📸" },
];

const FASHION_STYLE_PRESETS = [
  { id: "none", name: "Keep Original", desc: "Don't alter garment shape", icon: "✨" },
  { id: "traditional", name: "African Royalty", desc: "Regal Aso-Ebi / Agbada silk", icon: "👑" },
  { id: "streetwear", name: "Afro Streetwear", desc: "Urban hypebeast Y2K vibe", icon: "🧢" },
  { id: "gala", name: "Red Carpet Gala", desc: "Haute couture gown", icon: "🍸" },
  { id: "corporate", name: "Power Suit", desc: "Tailored executive blazer", icon: "💼" },
  { id: "resort", name: "Summer Resort", desc: "Light sunlit kaftan", icon: "🌴" },
];

const AI_ENGINES = [
  {
    id: "ai",
    label: "Quick Draft",
    badge: "Free",
    cost: 0,
    desc: "Instant testing & color drafts",
    icon: Zap,
    badgeColor: "bg-emerald-100 text-emerald-800"
  },
  {
    id: "dalle3",
    label: "Pro Studio",
    badge: "1 Credit",
    cost: 1,
    desc: "Ultra HD DALL-E 3 commercial photography",
    icon: Wand2,
    badgeColor: "bg-purple-100 text-purple-800"
  },
  {
    id: "sdxl",
    label: "Magazine Style",
    badge: "1 Credit",
    cost: 1,
    desc: "High-fashion lookbook aesthetic",
    icon: Sparkles,
    badgeColor: "bg-pink-100 text-pink-800"
  },
];

const PROMPT_SUGGESTIONS = [
  "Add metallic gold embroidery on collar & cuffs",
  "Silk satin sheen finish with natural sheen",
  "Sweetheart neckline cut & tailored silhouette",
  "Traditional coral bead neckpiece & wrist accessories",
  "Dramatic rim lighting & soft contact shadows"
];

export default function VisualStudioPage() {
  const [sellerProducts, setSellerProducts] = useState<ProductItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [inputImageUrl, setInputImageUrl] = useState<string>("");
  const [uploadingFile, setUploadingFile] = useState<boolean>(false);

  // Modal, Guide & Studio States
  const [isProductModalOpen, setIsProductModalOpen] = useState<boolean>(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState<boolean>(false);
  const [showQuickGuideBanner, setShowQuickGuideBanner] = useState<boolean>(true);
  const [activeStudioTab, setActiveStudioTab] = useState<"color" | "backdrop" | "style" | "engine" | "prompt">("color");
  const [productSearchQuery, setProductSearchQuery] = useState<string>("");

  const [targetColor, setTargetColor] = useState<string>("Original");
  const [stylePreset, setStylePreset] = useState<string>("none");
  const [targetBackground, setTargetBackground] = useState<string>("Transparent");
  const [customInstruction, setCustomInstruction] = useState<string>("");
  const [transformProvider, setTransformProvider] = useState<string>("ai");
  const [customApiKey, setCustomApiKey] = useState<string>("");
  const [showSettings, setShowSettings] = useState<boolean>(false);

  const [transforming, setTransforming] = useState<boolean>(false);
  const [savingProduct, setSavingProduct] = useState<boolean>(false);
  const [transformedResult, setTransformedResult] = useState<Record<string, unknown> | null>(null);

  const [showOriginalComparison, setShowOriginalComparison] = useState<boolean>(false);

  const [aiCreditsBalance, setAiCreditsBalance] = useState<number>(10);

  const fetchCreditsStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/subscriptions/trial");
      const data = await res.json();
      if (data.data?.aiCreditsBalance !== undefined) setAiCreditsBalance(data.data.aiCreditsBalance);
    } catch {
      // Ignore fallback
    }
  }, []);

  const fetchSellerProducts = useCallback(async () => {
    try {
      const res = await fetch("/api/ai/market-intelligence", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "seller-health" }),
      });
      const data = await res.json();
      if (data.telemetry?.products && data.telemetry.products.length > 0) {
        const prods: ProductItem[] = data.telemetry.products.map((p: Record<string, unknown>) => ({
          id: p.id as string,
          name: p.name as string,
          price: p.price as number,
          images: (p.images as string[]) || [],
        }));
        setSellerProducts(prods);
        if (!inputImageUrl && prods[0]?.images?.[0]) {
          setSelectedProductId(prods[0].id);
          setInputImageUrl(prods[0].images[0]);
        }
      }
    } catch {
      // Keep defaults
    }
  }, [inputImageUrl]);

  useEffect(() => {
    fetchSellerProducts();
    fetchCreditsStatus();
  }, [fetchSellerProducts, fetchCreditsStatus]);

  const filteredProducts = useMemo(() => {
    if (!productSearchQuery.trim()) return sellerProducts;
    const q = productSearchQuery.toLowerCase();
    return sellerProducts.filter(p => p.name.toLowerCase().includes(q));
  }, [sellerProducts, productSearchQuery]);

  const selectedProductObj = useMemo(() => {
    return sellerProducts.find(p => p.id === selectedProductId) || null;
  }, [sellerProducts, selectedProductId]);

  const handleSelectProductItem = (prod: ProductItem) => {
    setSelectedProductId(prod.id);
    setInputImageUrl(prod.images?.[0] || "");
    setTransformedResult(null);
    setIsProductModalOpen(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setInputImageUrl(data.url || data.secure_url || "");
      setSelectedProductId("");
      setTransformedResult(null);
      setIsProductModalOpen(false);
      toast.success("Image uploaded to Studio!");
    } catch {
      toast.error("Failed to upload image");
    } finally {
      setUploadingFile(false);
    }
  };

  const selectedEngineConfig = AI_ENGINES.find((e) => e.id === transformProvider) || AI_ENGINES[0];

  const handleTransformProduct = async () => {
    if (!inputImageUrl) {
      setIsProductModalOpen(true);
      return toast.error("Please select or upload a garment photo first!");
    }

    if (selectedEngineConfig.cost > 0 && aiCreditsBalance <= 0) {
      return toast.error("You are out of Pro Credits! Switch to Quick Draft (Free) or top up.");
    }

    setTransforming(true);
    setShowOriginalComparison(false);
    try {
      const selectedStyleObj = FASHION_STYLE_PRESETS.find((s) => s.id === stylePreset);
      const res = await fetch("/api/ai/product-transform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: inputImageUrl,
          targetColor: targetColor === "Original" ? "none" : targetColor,
          stylePreset: selectedStyleObj?.id !== "none" ? selectedStyleObj?.name : "",
          targetBackground,
          customInstruction,
          provider: transformProvider,
          customApiKey,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate image");

      setTransformedResult(data);
      if (data.remainingCredits !== undefined) setAiCreditsBalance(data.remainingCredits);
      toast.success("Transformation complete! ✨");
    } catch (err: unknown) {
      const errObj = err as { message?: string };
      toast.error(errObj.message || "Something went wrong generating the photo.");
    } finally {
      setTransforming(false);
    }
  };

  const handleSaveToProduct = async () => {
    if (!selectedProductId || !transformedResult?.transformedImageUrl) return;
    setSavingProduct(true);
    try {
      const res = await fetch("/api/ai/attach-to-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: selectedProductId, imageUrl: transformedResult.transformedImageUrl }),
      });
      if (!res.ok) throw new Error("Failed to attach image to product");
      toast.success("Saved image directly to product gallery!");
    } catch {
      toast.error("Could not save image to product.");
    } finally {
      setSavingProduct(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col overflow-x-hidden selection:bg-purple-600 selection:text-white">

      {/* ☀️ 1. LIGHT MODE TOP NAVIGATION BAR */}
      <header className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-slate-200/90 px-4 sm:px-8 py-3 flex items-center justify-between shadow-xs">
        
        {/* Logo & Product Picker */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl overflow-hidden shadow-md shadow-purple-200 border border-purple-200 shrink-0 bg-white">
              <Image src="/trendichat.png" alt="TrendiBot Avatar" width={36} height={36} className="object-cover w-full h-full" />
            </div>
            <span className="font-extrabold text-sm sm:text-base text-slate-900 tracking-tight hidden sm:inline">AI Visual Studio</span>
          </div>

          <div className="h-5 w-px bg-slate-200 hidden sm:block" />

          {/* Active Product Selector Button */}
          <button
            onClick={() => setIsProductModalOpen(true)}
            className="flex items-center gap-2.5 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 px-3.5 py-1.5 rounded-xl transition-all max-w-[200px] sm:max-w-xs shadow-2xs"
          >
            {inputImageUrl ? (
              <div className="w-6 h-6 rounded-lg relative overflow-hidden shrink-0 border border-slate-300">
                <Image src={inputImageUrl} alt="" fill className="object-cover" />
              </div>
            ) : (
              <Shirt className="w-4 h-4 text-purple-600 shrink-0" />
            )}
            <span className="text-xs font-bold text-slate-800 truncate">
              {selectedProductObj?.name || (inputImageUrl ? "Custom Upload" : "1. Choose Garment")}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          </button>
        </div>

        {/* Action Controls & Guide Button */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Quick Guide Tour Trigger */}
          <button
            onClick={() => setIsGuideModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold text-xs rounded-xl transition-all"
          >
            <Lightbulb className="w-4 h-4 text-amber-600" />
            <span className="hidden sm:inline">Quick Guide</span>
          </button>

          {/* Credits Counter */}
          <div className="hidden sm:flex items-center gap-2 bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-xl text-xs">
            <Zap className="w-3.5 h-3.5 text-purple-600 fill-purple-600" />
            <span className="font-bold text-purple-900">{aiCreditsBalance} Credits</span>
            <Link href="/dashboard/subscription" className="text-[10px] bg-purple-600 hover:bg-purple-700 text-white font-bold px-2 py-0.5 rounded-md transition-colors">
              +
            </Link>
          </div>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-slate-500 hover:text-slate-900 bg-slate-100 border border-slate-200 rounded-xl transition-all"
            title="API Key Settings"
          >
            <Settings2 className="w-4 h-4" />
          </button>

          {/* Primary CTA Button */}
          <button
            onClick={handleTransformProduct}
            disabled={transforming || !inputImageUrl}
            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white font-extrabold text-xs rounded-xl shadow-md shadow-purple-200 transition-all flex items-center gap-2 active:scale-95"
          >
            {transforming ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Generating...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                <span>Generate Photo</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* API KEY SETTINGS BANNER */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-amber-50 border-b border-amber-200 px-6 py-3 text-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-amber-900"
          >
            <span className="flex items-center gap-2 font-medium">
              <Key className="w-4 h-4 text-amber-600" /> Custom OpenAI API Key (Optional):
            </span>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="password"
                placeholder="sk-proj-..."
                value={customApiKey}
                onChange={(e) => setCustomApiKey(e.target.value)}
                className="px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-slate-900 font-mono text-xs w-full sm:w-64"
              />
              <button onClick={() => setShowSettings(false)} className="px-3 py-1.5 bg-amber-200 hover:bg-amber-300 font-bold rounded-lg text-amber-900">
                Done
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🖼️ 2. LIGHT MODE MAIN STUDIO CANVAS */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 relative min-h-[calc(100vh-220px)]">

        {/* FIRST-TIME QUICK GUIDE BANNER (DISMISSIBLE) */}
        <AnimatePresence>
          {showQuickGuideBanner && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full max-w-4xl bg-white border border-purple-200 rounded-2xl p-4 mb-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 flex items-center gap-2">
                    How to use Visual Studio in 3 simple steps:
                  </h4>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-[11px] text-slate-600 font-medium">
                    <span className="flex items-center gap-1"><b className="text-purple-700">1.</b> Choose a Garment</span>
                    <span>&rarr;</span>
                    <span className="flex items-center gap-1"><b className="text-purple-700">2.</b> Pick Color & Scene in Dock below</span>
                    <span>&rarr;</span>
                    <span className="flex items-center gap-1"><b className="text-purple-700">3.</b> Click <b>Generate Photo</b></span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setIsGuideModalOpen(true)}
                  className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-xl transition-colors"
                >
                  View Full Visual Guide
                </button>
                <button onClick={() => setShowQuickGuideBanner(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Multi-Image Selector Bar for Products with Multiple Photos */}
        {selectedProductObj && selectedProductObj.images && selectedProductObj.images.length > 1 && (
          <div className="w-full max-w-4xl mb-3 flex items-center justify-between bg-white border border-slate-200 p-2.5 rounded-2xl shadow-xs z-10">
            <span className="text-xs font-bold text-slate-700 px-2 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-purple-600" />
              Select Photo Angle ({selectedProductObj.images.length}):
            </span>
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide no-scrollbar">
              {selectedProductObj.images.map((imgUrl, idx) => {
                const isCurrentActive = inputImageUrl === imgUrl;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setInputImageUrl(imgUrl);
                      setTransformedResult(null);
                    }}
                    className={`relative w-11 h-11 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                      isCurrentActive ? "border-purple-600 ring-2 ring-purple-500/20 shadow-xs scale-105" : "border-slate-200 hover:border-slate-400 opacity-70 hover:opacity-100"
                    }`}
                    title={`Select Photo ${idx + 1}`}
                  >
                    <Image src={imgUrl} alt="" fill className="object-cover" />
                    {isCurrentActive && (
                      <div className="absolute inset-0 bg-purple-600/20 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white drop-shadow-md" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Canvas Toolbar Header */}
        <div className="w-full max-w-4xl flex items-center justify-between mb-3 z-10">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              {transformedResult ? "AI Transformed Output" : inputImageUrl ? "Active Garment View" : "Studio Canvas Stage"}
            </span>
          </div>

          {transformedResult && (
            <button
              onClick={() => setShowOriginalComparison(!showOriginalComparison)}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xs"
            >
              {showOriginalComparison ? <Eye className="w-3.5 h-3.5 text-purple-600" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
              {showOriginalComparison ? "Viewing Original" : "Compare Original"}
            </button>
          )}
        </div>

        {/* Light Studio Canvas Viewport */}
        <div className="w-full max-w-4xl h-[450px] sm:h-[540px] lg:h-[600px] bg-slate-100/90 border border-slate-200/90 rounded-3xl relative overflow-hidden flex items-center justify-center p-4 shadow-inner z-10">
          
          {/* Subtle Grid Pattern */}
          <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '32px 32px' }} />

          {!inputImageUrl && (
            <div className="flex flex-col items-center justify-center text-center p-6 z-10 max-w-sm">
              <div className="w-20 h-20 rounded-3xl bg-white border border-slate-200 flex items-center justify-center mb-4 shadow-sm">
                <Shirt className="w-10 h-10 text-purple-600" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 mb-1">Canvas Ready</h3>
              <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                Click <b>&quot;1. Choose Garment&quot;</b> at the top left to pick a product or upload a photo to start.
              </p>
              <button
                onClick={() => setIsProductModalOpen(true)}
                className="px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md shadow-purple-200 transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> 1. Select Garment
              </button>
            </div>
          )}

          {transforming && (
            <div className="flex flex-col items-center justify-center text-center z-20 space-y-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin" />
                <Sparkles className="w-8 h-8 text-purple-600 absolute inset-0 m-auto animate-pulse" />
              </div>
              <div>
                <h4 className="text-base font-extrabold text-slate-900">Synthesizing Photo...</h4>
                <p className="text-xs text-slate-500 mt-1">Applying {targetColor} recoloring in {targetBackground}</p>
              </div>
            </div>
          )}

          {!transforming && inputImageUrl && (
            <div className="relative w-full h-full">
              <Image
                src={
                  showOriginalComparison
                    ? inputImageUrl
                    : ((transformedResult?.transformedImageUrl as string) || inputImageUrl)
                }
                alt="Garment Preview"
                fill
                className="object-contain p-2 transition-all duration-500"
                priority
              />
            </div>
          )}
        </div>

        {/* Output Export Actions */}
        {transformedResult && !transforming && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-4xl mt-4 flex flex-col sm:flex-row gap-3 z-10">
            <a
              href={(transformedResult.transformedImageUrl as string) || "#"}
              target="_blank"
              rel="noreferrer"
              className="flex-1 py-3.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-extrabold text-xs rounded-2xl flex items-center justify-center gap-2 shadow-xs transition-all"
            >
              <Download className="w-4 h-4 text-purple-600" /> Download HD Photo
            </a>

            {selectedProductId && (
              <button
                onClick={handleSaveToProduct}
                disabled={savingProduct}
                className="flex-1 py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-2xl flex items-center justify-center gap-2 shadow-md shadow-purple-200 transition-all disabled:opacity-60"
              >
                {savingProduct ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingBag className="w-4 h-4" />}
                Attach directly to Shop Listing
              </button>
            )}
          </motion.div>
        )}

      </main>

      {/* 🛠️ 3. LIGHT MODE FLOATING TOOL DOCK */}
      <footer className="sticky bottom-0 z-30 bg-white/95 backdrop-blur-xl border-t border-slate-200 px-4 sm:px-8 py-3 space-y-2.5 shadow-xl">
        
        {/* Studio Dock Navigation Tabs */}
        <div className="flex items-center justify-between max-w-4xl mx-auto overflow-x-auto gap-2 scrollbar-hide no-scrollbar py-0.5">
          {[
            { id: "color", label: `Fabric Color: ${targetColor}`, icon: Palette },
            { id: "backdrop", label: `Scene: ${targetBackground}`, icon: Camera },
            { id: "style", label: `Aesthetic: ${FASHION_STYLE_PRESETS.find(s=>s.id===stylePreset)?.name || "Original"}`, icon: Shirt },
            { id: "engine", label: `Engine: ${selectedEngineConfig.label}`, icon: Zap },
            { id: "prompt", label: "Magic Prompt", icon: Sparkles },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeStudioTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveStudioTab(tab.id as "color" | "backdrop" | "style" | "engine" | "prompt")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                  isActive
                    ? "bg-purple-600 text-white shadow-md shadow-purple-200"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Options Bar */}
        <div className="max-w-4xl mx-auto">
          
          {/* TAB 1: COLOR SWATCHES */}
          {activeStudioTab === "color" && (
            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide no-scrollbar">
              {COLOR_SWATCHES.map((swatch) => {
                const isSelected = targetColor === swatch.name;
                return (
                  <button
                    key={swatch.name}
                    onClick={() => setTargetColor(swatch.name)}
                    className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 shrink-0 transition-all ${
                      isSelected ? "border-purple-600 bg-purple-50 text-purple-950 font-black shadow-xs ring-2 ring-purple-500/20" : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full ${swatch.bgClass} shadow-xs shrink-0`} />
                    <span className="text-xs font-bold">{swatch.name}</span>
                  </button>
                );
              })}
            </motion.div>
          )}

          {/* TAB 2: BACKDROPS */}
          {activeStudioTab === "backdrop" && (
            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide no-scrollbar">
              {BACKGROUND_OPTIONS.map((bg) => {
                const isSelected = targetBackground === bg.name;
                return (
                  <button
                    key={bg.id}
                    onClick={() => setTargetBackground(bg.name)}
                    className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 shrink-0 transition-all ${
                      isSelected ? "border-purple-600 bg-purple-50 text-purple-950 font-black shadow-xs ring-2 ring-purple-500/20" : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <span className="text-base">{bg.icon}</span>
                    <span className="text-xs font-bold">{bg.name}</span>
                  </button>
                );
              })}
            </motion.div>
          )}

          {/* TAB 3: FASHION STYLE PRESETS */}
          {activeStudioTab === "style" && (
            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide no-scrollbar">
              {FASHION_STYLE_PRESETS.map((preset) => {
                const isSelected = stylePreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => setStylePreset(preset.id)}
                    className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 shrink-0 transition-all ${
                      isSelected ? "border-purple-600 bg-purple-50 text-purple-950 font-black shadow-xs ring-2 ring-purple-500/20" : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <span className="text-base">{preset.icon}</span>
                    <span className="text-xs font-bold">{preset.name}</span>
                  </button>
                );
              })}
            </motion.div>
          )}

          {/* TAB 4: ENGINE SELECTOR */}
          {activeStudioTab === "engine" && (
            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide no-scrollbar">
              {AI_ENGINES.map((engine) => {
                const isSelected = transformProvider === engine.id;
                const Icon = engine.icon;
                return (
                  <button
                    key={engine.id}
                    onClick={() => setTransformProvider(engine.id)}
                    className={`px-4 py-2 rounded-xl border flex items-center gap-2.5 shrink-0 transition-all ${
                      isSelected ? "border-purple-600 bg-purple-50 text-purple-950 font-black shadow-xs ring-2 ring-purple-500/20" : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <Icon className="w-4 h-4 text-purple-600" />
                    <div className="text-left">
                      <p className="text-xs font-bold">{engine.label}</p>
                      <span className="text-[9px] opacity-75">{engine.badge}</span>
                    </div>
                  </button>
                );
              })}
            </motion.div>
          )}

          {/* TAB 5: MAGIC PROMPT ENHANCER */}
          {activeStudioTab === "prompt" && (
            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Custom specs (e.g. Add gold embroidery on collar, sweetheart neckline...)"
                  value={customInstruction}
                  onChange={(e) => setCustomInstruction(e.target.value)}
                  className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-purple-600 focus:bg-white"
                />
                {customInstruction && (
                  <button onClick={() => setCustomInstruction("")} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold">
                    Clear
                  </button>
                )}
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide no-scrollbar pb-1">
                {PROMPT_SUGGESTIONS.map((idea, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCustomInstruction(idea)}
                    className="text-[10px] bg-purple-50 hover:bg-purple-100 text-purple-800 font-semibold px-2.5 py-1 rounded-full border border-purple-200 shrink-0 transition-colors"
                  >
                    + {idea}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

        </div>
      </footer>

      {/* 📦 4. PRODUCT SELECTOR MODAL FOR 100+ ITEMS */}
      <AnimatePresence>
        {isProductModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900">Select Garment Photo</h3>
                  <p className="text-xs text-slate-500">Pick from shop inventory or upload custom photo</p>
                </div>
                <button onClick={() => setIsProductModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* File Upload Zone */}
              <div className="p-4 bg-slate-50 border-b border-slate-100">
                <label className="flex items-center justify-center gap-2 p-3 border border-dashed border-purple-300 hover:border-purple-500 bg-purple-50/50 hover:bg-purple-50 rounded-xl cursor-pointer text-xs font-bold text-purple-900 transition-all">
                  {uploadingFile ? <Loader2 className="w-4 h-4 animate-spin text-purple-600" /> : <Upload className="w-4 h-4 text-purple-600" />}
                  {uploadingFile ? "Uploading Photo..." : "Upload New Photo from Device"}
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>

              {/* Search Input */}
              <div className="p-4 border-b border-slate-100 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-7 top-7" />
                <input
                  type="text"
                  placeholder="Search 100+ shop products..."
                  value={productSearchQuery}
                  onChange={(e) => setProductSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-purple-600 focus:bg-white"
                />
              </div>

              {/* Products List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-slate-200">
                {filteredProducts.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">No matching products found</div>
                ) : (
                  filteredProducts.map((prod) => {
                    const isSelected = selectedProductId === prod.id;
                    const hasMultipleImages = prod.images && prod.images.length > 1;
                    return (
                      <div
                        key={prod.id}
                        className={`w-full p-3 rounded-2xl border text-left flex flex-col gap-2 transition-all ${
                          isSelected ? "border-purple-600 bg-purple-50/70 shadow-xs ring-2 ring-purple-500/20" : "border-slate-100 hover:bg-slate-50 text-slate-800"
                        }`}
                      >
                        <div
                          onClick={() => handleSelectProductItem(prod)}
                          className="flex items-center justify-between gap-3 cursor-pointer"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {prod.images?.[0] ? (
                              <div className="w-12 h-12 rounded-xl relative overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                                <Image src={prod.images[0]} alt="" fill className="object-cover" />
                              </div>
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-slate-100 shrink-0 flex items-center justify-center">
                                <Shirt className="w-6 h-6 text-slate-400" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <h4 className="text-xs font-extrabold text-slate-900 truncate">{prod.name}</h4>
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] text-purple-700 font-bold">GH₵ {prod.price}</span>
                                {hasMultipleImages && (
                                  <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-full">
                                    {prod.images.length} photos
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          {isSelected && <Check className="w-5 h-5 text-purple-600 shrink-0" />}
                        </div>

                        {/* Thumbnail selector for multi-image products */}
                        {hasMultipleImages && (
                          <div className="flex items-center gap-1.5 pt-2 border-t border-slate-200/60 overflow-x-auto scrollbar-hide no-scrollbar">
                            <span className="text-[10px] font-bold text-slate-500 mr-1">Choose Photo:</span>
                            {prod.images.map((imgUrl, imgIdx) => {
                              const isPhotoActive = inputImageUrl === imgUrl;
                              return (
                                <button
                                  key={imgIdx}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedProductId(prod.id);
                                    setInputImageUrl(imgUrl);
                                    setTransformedResult(null);
                                    setIsProductModalOpen(false);
                                  }}
                                  className={`relative w-8 h-8 rounded-lg overflow-hidden border transition-all ${
                                    isPhotoActive ? "border-purple-600 ring-2 ring-purple-500/30 scale-105" : "border-slate-300 opacity-70 hover:opacity-100"
                                  }`}
                                >
                                  <Image src={imgUrl} alt="" fill className="object-cover" />
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 📖 5. VISUAL QUICK-START GUIDE MODAL */}
      <AnimatePresence>
        {isGuideModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-6"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                    <Lightbulb className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">Visual Studio Quick Guide</h3>
                    <p className="text-xs text-slate-500">Create e-commerce studio photos in 3 steps</p>
                  </div>
                </div>
                <button onClick={() => setIsGuideModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                  <div className="flex items-center gap-2 text-purple-700 font-black text-xs">
                    <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px]">1</span>
                    Choose a Garment
                  </div>
                  <p className="text-xs text-slate-600 pl-7">
                    Click <b>&quot;1. Choose Garment&quot;</b> at top left to pick an item from your shop catalog or upload a photo.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                  <div className="flex items-center gap-2 text-purple-700 font-black text-xs">
                    <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px]">2</span>
                    Use the Studio Dock Below
                  </div>
                  <p className="text-xs text-slate-600 pl-7">
                    Tap <b>Fabric Color</b>, <b>Scene Background</b>, or <b>Fashion Aesthetics</b> in the dock at the bottom of the screen.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                  <div className="flex items-center gap-2 text-purple-700 font-black text-xs">
                    <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px]">3</span>
                    Generate &amp; Export
                  </div>
                  <p className="text-xs text-slate-600 pl-7">
                    Click the top right <b>&quot;Generate Photo&quot;</b> button. Once created, download in 8K or attach directly to your shop listing!
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsGuideModalOpen(false)}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
              >
                Got it, let&apos;s start creating!
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}