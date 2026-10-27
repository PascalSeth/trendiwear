"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Sparkles, Upload, Download, X,
  ShoppingBag, Zap, Eye, EyeOff, Search, Shirt,
  Check, Sliders, ChevronRight, ChevronLeft,
  Plus, Copy, RefreshCw, Wand2, Scissors, Maximize2,
  Palette, Layers, SunMedium, ChevronDown, User,
  UserCheck, Crown, Flame, Wine, Briefcase, Palmtree,
  Store, Landmark, Camera, ShieldCheck, Type, Compass,
  Image as ImageIcon, type LucideIcon, MoreHorizontal
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { getCurrencySymbolFromCode } from "@/lib/currency-utils";

interface ProductItem {
  id: string;
  name: string;
  images: string[];
  price: number;
  currency?: string;
  description?: string;
  material?: string;
  colors?: string[];
  sizes?: string[];
}

interface VisualDeckCard {
  id: string;
  imageUrl: string;
  version: string;
  title: string;
  tag: string;
  prompt: string;
  isOriginal?: boolean;
}

const FASHION_STYLE_PRESETS: Array<{
  id: string;
  name: string;
  tag: string;
  desc: string;
  imageUrl: string;
  icon: LucideIcon;
  iconColor: string;
  bgTint: string;
}> = [
  {
    id: "none",
    name: "Original Cut",
    tag: "Authentic",
    desc: "Preserve natural cut, drape & soft studio lighting",
    imageUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=500&q=80",
    icon: Sparkles,
    iconColor: "text-amber-600",
    bgTint: "bg-amber-100"
  },
  {
    id: "streetwear",
    name: "Afro Streetwear",
    tag: "Urban Drip",
    desc: "Lagos & Tokyo hypebeast oversized drape, cargo accents & sneakers",
    imageUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=500&q=80",
    icon: Flame,
    iconColor: "text-orange-600",
    bgTint: "bg-orange-100"
  },
  {
    id: "traditional",
    name: "African Royalty",
    tag: "Regal Velvet",
    desc: "Regal Aso-Ebi, Agbada silk, ceremonial coral beads & gold embroidery",
    imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80",
    icon: Crown,
    iconColor: "text-amber-600",
    bgTint: "bg-amber-100"
  },
  {
    id: "gala",
    name: "Red Carpet Gala",
    tag: "Haute Couture",
    desc: "Evening premiere velvet, satin lapels & paparazzi spotlights",
    imageUrl: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=500&q=80",
    icon: Wine,
    iconColor: "text-rose-600",
    bgTint: "bg-rose-100"
  },
  {
    id: "corporate",
    name: "Power Suit",
    tag: "Tailored",
    desc: "Structured modern executive blazer & sharp wool silhouette",
    imageUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=500&q=80",
    icon: Briefcase,
    iconColor: "text-slate-600",
    bgTint: "bg-slate-100"
  },
  {
    id: "resort",
    name: "Summer Resort",
    tag: "Sunlit Linen",
    desc: "Golden hour coastal breeze, breezy linen kaftan & vacation warmth",
    imageUrl: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=500&q=80",
    icon: Palmtree,
    iconColor: "text-emerald-600",
    bgTint: "bg-emerald-100"
  },
];

const BACKGROUND_OPTIONS: Array<{
  id: string;
  name: string;
  desc: string;
  icon: LucideIcon;
  iconColor: string;
  bgTint: string;
}> = [
  { id: "original", name: "Keep Original", desc: "Preserve photo background", icon: ImageIcon, iconColor: "text-slate-600", bgTint: "bg-slate-100" },
  { id: "lagos", name: "Boutique Studio", desc: "Warm ambient marble & softbox", icon: Store, iconColor: "text-amber-600", bgTint: "bg-amber-100" },
  { id: "white", name: "Clean White", desc: "Seamless e-commerce cyclorama", icon: Maximize2, iconColor: "text-sky-600", bgTint: "bg-sky-100" },
  { id: "beach", name: "Sunset Beach", desc: "Golden hour coastal breeze", icon: SunMedium, iconColor: "text-amber-600", bgTint: "bg-amber-100" },
  { id: "gallery", name: "Luxury Gallery", desc: "Mahogany & velvet drapery", icon: Landmark, iconColor: "text-indigo-600", bgTint: "bg-indigo-100" },
  { id: "runway", name: "Fashion Runway", desc: "Catwalk spotlights & crowd", icon: Camera, iconColor: "text-purple-600", bgTint: "bg-purple-100" },
  { id: "cutout", name: "Transparent Cutout", desc: "Clean isolated product cutout", icon: Scissors, iconColor: "text-emerald-600", bgTint: "bg-emerald-100" },
];

const AI_ENGINES: Array<{
  id: string;
  label: string;
  badge: string;
  cost: string;
  icon: LucideIcon;
  iconColor: string;
  bgTint: string;
  desc: string;
}> = [
  { id: "ai", label: "Quick Preview", badge: "Free", cost: "Free", icon: Zap, iconColor: "text-indigo-600", bgTint: "bg-indigo-50", desc: "Instant draft to preview fit without credits." },
  { id: "pro", label: "Studio Catalog", badge: "1 Credit", cost: "1 Credit", icon: Camera, iconColor: "text-violet-600", bgTint: "bg-violet-50", desc: "Studio softbox lighting for online store catalog." },
  { id: "exclusive", label: "Ultra Editorial", badge: "2 Credits", cost: "2 Credits", icon: Sparkles, iconColor: "text-purple-600", bgTint: "bg-purple-50", desc: "Magazine quality with sharp fabric weave." },
];

const QUICK_COLORS = [
  { name: "Pure White", hex: "#ffffff", border: "border-slate-300", bg: "bg-white" },
  { name: "Midnight Black", hex: "#0f172a", border: "border-slate-800", bg: "bg-slate-900" },
  { name: "Royal Blue", hex: "#2563eb", border: "border-blue-600", bg: "bg-blue-600" },
  { name: "Emerald Green", hex: "#059669", border: "border-emerald-600", bg: "bg-emerald-600" },
  { name: "Metallic Gold", hex: "#d97706", border: "border-amber-500", bg: "bg-amber-500" },
];

const ALL_COLOR_SWATCHES = [
  { name: "Original", hex: "transparent", bgClass: "bg-gradient-to-tr from-gray-200 to-gray-300 border-2 border-dashed border-gray-400" },
  { name: "Pure White", hex: "#ffffff", bgClass: "bg-white border border-gray-300" },
  { name: "Midnight Black", hex: "#0f172a", bgClass: "bg-slate-900 border border-slate-700" },
  { name: "Metallic Gold", hex: "#d97706", bgClass: "bg-amber-500 border border-amber-400" },
  { name: "Ruby Red", hex: "#dc2626", bgClass: "bg-red-600 border border-red-500" },
  { name: "Emerald Green", hex: "#059669", bgClass: "bg-emerald-600 border border-emerald-500" },
  { name: "Royal Blue", hex: "#2563eb", bgClass: "bg-blue-600 border border-blue-500" },
  { name: "Sunshine", hex: "#eab308", bgClass: "bg-yellow-400 border border-yellow-300" },
  { name: "Purple", hex: "#9333ea", bgClass: "bg-purple-600 border border-purple-500" },
  { name: "Hot Pink", hex: "#db2777", bgClass: "bg-pink-600 border border-pink-500" },
  { name: "Mocha Brown", hex: "#78350f", bgClass: "bg-amber-900 border border-amber-800" },
];

const MODEL_ETHNICITIES = [
  { id: "black", label: "Black", desc: "Black African / Afro-descendant", flag: "🌍" },
  { id: "white", label: "White", desc: "Caucasian / European", flag: "🕊️" },
  { id: "asian", label: "Asian", desc: "East Asian", flag: "🌸" },
  { id: "south_asian", label: "South Asian", desc: "South Asian / Desi", flag: "🪷" },
  { id: "latino", label: "Latino", desc: "Hispanic / Latin American", flag: "☀️" },
  { id: "middle_eastern", label: "Middle East", desc: "Middle Eastern", flag: "✨" },
  { id: "any", label: "Diverse", desc: "Diverse fashion model", flag: "🌐" },
] as const;

type ModelEthnicity = typeof MODEL_ETHNICITIES[number]["id"];

const PROMPT_SUGGESTIONS = ["Silk sheen", "Gold embroidery", "Studio softbox", "Editorial look"];

const GENERATION_PHASES: Array<{ title: string; detail: string; icon: LucideIcon }> = [
  { title: "Composing Scene", detail: "Studio lighting & backdrop", icon: Compass },
  { title: "Tailoring Garment", detail: "Preserving authentic drape", icon: Scissors },
  { title: "Refining Details", detail: "Fabric texture & highlights", icon: Sparkles },
  { title: "Developing Photo", detail: "Rendering high-res visual", icon: Camera },
];

export default function VisualStudioPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [sellerProducts, setSellerProducts] = useState<ProductItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [inputImageUrl, setInputImageUrl] = useState<string>("");
  const [uploadingFile, setUploadingFile] = useState<boolean>(false);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(true);
  const [brokenImageIds, setBrokenImageIds] = useState<Record<string, boolean>>({});

  const [targetColor, setTargetColor] = useState<string>("Original");
  const [stylePreset, setStylePreset] = useState<string>("none");
  const [targetBackground, setTargetBackground] = useState<string>("original");
  const [transformProvider, setTransformProvider] = useState<string>("ai");
  const [customInstruction, setCustomInstruction] = useState<string>("");
  const [controlModeLevel, setControlModeLevel] = useState<"Low" | "Middle" | "High">("Middle");
  const [qualitySteps, setQualitySteps] = useState<number>(30);
  const [aspectRatio, setAspectRatio] = useState<string>("1:1");

  const [garmentText, setGarmentText] = useState<string>("");
  const [modelPresentation, setModelPresentation] = useState<"shirt_only" | "from_photo" | "imagined">("shirt_only");
  const [imaginedModelGender, setImaginedModelGender] = useState<"female" | "male">("female");
  const [imaginedModelEthnicity, setImaginedModelEthnicity] = useState<ModelEthnicity>("black");
  const [preservePrint, setPreservePrint] = useState<boolean>(true);
  const [preserveShirtDesign, setPreserveShirtDesign] = useState<boolean>(true);

  const [generatedCards, setGeneratedCards] = useState<VisualDeckCard[]>([]);
  const [activeCardIndex, setActiveCardIndex] = useState<number>(0);

  const [isProductModalOpen, setIsProductModalOpen] = useState<boolean>(false);
  const [productSearchQuery, setProductSearchQuery] = useState<string>("");
  const [isStyleModalOpen, setIsStyleModalOpen] = useState<boolean>(false);
  const [isBackdropModalOpen, setIsBackdropModalOpen] = useState<boolean>(false);
  const [isEngineModalOpen, setIsEngineModalOpen] = useState<boolean>(false);
  const [isColorModalOpen, setIsColorModalOpen] = useState<boolean>(false);
  const [isColorCollapsed, setIsColorCollapsed] = useState<boolean>(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState<boolean>(false);

  const [transforming, setTransforming] = useState<boolean>(false);
  const [savingProduct, setSavingProduct] = useState<boolean>(false);
  const [aiCreditsBalance, setAiCreditsBalance] = useState<number>(10);
  const [showOriginalComparison, setShowOriginalComparison] = useState<boolean>(false);
  const [generatingStepIndex, setGeneratingStepIndex] = useState<number>(0);
  const [rightPanelOpen, setRightPanelOpen] = useState<boolean>(true);

  useEffect(() => {
    if (!transforming) { setGeneratingStepIndex(0); return; }
    const interval = setInterval(() => setGeneratingStepIndex((p) => (p + 1) % GENERATION_PHASES.length), 2200);
    return () => clearInterval(interval);
  }, [transforming]);

  const activeStyleObj = useMemo(() => FASHION_STYLE_PRESETS.find((s) => s.id === stylePreset) || FASHION_STYLE_PRESETS[0], [stylePreset]);
  const activeBackdropObj = useMemo(() => BACKGROUND_OPTIONS.find((b) => b.id === targetBackground) || BACKGROUND_OPTIONS[0], [targetBackground]);
  const activeEngineObj = useMemo(() => AI_ENGINES.find((e) => e.id === transformProvider) || AI_ENGINES[0], [transformProvider]);

  const fetchCreditsStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/subscriptions/trial");
      const data = await res.json();
      if (data.data?.aiCreditsBalance !== undefined) setAiCreditsBalance(data.data.aiCreditsBalance);
    } catch { /* ignore */ }
  }, []);

  const fetchSellerProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      // 1. Fetch real store products from dashboard products API
      const res = await fetch("/api/products?dashboard=true&limit=100");
      let prods: ProductItem[] = [];
      if (res.ok) {
        const data = await res.json();
        const rawList = data.products || (Array.isArray(data) ? data : []);
        prods = rawList
          .filter((p: { isDeleted?: boolean }) => !p.isDeleted)
          .map((p: Record<string, unknown>) => ({
            id: p.id as string,
            name: p.name as string,
            price: Number(p.price) || 0,
            currency: (p.currency as string) || "GHS",
            description: (p.description as string) || "",
            material: (p.material as string) || "",
            colors: Array.isArray(p.colors) ? (p.colors as string[]) : [],
            sizes: Array.isArray(p.sizes) ? (p.sizes as string[]) : [],
            images: Array.isArray(p.images) && (p.images as string[]).length > 0
              ? (p.images as string[])
              : p.imageUrl
              ? [p.imageUrl as string]
              : []
          }));
      }

      // 2. Fallback to general products endpoint if dashboard returns empty
      if (prods.length === 0) {
        const pubRes = await fetch("/api/products?limit=50");
        if (pubRes.ok) {
          const pubData = await pubRes.json();
          const pubList = pubData.products || [];
          prods = pubList
            .filter((p: { isDeleted?: boolean }) => !p.isDeleted)
            .map((p: Record<string, unknown>) => ({
              id: p.id as string,
              name: p.name as string,
              price: Number(p.price) || 0,
              currency: (p.currency as string) || "GHS",
              description: (p.description as string) || "",
              material: (p.material as string) || "",
              colors: Array.isArray(p.colors) ? (p.colors as string[]) : [],
              sizes: Array.isArray(p.sizes) ? (p.sizes as string[]) : [],
              images: Array.isArray(p.images) && (p.images as string[]).length > 0
                ? (p.images as string[])
                : p.imageUrl
                ? [p.imageUrl as string]
                : []
            }));
        }
      }

      setSellerProducts(prods);

      // Stage the first product that has at least one valid image from the DB
      const firstWithImage = prods.find((p) => p.images && p.images.length > 0 && p.images[0]);
      if (firstWithImage) {
        setSelectedProductId(firstWithImage.id);
        setInputImageUrl(firstWithImage.images[0]);
      } else {
        setSelectedProductId("");
        setInputImageUrl("");
      }
    } catch (err) {
      console.error("Failed to load products for Visual Studio:", err);
      setSellerProducts([]);
      setSelectedProductId("");
      setInputImageUrl("");
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    fetchSellerProducts();
    fetchCreditsStatus();
  }, [fetchSellerProducts, fetchCreditsStatus]);

  const selectedProduct = useMemo(() => sellerProducts.find((p) => p.id === selectedProductId) || null, [sellerProducts, selectedProductId]);

  const displayDeck = useMemo<VisualDeckCard[]>(() => {
    const list: VisualDeckCard[] = [];
    generatedCards.forEach((c) => list.push(c));
    if (inputImageUrl) {
      list.push({
        id: `staged-${inputImageUrl}`,
        imageUrl: inputImageUrl,
        version: "Base",
        title: selectedProduct?.name || "Staged Garment",
        tag: "Selected Reference Photo",
        prompt: "Source product photo",
        isOriginal: true
      });
    }
    if (selectedProduct && selectedProduct.images && selectedProduct.images.length > 1) {
      let angleNum = 2;
      selectedProduct.images.forEach((img, idx) => {
        if (img && img !== inputImageUrl) {
          list.push({
            id: `angle-${idx}-${img}`,
            imageUrl: img,
            version: `Angle ${angleNum++}`,
            title: selectedProduct.name,
            tag: "Catalog View",
            prompt: "Alternate angle photo",
            isOriginal: true
          });
        }
      });
    }
    return list;
  }, [generatedCards, inputImageUrl, selectedProduct]);

  // Curated, collision-safe swatches displayed directly on the staged garment pill (max 3 swatches)
  const displayedColorSwatches = useMemo(() => {
    type SwatchItem = { id: string; name: string; hex?: string; bgClass?: string; isDbColor?: boolean };
    const list: SwatchItem[] = [];
    const seen = new Set<string>();

    // 1. If an active targetColor is chosen and it's not "Original", ensure it appears first or in list
    if (targetColor && targetColor !== "Original") {
      const isHex = targetColor.startsWith("#");
      if (isHex) {
        list.push({ id: targetColor, name: targetColor, hex: targetColor, isDbColor: true });
        seen.add(targetColor.toLowerCase());
      } else {
        const found = QUICK_COLORS.find((c) => c.name.toLowerCase() === targetColor.toLowerCase())
          || ALL_COLOR_SWATCHES.find((c) => c.name.toLowerCase() === targetColor.toLowerCase());
        if (found) {
          list.push({
            id: found.name,
            name: found.name,
            hex: "hex" in found && found.hex !== "transparent" ? (found.hex as string) : undefined,
            bgClass: "bgClass" in found ? (found.bgClass as string) : ("bg" in found ? `${(found as any).bg} ${(found as any).border}` : undefined)
          });
          seen.add(found.name.toLowerCase());
        }
      }
    }

    // 2. Add product authentic colors from database (deduplicating case-insensitively)
    if (selectedProduct?.colors && selectedProduct.colors.length > 0) {
      for (const hex of selectedProduct.colors) {
        if (!hex) continue;
        const key = hex.toLowerCase();
        if (!seen.has(key)) {
          list.push({ id: hex, name: hex, hex, isDbColor: true });
          seen.add(key);
        }
      }
    }

    // 3. Fill up to 3 slots from QUICK_COLORS so there are always quick options
    for (const c of QUICK_COLORS) {
      if (list.length >= 3) break;
      const key = c.name.toLowerCase();
      const hexKey = c.hex.toLowerCase();
      if (!seen.has(key) && !seen.has(hexKey)) {
        list.push({ id: c.name, name: c.name, hex: c.hex, bgClass: `${c.bg} ${c.border}` });
        seen.add(key);
      }
    }

    return list.slice(0, 3);
  }, [targetColor, selectedProduct?.colors]);

  const filteredProducts = useMemo(() => {
    if (!productSearchQuery.trim()) return sellerProducts;
    const q = productSearchQuery.toLowerCase();
    return sellerProducts.filter((p) => p.name.toLowerCase().includes(q));
  }, [sellerProducts, productSearchQuery]);

  const handleSelectProduct = (prod: ProductItem, specificImage?: string) => {
    const chosen = specificImage || (prod.id === selectedProductId && inputImageUrl && prod.images?.includes(inputImageUrl) ? inputImageUrl : prod.images?.[0]) || "";
    setSelectedProductId(prod.id);
    setInputImageUrl(chosen);
    // Point active card directly to the newly staged product photo
    setActiveCardIndex(generatedCards.length);
    setIsProductModalOpen(false);
    toast.success(`Staged "${prod.name}" reference photo`);
  };

  const handleSelectDeckCard = (index: number) => {
    setActiveCardIndex(index);
    const card = displayDeck[index];
    if (card && card.isOriginal && card.imageUrl) {
      setInputImageUrl(card.imageUrl);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Instantly generate a local preview URL so the user immediately sees their photo on canvas
    const localPreviewUrl = URL.createObjectURL(file);
    setInputImageUrl(localPreviewUrl);
    setSelectedProductId("");
    setActiveCardIndex(generatedCards.length);
    setIsProductModalOpen(false);

    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || errData.details || "Upload failed");
      }
      const data = await res.json();
      const remoteUrl = data.url || data.secure_url;
      if (remoteUrl) {
        setInputImageUrl(remoteUrl);
      }
      toast.success("Photo staged successfully!");
    } catch (uploadErr) {
      console.warn("Upload service notice, using local photo preview:", uploadErr);
      toast.info("Photo staged for preview.");
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleAddPromptSuggestion = (text: string) => {
    setCustomInstruction((prev) => {
      if (!prev.trim()) return text;
      if (prev.toLowerCase().includes(text.toLowerCase())) return prev;
      return `${prev.trim()}, ${text}`;
    });
  };

  const composedPrompt = useMemo(() => {
    const parts = [];
    if (selectedProduct?.name) {
      const mat = selectedProduct.material ? ` in authentic ${selectedProduct.material}` : "";
      const col = selectedProduct.colors && selectedProduct.colors.length > 0 ? ` with authentic colors (${selectedProduct.colors.join(", ")})` : "";
      parts.push(`Commercial studio photoshoot of ${selectedProduct.name}${mat}${col}`);
    } else {
      parts.push("Commercial studio product photoshoot");
    }
    if (modelPresentation === "imagined") {
      const ethObj = MODEL_ETHNICITIES.find((e) => e.id === imaginedModelEthnicity);
      const ethDesc = ethObj && ethObj.id !== "any" ? `${ethObj.desc} ` : "";
      parts.push(`modeled by a professional ${ethDesc}${imaginedModelGender} fashion model`);
    } else if (modelPresentation === "shirt_only") {
      parts.push("isolated garment only, ghost mannequin");
    } else if (modelPresentation === "from_photo") {
      parts.push("preserve person from original photo");
    }
    if (targetColor !== "Original") parts.push(`in ${targetColor} fabric`);
    if (activeStyleObj.id !== "none") parts.push(`styled in ${activeStyleObj.name} fashion aesthetic`);
    if (activeBackdropObj.id === "original") parts.push("preserve original background");
    else if (activeBackdropObj.id === "cutout") parts.push("isolated transparent background");
    else parts.push(`set in ${activeBackdropObj.name} environment`);
    if (customInstruction.trim()) parts.push(customInstruction.trim());
    if (controlModeLevel === "High") parts.push("high-detail 8k resolution, crisp studio softbox lighting");
    return parts.join(", ") + ".";
  }, [selectedProduct, targetColor, activeStyleObj, activeBackdropObj, customInstruction, controlModeLevel, modelPresentation, imaginedModelGender, imaginedModelEthnicity]);

  const handleGenerate = async () => {
    const activeImage = activeCard?.imageUrl || inputImageUrl;
    if (!activeImage) {
      setIsProductModalOpen(true);
      return toast.error("Please select a garment photo first.");
    }
    const creditCost = transformProvider === "exclusive" ? 2 : transformProvider === "pro" ? 1 : 0;
    if (creditCost > 0 && aiCreditsBalance < creditCost) {
      return toast.error(`You need ${creditCost} credit${creditCost > 1 ? "s" : ""} for ${activeEngineObj.label}.`);
    }
    setTransforming(true);
    setShowOriginalComparison(false);
    try {
      const ethObj = MODEL_ETHNICITIES.find((e) => e.id === imaginedModelEthnicity);
      const ethDesc = ethObj && ethObj.id !== "any" ? `${ethObj.desc} ` : "";
      const res = await fetch("/api/ai/product-transform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: activeImage,
          productId: selectedProductId,
          targetColor: targetColor === "Original" ? "none" : targetColor,
          stylePreset: activeStyleObj.id !== "none" ? activeStyleObj.name : "",
          targetBackground: activeBackdropObj.id === "original" ? "original" : activeBackdropObj.id === "cutout" ? "cutout" : activeBackdropObj.name,
          customInstruction: customInstruction.trim(),
          provider: transformProvider,
          garmentText: garmentText.trim(),
          presentationMode: modelPresentation,
          modelDirective: modelPresentation === "imagined" ? `professional ${ethDesc}${imaginedModelGender} fashion model` : "none",
          modelEthnicity: imaginedModelEthnicity,
          preservePerson: modelPresentation === "from_photo",
          preservePrint,
          preserveShirtDesign,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      const newImageUrl = data.transformedImageUrl || data.outputUrl;
      if (newImageUrl) {
        const ver = `V${generatedCards.length + 1}`;
        setGeneratedCards((prev) => [
          {
            id: `gen-${Date.now()}`,
            imageUrl: newImageUrl,
            version: ver,
            title: selectedProduct?.name || "Lookbook Visual",
            tag: `${activeStyleObj.name} \u2022 ${activeBackdropObj.name}`,
            prompt: composedPrompt
          },
          ...prev
        ]);
        setActiveCardIndex(0);
        if (data.remainingCredits !== undefined) setAiCreditsBalance(data.remainingCredits);
        toast.success(`Generated ${ver} visual!`);
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e.message || "Failed to generate visual.");
    } finally {
      setTransforming(false);
    }
  };

  const handleSaveToProduct = async () => {
    const active = displayDeck[activeCardIndex] || displayDeck[0];
    if (!selectedProductId || !active?.imageUrl) {
      toast.error("Please choose a catalog product first.");
      return;
    }
    setSavingProduct(true);
    try {
      const res = await fetch("/api/ai/attach-to-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: selectedProductId, imageUrl: active.imageUrl })
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Updated product catalog photo!");
      setIsCompareModalOpen(false);
    } catch {
      toast.error("Could not update product photo.");
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDownloadImage = (url: string, filename = "lookbook.jpg") => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.target = "_blank";
    link.rel = "noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Downloading image");
  };

  const cycleEngine = (direction: 1 | -1) => {
    const idx = AI_ENGINES.findIndex((e) => e.id === transformProvider);
    const nextIdx = (idx + direction + AI_ENGINES.length) % AI_ENGINES.length;
    setTransformProvider(AI_ENGINES[nextIdx].id);
    toast.success(`Engine: ${AI_ENGINES[nextIdx].label}`);
  };

  const activeCard = displayDeck[activeCardIndex] || displayDeck[0];

  return (
    <div
      className="w-full h-[calc(100dvh-4.25rem)] flex flex-col overflow-hidden select-none font-sans relative"
      style={{
        background: "linear-gradient(135deg, #fdf2f8 0%, #f5f3ff 20%, #ede9fe 40%, #e0f2fe 65%, #f0fdf4 85%, #fff7ed 100%)",
      }}
    >
      <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />

      {/* ==================================================================== */}
      {/* CUTE & SIMPLE STUDIO HEADER (REDUCED SIZING & PLAYFUL UI)            */}
      {/* ==================================================================== */}
      <header className="flex items-center justify-between px-3 sm:px-4 py-1.5 shrink-0 border-b border-indigo-100/60 bg-white/70 backdrop-blur-xl z-30 shadow-[0_1px_12px_-2px_rgba(79,70,229,0.05)] relative">
        
        {/* Left: Cute Brand Tag + Staged Garment Chip + Engine Chip */}
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          
          {/* Cute Studio Tag */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-violet-600 via-indigo-600 to-pink-500 text-white shadow-xs shadow-indigo-500/20 shrink-0 select-none">
            <Sparkles className="w-3 h-3 text-pink-200" />
            <span className="font-extrabold text-[11px] tracking-tight">Studio</span>
            <span className="text-[8px] font-black px-1.5 py-0.2 rounded-full bg-white/20 text-white leading-none">
              AI
            </span>
          </div>

          {/* Staged Product Chip (Compact, Cute Rounded-Full) */}
          <button
            onClick={() => setIsProductModalOpen(true)}
            className="group flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/80 hover:bg-white border border-slate-200/80 hover:border-indigo-300 shadow-2xs hover:shadow-xs transition-all cursor-pointer text-left shrink-0"
            title="Switch staged garment"
          >
            <div className="relative w-5 h-5 rounded-full overflow-hidden bg-indigo-50 border border-indigo-100 shrink-0 flex items-center justify-center">
              {inputImageUrl ? (
                <Image
                  src={inputImageUrl}
                  alt="Garment"
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : selectedProduct && selectedProduct.images?.[0] ? (
                <Image
                  src={selectedProduct.images[0]}
                  alt="Garment"
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <Shirt className="w-2.5 h-2.5 text-indigo-500" />
              )}
            </div>
            <span className="text-[11px] font-bold text-slate-700 group-hover:text-indigo-600 truncate max-w-[100px] sm:max-w-[130px]">
              {selectedProduct ? selectedProduct.name : "Choose Garment"}
            </span>
            <ChevronDown className="w-2.5 h-2.5 text-slate-400 group-hover:text-indigo-500 transition-transform group-hover:translate-y-0.2 shrink-0 pr-0.5" />
          </button>

          {/* Engine Selector Chip */}
          <button
            onClick={() => setIsEngineModalOpen(true)}
            className="hidden lg:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/70 hover:bg-white border border-slate-200/70 hover:border-indigo-200 text-slate-600 hover:text-indigo-600 transition-all cursor-pointer shadow-2xs shrink-0"
            title="Select AI Engine"
          >
            <activeEngineObj.icon className="w-3 h-3 text-indigo-500" />
            <span className="text-[10px] font-bold">{activeEngineObj.label}</span>
            <span className="text-[8px] font-black px-1.5 py-0.2 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100/80">
              {activeEngineObj.badge}
            </span>
          </button>
        </div>

        {/* Center: Live Studio Stage Status Pill (Tablet & Desktop) */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/60 backdrop-blur-md border border-white/90 shadow-2xs text-[10px] text-slate-500 font-medium">
          <span className="relative flex h-1.5 w-1.5 shrink-0">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${transforming ? "bg-indigo-400" : "bg-emerald-400"}`} />
            <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${transforming ? "bg-indigo-600" : "bg-emerald-500"}`} />
          </span>
          <span className="font-bold text-slate-700">{activeCard?.version || "Draft"}</span>
          <span className="text-slate-300">•</span>
          <span className="text-indigo-600 font-semibold truncate max-w-[100px]">{activeStyleObj.name}</span>
        </div>

        {/* Right: Credits Token, Upload, Settings Toggle */}
        <div className="flex items-center gap-1.5 shrink-0">
          
          {/* Cute AI Credits Token */}
          <Link
            href="/dashboard/subscription"
            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100/80 hover:to-orange-100/80 border border-amber-200/70 text-amber-800 font-black text-[10px] shadow-2xs transition-all hover:scale-105"
            title="AI Credits Balance"
          >
            <Zap className="w-2.5 h-2.5 text-amber-500 fill-amber-400" />
            <span>{aiCreditsBalance}</span>
            <span className="text-amber-400 font-bold ml-0.5">+</span>
          </Link>

          {/* Cute Upload Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingFile}
            className="px-2.5 py-1 rounded-full text-[10px] font-bold text-slate-700 hover:text-indigo-600 bg-white/80 hover:bg-white border border-slate-200/80 hover:border-indigo-200 shadow-2xs transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
            title="Upload photo"
          >
            {uploadingFile ? (
              <RefreshCw className="w-3 h-3 animate-spin text-indigo-500" />
            ) : (
              <Upload className="w-3 h-3 text-indigo-500" />
            )}
            <span className="hidden sm:inline">Upload</span>
          </button>

          {/* Cute Settings Panel Toggle */}
          <button
            onClick={() => setRightPanelOpen(!rightPanelOpen)}
            className={`w-7 h-7 rounded-full transition-all cursor-pointer shadow-2xs flex items-center justify-center ${
              rightPanelOpen
                ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-xs"
                : "bg-white/80 hover:bg-white border border-slate-200/80 text-slate-600 hover:text-indigo-600"
            }`}
            title={rightPanelOpen ? "Close panel" : "Open panel"}
          >
            <Sliders className="w-3 h-3" />
          </button>
        </div>
      </header>

      {/* ==================================================================== */}
      {/* MAIN VIEWPORT (Flex: Center Stage + Docked Right Panel)              */}
      {/* ==================================================================== */}
      <div className="flex flex-1 min-h-0 relative overflow-hidden">

        {/* ------------------------------------------------------------------ */}
        {/* CENTER STAGE CANVAS (FUN CREATIVE GRADIENT MESH & AURORA)         */}
        {/* ------------------------------------------------------------------ */}
        <div className="flex-1 flex flex-col min-w-0 relative h-full overflow-hidden">

          {/* Fun Creative Gradient Mesh & Playful Aurora Atmosphere */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {/* Playful Designer Dot Matrix Grid */}
            <div
              className="absolute inset-0 opacity-40"
              style={{
                backgroundImage: "radial-gradient(rgba(129, 140, 248, 0.22) 1.2px, transparent 1.2px)",
                backgroundSize: "22px 22px"
              }}
            />

            {/* Aurora Glow Blob 1: Top Right (Lilac & Pink) */}
            <div className="absolute -top-16 -right-16 w-96 h-96 rounded-full bg-gradient-to-br from-pink-300/35 via-purple-300/25 to-indigo-200/20 blur-[85px]" />

            {/* Aurora Glow Blob 2: Bottom Left (Cyan & Mint) */}
            <div className="absolute -bottom-20 -left-20 w-[420px] h-[420px] rounded-full bg-gradient-to-tr from-cyan-300/30 via-teal-200/25 to-sky-200/20 blur-[90px]" />

            {/* Aurora Glow Blob 3: Center Halo (Peach, Violet & Cream) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full bg-gradient-to-r from-violet-300/25 via-pink-200/30 to-amber-200/25 blur-[100px]" />

            {/* Whimsical Floating Sparkles */}
            <div className="absolute top-8 left-12 text-indigo-400/40 text-lg select-none">✦</div>
            <div className="absolute top-20 right-24 text-pink-400/40 text-sm select-none">✨</div>
            <div className="absolute bottom-24 left-20 text-teal-400/40 text-base select-none">✧</div>
            <div className="absolute bottom-16 right-16 text-violet-400/40 text-lg select-none">✦</div>
          </div>

          {/* Main Stage Image Area */}
          <div className="flex-1 flex items-center justify-center p-3 relative min-h-0">
            
            {/* Generation Phase Floating Pill */}
            <AnimatePresence>
              {transforming && (
                <motion.div
                  initial={{ opacity: 0, y: -15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -15, scale: 0.95 }}
                  className="absolute top-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2.5 px-3.5 py-2 rounded-xl shadow-lg"
                  style={{
                    background: "rgba(255, 255, 255, 0.94)",
                    backdropFilter: "blur(20px)",
                    border: "1px solid rgba(129, 140, 248, 0.45)",
                    boxShadow: "0 12px 30px rgba(79, 70, 229, 0.15)"
                  }}
                >
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-xs">
                    <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: "3s" }} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 leading-tight">{GENERATION_PHASES[generatingStepIndex].title}</p>
                    <p className="text-[10px] text-slate-400 leading-tight">{GENERATION_PHASES[generatingStepIndex].detail}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* The Staged Image Frame (Enhanced Luminous Glow) */}
            {activeCard && activeCard.imageUrl ? (
              <motion.div
                key={activeCard.id}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className={`relative rounded-2xl overflow-hidden shadow-2xl transition-all ${
                  transforming ? "ring-2 ring-indigo-500/50" : ""
                }`}
                style={{
                  height: "min(440px, calc(100% - 16px))",
                  width: "auto",
                  maxWidth: "calc(100% - 16px)",
                  aspectRatio: aspectRatio.replace(":", "/"),
                  border: "3px solid rgba(255, 255, 255, 0.95)",
                  boxShadow: "0 25px 60px -15px rgba(99, 102, 241, 0.22), 0 10px 25px -10px rgba(236, 72, 153, 0.14), 0 0 0 1px rgba(255, 255, 255, 0.9)"
                }}
              >
                <Image
                  src={activeCard.imageUrl}
                  alt={activeCard.title}
                  fill
                  unoptimized
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 500px"
                  priority
                  onError={() => setBrokenImageIds((prev) => ({ ...prev, [activeCard.id]: true }))}
                />

                {brokenImageIds[activeCard.id] && (
                  <div className="absolute inset-0 bg-slate-100 flex flex-col items-center justify-center p-4 text-center z-10">
                    <Shirt className="w-8 h-8 text-slate-400 mb-2" />
                    <p className="text-xs font-bold text-slate-700">Photo Preview Unavailable</p>
                    <p className="text-[10px] text-slate-400 mt-1 max-w-[200px]">The image link could not be loaded</p>
                    <button
                      onClick={() => setIsProductModalOpen(true)}
                      className="mt-3 px-3 py-1 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs"
                    >
                      Choose Different Photo
                    </button>
                  </div>
                )}

                {/* Shimmer sweep effect during generation */}
                {transforming && (
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <motion.div
                      initial={{ transform: "translateX(-200%) rotate(30deg)" }}
                      animate={{ transform: "translateX(200%) rotate(30deg)" }}
                      transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                      className="w-full h-32 bg-gradient-to-b from-transparent via-white/35 to-transparent"
                    />
                  </div>
                )}

                {/* Top-Left: Aspect ratio badge */}
                <div className="absolute top-2.5 left-2.5 z-10">
                  <button
                    onClick={() => {
                      const rs = ["1:1", "4:5", "3:4", "16:9"];
                      setAspectRatio(rs[(rs.indexOf(aspectRatio) + 1) % rs.length]);
                    }}
                    className="px-2 py-0.5 rounded-lg text-[10px] font-bold text-slate-800 flex items-center gap-1 cursor-pointer transition-all hover:scale-105"
                    style={{
                      background: "rgba(255, 255, 255, 0.82)",
                      backdropFilter: "blur(16px)",
                      border: "1px solid rgba(255, 255, 255, 0.95)",
                    }}
                  >
                    <Maximize2 className="w-2.5 h-2.5 text-slate-500" />
                    <span>{aspectRatio}</span>
                  </button>
                </div>

                {/* Top-Right: Quick inspect & download buttons */}
                <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1">
                  <button
                    onClick={() => setIsCompareModalOpen(true)}
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-700 hover:text-indigo-600 cursor-pointer transition-all hover:scale-105"
                    style={{
                      background: "rgba(255, 255, 255, 0.82)",
                      backdropFilter: "blur(16px)",
                      border: "1px solid rgba(255, 255, 255, 0.95)",
                    }}
                    title="Inspect"
                  >
                    <Eye className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleDownloadImage(activeCard.imageUrl, `${activeCard.title}.jpg`)}
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-700 hover:text-indigo-600 cursor-pointer transition-all hover:scale-105"
                    style={{
                      background: "rgba(255, 255, 255, 0.82)",
                      backdropFilter: "blur(16px)",
                      border: "1px solid rgba(255, 255, 255, 0.95)",
                    }}
                    title="Download"
                  >
                    <Download className="w-3 h-3" />
                  </button>
                </div>

                {/* ------------------------------------------------------------ */}
                {/* CONTEXTUAL ON-IMAGE WIDGETS (UNIFIED RESPONSIVE BOTTOM BAR)  */}
                {/* ------------------------------------------------------------ */}
                <div className="absolute inset-x-2.5 bottom-2.5 z-20 flex flex-wrap items-end justify-between gap-1.5 pointer-events-none">
                  {/* Floating "Change Fabric Color" Widget (Bottom-Left) */}
                  <motion.div
                    layout
                    className="pointer-events-auto rounded-xl p-1.5 flex items-center shadow-md shrink-0 transition-all"
                    style={{
                      background: "rgba(255, 255, 255, 0.88)",
                      backdropFilter: "blur(20px)",
                      border: "1px solid rgba(255, 255, 255, 0.95)",
                    }}
                  >
                    {/* Collapsible Trigger: Palette Icon + Color text + collapse indicator */}
                    <button
                      type="button"
                      onClick={() => setIsColorCollapsed((prev) => !prev)}
                      className="group flex items-center gap-1 text-slate-600 hover:text-indigo-600 transition-colors px-1 py-0.5 rounded-lg hover:bg-slate-100/70 cursor-pointer shrink-0 select-none"
                      title={isColorCollapsed ? "Expand fabric colors" : "Collapse into icon"}
                    >
                      <Palette className="w-3.5 h-3.5 text-slate-600 group-hover:text-indigo-600 transition-colors" />

                      {/* When collapsed and active color is set, show micro indicator dot */}
                      {isColorCollapsed && targetColor && targetColor !== "Original" && (
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-white shadow-xs shrink-0"
                          style={{
                            backgroundColor: targetColor.startsWith("#")
                              ? targetColor
                              : (ALL_COLOR_SWATCHES.find(c => c.name.toLowerCase() === targetColor.toLowerCase())?.hex || "#6366f1")
                          }}
                        />
                      )}

                      {!isColorCollapsed && (
                        <span className="text-[9px] font-bold text-slate-600 group-hover:text-indigo-600 hidden sm:inline">Color</span>
                      )}

                      <ChevronLeft
                        className={`w-2.5 h-2.5 text-slate-400 group-hover:text-indigo-500 transition-transform duration-200 ${
                          isColorCollapsed ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {/* Collapsible Swatches: Smoothly enter / exit into the icon */}
                    <AnimatePresence initial={false}>
                      {!isColorCollapsed && (
                        <motion.div
                          key="color-swatches"
                          initial={{ width: 0, opacity: 0 }}
                          animate={{ width: "auto", opacity: 1 }}
                          exit={{ width: 0, opacity: 0 }}
                          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                          className="overflow-hidden flex items-center"
                        >
                          <div className="flex items-center gap-1 pl-1">
                            {displayedColorSwatches.map((swatch) => {
                              const isSel = swatch.hex
                                ? targetColor.toLowerCase() === swatch.hex.toLowerCase()
                                : targetColor.toLowerCase() === swatch.name.toLowerCase();
                              return (
                                <button
                                  key={swatch.id}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setTargetColor(swatch.hex || swatch.name);
                                    toast.success(`Color: ${swatch.name}`);
                                  }}
                                  className={`w-5 h-5 rounded-md transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                                    swatch.bgClass ? swatch.bgClass : "border"
                                  } ${
                                    isSel
                                      ? "ring-2 ring-indigo-500 scale-110 shadow-xs z-10"
                                      : "opacity-85 hover:opacity-100 hover:scale-105"
                                  }`}
                                  style={swatch.hex && !swatch.bgClass ? { backgroundColor: swatch.hex, borderColor: "rgba(0,0,0,0.15)" } : undefined}
                                  title={swatch.isDbColor ? `Product Color: ${swatch.name}` : swatch.name}
                                >
                                  {isSel && (
                                    <Check className={`w-2.5 h-2.5 stroke-[3] ${
                                      swatch.hex?.toLowerCase() === "#ffffff" || swatch.name === "Pure White" || swatch.name === "Original"
                                        ? "text-slate-900"
                                        : "text-white mix-blend-difference"
                                    }`} />
                                  )}
                                </button>
                              );
                            })}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsColorModalOpen(true);
                              }}
                              className="w-5 h-5 rounded-md bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-bold cursor-pointer transition-transform hover:scale-105 shrink-0"
                              title="All Colors"
                            >
                              +
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* Floating mini thumbnail stack (Bottom-Right) */}
                  <div
                    className="pointer-events-auto rounded-xl p-1 flex items-center shadow-md shrink-0 ml-auto transition-all"
                    style={{
                      background: "rgba(255, 255, 255, 0.88)",
                      backdropFilter: "blur(20px)",
                      border: "1px solid rgba(255, 255, 255, 0.95)",
                    }}
                  >
                    <div className="flex items-center -space-x-1.5 pr-1">
                      {displayDeck.slice(0, 3).map((item, i) => (
                        <button
                          key={item.id}
                          onClick={() => handleSelectDeckCard(i)}
                          className={`relative w-6 h-6 rounded-lg overflow-hidden border border-white shadow-xs transition-all cursor-pointer hover:scale-110 hover:z-30 shrink-0 ${
                            i === activeCardIndex ? "ring-2 ring-indigo-500 z-20 scale-105" : "opacity-85"
                          }`}
                          title={`${item.title} (${item.version})`}
                        >
                          <Image src={item.imageUrl} alt="" fill unoptimized className="object-cover" sizes="24px" />
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setIsProductModalOpen(true)}
                      className="w-5 h-5 rounded-md bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 flex items-center justify-center font-bold text-[10px] transition-transform hover:scale-105 cursor-pointer shrink-0"
                      title="Browse Catalog & Photos"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Card footer overlay */}
                <div className="absolute inset-x-0 bottom-0 p-2.5 pt-8 bg-gradient-to-t from-slate-950/70 via-slate-950/10 to-transparent flex items-end justify-between pointer-events-none opacity-0 hover:opacity-100 transition-opacity">
                  <div>
                    <p className="text-[11px] font-bold text-white truncate drop-shadow-xs">{activeCard.title}</p>
                    <p className="text-[9px] text-white/80">{activeCard.tag}</p>
                  </div>
                  <span className="px-1.5 py-0.5 rounded-md bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-black text-[10px] shadow-xs">
                    {activeCard.version}
                  </span>
                </div>
              </motion.div>
            ) : (
              /* Empty Canvas State */
              <div className="flex flex-col items-center justify-center gap-3 text-center">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-md"
                  style={{
                    background: "rgba(255, 255, 255, 0.8)",
                    backdropFilter: "blur(20px)",
                    border: "1px solid rgba(255, 255, 255, 0.95)"
                  }}
                >
                  <Shirt className="w-8 h-8 text-slate-300" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-700">No Garment Staged</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Upload a photo or pick from your catalog</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-500/25 transition-all hover:scale-105"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Upload Photo</span>
                  </button>
                  <button
                    onClick={() => setIsProductModalOpen(true)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-950 cursor-pointer transition-all hover:scale-105 shadow-xs"
                    style={{
                      background: "rgba(255, 255, 255, 0.8)",
                      border: "1px solid rgba(255, 255, 255, 0.95)"
                    }}
                  >
                    Browse Catalog
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* ------------------------------------------------------------------ */}
          {/* COMPACT FLOATING PROMPT PILL CONTAINER                             */}
          {/* ------------------------------------------------------------------ */}
          <div className="px-4 pb-3 pt-1 shrink-0 flex items-center justify-between gap-3 z-20">
            
            {/* Prompt input box matching reference "Promt" */}
            <div
              className="flex-1 max-w-xl flex items-center gap-2 px-3 py-1.5 rounded-xl shadow-xs"
              style={{
                background: "rgba(255, 255, 255, 0.82)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255, 255, 255, 0.95)",
              }}
            >
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Prompt</span>
              <input
                id="studio-prompt-input"
                type="text"
                value={customInstruction}
                onChange={(e) => setCustomInstruction(e.target.value)}
                placeholder="Describe your vision (e.g. silk sheen, gold embroidery)..."
                className="flex-1 bg-transparent text-xs text-slate-800 placeholder:text-slate-400 outline-none"
              />
              <div className="hidden md:flex items-center gap-1">
                {PROMPT_SUGGESTIONS.slice(0, 2).map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleAddPromptSuggestion(tag)}
                    className="px-1.5 py-0.5 rounded-md bg-black/[0.04] hover:bg-indigo-50 text-[9px] font-semibold text-slate-500 hover:text-indigo-700 transition-all cursor-pointer"
                  >
                    +{tag}
                  </button>
                ))}
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(composedPrompt);
                  toast.success("Prompt copied to clipboard");
                }}
                className="p-1 rounded text-slate-400 hover:text-slate-700 cursor-pointer transition-colors"
                title="Copy Full Prompt"
              >
                <Copy className="w-3 h-3" />
              </button>
            </div>

            {/* Render Button */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleGenerate}
                disabled={transforming}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:scale-95 disabled:opacity-60 text-white font-black text-xs shadow-md shadow-indigo-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {transforming ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                    <span>Rendering...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 fill-white" />
                    <span>Render</span>
                    <span className="text-[10px] font-bold text-indigo-100 opacity-90">({activeEngineObj.cost})</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </div>

        {/* ------------------------------------------------------------------ */}
        {/* DOCKED RIGHT GLASS PANEL (NOT OVERLAPPING THE CANVAS)              */}
        {/* ------------------------------------------------------------------ */}
        <AnimatePresence>
          {rightPanelOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 275, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
              className="shrink-0 h-full border-l border-black/[0.05] flex flex-col overflow-hidden z-20"
              style={{
                background: "rgba(255, 255, 255, 0.72)",
                backdropFilter: "blur(24px) saturate(160%)",
              }}
            >
              {/* Top Panel Header */}
              <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-black/[0.04] shrink-0">
                <div className="flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                  <h3 className="text-xs font-black text-slate-800">Image settings</h3>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setIsEngineModalOpen(true)}
                    className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-black/[0.04] transition-all cursor-pointer"
                    title="Engine settings"
                  >
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setRightPanelOpen(false)}
                    className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-black/[0.04] transition-all cursor-pointer"
                    title="Hide Panel"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Scrollable Settings Controls */}
              <div className="flex-1 overflow-y-auto px-3 py-2.5 space-y-2.5 scrollbar-thin">
                
                {/* 1. Control Mode Pill Slider */}
                <div
                  className="rounded-xl p-2.5 space-y-1.5"
                  style={{
                    background: "rgba(255, 255, 255, 0.65)",
                    border: "1px solid rgba(255, 255, 255, 0.9)"
                  }}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold text-slate-700">Control mode</p>
                    <span className="text-[10px] text-slate-400 font-semibold">{controlModeLevel}</span>
                  </div>

                  <div className="flex items-center bg-white rounded-lg p-0.5 border border-slate-200/70 shadow-inner">
                    {(["Low", "Middle", "High"] as const).map((lvl) => {
                      const isSel = controlModeLevel === lvl;
                      return (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setControlModeLevel(lvl)}
                          className={`flex-1 py-1 text-[10px] font-bold rounded transition-all cursor-pointer flex items-center justify-center gap-0.5 ${
                            isSel ? "bg-slate-900 text-white shadow-xs" : "text-slate-400 hover:text-slate-700"
                          }`}
                        >
                          <span>{lvl}</span>
                          {isSel && <span className="text-[8px] font-mono opacity-50">||</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Quality Steps Slider */}
                <div
                  className="rounded-xl p-2.5 space-y-1.5"
                  style={{
                    background: "rgba(255, 255, 255, 0.65)",
                    border: "1px solid rgba(255, 255, 255, 0.9)"
                  }}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold text-slate-700">Quality steps</p>
                    <span className="text-[10px] text-indigo-700 font-bold">{qualitySteps}</span>
                  </div>

                  <div className="space-y-1">
                    <input
                      type="range"
                      min="10"
                      max="100"
                      step="5"
                      value={qualitySteps}
                      onChange={(e) => setQualitySteps(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 rounded appearance-none cursor-pointer accent-indigo-600"
                    />
                    <div className="flex justify-between text-[9px] font-mono text-slate-400 font-bold px-0.5">
                      <span>0</span>
                      <span className="text-indigo-600 font-extrabold">|| {qualitySteps}</span>
                      <span>100</span>
                    </div>
                  </div>
                </div>

                {/* 3. Style Aesthetics / Image Examples */}
                <div
                  className="rounded-xl p-2.5 space-y-2"
                  style={{
                    background: "rgba(255, 255, 255, 0.65)",
                    border: "1px solid rgba(255, 255, 255, 0.9)"
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-extrabold text-slate-800 leading-tight">Style Aesthetic</p>
                      <p className="text-[9px] text-slate-400">Editorial mood & lighting</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsStyleModalOpen(true)}
                      className="text-[9px] font-bold text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <span>All</span>
                      <ChevronRight className="w-2.5 h-2.5" />
                    </button>
                  </div>

                  {/* Active Preset Tag Indicator */}
                  {activeStyleObj && (
                    <div className="flex items-center justify-between px-2 py-1 bg-white/80 border border-slate-200/80 rounded-lg text-[10px]">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0" />
                        <span className="font-bold text-slate-800 truncate">{activeStyleObj.name}</span>
                        <span className="text-[8.5px] font-extrabold text-indigo-600 uppercase tracking-wide shrink-0">
                          {activeStyleObj.tag}
                        </span>
                      </div>
                      {stylePreset !== "none" && (
                        <button
                          type="button"
                          onClick={() => {
                            setStylePreset("none");
                            toast.info("Reset to Original Cut");
                          }}
                          className="text-[8.5px] font-bold text-slate-400 hover:text-slate-600 ml-1 cursor-pointer shrink-0"
                          title="Reset style"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  )}

                  {/* Visual Editorial Cards Carousel */}
                  <div className="flex items-stretch gap-1.5 overflow-x-auto pb-1 pt-0.5 scrollbar-thin snap-x snap-mandatory">
                    {FASHION_STYLE_PRESETS.map((sty) => {
                      const isSel = stylePreset === sty.id;
                      return (
                        <button
                          key={sty.id}
                          type="button"
                          onClick={() => {
                            setStylePreset(sty.id);
                            toast.success(`Style: ${sty.name}`);
                          }}
                          className={`group relative w-[74px] h-[102px] rounded-xl overflow-hidden shrink-0 transition-all duration-200 cursor-pointer text-left snap-start ${
                            isSel
                              ? "ring-2 ring-indigo-600 shadow-md scale-[1.02]"
                              : "border border-slate-200/80 hover:border-indigo-300 hover:shadow-xs opacity-90 hover:opacity-100"
                          }`}
                        >
                          {/* Real Visual Image */}
                          <Image
                            src={sty.imageUrl}
                            alt={sty.name}
                            fill
                            unoptimized
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            sizes="74px"
                          />

                          {/* Gradient Scrim */}
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/30 to-transparent" />

                          {/* Selected Check Badge */}
                          {isSel && (
                            <div className="absolute top-1.5 right-1.5 z-10 w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </div>
                          )}

                          {/* Bottom Info: Tag and Name */}
                          <div className="absolute inset-x-0 bottom-0 p-1.5 z-10 flex flex-col justify-end">
                            <span className="text-[7px] font-extrabold uppercase tracking-wider text-indigo-300 drop-shadow-xs leading-none mb-0.5">
                              {sty.tag}
                            </span>
                            <span className="text-[8.5px] font-black text-white leading-tight drop-shadow-xs line-clamp-2">
                              {sty.name}
                            </span>
                          </div>
                        </button>
                      );
                    })}

                    {/* View All / Explore Card */}
                    <button
                      type="button"
                      onClick={() => setIsStyleModalOpen(true)}
                      className="w-14 h-[102px] rounded-xl border border-dashed border-slate-300 hover:border-indigo-400 bg-white/60 hover:bg-indigo-50/50 flex flex-col items-center justify-center p-1.5 text-center text-slate-400 hover:text-indigo-600 transition-all cursor-pointer shrink-0 snap-start"
                    >
                      <Plus className="w-3.5 h-3.5 mb-1" />
                      <span className="text-[8px] font-bold leading-tight">View All</span>
                    </button>
                  </div>
                </div>

                {/* 4. Model Presentation */}
                <div
                  className="rounded-xl p-2.5 space-y-2"
                  style={{
                    background: "rgba(255, 255, 255, 0.65)",
                    border: "1px solid rgba(255, 255, 255, 0.9)"
                  }}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold text-slate-700">Model Directive</p>
                    <span className="text-[9px] text-slate-400 font-semibold truncate max-w-[130px] text-right">
                      {modelPresentation === "shirt_only"
                        ? "Only Shirt"
                        : modelPresentation === "from_photo"
                        ? "From Photo"
                        : `${MODEL_ETHNICITIES.find((e) => e.id === imaginedModelEthnicity)?.label || ""} ${imaginedModelGender}`}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1 bg-white p-0.5 rounded-lg border border-slate-200/70 shadow-inner">
                    {([
                      ["shirt_only", "Shirt", Shirt],
                      ["from_photo", "Photo", UserCheck],
                      ["imagined", "AI Model", Wand2],
                    ] as const).map(([mode, label, Icon]) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setModelPresentation(mode as "shirt_only" | "from_photo" | "imagined")}
                        className={`py-1 rounded text-[9px] font-bold flex items-center justify-center gap-0.5 transition-all cursor-pointer ${
                          modelPresentation === mode ? "bg-slate-900 text-white shadow-xs" : "text-slate-400 hover:text-slate-700"
                        }`}
                      >
                        <Icon className="w-2.5 h-2.5" />
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>

                  {modelPresentation === "imagined" && (
                    <div className="space-y-2 pt-1 border-t border-slate-200/50">
                      {/* Gender Row */}
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-500">Gender</span>
                        <div className="flex gap-1 bg-white p-0.5 rounded-lg border border-slate-200/70 shadow-inner w-28">
                          {(["female", "male"] as const).map((g) => (
                            <button
                              key={g}
                              type="button"
                              onClick={() => {
                                setImaginedModelGender(g);
                                toast.success(`Model: ${g}`);
                              }}
                              className={`flex-1 py-0.5 rounded text-[9px] font-bold transition-all cursor-pointer capitalize ${
                                imaginedModelGender === g ? "bg-slate-900 text-white shadow-xs" : "text-slate-400 hover:text-slate-700"
                              }`}
                            >
                              {g}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Ethnicity Row & Options */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-500">Ethnicity</span>
                          <span className="text-[9px] font-black text-indigo-700 uppercase tracking-wider">
                            {MODEL_ETHNICITIES.find((e) => e.id === imaginedModelEthnicity)?.label}
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-1">
                          {MODEL_ETHNICITIES.map((eth) => {
                            const isSel = imaginedModelEthnicity === eth.id;
                            return (
                              <button
                                key={eth.id}
                                type="button"
                                onClick={() => {
                                  setImaginedModelEthnicity(eth.id);
                                  toast.success(`Ethnicity: ${eth.label}`);
                                }}
                                className={`py-1.5 px-0.5 rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                                  isSel
                                    ? "bg-gradient-to-r from-indigo-600 to-violet-600 border-indigo-600 text-white font-black shadow-xs ring-1 ring-indigo-400/50 scale-[1.03]"
                                    : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                                }`}
                                title={eth.desc}
                              >
                                <span className="text-[11px] leading-none">{eth.flag}</span>
                                <span className="text-[7.5px] font-bold leading-tight truncate w-full">
                                  {eth.label}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 5. Backdrop Selector */}
                <div
                  onClick={() => setIsBackdropModalOpen(true)}
                  className="rounded-xl p-2.5 flex items-center justify-between cursor-pointer hover:bg-white transition-all group"
                  style={{
                    background: "rgba(255, 255, 255, 0.65)",
                    border: "1px solid rgba(255, 255, 255, 0.9)"
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${activeBackdropObj.bgTint} ${activeBackdropObj.iconColor}`}>
                      <activeBackdropObj.icon className="w-3 h-3" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-slate-700 leading-tight">Backdrop</p>
                      <p className="text-[9px] text-slate-400 leading-tight">{activeBackdropObj.name}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-slate-600 transition-colors" />
                </div>

                {/* 6. Fidelity Locks */}
                <div
                  className="rounded-xl p-2.5 space-y-1.5"
                  style={{
                    background: "rgba(255, 255, 255, 0.65)",
                    border: "1px solid rgba(255, 255, 255, 0.9)"
                  }}
                >
                  <p className="text-[10px] font-bold text-slate-700 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-slate-400" />
                    <span>Fidelity Locks</span>
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPreserveShirtDesign(!preserveShirtDesign)}
                      className={`p-1.5 rounded-lg border text-left transition-all cursor-pointer ${
                        preserveShirtDesign
                          ? "bg-indigo-50 border-indigo-300 text-indigo-800"
                          : "bg-white border-slate-200 text-slate-400 hover:text-slate-600"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <Scissors className="w-2.5 h-2.5" />
                        <div className={`w-2.5 h-2.5 rounded-full flex items-center justify-center ${preserveShirtDesign ? "bg-indigo-600 text-white" : "bg-slate-200"}`}>
                          {preserveShirtDesign && <Check className="w-2 h-2 stroke-[3]" />}
                        </div>
                      </div>
                      <p className="text-[9px] font-bold">Lock Cut</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPreservePrint(!preservePrint)}
                      className={`p-1.5 rounded-lg border text-left transition-all cursor-pointer ${
                        preservePrint
                          ? "bg-indigo-50 border-indigo-300 text-indigo-800"
                          : "bg-white border-slate-200 text-slate-400 hover:text-slate-600"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <Type className="w-2.5 h-2.5" />
                        <div className={`w-2.5 h-2.5 rounded-full flex items-center justify-center ${preservePrint ? "bg-indigo-600 text-white" : "bg-slate-200"}`}>
                          {preservePrint && <Check className="w-2 h-2 stroke-[3]" />}
                        </div>
                      </div>
                      <p className="text-[9px] font-bold">Keep Prints</p>
                    </button>
                  </div>

                  <div className="relative pt-0.5">
                    <Type className="w-2.5 h-2.5 text-slate-400 absolute left-2 top-2" />
                    <input
                      type="text"
                      value={garmentText}
                      onChange={(e) => setGarmentText(e.target.value)}
                      placeholder="Shirt text / logo..."
                      className="w-full bg-white border border-slate-200 rounded-lg pl-5 pr-2 py-1 text-[10px] text-slate-700 placeholder:text-slate-400 outline-none focus:border-indigo-400"
                    />
                  </div>
                </div>

              </div>

              {/* Bottom Generate Action in Panel */}
              <div className="p-2.5 border-t border-black/[0.04] bg-white/40 shrink-0">
                <button
                  onClick={handleGenerate}
                  disabled={transforming}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:scale-[0.98] disabled:opacity-60 text-white font-black text-xs shadow-md shadow-indigo-500/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {transforming ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                      <span>Rendering...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 fill-white" />
                      <span>Render</span>
                      <span className="text-[9px] font-bold text-indigo-100 opacity-90">({activeEngineObj.cost})</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Small collapsed tab to re-open panel when closed */}
        {!rightPanelOpen && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setRightPanelOpen(true)}
            className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1 px-1.5 py-3 rounded-xl cursor-pointer transition-all shadow-md hover:scale-105 z-30"
            style={{
              background: "rgba(255, 255, 255, 0.85)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255, 255, 255, 0.95)",
            }}
            title="Open Settings"
          >
            <ChevronLeft className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-[9px] font-extrabold text-slate-700 rotate-90 whitespace-nowrap mt-1.5">
              SETTINGS
            </span>
          </motion.button>
        )}

      </div>

      {/* ==================================================================== */}
      {/* MODAL: PRODUCT CATALOG SELECTOR                                      */}
      {/* ==================================================================== */}
      <AnimatePresence>
        {isProductModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh] rounded-2xl shadow-2xl"
              style={{
                background: "rgba(255, 255, 255, 0.95)",
                backdropFilter: "blur(32px)",
                border: "1px solid rgba(255, 255, 255, 0.95)"
              }}
            >
              <div className="p-4 flex items-center justify-between border-b border-black/[0.05]">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800">Select Garment Photo</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Stage an item from your catalog or upload a photo</p>
                </div>
                <button onClick={() => setIsProductModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Upload Drop area */}
              <div className="p-3 border-b border-black/[0.05]">
                <label className="flex items-center justify-center gap-2 p-3 rounded-xl cursor-pointer text-xs font-bold text-indigo-800 transition-all border border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/60 hover:bg-indigo-50">
                  {uploadingFile ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" /> : <Upload className="w-3.5 h-3.5 text-indigo-600" />}
                  <span>{uploadingFile ? "Uploading..." : "Upload Garment Photo from Device"}</span>
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>

              {/* Search */}
              <div className="p-3 relative border-b border-black/[0.05]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-6 top-[22px]" />
                <input
                  type="text"
                  placeholder="Search catalog products..."
                  value={productSearchQuery}
                  onChange={(e) => setProductSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 placeholder:text-slate-400 outline-none focus:border-indigo-400"
                />
              </div>

              {/* Inventory items */}
              <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                {loadingProducts ? (
                  <div className="p-6 text-center text-xs text-slate-400">Loading your store catalog...</div>
                ) : filteredProducts.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">No products found. Upload a photo above.</div>
                ) : (
                  filteredProducts.map((prod) => {
                    const isSel = selectedProductId === prod.id;
                    const hasImages = prod.images && prod.images.length > 0;
                    return (
                      <div
                        key={prod.id}
                        className={`p-3 rounded-xl border flex flex-col gap-2.5 transition-all ${
                          isSel ? "border-indigo-400 bg-indigo-50/70 shadow-xs ring-1 ring-indigo-200" : "border-slate-100 bg-white hover:bg-slate-50/80"
                        }`}
                      >
                        {/* Product Header Row */}
                        <div
                          onClick={() => handleSelectProduct(prod, isSel && inputImageUrl ? inputImageUrl : prod.images?.[0])}
                          className="flex items-center justify-between gap-2.5 cursor-pointer"
                        >
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-bold text-slate-800 truncate">{prod.name}</h4>
                              {prod.material && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium">
                                  {prod.material}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <p className="text-[10px] text-indigo-700 font-bold">
                                {getCurrencySymbolFromCode(prod.currency)} {prod.price.toFixed(2)}
                              </p>
                              {prod.colors && prod.colors.length > 0 && (
                                <div className="flex items-center gap-1">
                                  {prod.colors.map((c) => (
                                    <span key={c} className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: c }} title={c} />
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          {isSel && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-600 text-white shrink-0 flex items-center gap-1">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                              <span>Staged</span>
                            </span>
                          )}
                        </div>

                        {/* Image Gallery: Every product photo is directly clickable */}
                        {hasImages ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                              {prod.images.map((img, idx) => {
                                const isImgActive = isSel && inputImageUrl === img;
                                return (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSelectProduct(prod, img);
                                    }}
                                    className={`relative w-14 h-14 rounded-lg overflow-hidden border shrink-0 transition-all cursor-pointer group ${
                                      isImgActive
                                        ? "ring-2 ring-indigo-600 border-indigo-600 shadow-md scale-[1.03]"
                                        : "border-slate-200 hover:border-indigo-300 opacity-80 hover:opacity-100"
                                    }`}
                                    title={`Select Photo #${idx + 1} of ${prod.name}`}
                                  >
                                    <Image src={img} alt="" fill unoptimized className="object-cover" sizes="56px" />
                                    {isImgActive && (
                                      <div className="absolute inset-0 bg-indigo-900/30 flex items-center justify-center">
                                        <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                                          <Check className="w-3 h-3 stroke-[3]" />
                                        </div>
                                      </div>
                                    )}
                                    <span className="absolute bottom-0.5 right-0.5 px-1 py-0.2 rounded bg-black/60 text-white text-[7.5px] font-bold">
                                      #{idx + 1}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                            <p className="text-[9px] text-slate-400">
                              {prod.images.length > 1
                                ? `Click any photo (#1 - #${prod.images.length}) to stage it as your AI reference`
                                : "Click photo to stage as your AI reference"}
                            </p>
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-slate-100 shrink-0 flex items-center justify-center">
                            <Shirt className="w-4 h-4 text-slate-300" />
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

      {/* ==================================================================== */}
      {/* MODAL: STYLE PRESETS CATALOG                                         */}
      {/* ==================================================================== */}
      <AnimatePresence>
        {isStyleModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-sm overflow-hidden rounded-2xl shadow-2xl"
              style={{
                background: "rgba(255, 255, 255, 0.95)",
                backdropFilter: "blur(32px)",
                border: "1px solid rgba(255, 255, 255, 0.95)"
              }}
            >
              <div className="p-4 flex items-center justify-between border-b border-black/[0.05]">
                <div>
                  <h3 className="text-xs font-extrabold text-slate-800">Fashion Aesthetic</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Select photoshoot styling direction</p>
                </div>
                <button onClick={() => setIsStyleModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[64vh] overflow-y-auto">
                {FASHION_STYLE_PRESETS.map((style) => {
                  const isSel = stylePreset === style.id;
                  return (
                    <div
                      key={style.id}
                      onClick={() => {
                        setStylePreset(style.id);
                        setIsStyleModalOpen(false);
                        toast.success(`Style: ${style.name}`);
                      }}
                      className={`group relative rounded-xl border p-2.5 flex items-center gap-3 cursor-pointer transition-all ${
                        isSel
                          ? "border-indigo-500 bg-indigo-50/80 shadow-xs ring-1 ring-indigo-300"
                          : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50/80"
                      }`}
                    >
                      {/* Real Visual Thumbnail */}
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 border border-black/5 shadow-xs">
                        <Image
                          src={style.imageUrl}
                          alt={style.name}
                          fill
                          unoptimized
                          className="object-cover transition-transform group-hover:scale-105"
                          sizes="64px"
                        />
                        {isSel && (
                          <div className="absolute inset-0 bg-indigo-600/30 backdrop-blur-[1px] flex items-center justify-center">
                            <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[8.5px] font-extrabold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                            {style.tag}
                          </span>
                        </div>
                        <h4 className="text-xs font-black text-slate-800 truncate">{style.name}</h4>
                        <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5 leading-snug">{style.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================================================================== */}
      {/* MODAL: BACKDROP PICKER                                               */}
      {/* ==================================================================== */}
      <AnimatePresence>
        {isBackdropModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-sm overflow-hidden rounded-2xl shadow-2xl"
              style={{
                background: "rgba(255, 255, 255, 0.95)",
                backdropFilter: "blur(32px)",
                border: "1px solid rgba(255, 255, 255, 0.95)"
              }}
            >
              <div className="p-4 flex items-center justify-between border-b border-black/[0.05]">
                <div>
                  <h3 className="text-xs font-extrabold text-slate-800">Backdrop Environment</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Choose background atmosphere</p>
                </div>
                <button onClick={() => setIsBackdropModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-3 space-y-1.5 max-h-[60vh] overflow-y-auto">
                {BACKGROUND_OPTIONS.map((bg) => {
                  const isSel = targetBackground === bg.id;
                  return (
                    <div
                      key={bg.id}
                      onClick={() => {
                        setTargetBackground(bg.id);
                        setIsBackdropModalOpen(false);
                        toast.success(`Backdrop: ${bg.name}`);
                      }}
                      className={`p-2.5 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                        isSel ? "border-indigo-400 bg-indigo-50/70 shadow-xs ring-1 ring-indigo-200" : "border-slate-100 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${bg.bgTint} ${bg.iconColor}`}>
                        <bg.icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xs font-bold text-slate-800">{bg.name}</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">{bg.desc}</p>
                      </div>
                      {isSel && (
                        <div className="w-4 h-4 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white flex items-center justify-center shrink-0">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================================================================== */}
      {/* MODAL: PHOTO QUALITY & ENGINE                                        */}
      {/* ==================================================================== */}
      <AnimatePresence>
        {isEngineModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-sm overflow-hidden rounded-2xl shadow-2xl"
              style={{
                background: "rgba(255, 255, 255, 0.95)",
                backdropFilter: "blur(32px)",
                border: "1px solid rgba(255, 255, 255, 0.95)"
              }}
            >
              <div className="p-4 flex items-center justify-between border-b border-black/[0.05]">
                <div>
                  <h3 className="text-xs font-extrabold text-slate-800">Photo Quality Tier</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Select image resolution & detail</p>
                </div>
                <button onClick={() => setIsEngineModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-3 space-y-2">
                {AI_ENGINES.map((eng) => {
                  const isSel = transformProvider === eng.id;
                  return (
                    <div
                      key={eng.id}
                      onClick={() => {
                        setTransformProvider(eng.id);
                        setIsEngineModalOpen(false);
                        toast.success(`Quality: ${eng.label}`);
                      }}
                      className={`p-2.5 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                        isSel ? "border-indigo-400 bg-indigo-50/70 shadow-xs ring-1 ring-indigo-200" : "border-slate-100 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${eng.bgTint} ${eng.iconColor}`}>
                        <eng.icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-slate-800">{eng.label}</h4>
                          <span className="text-[9px] px-1 py-0.2 rounded bg-slate-100 text-slate-500 font-semibold">{eng.badge}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">{eng.desc}</p>
                      </div>
                      {isSel ? (
                        <div className="w-4 h-4 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white flex items-center justify-center shrink-0">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      ) : (
                        <span className="text-xs font-bold text-slate-400">{eng.cost}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================================================================== */}
      {/* MODAL: ALL COLOR SWATCHES                                            */}
      {/* ==================================================================== */}
      <AnimatePresence>
        {isColorModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-xs overflow-hidden rounded-2xl shadow-2xl"
              style={{
                background: "rgba(255, 255, 255, 0.95)",
                backdropFilter: "blur(32px)",
                border: "1px solid rgba(255, 255, 255, 0.95)"
              }}
            >
              <div className="p-3.5 flex items-center justify-between border-b border-black/[0.05]">
                <div>
                  <h3 className="text-xs font-extrabold text-slate-800">Fabric Color Palette</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Select target color</p>
                </div>
                <button onClick={() => setIsColorModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-3.5 grid grid-cols-3 gap-2">
                {ALL_COLOR_SWATCHES.map((col) => {
                  const isSel = targetColor === col.name;
                  return (
                    <button
                      key={col.name}
                      onClick={() => {
                        setTargetColor(col.name);
                        setIsColorModalOpen(false);
                        toast.success(`Color: ${col.name}`);
                      }}
                      className={`p-2 rounded-xl flex flex-col items-center gap-1 border transition-all cursor-pointer ${
                        isSel ? "border-indigo-400 bg-indigo-50 ring-1 ring-indigo-200 shadow-xs" : "border-slate-100 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full ${col.bgClass} flex items-center justify-center shadow-xs`}>
                        {isSel && <Check className={`w-3 h-3 stroke-[3] ${col.name === "Pure White" || col.name === "Original" ? "text-slate-900" : "text-white"}`} />}
                      </div>
                      <span className="text-[10px] font-bold text-slate-700 text-center">{col.name}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================================================================== */}
      {/* MODAL: INSPECT & COMPARE                                             */}
      {/* ==================================================================== */}
      <AnimatePresence>
        {isCompareModalOpen && activeCard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-3xl overflow-hidden rounded-2xl shadow-2xl flex flex-col max-h-[88vh]"
              style={{
                background: "rgba(255, 255, 255, 0.95)",
                backdropFilter: "blur(32px)",
                border: "1px solid rgba(255, 255, 255, 0.95)"
              }}
            >
              <div className="p-4 flex items-center justify-between border-b border-black/[0.05]">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-extrabold text-slate-800">{activeCard.title}</h3>
                  <span className="px-1.5 py-0.2 rounded bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-black text-[10px]">
                    {activeCard.version}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {inputImageUrl && (
                    <button
                      onClick={() => setShowOriginalComparison(!showOriginalComparison)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 flex items-center gap-1 cursor-pointer transition-all"
                    >
                      {showOriginalComparison ? <Eye className="w-3 h-3 text-indigo-600" /> : <EyeOff className="w-3 h-3 text-slate-400" />}
                      <span>{showOriginalComparison ? "Original" : "Compare"}</span>
                    </button>
                  )}
                  <button onClick={() => setIsCompareModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 min-h-[340px] bg-slate-50 relative flex items-center justify-center p-3">
                <Image
                  src={showOriginalComparison && inputImageUrl ? inputImageUrl : activeCard.imageUrl}
                  alt={activeCard.title}
                  fill
                  unoptimized
                  className="object-contain"
                />
              </div>

              <div className="p-3 flex items-center justify-between gap-3 border-t border-black/[0.05]">
                <p className="text-[11px] text-slate-400 max-w-sm line-clamp-1">{activeCard.prompt}</p>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleDownloadImage(activeCard.imageUrl, `${activeCard.title}.jpg`)}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1 cursor-pointer transition-all"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download</span>
                  </button>
                  {selectedProductId && (
                    <button
                      onClick={handleSaveToProduct}
                      disabled={savingProduct}
                      className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white font-black text-xs flex items-center gap-1 cursor-pointer transition-all shadow-md shadow-indigo-500/20"
                    >
                      {savingProduct ? <RefreshCw className="w-3 h-3 animate-spin" /> : <ShoppingBag className="w-3 h-3" />}
                      <span>Set as Cover</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
