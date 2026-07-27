"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  Sparkles, Wand2, Palette, Image as ImageIcon, Loader2, 
  Zap, Upload, Download, X, Key,
  FolderPlus, Check, Layers,
  TrendingUp, DollarSign, FileText, Rocket, BarChart3, Calculator
} from "lucide-react";
import { toast } from "sonner";

interface ProductItem {
  id: string;
  name: string;
  images: string[];
  price: number;
}

const COLOR_SWATCHES = [
  { name: "Keep Original", hex: "transparent", bgClass: "bg-slate-100 border-2 border-dashed border-slate-300" },
  { name: "Ruby Red", hex: "#dc2626", bgClass: "bg-red-600" },
  { name: "Emerald Green", hex: "#059669", bgClass: "bg-emerald-600" },
  { name: "Royal Blue", hex: "#2563eb", bgClass: "bg-blue-600" },
  { name: "Sunshine Yellow", hex: "#eab308", bgClass: "bg-yellow-500" },
  { name: "Sunset Orange", hex: "#ea580c", bgClass: "bg-orange-600" },
  { name: "Electric Purple", hex: "#9333ea", bgClass: "bg-purple-600" },
  { name: "Hot Pink", hex: "#db2777", bgClass: "bg-pink-600" },
  { name: "Midnight Black", hex: "#0f172a", bgClass: "bg-slate-900" },
  { name: "Pure White", hex: "#ffffff", bgClass: "bg-white border-slate-300" },
  { name: "Metallic Gold", hex: "#d97706", bgClass: "bg-amber-500" },
  { name: "Mocha Brown", hex: "#78350f", bgClass: "bg-amber-900" },
  { name: "Cream Beige", hex: "#fef3c7", bgClass: "bg-amber-100 border-amber-300" },
];

const BACKGROUND_OPTIONS = [
  { id: "lagos", name: "Lagos Boutique Studio", desc: "Warm ambient marble & studio lighting", icon: "🏬" },
  { id: "beach", name: "Accra Sunset Beach", desc: "Coastal boardwalk golden hour", icon: "🌅" },
  { id: "white", name: "Minimalist Cyclorama", desc: "Clean seamless white e-commerce", icon: "✨" },
  { id: "gallery", name: "Velvet Luxury Gallery", desc: "Opulent mahogany & gold leaf setting", icon: "🏛️" },
  { id: "runway", name: "Paris Fashion Week Runway", desc: "High-contrast runway spotlight & catwalk background", icon: "📸" },
  { id: "none", name: "No Background (Isolated)", desc: "Transparent cutout product background", icon: "✂️" },
];

const FASHION_STYLE_PRESETS = [
  { id: "none", name: "Original Garment Cut", desc: "Preserve exact outfit silhouette & style", icon: "✨" },
  { id: "traditional", name: "Royal African Traditional (Aso-Ebi / Agbada)", desc: "Regal velvet, coral beads & silk embroidery", icon: "👑" },
  { id: "streetwear", name: "Lagos Afro-Streetwear & Y2K", desc: "Hypebeast denim, graphic cargo & urban vibe", icon: "🧢" },
  { id: "gala", name: "Red Carpet Gala & Luxury Evening Gown", desc: "High-fashion velvet, gold accents & floor gown", icon: "🍸" },
  { id: "corporate", name: "Executive Corporate Power Suit", desc: "Tailored Ankara blazer & sharp modern office cut", icon: "💼" },
  { id: "resort", name: "Coastal Resort & Summer Linen Kaftan", desc: "Sunlit breezy linen & relaxed vacation aesthetic", icon: "🌴" },
  { id: "runway", name: "High-Fashion Paris Runway Editorial", desc: "Dynamic catwalk lighting & avant-garde couture", icon: "💃" },
];

const AI_ENGINES = [
  { 
    id: "ai", 
    label: "High-Speed Studio Engine", 
    tier: "FREE & UNLIMITED",
    badge: "0 Credits (Free)", 
    cost: 0,
    speed: "⚡ Instant (~1-2s)",
    desc: "Unlimited fast generation for testing, quick concepts & color drafts.", 
    icon: Sparkles,
    cardBorder: "border-emerald-200 hover:border-emerald-400 bg-emerald-50/30",
    activeCard: "border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20",
    badgeClass: "bg-emerald-600 text-white"
  },
  { 
    id: "dalle3", 
    label: "Ultra HD Commercial Studio", 
    tier: "PRO BEST QUALITY",
    badge: "1 Credit", 
    cost: 1,
    speed: "💎 Ultra HD Detail",
    desc: "HD studio photorealism, exact fabric textures, pristine stitching & lighting.", 
    icon: Wand2,
    cardBorder: "border-indigo-200 hover:border-indigo-400 bg-indigo-50/30",
    activeCard: "border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20",
    badgeClass: "bg-indigo-600 text-white"
  },
  { 
    id: "replicate", 
    label: "Photorealistic Fabric Engine", 
    tier: "PRO SPEED & DETAIL",
    badge: "1 Credit", 
    cost: 1,
    speed: "⚡ Sub-2s Speed",
    desc: "State-of-the-art fashion photorealism, hyper-realistic embroidery & metallic textures.", 
    icon: Zap,
    cardBorder: "border-purple-200 hover:border-purple-400 bg-purple-50/30",
    activeCard: "border-purple-600 bg-purple-50/70 ring-2 ring-purple-500/20",
    badgeClass: "bg-purple-600 text-white"
  },
  { 
    id: "sdxl", 
    label: "Editorial Lookbook Engine", 
    tier: "PRO EDITORIAL",
    badge: "1 Credit", 
    cost: 1,
    speed: "🎨 High-Contrast Fashion",
    desc: "Luxury magazine lookbook aesthetics, rich color grading & artistic lighting.", 
    icon: Layers,
    cardBorder: "border-amber-200 hover:border-amber-400 bg-amber-50/30",
    activeCard: "border-amber-600 bg-amber-50/70 ring-2 ring-amber-500/20",
    badgeClass: "bg-amber-600 text-white"
  },
];

const PROMPT_SUGGESTIONS = [
  "Add metallic gold embroidery around cuffs and collar",
  "Change dress to off-shoulder sweetheart neckline",
  "Model walking down a Milan fashion week runway with sunglasses",
  "Add matching traditional headwrap (Gele) with coral bead accessories",
  "Transform into a 2-piece crop top and high-waisted pleated skirt set",
  "Add subtle silk shine and high-contrast studio rim lighting"
];

import { useSearchParams } from "next/navigation";

export default function AIStudioPage() {
  const searchParams = useSearchParams();
  const [activeSuiteTab, setActiveSuiteTab] = useState<"studio" | "trends" | "pricing" | "copywriter" | "launch">("studio");

  useEffect(() => {
    const tabParam = searchParams?.get("tab");
    if (tabParam && ["studio", "trends", "pricing", "copywriter", "launch"].includes(tabParam)) {
      setActiveSuiteTab(tabParam as "studio" | "trends" | "pricing" | "copywriter" | "launch");
    }
  }, [searchParams]);
  
  // Products & Credits State
  const [sellerProducts, setSellerProducts] = useState<ProductItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [inputImageUrl, setInputImageUrl] = useState<string>("");
  const [uploadingFile, setUploadingFile] = useState<boolean>(false);
  
  // Visual Studio Transformation options
  const [targetColor, setTargetColor] = useState<string>("Keep Original");
  const [stylePreset, setStylePreset] = useState<string>("none");
  const [targetBackground, setTargetBackground] = useState<string>("Lagos Boutique Studio");
  const [customInstruction, setCustomInstruction] = useState<string>("");
  const [transformProvider, setTransformProvider] = useState<string>("ai");
  const [customApiKey, setCustomApiKey] = useState<string>("");
  const [showKeyDrawer, setShowKeyDrawer] = useState<boolean>(false);
  const [transforming, setTransforming] = useState<boolean>(false);
  const [savingProduct, setSavingProduct] = useState<boolean>(false);
  const [transformedResult, setTransformedResult] = useState<Record<string, unknown> | null>(null);

  // Market & Trend Intelligence State
  const [trendCategory, setTrendCategory] = useState<string>("Traditional & Aso-Ebi");
  const [trendSeason, setTrendSeason] = useState<string>("Wedding Season (Q3/Q4)");
  const [trendLoading, setTrendLoading] = useState<boolean>(false);
  const [trendResult, setTrendResult] = useState<string | null>(null);

  // Pricing Strategist State
  const [pricingGarmentName, setPricingGarmentName] = useState<string>("Luxury Velvet Agbada Set");
  const [pricingFabricCost, setPricingFabricCost] = useState<number>(250);
  const [pricingTailoringCost, setPricingTailoringCost] = useState<number>(150);
  const [pricingOverheadCost, setPricingOverheadCost] = useState<number>(50);
  const [pricingTargetMargin, setPricingTargetMargin] = useState<number>(45);
  const [pricingLoading, setPricingLoading] = useState<boolean>(false);
  const [pricingResult, setPricingResult] = useState<string | null>(null);
  const [pricingFinancials, setPricingFinancials] = useState<Record<string, unknown> | null>(null);

  // Copywriter & Storyteller State
  const [copyProductName, setCopyProductName] = useState<string>("Embroidered Royal Kente Kaftan");
  const [copyFabricType, setCopyFabricType] = useState<string>("Handwoven Silk Kente");
  const [copyOccasion, setCopyOccasion] = useState<string>("Traditional Wedding & Gala");
  const [copyKeyFeatures, setCopyKeyFeatures] = useState<string>("Gold metallic embroidery, relaxed luxury fit, breathable lining");
  const [copyLoading, setCopyLoading] = useState<boolean>(false);
  const [copyResult, setCopyResult] = useState<string | null>(null);

  // Collection Launch Planner State
  const [launchCollectionName, setLaunchCollectionName] = useState<string>("Ancestral Royalty 2026");
  const [launchTargetDate, setLaunchTargetDate] = useState<string>("30 days from now");
  const [launchTargetAudience, setLaunchTargetAudience] = useState<string>("Fashion-forward professionals and event guests");
  const [launchLoading, setLaunchLoading] = useState<boolean>(false);
  const [launchResult, setLaunchResult] = useState<string | null>(null);

  // AI Credit states
  const [aiCreditsBalance, setAiCreditsBalance] = useState<number>(10);
  const [aiCreditsLimit, setAiCreditsLimit] = useState<number>(10);

  useEffect(() => {
    fetchSellerProducts();
    fetchCreditsStatus();
  }, []);

  const fetchCreditsStatus = async () => {
    try {
      const res = await fetch("/api/subscriptions/trial");
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          if (json.data.aiCreditsBalance !== undefined) setAiCreditsBalance(json.data.aiCreditsBalance);
          if (json.data.aiCreditsLimit !== undefined) setAiCreditsLimit(json.data.aiCreditsLimit);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSellerProducts = async () => {
    try {
      const res = await fetch("/api/products?limit=20");
      if (res.ok) {
        const data = await res.json();
        const items = data.products || data || [];
        setSellerProducts(items);
        if (items.length > 0) {
          setSelectedProductId(items[0].id);
          setInputImageUrl(items[0].images?.[0] || "");
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleProductSelect = (id: string) => {
    setSelectedProductId(id);
    const prod = sellerProducts.find((p) => p.id === id);
    if (prod && prod.images?.[0]) {
      setInputImageUrl(prod.images[0]);
    }
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
      toast.success("Product image uploaded!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload image");
    } finally {
      setUploadingFile(false);
    }
  };

  const selectedEngineConfig = AI_ENGINES.find((e) => e.id === transformProvider) || AI_ENGINES[0];

  const handleTransformProduct = async () => {
    if (!inputImageUrl) {
      toast.error("Please upload an image or choose a product first");
      return;
    }

    const isProEngine = selectedEngineConfig.cost > 0;
    if (isProEngine && aiCreditsBalance <= 0) {
      toast.error("You have 0 Pro Credits remaining. Please switch to the High-Speed Studio Engine or top up your credits.");
      return;
    }

    setTransforming(true);
    setTransformedResult(null);

    try {
      const selectedStyleObj = FASHION_STYLE_PRESETS.find((s) => s.id === stylePreset);

      const res = await fetch("/api/ai/product-transform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: inputImageUrl,
          targetColor: targetColor === "Keep Original" ? "none" : targetColor,
          stylePreset: selectedStyleObj?.id !== "none" ? selectedStyleObj?.name : "",
          targetBackground,
          customInstruction,
          provider: transformProvider,
          customApiKey,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to transform image");

      setTransformedResult(data);
      if (data.remainingCredits !== undefined) {
        setAiCreditsBalance(data.remainingCredits);
      }
      toast.success(`Generated using ${data.providerUsed || selectedEngineConfig.label}!`);
    } catch (err: unknown) {
      console.error(err);
      const errObj = err as { message?: string };
      toast.error(errObj.message || "Failed to transform image");
    } finally {
      setTransforming(false);
    }
  };

  const handleSaveToProduct = async () => {
    if (!selectedProductId || !transformedResult?.transformedImageUrl) {
      toast.error("No product selected or no generated variant image");
      return;
    }

    setSavingProduct(true);
    try {
      const res = await fetch("/api/ai/attach-to-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedProductId,
          imageUrl: transformedResult.transformedImageUrl,
        }),
      });

      if (!res.ok) throw new Error("Failed to attach to product");
      toast.success("Saved generated variant to product gallery!");
    } catch (err: unknown) {
      console.error(err);
      const errObj = err as { message?: string };
      toast.error(errObj.message || "Failed to save variant to product gallery");
    } finally {
      setSavingProduct(false);
    }
  };

  // Handler for Market Intelligence API calls
  const handleMarketIntelligenceCall = async (
    action: string,
    payload: Record<string, unknown>,
    setLoadingState: (loading: boolean) => void,
    setResultState: (result: string | null) => void,
    setExtraState?: (extra: Record<string, unknown> | null) => void
  ) => {
    setLoadingState(true);
    try {
      const res = await fetch("/api/ai/market-intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Intelligence request failed");
      setResultState(data.result);
      if (setExtraState && data.financials) setExtraState(data.financials);
      toast.success("Strategic insights generated!");
    } catch (err: unknown) {
      console.error(err);
      const errObj = err as { message?: string };
      toast.error(errObj.message || "Failed to analyze intelligence");
    } finally {
      setLoadingState(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 font-sans">
      
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">Merchant Intelligence Suite</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Seller AI Suite
          </h1>
          <p className="text-xs font-medium text-slate-500 mt-1">
            Visual fashion studio, market trend intelligence, pricing optimization, copywriting &amp; collection launch planning.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold rounded-xl shadow-2xs">
            <Zap className="h-4 w-4 text-indigo-600" />
            <span>⚡ {aiCreditsBalance} / {aiCreditsLimit} Studio Credits</span>
            <Link 
              href="/dashboard/subscription" 
              className="ml-1 text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-2 py-0.5 rounded-lg transition-all"
            >
              + Top Up
            </Link>
          </div>

          <button
            onClick={() => setShowKeyDrawer(!showKeyDrawer)}
            className="px-3.5 py-2 bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs flex items-center gap-2 transition-all rounded-xl shadow-2xs"
          >
            <Key className="h-4 w-4 text-amber-500" />
            <span className="hidden md:inline">{customApiKey ? "Custom Key Set" : "API Key Settings"}</span>
          </button>
        </div>
      </div>

      {/* SELLER AI SUITE NAVIGATION TABS */}
      <div className="flex overflow-x-auto gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200/80">
        <button
          onClick={() => setActiveSuiteTab("studio")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeSuiteTab === "studio" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Visual Fashion Studio</span>
        </button>

        <button
          onClick={() => setActiveSuiteTab("trends")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeSuiteTab === "trends" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Market &amp; Trend Research</span>
        </button>

        <button
          onClick={() => setActiveSuiteTab("pricing")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeSuiteTab === "pricing" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Pricing &amp; Profit Strategist</span>
        </button>

        <button
          onClick={() => setActiveSuiteTab("copywriter")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeSuiteTab === "copywriter" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Product Story &amp; Copywriter</span>
        </button>

        <button
          onClick={() => setActiveSuiteTab("launch")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeSuiteTab === "launch" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
          }`}
        >
          <Rocket className="w-4 h-4" />
          <span>Collection Launch Planner</span>
        </button>
      </div>

      {/* CUSTOM API KEY SETTINGS DRAWER */}
      {showKeyDrawer && (
        <div className="bg-amber-50/60 border border-amber-200 p-5 rounded-2xl space-y-3 animate-in fade-in-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4 text-amber-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Custom Engine Key Settings (Optional)</h3>
            </div>
            <button onClick={() => setShowKeyDrawer(false)} className="text-slate-400 hover:text-slate-600">
              <X size={16} />
            </button>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Optional: Enter your personal API key token to bypass system credit limits.
          </p>
          <div className="flex gap-2">
            <input
              type="password"
              placeholder="sk-... or r8_..."
              value={customApiKey}
              onChange={(e) => setCustomApiKey(e.target.value)}
              className="flex-1 px-3 py-2 bg-white border border-amber-200 rounded-xl text-xs font-mono"
            />
            {customApiKey && (
              <button
                onClick={() => setCustomApiKey("")}
                className="px-3 py-2 bg-rose-100 text-rose-700 font-bold text-xs rounded-xl"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* TAB 1: VISUAL FASHION STUDIO */}
      {activeSuiteTab === "studio" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 space-y-6">
            
            {/* ENGINE SELECTOR */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-indigo-600" />
                  <span>Step 1: Choose Studio Visual Engine</span>
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                  1 Free • 3 Pro
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {AI_ENGINES.map((engine) => {
                  const isSelected = transformProvider === engine.id;
                  const IconComp = engine.icon;
                  return (
                    <button
                      key={engine.id}
                      onClick={() => setTransformProvider(engine.id)}
                      className={`text-left p-3.5 rounded-2xl border transition-all flex flex-col justify-between space-y-2 relative overflow-hidden ${
                        isSelected ? engine.activeCard : engine.cardBorder
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-2 right-2 flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white shadow-xs">
                          <Check size={12} className="stroke-[3]" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-1.5 mb-1 pr-6">
                          <IconComp className="w-4 h-4 text-slate-700 shrink-0" />
                          <span className="text-xs font-black text-slate-900">{engine.label}</span>
                        </div>
                        <p className="text-[10px] text-slate-600 leading-snug">{engine.desc}</p>
                      </div>

                      <div className="pt-2 border-t border-slate-200/50 flex items-center justify-between text-[10px] font-bold">
                        <span className="text-slate-500">{engine.speed}</span>
                        <span className={`px-2 py-0.5 rounded-lg ${engine.badgeClass}`}>
                          {engine.badge}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SELECT PRODUCT OR UPLOAD */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center justify-between">
                <span>Step 2: Select Garment Image</span>
                <span className="text-indigo-600 font-bold text-[10px]">Required</span>
              </h2>

              {sellerProducts.length > 0 && (
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500">Pick from Store Catalog</label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => handleProductSelect(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  >
                    <option value="">-- Choose Catalogue Item --</option>
                    {sellerProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (GH₵ {p.price})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="text-[11px] font-bold text-slate-500">Or Upload New Garment Photo</label>
                <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-indigo-400 bg-slate-50/50 transition-all">
                  {uploadingFile ? (
                    <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-5 h-5 text-indigo-600 mb-1" />
                      <span className="text-xs font-bold text-slate-700">Click to upload garment image</span>
                      <span className="text-[10px] text-slate-400">PNG, JPG, WEBP up to 10MB</span>
                    </>
                  )}
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>

              {inputImageUrl && (
                <div className="relative h-44 w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                  <Image src={inputImageUrl} alt="Input Garment" fill className="object-contain p-2" />
                </div>
              )}
            </div>

            {/* FASHION PRESETS */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Step 3: Choose Fashion Aesthetic &amp; Restyling Preset
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {FASHION_STYLE_PRESETS.map((preset) => {
                  const isSelected = stylePreset === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => setStylePreset(preset.id)}
                      className={`text-left p-3 rounded-xl border transition-all flex items-start gap-2.5 ${
                        isSelected ? "border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20" : "border-slate-200/80 hover:border-slate-300"
                      }`}
                    >
                      <span className="text-lg shrink-0 mt-0.5">{preset.icon}</span>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 truncate">{preset.name}</h4>
                        <p className="text-[10px] font-medium text-slate-500 leading-tight">{preset.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* COLORWAY SELECTION */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Step 4: Choose Target Garment Colorway
              </h2>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {COLOR_SWATCHES.map((swatch) => {
                  const isSelected = targetColor === swatch.name;
                  return (
                    <button
                      key={swatch.name}
                      onClick={() => setTargetColor(swatch.name)}
                      className={`flex flex-col items-center p-2 rounded-xl border text-center transition-all ${
                        isSelected ? "border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20" : "border-slate-200/80 hover:border-slate-300"
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full ${swatch.bgClass} shadow-2xs mb-1`} />
                      <span className="text-[9px] font-bold text-slate-700 truncate w-full">{swatch.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* BACKDROP */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Step 5: Choose Studio Backdrop
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {BACKGROUND_OPTIONS.map((bg) => {
                  const isSelected = targetBackground === bg.name;
                  return (
                    <button
                      key={bg.id}
                      onClick={() => setTargetBackground(bg.name)}
                      className={`text-left p-3 rounded-xl border transition-all flex items-center gap-2.5 ${
                        isSelected ? "border-indigo-600 bg-indigo-50/50" : "border-slate-200/80 hover:border-slate-300"
                      }`}
                    >
                      <span className="text-xl shrink-0">{bg.icon}</span>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 truncate">{bg.name}</h4>
                        <p className="text-[10px] font-medium text-slate-500 truncate">{bg.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* CUSTOM PROMPT */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center justify-between">
                <span>Step 6: Custom Specifications</span>
                <span className="text-slate-400 text-[10px] lowercase">Optional</span>
              </h2>
              <textarea
                rows={3}
                value={customInstruction}
                onChange={(e) => setCustomInstruction(e.target.value)}
                placeholder="e.g. Add gold embroidery on collar and sleeves, model wearing sunglasses..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-indigo-500"
              />
              <div className="flex flex-wrap gap-1.5">
                {PROMPT_SUGGESTIONS.map((idea, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCustomInstruction(idea)}
                    className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-2 py-1 rounded-lg transition-all text-left"
                  >
                    + {idea}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleTransformProduct}
              disabled={transforming || !inputImageUrl || (selectedEngineConfig.cost > 0 && aiCreditsBalance <= 0)}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
            >
              {transforming ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Generating with {selectedEngineConfig.label}...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" /> 
                  {selectedEngineConfig.cost === 0 
                    ? "Generate Free Variant (0 Credits)" 
                    : `Transform Garment with ${selectedEngineConfig.label} (1 Credit)`}
                </>
              )}
            </button>
          </div>

          {/* PREVIEW RIGHT PANEL */}
          <div className="lg:col-span-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6 h-full flex flex-col justify-between sticky top-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600" /> Generated Result Preview
                  </h2>
                  {transformedResult && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Engine: {String(transformedResult.providerUsed)}
                    </span>
                  )}
                </div>

                {transforming ? (
                  <div className="h-[480px] w-full rounded-2xl bg-slate-50 border border-dashed border-slate-200 flex flex-col items-center justify-center space-y-3 p-6 text-center">
                    <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                    <p className="text-xs font-bold text-slate-700">Generating with {selectedEngineConfig.label}...</p>
                    <p className="text-[11px] text-slate-500 max-w-xs">
                      Synthesizing realistic fabric textures &amp; lighting according to your selections.
                    </p>
                  </div>
                ) : transformedResult?.transformedImageUrl ? (
                  <div className="space-y-4">
                    <div className="relative h-[480px] w-full rounded-2xl overflow-hidden border border-slate-200/80 bg-slate-100 shadow-inner">
                      <Image src={transformedResult.transformedImageUrl as string} alt="Generated Variant" fill className="object-contain p-2" />
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Engine:</span>
                          <p className="font-bold text-slate-800">{String(transformedResult.providerUsed)}</p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Colorway:</span>
                          <p className="font-bold text-slate-800">{targetColor}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60">
                        <a
                          href={transformedResult.transformedImageUrl as string}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all border border-slate-200"
                        >
                          <Download className="w-3.5 h-3.5" /> Download HD
                        </a>
                        {selectedProductId && (
                          <button
                            onClick={handleSaveToProduct}
                            disabled={savingProduct}
                            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-all"
                          >
                            {savingProduct ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FolderPlus className="w-3.5 h-3.5" />}
                            Attach to Product
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-[480px] w-full rounded-2xl bg-slate-50/50 border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                    <ImageIcon className="w-12 h-12 mb-2 opacity-20" />
                    <p className="text-xs font-bold text-slate-600 mb-1">No Studio Image Generated Yet</p>
                    <p className="text-[11px] text-slate-400 max-w-sm">
                      Select an engine, fashion preset, colorway, and backdrop, then click Generate.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MARKET & TREND INTELLIGENCE */}
      {activeSuiteTab === "trends" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                <span>Market Trend &amp; Demand Research</span>
              </h2>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-500">Garment Category</label>
                  <select
                    value={trendCategory}
                    onChange={(e) => setTrendCategory(e.target.value)}
                    className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  >
                    <option value="Traditional & Aso-Ebi">Traditional &amp; Aso-Ebi Wear</option>
                    <option value="Afro-Streetwear & Y2K">Afro-Streetwear &amp; Y2K</option>
                    <option value="Corporate Ankara Suits">Corporate &amp; Executive Ankara</option>
                    <option value="Gala & Red Carpet Gowns">Luxury Gala &amp; Evening Wear</option>
                    <option value="Coastal Resort Linen">Resort &amp; Summer Linen</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500">Seasonal Target Event</label>
                  <select
                    value={trendSeason}
                    onChange={(e) => setTrendSeason(e.target.value)}
                    className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  >
                    <option value="Wedding Season (Q3/Q4)">Wedding Season (Q3/Q4)</option>
                    <option value="Easter & Spring Celebrations">Easter &amp; Spring Celebrations</option>
                    <option value="Detty December & Holiday Season">Detty December &amp; Holiday Season</option>
                    <option value="Campus Fashion Week">Campus &amp; Youth Fashion Season</option>
                  </select>
                </div>

                <button
                  onClick={() => handleMarketIntelligenceCall("trend-forecast", { category: trendCategory, season: trendSeason }, setTrendLoading, setTrendResult)}
                  disabled={trendLoading}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
                >
                  {trendLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
                  Run Market Forecast
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 min-h-[480px]">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
                <BarChart3 className="w-4 h-4 text-indigo-600" /> Projected Market Intelligence Report
              </h2>

              {trendLoading ? (
                <div className="h-80 flex flex-col items-center justify-center text-slate-500 space-y-2">
                  <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                  <p className="text-xs font-bold">Analyzing regional market demand &amp; fabric trends...</p>
                </div>
              ) : trendResult ? (
                <div className="prose prose-slate max-w-none text-xs leading-relaxed whitespace-pre-line p-4 bg-slate-50 rounded-xl border border-slate-200/60 font-sans">
                  {trendResult}
                </div>
              ) : (
                <div className="h-80 flex flex-col items-center justify-center text-slate-400 text-center p-6">
                  <TrendingUp className="w-12 h-12 mb-2 opacity-20" />
                  <p className="text-xs font-bold text-slate-600 mb-1">No Forecast Run Yet</p>
                  <p className="text-[11px] text-slate-400 max-w-sm">Select a category and target season on the left to analyze market demand, trending fabric colors, and stocking advice.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PRICING & PROFIT STRATEGIST */}
      {activeSuiteTab === "pricing" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-indigo-600" />
                <span>Pricing &amp; Cost Inputs</span>
              </h2>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-500">Garment Name</label>
                  <input
                    type="text"
                    value={pricingGarmentName}
                    onChange={(e) => setPricingGarmentName(e.target.value)}
                    className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500">Fabric Cost (GH₵)</label>
                    <input
                      type="number"
                      value={pricingFabricCost}
                      onChange={(e) => setPricingFabricCost(Number(e.target.value))}
                      className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500">Tailoring Labor (GH₵)</label>
                    <input
                      type="number"
                      value={pricingTailoringCost}
                      onChange={(e) => setPricingTailoringCost(Number(e.target.value))}
                      className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500">Overhead/Pack (GH₵)</label>
                    <input
                      type="number"
                      value={pricingOverheadCost}
                      onChange={(e) => setPricingOverheadCost(Number(e.target.value))}
                      className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500">Target Profit Margin %</label>
                    <input
                      type="number"
                      value={pricingTargetMargin}
                      onChange={(e) => setPricingTargetMargin(Number(e.target.value))}
                      className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                    />
                  </div>
                </div>

                <button
                  onClick={() => handleMarketIntelligenceCall("pricing-strategy", {
                    garmentName: pricingGarmentName,
                    fabricCost: pricingFabricCost,
                    tailoringCost: pricingTailoringCost,
                    overheadCost: pricingOverheadCost,
                    targetMargin: pricingTargetMargin
                  }, setPricingLoading, setPricingResult, setPricingFinancials)}
                  disabled={pricingLoading}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
                >
                  {pricingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
                  Calculate &amp; Analyze Pricing
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 min-h-[480px]">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
                <DollarSign className="w-4 h-4 text-emerald-600" /> Strategic Pricing Breakdown
              </h2>

              {pricingFinancials && (
                <div className="grid grid-cols-3 gap-3 p-4 bg-emerald-50/50 rounded-xl border border-emerald-200 text-center">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-700 uppercase">Total Production Cost</span>
                    <p className="text-base font-black text-slate-900">GH₵ {String(pricingFinancials.totalCost)}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-emerald-700 uppercase">Recommended Price</span>
                    <p className="text-base font-black text-emerald-700">GH₵ {String(pricingFinancials.recommendedRetailPrice)}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-emerald-700 uppercase">Profit / Unit</span>
                    <p className="text-base font-black text-slate-900">GH₵ {String(pricingFinancials.netProfit)}</p>
                  </div>
                </div>
              )}

              {pricingLoading ? (
                <div className="h-64 flex flex-col items-center justify-center text-slate-500 space-y-2">
                  <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                  <p className="text-xs font-bold">Computing financial strategy &amp; international multipliers...</p>
                </div>
              ) : pricingResult ? (
                <div className="prose prose-slate max-w-none text-xs leading-relaxed whitespace-pre-line p-4 bg-slate-50 rounded-xl border border-slate-200/60 font-sans">
                  {pricingResult}
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-center p-6">
                  <DollarSign className="w-12 h-12 mb-2 opacity-20" />
                  <p className="text-xs font-bold text-slate-600 mb-1">No Pricing Strategy Calculated</p>
                  <p className="text-[11px] text-slate-400 max-w-sm">Enter your garment production costs on the left to calculate recommended retail prices, profit margins, and export exchange rates.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PRODUCT COPYWRITER & STORYTELLER */}
      {activeSuiteTab === "copywriter" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>Product Details &amp; Inputs</span>
              </h2>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-500">Product Title</label>
                  <input
                    type="text"
                    value={copyProductName}
                    onChange={(e) => setCopyProductName(e.target.value)}
                    className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500">Fabric Type</label>
                    <input
                      type="text"
                      value={copyFabricType}
                      onChange={(e) => setCopyFabricType(e.target.value)}
                      className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500">Occasion</label>
                    <input
                      type="text"
                      value={copyOccasion}
                      onChange={(e) => setCopyOccasion(e.target.value)}
                      className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500">Key Features &amp; Tailoring Highlights</label>
                  <textarea
                    rows={3}
                    value={copyKeyFeatures}
                    onChange={(e) => setCopyKeyFeatures(e.target.value)}
                    className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  />
                </div>

                <button
                  onClick={() => handleMarketIntelligenceCall("copywriter", {
                    productName: copyProductName,
                    fabricType: copyFabricType,
                    occasion: copyOccasion,
                    keyFeatures: copyKeyFeatures
                  }, setCopyLoading, setCopyResult)}
                  disabled={copyLoading}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
                >
                  {copyLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                  Generate SEO Listing &amp; Cultural Story
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 min-h-[480px]">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
                <FileText className="w-4 h-4 text-indigo-600" /> High-Converting Copy &amp; Cultural Story
              </h2>

              {copyLoading ? (
                <div className="h-80 flex flex-col items-center justify-center text-slate-500 space-y-2">
                  <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                  <p className="text-xs font-bold">Crafting SEO titles, storytelling &amp; care guidelines...</p>
                </div>
              ) : copyResult ? (
                <div className="prose prose-slate max-w-none text-xs leading-relaxed whitespace-pre-line p-4 bg-slate-50 rounded-xl border border-slate-200/60 font-sans">
                  {copyResult}
                </div>
              ) : (
                <div className="h-80 flex flex-col items-center justify-center text-slate-400 text-center p-6">
                  <FileText className="w-12 h-12 mb-2 opacity-20" />
                  <p className="text-xs font-bold text-slate-600 mb-1">No Copy Generated Yet</p>
                  <p className="text-[11px] text-slate-400 max-w-sm">Enter garment details on the left to generate rich cultural narratives, SEO titles, and care instructions.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: COLLECTION LAUNCH PLANNER */}
      {activeSuiteTab === "launch" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Rocket className="w-4 h-4 text-indigo-600" />
                <span>Collection Launch Parameters</span>
              </h2>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-500">Collection Name</label>
                  <input
                    type="text"
                    value={launchCollectionName}
                    onChange={(e) => setLaunchCollectionName(e.target.value)}
                    className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500">Target Launch Date</label>
                  <input
                    type="text"
                    value={launchTargetDate}
                    onChange={(e) => setLaunchTargetDate(e.target.value)}
                    className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500">Target Customer Audience</label>
                  <textarea
                    rows={2}
                    value={launchTargetAudience}
                    onChange={(e) => setLaunchTargetAudience(e.target.value)}
                    className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  />
                </div>

                <button
                  onClick={() => handleMarketIntelligenceCall("launch-planner", {
                    collectionName: launchCollectionName,
                    targetLaunchDate: launchTargetDate,
                    targetAudience: launchTargetAudience
                  }, setLaunchLoading, setLaunchResult)}
                  disabled={launchLoading}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
                >
                  {launchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
                  Generate 30-Day Launch Campaign Plan
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 min-h-[480px]">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
                <Rocket className="w-4 h-4 text-indigo-600" /> 30-Day Launch Campaign Roadmap
              </h2>

              {launchLoading ? (
                <div className="h-80 flex flex-col items-center justify-center text-slate-500 space-y-2">
                  <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                  <p className="text-xs font-bold">Building 30-day roadmap, video hooks &amp; email copy...</p>
                </div>
              ) : launchResult ? (
                <div className="prose prose-slate max-w-none text-xs leading-relaxed whitespace-pre-line p-4 bg-slate-50 rounded-xl border border-slate-200/60 font-sans">
                  {launchResult}
                </div>
              ) : (
                <div className="h-80 flex flex-col items-center justify-center text-slate-400 text-center p-6">
                  <Rocket className="w-12 h-12 mb-2 opacity-20" />
                  <p className="text-xs font-bold text-slate-600 mb-1">No Launch Plan Generated Yet</p>
                  <p className="text-[11px] text-slate-400 max-w-sm">Enter your collection details on the left to generate a 30-day marketing timeline, video hooks, and promotional email copy.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
