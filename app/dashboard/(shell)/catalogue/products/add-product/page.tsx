'use client';

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, X, Video, ChevronRight, ChevronLeft,
  Check, Tag, Palette, Image as ImageIcon,
  Loader2, DollarSign, Wand2, Sparkles, Camera, Eye,
  AlertCircle, ArrowRight, Star, RefreshCw, Layers, ShieldCheck,
  Package, Scissors, CheckCircle2, CircleDashed
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ColorPicker } from "@/components/ui/color-picker";
import { MultiCategoryPicker, type ParentCategory } from "@/app/components/MultiCategoryPicker";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// --- Types ---
type SizeOption =
  | "US 2" | "US 4" | "US 6" | "US 8" | "US 10" | "US 12" | "US 14" | "US 16"
  | "EU 34" | "EU 36" | "EU 38" | "EU 40" | "EU 42" | "EU 44" | "EU 46" | "EU 48"
  | "UK 6" | "UK 8" | "UK 10" | "UK 12" | "UK 14" | "UK 16" | "UK 18" | "UK 20"
  | "XS" | "S" | "M" | "L" | "XL" | "XXL";

interface Collection {
  id: string;
  name: string;
  slug: string;
}

const TABS = [
  { id: 'basics', label: 'Basics', icon: Tag, subtitle: 'Name, Category & Story' },
  { id: 'media', label: 'Media', icon: ImageIcon, subtitle: 'Photos & Lookbook Video' },
  { id: 'pricing', label: 'Pricing & Stock', icon: DollarSign, subtitle: 'Price, Inventory & Sale' },
  { id: 'details', label: 'Sizing & Specs', icon: Palette, subtitle: 'Sizes, Colors & Materials' },
] as const;

type TabId = typeof TABS[number]['id'];

const COLOR_MAP: Record<string, string> = {
  black: '#000000',
  white: '#FFFFFF',
  red: '#DC143C',
  blue: '#2563EB',
  navy: '#000080',
  green: '#008000',
  emerald: '#059669',
  yellow: '#FFD700',
  gold: '#D97706',
  orange: '#FFA500',
  purple: '#800080',
  pink: '#FFC0CB',
  brown: '#8B4513',
  beige: '#F5F5DC',
  grey: '#808080',
  gray: '#808080',
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

function AddProductForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabId>('basics');
  const [loading, setLoading] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiEngineName, setAiEngineName] = useState<string | null>(null);
  const [showDnaDetails, setShowDnaDetails] = useState(false);

  // --- Form State ---
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("GHS");
  const [stockQuantity, setStockQuantity] = useState("1");
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState("");
  const [selectedSizes, setSelectedSizes] = useState<SizeOption[]>([]);
  const [denomination, setDenomination] = useState<"US" | "EU" | "UK" | "General">("US");
  const [colors, setColors] = useState<string[]>([]);
  const [material, setMaterial] = useState("");
  const [careInstructions, setCareInstructions] = useState("");
  const [aiTags, setAiTags] = useState<string[]>([]);
  const [isCustomizable, setIsCustomizable] = useState(false);
  const [isUnisex, setIsUnisex] = useState(true);
  const [isOnSale, setIsOnSale] = useState(false);
  const [isPreorder, setIsPreorder] = useState(false);
  const [preorderLimit, setPreorderLimit] = useState("0");
  const [discountPercentage, setDiscountPercentage] = useState("");
  const [discountPrice, setDiscountPrice] = useState("");
  const [discountType, setDiscountType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [submittedForShowcase, setSubmittedForShowcase] = useState(false);
  const [estimatedDelivery, setEstimatedDelivery] = useState("0");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [detectedDna, setDetectedDna] = useState<{
    garmentType?: "dress" | "top" | "bottom" | "jumpsuit" | "two_piece_set" | "outerwear" | "footwear" | "accessory" | string;
    silhouette?: string;
    neckline?: string;
    sleeves?: string;
    fabricTexture?: string;
    keyAccents?: string[];
    topColor?: string;
    bottomColor?: string;
    isTwoTone?: boolean;
    hasSeparateTopAndBottom?: boolean;
    topShape?: string;
    bottomShape?: string;
    overallLook?: string;
  } | null>(null);

  // --- Data States ---
  const [parentCategories, setParentCategories] = useState<ParentCategory[]>([]);
  const [selectedCategoryCollections, setSelectedCategoryCollections] = useState<Collection[]>([]);

  // Pre-fill from AI Market Research suggestion links
  useEffect(() => {
    if (!searchParams) return;
    const nameParam = searchParams.get("name");
    const priceParam = searchParams.get("price");
    const descParam = searchParams.get("desc");
    const materialParam = searchParams.get("material");

    if (nameParam) setName(nameParam);
    if (priceParam) setPrice(priceParam);
    if (descParam) setDescription(descParam);
    if (materialParam) setMaterial(materialParam);

    if (nameParam) {
      toast.info(`Pre-filled "${nameParam}" from Market Research`);
    }
  }, [searchParams]);

  useEffect(() => {
    async function fetchFilters() {
      const mainCatId = selectedCategoryIds.length > 0 ? selectedCategoryIds[0] : "";
      const url = mainCatId ? `/api/product-selection-filters?categoryId=${mainCatId}` : "/api/product-selection-filters";
      try {
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setParentCategories(data.parentCategories || []);
          setSelectedCategoryCollections(data.selectedCategoryCollections || []);
        }
      } catch (err) {
        console.error("Failed to fetch selection filters:", err);
      }
    }
    fetchFilters();

    async function fetchVerification() {
      try {
        const res = await fetch('/api/professional-profiles');
        if (res.ok) {
          const data = await res.json();
          setIsVerified(Boolean(data.isVerified));
        }
      } catch { }
    }
    fetchVerification();
  }, [selectedCategoryIds]);

  // DeepSeek AI Vision & Text Generation Handler
  const handleDeepSeekGenerate = async (imageFileOverride?: File) => {
    const targetFile = imageFileOverride || selectedImages[0];
    const hasImage = Boolean(targetFile || uploadedImageUrls.length > 0);

    if (!name.trim() && !hasImage) {
      toast.error("Please enter a product title or upload a garment photo to analyze with AI.");
      return;
    }

    setAiGenerating(true);
    setAiEngineName(null);

    const activeCatName = parentCategories.find(c => selectedCategoryIds.includes(c.id))?.name || "";

    try {
      const imagePayload: string[] = [];
      if (targetFile) {
        try {
          const b64 = await fileToBase64(targetFile);
          imagePayload.push(b64);
        } catch (bErr) {
          console.warn("Failed to encode image to base64:", bErr);
        }
      } else if (uploadedImageUrls.length > 0 && uploadedImageUrls[0].startsWith("http")) {
        imagePayload.push(uploadedImageUrls[0]);
      }

      const res = await fetch("/api/ai/product-enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: name,
          description,
          categoryName: activeCatName,
          material,
          colors,
          images: imagePayload,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.productName && !name.trim()) {
          setName(data.productName);
        }
        if (data.enhancedDescription) {
          setDescription(data.enhancedDescription);
        }
        if (Array.isArray(data.suggestedTags) && data.suggestedTags.length > 0) {
          setAiTags(data.suggestedTags);
        }
        if (data.suggestedMaterial) {
          setMaterial(data.suggestedMaterial);
        }
        if (data.suggestedCare) {
          setCareInstructions(data.suggestedCare);
        }
        if (Array.isArray(data.suggestedColors) && data.suggestedColors.length > 0) {
          const mapped = data.suggestedColors.map((c: string) => {
            const clean = c.toLowerCase().trim();
            return COLOR_MAP[clean] || c;
          });
          setColors(prev => Array.from(new Set([...prev, ...mapped])));
        }
        if (data.suggestedCategory && selectedCategoryIds.length === 0) {
          const found = parentCategories.find(cat =>
            cat.name.toLowerCase().includes(data.suggestedCategory.toLowerCase()) ||
            data.suggestedCategory.toLowerCase().includes(cat.name.toLowerCase())
          );
          if (found) {
            setSelectedCategoryIds([found.id]);
          }
        }
        if (data.silhouette || data.neckline || data.fabricTexture || data.topShape || data.bottomShape || data.overallLook || data.garmentType) {
          setDetectedDna({
            garmentType: data.garmentType,
            silhouette: data.silhouette,
            neckline: data.neckline,
            sleeves: data.sleeves,
            fabricTexture: data.fabricTexture,
            keyAccents: data.keyAccents,
            topColor: data.topColor,
            bottomColor: data.bottomColor,
            isTwoTone: data.isTwoTone,
            hasSeparateTopAndBottom: data.hasSeparateTopAndBottom,
            topShape: data.topShape,
            bottomShape: data.bottomShape,
            overallLook: data.overallLook,
          });
        }
        if (data.engineUsed) {
          setAiEngineName(data.engineUsed);
        }
        toast.success(`Enhanced with ${data.engineUsed || "DeepSeek Vision"}! Fields updated.`);
      } else {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.error || "Failed to generate AI enhancements.");
      }
    } catch (err) {
      console.error("DeepSeek enhancement error:", err);
      toast.error("Network error connecting to DeepSeek AI Engine.");
    } finally {
      setAiGenerating(false);
    }
  };

  const handleVisionQuickUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (selectedImages.length >= 4) {
      toast.error("Maximum 4 product photos allowed.");
      return;
    }
    setSelectedImages(prev => [file, ...prev]);
    const objUrl = URL.createObjectURL(file);
    setUploadedImageUrls(prev => [objUrl, ...prev]);
    toast.info("Analyzing garment photo with DeepSeek Vision...");
    await handleDeepSeekGenerate(file);
  };

  const sizeOptions = {
    US: ["US 2", "US 4", "US 6", "US 8", "US 10", "US 12", "US 14", "US 16"] as SizeOption[],
    EU: ["EU 34", "EU 36", "EU 38", "EU 40", "EU 42", "EU 44", "EU 46", "EU 48"] as SizeOption[],
    UK: ["UK 6", "UK 8", "UK 10", "UK 12", "UK 14", "UK 16", "UK 18", "UK 20"] as SizeOption[],
    General: ["XS", "S", "M", "L", "XL", "XXL"] as SizeOption[],
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    if (selectedImages.length + files.length > 4) {
      toast.error("Maximum 4 product photos allowed.");
      return;
    }
    setSelectedImages(prev => [...prev, ...files]);
    const urls = files.map(f => URL.createObjectURL(f));
    setUploadedImageUrls(prev => [...prev, ...urls]);
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setUploadedImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const setCoverImage = (index: number) => {
    if (index === 0) return;
    setSelectedImages(prev => {
      const copy = [...prev];
      const item = copy.splice(index, 1)[0];
      return [item, ...copy];
    });
    setUploadedImageUrls(prev => {
      const copy = [...prev];
      const item = copy.splice(index, 1)[0];
      return [item, ...copy];
    });
    toast.success("Cover photo updated");
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      toast.error("File is too large. Max limit is 50MB");
      return;
    }
    setSelectedVideo(file);
    setUploadedVideoUrl(URL.createObjectURL(file));
  };

  const resetForm = () => {
    setName(""); setDescription(""); setSelectedCategoryIds([]); setSelectedCollections([]);
    setPrice(""); setStockQuantity("1"); setPreorderLimit("0"); setDiscountPercentage("");
    setDiscountPrice(""); setDiscountType("PERCENTAGE"); setSelectedImages([]); setUploadedImageUrls([]);
    setSelectedVideo(null); setUploadedVideoUrl(""); setSelectedSizes([]); setColors([]);
    setMaterial(""); setCareInstructions(""); setIsCustomizable(false); setIsUnisex(true);
    setIsPreorder(false); setEstimatedDelivery("0"); setSubmittedForShowcase(false);
    setAiTags([]); setAiEngineName(null); setDetectedDna(null);
    setActiveTab('basics'); setShowSuccessModal(false); setIsOnSale(false);
  };

  // Section completion checks for visual feedback on tabs
  const tabStatus = useMemo(() => ({
    basics: Boolean(name.trim().length > 0 && selectedCategoryIds.length > 0),
    media: Boolean(uploadedImageUrls.length > 0),
    pricing: Boolean(price && parseFloat(price) > 0),
    details: Boolean(selectedSizes.length > 0 || colors.length > 0 || material.trim().length > 0),
  }), [name, selectedCategoryIds, uploadedImageUrls, price, selectedSizes, colors, material]);

  const completedCount = useMemo(() => {
    return Object.values(tabStatus).filter(Boolean).length;
  }, [tabStatus]);

  // Comprehensive validation when user clicks Publish
  const validateBeforeSubmit = (): boolean => {
    if (!name.trim()) {
      toast.error("Please enter a product title.");
      setActiveTab('basics');
      return false;
    }
    if (selectedCategoryIds.length === 0) {
      toast.error("Please select at least one marketplace category.");
      setActiveTab('basics');
      return false;
    }
    if (uploadedImageUrls.length === 0) {
      toast.error("Please upload at least one product photo.");
      setActiveTab('media');
      return false;
    }
    if (!price || parseFloat(price) <= 0 || isNaN(parseFloat(price))) {
      toast.error("Please provide a valid retail base price.");
      setActiveTab('pricing');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateBeforeSubmit()) return;

    setLoading(true);
    try {
      const imgUrls = selectedImages.length > 0
        ? await Promise.all(selectedImages.map(async file => {
            const fd = new FormData();
            fd.append('file', file);
            const res = await fetch('/api/upload', { method: 'POST', body: fd });
            const data = await res.json();
            return data.url;
          }))
        : uploadedImageUrls;

      let finalVideoUrl = "";
      if (selectedVideo) {
        const fd = new FormData();
        fd.append('file', selectedVideo);
        fd.append('bucket', 'videos');
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const data = await res.json();
        finalVideoUrl = data.url;
      }

      const productData = {
        name,
        description: description || name,
        price: parseFloat(price),
        currency,
        stockQuantity: parseInt(stockQuantity || "1"),
        images: imgUrls,
        videoUrl: finalVideoUrl || undefined,
        categoryIds: selectedCategoryIds,
        collectionIds: selectedCollections,
        sizes: selectedSizes,
        colors,
        material: material || undefined,
        careInstructions: careInstructions || undefined,
        isCustomizable,
        isUnisex,
        isPreorder,
        preorderLimit: parseInt(preorderLimit || "0"),
        estimatedDelivery: parseInt(estimatedDelivery || "0"),
        submittedForShowcase,
        discountPercentage: discountType === 'PERCENTAGE' ? (parseFloat(discountPercentage) || undefined) : undefined,
        discountPrice: discountType === 'FIXED' ? (parseFloat(discountPrice) || undefined) : undefined,
        isOnSale,
        allowPickup: true,
        allowDelivery: true,
      };

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });

      if (res.ok) {
        setShowSuccessModal(true);
      } else {
        const errorData = await res.json();
        if (res.status === 403 && errorData.error?.includes('limit')) {
          toast.error("Monthly listing limit reached for your current subscription tier.");
          router.push('/dashboard/subscription');
        } else {
          toast.error(`Error: ${errorData.error || 'Failed to create product'}`);
        }
      }
    } catch (err) {
      console.error("Submission failed:", err);
      toast.error("Failed to publish product. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const activeIndex = TABS.findIndex(t => t.id === activeTab);
  const currencySymbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : "GH₵";

  // Calculated final customer price
  const finalPrice = useMemo(() => {
    const base = parseFloat(price || "0") || 0;
    if (!isOnSale) return base;
    if (discountType === "PERCENTAGE") {
      const pct = parseFloat(discountPercentage || "0") || 0;
      return base * (1 - pct / 100);
    }
    return Math.max(0, parseFloat(discountPrice || price || "0") || 0);
  }, [price, isOnSale, discountType, discountPercentage, discountPrice]);

  return (
    <div className="min-h-screen bg-[#FBFBFA] font-sans selection:bg-stone-900 selection:text-white pb-32">

      {/* TOP STICKY BAR */}
      <header className="sticky top-0 z-30 bg-[#FBFBFA]/95 backdrop-blur-xl border-b border-stone-200/80 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">

          {/* Left: Back & Title */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="w-9 h-9 rounded-full bg-white border border-stone-200/80 flex items-center justify-center text-stone-700 hover:bg-stone-100 hover:text-stone-900 transition-all shadow-2xs shrink-0"
              title="Return to Products"
            >
              <ChevronLeft size={17} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-1.5 w-1.5 rounded-full bg-amber-600 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-stone-500">Catalogue Studio</span>
              </div>
              <h1 className="text-base sm:text-lg font-serif font-bold text-stone-900 tracking-tight">Add New Product</h1>
            </div>
          </div>

          {/* Right: Quick Stats & Primary Publish Button */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-100/80 border border-stone-200/60 text-[11px] font-bold text-stone-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>{completedCount} of 4 Sections Complete</span>
            </div>

            <Button
              type="button"
              onClick={() => router.push('/dashboard/catalogue/products')}
              variant="outline"
              className="hidden md:inline-flex rounded-xl h-9 px-3.5 text-xs font-semibold text-stone-600 border-stone-200 hover:bg-stone-100"
            >
              Cancel
            </Button>

            <Button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="bg-stone-900 hover:bg-stone-800 text-white rounded-xl px-5 h-9 text-xs font-bold uppercase tracking-wider shadow-sm transition-all active:scale-95"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                  Publishing...
                </>
              ) : (
                'Publish Product'
              )}
            </Button>
          </div>

        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-5 space-y-5">

        {/* --- SMART AI ACTION BAR (COMPACT & POWERFUL) --- */}
        <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 rounded-2xl p-4 sm:p-5 text-white shadow-sm border border-stone-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-wide">DeepSeek AI Autofill</h3>
                {aiEngineName && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full text-[9px] font-bold border border-emerald-500/30">
                    <Check size={9} /> {aiEngineName}
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-300 font-normal leading-relaxed mt-0.5">
                Snap or drop a garment photo, or enter a title to automatically draft description, colors, tags & materials.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center">
            {/* Quick Photo Upload & Scan */}
            <label className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl border border-white/20 hover:border-amber-400/60 bg-white/10 hover:bg-white/15 text-white text-xs font-bold uppercase tracking-wider cursor-pointer transition-all active:scale-95">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleVisionQuickUpload}
                disabled={aiGenerating}
              />
              <Camera size={14} className="text-amber-400" />
              <span>{uploadedImageUrls.length > 0 ? "Scan New Photo" : "Scan Garment Photo"}</span>
            </label>

            {/* AI Auto-fill Button */}
            <Button
              type="button"
              onClick={() => handleDeepSeekGenerate()}
              disabled={aiGenerating || (!name.trim() && uploadedImageUrls.length === 0)}
              className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs uppercase tracking-wider rounded-xl px-4 py-2 h-9 shadow-sm transition-all active:scale-95 border-0"
            >
              {aiGenerating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Wand2 className="w-3.5 h-3.5 mr-1.5" />
                  Autofill Details
                </>
              )}
            </Button>
          </div>
        </div>

        {/* EXPANDABLE AI GARMENT DNA INSIGHTS (CLEAN & COMPACT) */}
        {detectedDna && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5 text-xs text-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-amber-900 inline-flex items-center gap-1 uppercase tracking-wider text-[10px]">
                <Sparkles size={11} className="text-amber-600" /> AI Insights:
              </span>
              {detectedDna.garmentType && (
                <span className="px-2 py-0.5 rounded-md bg-white border border-amber-200 text-stone-800 font-semibold text-[11px]">
                  Type: {detectedDna.garmentType.replace('_', ' ')}
                </span>
              )}
              {detectedDna.silhouette && (
                <span className="px-2 py-0.5 rounded-md bg-white border border-amber-200 text-stone-800 font-semibold text-[11px]">
                  Silhouette: {detectedDna.silhouette}
                </span>
              )}
              {detectedDna.fabricTexture && (
                <span className="px-2 py-0.5 rounded-md bg-white border border-amber-200 text-stone-800 font-semibold text-[11px]">
                  Fabric: {detectedDna.fabricTexture}
                </span>
              )}
              {(detectedDna.topColor || colors[0]) && (
                <span className="px-2 py-0.5 rounded-md bg-white border border-amber-200 text-stone-800 font-semibold text-[11px]">
                  Tone: {detectedDna.topColor || colors[0]}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowDnaDetails(!showDnaDetails)}
              className="text-amber-900 font-bold hover:underline text-[11px] self-start sm:self-auto shrink-0 flex items-center gap-1"
            >
              {showDnaDetails ? "Hide full insights" : "View garment DNA details"}
              <ChevronRight size={12} className={cn("transition-transform", showDnaDetails && "rotate-90")} />
            </button>
          </div>
        )}

        {/* EXPANDED DNA DETAILS PANEL */}
        <AnimatePresence>
          {showDnaDetails && detectedDna && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden bg-white border border-amber-200/80 rounded-xl p-4 space-y-3 text-xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {detectedDna.overallLook && (
                  <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 sm:col-span-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">Overall Style & Aesthetic</span>
                    <p className="text-stone-800 font-medium mt-0.5">{detectedDna.overallLook}</p>
                  </div>
                )}
                {detectedDna.neckline && (
                  <div className="p-2.5 bg-stone-50 rounded-lg border border-stone-200">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-stone-500 block">Neckline</span>
                    <p className="text-stone-800 font-semibold mt-0.5">{detectedDna.neckline}</p>
                  </div>
                )}
                {detectedDna.sleeves && (
                  <div className="p-2.5 bg-stone-50 rounded-lg border border-stone-200">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-stone-500 block">Sleeves</span>
                    <p className="text-stone-800 font-semibold mt-0.5">{detectedDna.sleeves}</p>
                  </div>
                )}
                {detectedDna.isTwoTone && (
                  <div className="p-2.5 bg-purple-50 rounded-lg border border-purple-200">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-purple-700 block">Contrast / Two-Tone</span>
                    <p className="text-purple-900 font-semibold mt-0.5">Top: {detectedDna.topColor} | Bottom: {detectedDna.bottomColor}</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- MAIN TAB NAVIGATION (FREE CLICKING, NO BLOCKING GATES) --- */}
        <div className="bg-white rounded-2xl p-1.5 border border-stone-200/80 shadow-2xs">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const isFilled = tabStatus[tab.id];

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2.5 p-3 rounded-xl transition-all text-left relative",
                    isActive
                      ? "bg-stone-900 text-white shadow-xs"
                      : "hover:bg-stone-100/70 text-stone-700"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                    isActive
                      ? "bg-white/15 text-white"
                      : isFilled
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-stone-100 text-stone-500"
                  )}>
                    {isFilled && !isActive ? (
                      <Check size={16} className="text-emerald-600 stroke-[3]" />
                    ) : (
                      <Icon size={16} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider truncate">
                        {tab.label}
                      </span>
                      {isFilled && isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                      )}
                    </div>
                    <span className={cn(
                      "text-[10px] truncate block",
                      isActive ? "text-stone-300" : "text-stone-400"
                    )}>
                      {tab.subtitle}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* --- TWO COLUMN CONTENT AREA --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* LEFT COLUMN: ACTIVE TAB CONTENT (8 COLS) */}
          <div className="lg:col-span-8 space-y-6">

            <AnimatePresence mode="wait">

              {/* === TAB 0: BASICS === */}
              {activeTab === 'basics' && (
                <motion.div
                  key="basics"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-xs space-y-6"
                >
                  <div>
                    <h2 className="text-lg font-serif font-bold text-stone-900">Product Identity</h2>
                    <p className="text-xs text-stone-500 font-medium">Enter product title, marketplace category, and descriptions.</p>
                  </div>

                  {/* PRODUCT NAME */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                        Product Title <span className="text-rose-500">*</span>
                      </Label>
                      {name.trim() && (
                        <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                          <Check size={11} /> Entered
                        </span>
                      )}
                    </div>
                    <Input
                      placeholder="e.g. Classic Heavyweight Linen Shirt"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-11 rounded-xl border-stone-200 focus:border-stone-900 text-sm font-semibold px-4 bg-stone-50/50 focus:bg-white transition-colors"
                    />
                  </div>

                  {/* CATEGORIES PICKER */}
                  <div className="space-y-3 pt-4 border-t border-stone-100">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-stone-500">
                        Marketplace Category <span className="text-rose-500">*</span>
                      </Label>
                      <span className="text-[10px] text-stone-400 font-semibold">
                        {selectedCategoryIds.length} Selected (Max 3)
                      </span>
                    </div>
                    <MultiCategoryPicker
                      parentCategories={parentCategories}
                      selectedCategoryIds={selectedCategoryIds}
                      onChange={setSelectedCategoryIds}
                    />
                  </div>

                  {/* BRAND COLLECTIONS */}
                  {selectedCategoryCollections.length > 0 && (
                    <div className="space-y-3 pt-4 border-t border-stone-100">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-stone-500">
                        Brand Collections (Optional)
                      </Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {selectedCategoryCollections.map(col => {
                          const isSel = selectedCollections.includes(col.id);
                          return (
                            <button
                              key={col.id}
                              type="button"
                              onClick={() => setSelectedCollections(prev => isSel ? prev.filter(id => id !== col.id) : [...prev, col.id])}
                              className={cn(
                                "px-4 py-3 rounded-xl border text-left flex items-center justify-between transition-all font-bold text-xs uppercase tracking-wider",
                                isSel ? "bg-stone-900 border-stone-900 text-white shadow-xs" : "bg-stone-50/70 border-stone-200 text-stone-700 hover:border-stone-300"
                              )}
                            >
                              <span>{col.name}</span>
                              {isSel && <Check size={14} className="text-amber-400" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* DESCRIPTION */}
                  <div className="space-y-2 pt-4 border-t border-stone-100">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                        Product Description
                      </Label>
                      <span className="text-[10px] font-bold text-stone-400">{description.length}/1000</span>
                    </div>
                    <textarea
                      rows={4}
                      placeholder="Describe the fabric weave, fit, styling suggestions, and silhouette..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full rounded-xl border border-stone-200 focus:border-stone-900 p-3.5 text-xs font-medium leading-relaxed bg-stone-50/50 focus:bg-white resize-none transition-all outline-none"
                    />
                  </div>

                  {/* AI RECOMMENDED TAGS */}
                  {aiTags.length > 0 && (
                    <div className="p-3.5 bg-amber-50/70 rounded-xl border border-amber-200/60 space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                        <Sparkles size={12} className="text-amber-600" /> AI Suggested Tags
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {aiTags.map((tag) => (
                          <span key={tag} className="px-2.5 py-0.5 bg-white border border-amber-200 rounded-full text-[11px] font-bold text-amber-900 shadow-2xs">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* === TAB 1: MEDIA === */}
              {activeTab === 'media' && (
                <motion.div
                  key="media"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-xs space-y-6"
                >
                  <div>
                    <h2 className="text-lg font-serif font-bold text-stone-900">Studio Photography & Video</h2>
                    <p className="text-xs text-stone-500 font-medium">Upload up to 4 high-definition photos. The first image is your catalogue cover.</p>
                  </div>

                  {/* PHOTO GRID */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <AnimatePresence>
                      {uploadedImageUrls.map((url, idx) => (
                        <motion.div
                          key={url}
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.8, opacity: 0 }}
                          className="aspect-[3/4] rounded-xl overflow-hidden relative group border border-stone-200 shadow-2xs bg-stone-100"
                        >
                          <Image src={url} alt={`product-${idx}`} fill className="object-cover" />

                          {/* Delete Action */}
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-stone-900 shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-50 hover:text-rose-600"
                            title="Remove Photo"
                          >
                            <X size={13} />
                          </button>

                          {/* Cover badge / Set as Cover */}
                          {idx === 0 ? (
                            <span className="absolute bottom-2 left-2 bg-stone-900/90 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md shadow-2xs">
                              Cover Photo
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setCoverImage(idx)}
                              className="absolute bottom-2 left-2 bg-white/90 text-stone-900 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md shadow-2xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-amber-400 hover:text-stone-900"
                            >
                              Make Cover
                            </button>
                          )}
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {uploadedImageUrls.length < 4 && (
                      <label className="aspect-[3/4] rounded-xl border-2 border-dashed border-stone-300 hover:border-stone-900 bg-stone-50/50 hover:bg-stone-100/50 transition-all flex flex-col items-center justify-center cursor-pointer p-3 group text-center">
                        <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
                        <div className="w-10 h-10 rounded-full bg-white shadow-2xs border border-stone-200 flex items-center justify-center text-stone-600 mb-2 group-hover:scale-105 transition-transform">
                          <Upload size={16} />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-700">Add Photo</span>
                        <span className="text-[9px] text-stone-400 font-bold mt-0.5">({uploadedImageUrls.length}/4 Uploaded)</span>
                      </label>
                    )}
                  </div>

                  {/* LOOKBOOK VIDEO */}
                  <div className="pt-4 border-t border-stone-100 space-y-3">
                    <div>
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Lookbook Video Clip (Optional)</Label>
                      <p className="text-[11px] text-stone-500 font-medium mt-0.5">Vertical 9:16 video recommended for mobile feed (Max 50MB).</p>
                    </div>

                    {uploadedVideoUrl ? (
                      <div className="relative aspect-video max-w-sm rounded-xl bg-stone-900 overflow-hidden shadow-md">
                        <video src={uploadedVideoUrl} className="w-full h-full object-cover" autoPlay loop muted playsInline />
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedVideo(null);
                            setUploadedVideoUrl("");
                          }}
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 text-stone-900 flex items-center justify-center shadow-md hover:bg-rose-50 hover:text-rose-600"
                          title="Remove Video"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ) : (
                      <label className="flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-stone-300 hover:border-stone-900 bg-stone-50/50 cursor-pointer transition-all max-w-sm">
                        <input type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} />
                        <div className="w-10 h-10 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-stone-700 shrink-0">
                          <Video size={18} />
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-stone-900">Upload Video Clip</p>
                          <p className="text-[10px] text-stone-400 font-bold mt-0.5">MP4, MOV (Max 50MB)</p>
                        </div>
                      </label>
                    )}
                  </div>
                </motion.div>
              )}

              {/* === TAB 2: PRICING & STOCK === */}
              {activeTab === 'pricing' && (
                <motion.div
                  key="pricing"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-xs space-y-6"
                >
                  <div>
                    <h2 className="text-lg font-serif font-bold text-stone-900">Pricing & Inventory</h2>
                    <p className="text-xs text-stone-500 font-medium">Set retail price, stock numbers, promotional sale discounts, and pre-orders.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Currency</Label>
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="w-full h-11 bg-stone-50/50 border border-stone-200 rounded-xl px-4 text-xs font-bold uppercase tracking-wider outline-none focus:border-stone-900 focus:bg-white"
                      >
                        <option value="GHS">GH₵ (Ghanaian Cedi)</option>
                        <option value="USD">$ (US Dollar)</option>
                        <option value="EUR">€ (Euro)</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                        Retail Base Price <span className="text-rose-500">*</span>
                      </Label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">
                          {currencySymbol}
                        </span>
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          className="h-11 rounded-xl border-stone-200 focus:border-stone-900 text-sm font-semibold pl-12 pr-4 bg-stone-50/50 focus:bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-4 border-t border-stone-100">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                      Stock Inventory Quantity <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      type="number"
                      placeholder="1"
                      value={stockQuantity}
                      onChange={(e) => setStockQuantity(e.target.value)}
                      className="h-11 rounded-xl border-stone-200 focus:border-stone-900 text-sm font-semibold px-4 bg-stone-50/50 focus:bg-white max-w-xs"
                    />
                  </div>

                  {/* PROMOTIONAL SALE TOGGLE */}
                  <div className="pt-4 border-t border-stone-100 space-y-3">
                    <div className="flex items-center justify-between p-4 bg-stone-50/60 rounded-xl border border-stone-200">
                      <div>
                        <h4 className="text-xs font-bold text-stone-900">Promotional Sale / Discount</h4>
                        <p className="text-[11px] text-stone-500 font-medium">Offer a limited-time percentage or fixed discount price.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsOnSale(!isOnSale)}
                        className={cn(
                          "w-10 h-5 rounded-full p-0.5 transition-colors",
                          isOnSale ? 'bg-stone-900' : 'bg-stone-300'
                        )}
                      >
                        <div className={cn(
                          "w-4 h-4 rounded-full bg-white shadow-2xs transition-transform",
                          isOnSale ? 'translate-x-5' : 'translate-x-0'
                        )} />
                      </button>
                    </div>

                    {isOnSale && (
                      <div className="p-4 bg-stone-900 text-white rounded-xl space-y-4">
                        <div className="flex gap-1.5 bg-stone-800 p-1 rounded-lg w-fit">
                          <button
                            type="button"
                            onClick={() => setDiscountType("PERCENTAGE")}
                            className={cn(
                              "px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all",
                              discountType === "PERCENTAGE" ? "bg-white text-stone-900" : "text-stone-400"
                            )}
                          >
                            Percentage %
                          </button>
                          <button
                            type="button"
                            onClick={() => setDiscountType("FIXED")}
                            className={cn(
                              "px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all",
                              discountType === "FIXED" ? "bg-white text-stone-900" : "text-stone-400"
                            )}
                          >
                            Fixed Price
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                          {discountType === 'PERCENTAGE' ? (
                            <div className="space-y-1.5">
                              <Label className="text-[10px] font-bold uppercase tracking-wider text-stone-300">Discount %</Label>
                              <Input
                                type="number"
                                placeholder="20"
                                value={discountPercentage}
                                onChange={e => setDiscountPercentage(e.target.value)}
                                className="h-10 bg-stone-800 border-stone-700 text-white text-xs rounded-lg"
                              />
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              <Label className="text-[10px] font-bold uppercase tracking-wider text-stone-300">Sale Price ({currencySymbol})</Label>
                              <Input
                                type="number"
                                placeholder="150.00"
                                value={discountPrice}
                                onChange={e => setDiscountPrice(e.target.value)}
                                className="h-10 bg-stone-800 border-stone-700 text-white text-xs rounded-lg"
                              />
                            </div>
                          )}

                          <div className="p-3 bg-stone-800 rounded-lg border border-stone-700">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-stone-400 block mb-0.5">Effective Buyer Price</span>
                            <span className="font-serif font-bold text-xl text-amber-400">
                              {currencySymbol} {finalPrice.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* PRE-ORDERS TOGGLE */}
                  <div className="pt-4 border-t border-stone-100 space-y-3">
                    <div className="flex items-center justify-between p-4 bg-stone-50/60 rounded-xl border border-stone-200">
                      <div>
                        <h4 className="text-xs font-bold text-stone-900">Pre-order / Backorder Mode</h4>
                        <p className="text-[11px] text-stone-500 font-medium">Allow orders even when inventory reaches 0 (Verified Sellers only).</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (!isVerified) {
                            toast.error("You must be a Verified Seller to enable Pre-orders.");
                            return;
                          }
                          setIsPreorder(!isPreorder);
                        }}
                        className={cn(
                          "w-10 h-5 rounded-full p-0.5 transition-colors",
                          isPreorder ? 'bg-stone-900' : 'bg-stone-300'
                        )}
                      >
                        <div className={cn(
                          "w-4 h-4 rounded-full bg-white shadow-2xs transition-transform",
                          isPreorder ? 'translate-x-5' : 'translate-x-0'
                        )} />
                      </button>
                    </div>

                    {isPreorder && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-amber-50/50 rounded-xl border border-amber-200/60">
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-amber-900">Waitlist Cap</Label>
                          <Input
                            type="number"
                            placeholder="50"
                            value={preorderLimit}
                            onChange={e => setPreorderLimit(e.target.value)}
                            className="h-10 bg-white border-amber-200 rounded-lg text-xs"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-amber-900">Delivery Lead Time (Days)</Label>
                          <Input
                            type="number"
                            placeholder="14"
                            value={estimatedDelivery}
                            onChange={e => setEstimatedDelivery(e.target.value)}
                            className="h-10 bg-white border-amber-200 rounded-lg text-xs"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* === TAB 3: DETAILS & SIZING === */}
              {activeTab === 'details' && (
                <motion.div
                  key="details"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-xs space-y-6"
                >
                  <div>
                    <h2 className="text-lg font-serif font-bold text-stone-900">Craftsmanship & Sizing</h2>
                    <p className="text-xs text-stone-500 font-medium">Configure size specifications, color swatches, fabrics, and custom tailoring.</p>
                  </div>

                  {/* SIZES MATRIX */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Available Sizes</Label>
                      <div className="flex bg-stone-100 p-0.5 rounded-full border border-stone-200">
                        {["US", "EU", "UK", "General"].map(t => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setDenomination(t as "US" | "EU" | "UK" | "General")}
                            className={cn(
                              "px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full transition-all",
                              denomination === t ? "bg-stone-900 text-white shadow-2xs" : "text-stone-600 hover:text-stone-900"
                            )}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                      {sizeOptions[denomination].map(size => {
                        const isSel = selectedSizes.includes(size);
                        return (
                          <button
                            key={size}
                            type="button"
                            onClick={() => setSelectedSizes(prev => isSel ? prev.filter(s => s !== size) : [...prev, size])}
                            className={cn(
                              "h-9 rounded-lg border text-[11px] font-bold uppercase tracking-wider transition-all",
                              isSel ? "bg-stone-900 border-stone-900 text-white shadow-2xs" : "bg-stone-50/70 border-stone-200 text-stone-700 hover:border-stone-300"
                            )}
                          >
                            {size}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* COLOR VARIANTS */}
                  <div className="space-y-3 pt-4 border-t border-stone-100">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Color Palette</Label>
                    <ColorPicker value={colors} onChange={setColors} />
                  </div>

                  {/* PRIMARY MATERIAL CHIPS */}
                  <div className="space-y-3 pt-4 border-t border-stone-100">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Primary Material / Fabric</Label>
                      {material && (
                        <button
                          type="button"
                          onClick={() => setMaterial("")}
                          className="text-[10px] text-stone-400 hover:text-stone-700"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {["Cotton", "Linen", "Silk", "Kente", "Ankara", "Wool", "Leather", "Organza", "Lace", "Denim", "Satin", "Viscose"].map(m => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setMaterial(m)}
                          className={cn(
                            "px-3 py-1.5 rounded-full border text-[11px] font-bold uppercase tracking-wider transition-all",
                            material === m ? "bg-stone-900 border-stone-900 text-white shadow-2xs" : "bg-stone-50/70 border-stone-200 text-stone-700 hover:border-stone-300"
                          )}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* CARE ADVICE */}
                  <div className="space-y-2 pt-4 border-t border-stone-100">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Garment Care Advice</Label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Dry clean only. Iron inside out on low temperature."
                      value={careInstructions}
                      onChange={e => setCareInstructions(e.target.value)}
                      className="w-full rounded-xl border border-stone-200 focus:border-stone-900 p-3 text-xs font-medium bg-stone-50/50 resize-none outline-none focus:bg-white"
                    />
                  </div>

                  {/* TOGGLES: CUSTOM MEASUREMENTS & SHOWCASE */}
                  <div className="pt-4 border-t border-stone-100 space-y-2.5">
                    <div className="flex items-center justify-between p-3.5 bg-stone-50/60 rounded-xl border border-stone-200">
                      <div>
                        <span className="text-xs font-bold text-stone-900 block">Made-to-Measure Tailoring Requestable</span>
                        <span className="text-[10px] text-stone-500 font-medium">Buyers can submit bespoke tailoring measurements with their order.</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsCustomizable(!isCustomizable)}
                        className={cn(
                          "w-9 h-5 rounded-full p-0.5 transition-colors",
                          isCustomizable ? 'bg-stone-900' : 'bg-stone-300'
                        )}
                      >
                        <div className={cn(
                          "w-4 h-4 rounded-full bg-white shadow-2xs transition-transform",
                          isCustomizable ? 'translate-x-4' : 'translate-x-0'
                        )} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-3.5 bg-stone-50/60 rounded-xl border border-stone-200">
                      <div>
                        <span className="text-xs font-bold text-stone-900 block">Feature in Community Showcase</span>
                        <span className="text-[10px] text-stone-500 font-medium">Submit piece to public editorial feed for wider marketplace discovery.</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSubmittedForShowcase(!submittedForShowcase)}
                        className={cn(
                          "w-9 h-5 rounded-full p-0.5 transition-colors",
                          submittedForShowcase ? 'bg-stone-900' : 'bg-stone-300'
                        )}
                      >
                        <div className={cn(
                          "w-4 h-4 rounded-full bg-white shadow-2xs transition-transform",
                          submittedForShowcase ? 'translate-x-4' : 'translate-x-0'
                        )} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>

            {/* PREV / NEXT TAB SHORTCUT FOOTER */}
            <div className="flex items-center justify-between pt-2">
              {activeIndex > 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTab(TABS[activeIndex - 1].id)}
                  className="rounded-xl px-4 h-10 text-xs font-bold uppercase tracking-wider border-stone-200 hover:bg-stone-100"
                >
                  <ChevronLeft size={15} className="mr-1" />
                  {TABS[activeIndex - 1].label}
                </Button>
              ) : <div />}

              {activeIndex < TABS.length - 1 && (
                <Button
                  type="button"
                  onClick={() => setActiveTab(TABS[activeIndex + 1].id)}
                  className="bg-stone-900 hover:bg-stone-800 text-white rounded-xl px-5 h-10 text-xs font-bold uppercase tracking-wider"
                >
                  Continue to {TABS[activeIndex + 1].label}
                  <ChevronRight size={15} className="ml-1" />
                </Button>
              )}
            </div>

          </div>

          {/* RIGHT COLUMN: STICKY LIVE PREVIEW CARD & PUBLISH CHECKLIST (4 COLS) */}
          <div className="lg:col-span-4 space-y-5 lg:sticky lg:top-20">

            {/* LIVE MARKETPLACE CARD PREVIEW */}
            <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div className="flex items-center gap-1.5 text-stone-500 text-xs font-bold uppercase tracking-wider">
                  <Eye size={14} className="text-amber-600" /> Live Preview
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">
                  Customer View
                </span>
              </div>

              {/* PRODUCT MOCKUP CARD */}
              <div className="rounded-xl overflow-hidden border border-stone-200/80 shadow-sm bg-stone-50 group">
                <div className="aspect-[3/4] relative bg-stone-200/70 overflow-hidden">
                  {uploadedImageUrls.length > 0 ? (
                    <Image
                      src={uploadedImageUrls[0]}
                      alt="Product preview"
                      fill
                      className="object-cover group-hover:scale-102 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 p-4 text-center">
                      <ImageIcon size={32} className="stroke-[1.5] mb-2 text-stone-300" />
                      <span className="text-[11px] font-semibold">No Photo Uploaded Yet</span>
                      <span className="text-[9px] text-stone-400">Add an image in Media tab</span>
                    </div>
                  )}

                  {isOnSale && (
                    <span className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-rose-600 text-white text-[9px] font-black uppercase tracking-wider rounded-md shadow-sm">
                      Sale
                    </span>
                  )}
                  {isPreorder && (
                    <span className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-amber-500 text-stone-950 text-[9px] font-black uppercase tracking-wider rounded-md shadow-sm">
                      Pre-order
                    </span>
                  )}
                </div>

                <div className="p-3.5 space-y-2 bg-white">
                  <div>
                    <h4 className="font-serif font-bold text-sm text-stone-900 truncate">
                      {name.trim() || "Untitled Product"}
                    </h4>
                    <p className="text-[10px] text-stone-500 font-semibold truncate">
                      {parentCategories.find(c => selectedCategoryIds.includes(c.id))?.name || "Uncategorized"}
                    </p>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="font-serif font-bold text-base text-stone-900">
                      {currencySymbol} {finalPrice > 0 ? finalPrice.toFixed(2) : "0.00"}
                    </span>
                    {isOnSale && parseFloat(price || "0") > finalPrice && (
                      <span className="text-xs text-stone-400 line-through">
                        {currencySymbol} {parseFloat(price || "0").toFixed(2)}
                      </span>
                    )}
                  </div>

                  {/* Colors & Sizes Preview */}
                  {(colors.length > 0 || selectedSizes.length > 0) && (
                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[10px]">
                      {colors.length > 0 && (
                        <div className="flex items-center gap-1">
                          {colors.slice(0, 4).map((c, i) => (
                            <span
                              key={i}
                              className="w-3.5 h-3.5 rounded-full border border-stone-300"
                              style={{ backgroundColor: c }}
                            />
                          ))}
                          {colors.length > 4 && (
                            <span className="text-[9px] text-stone-400 font-bold">+{colors.length - 4}</span>
                          )}
                        </div>
                      )}
                      {selectedSizes.length > 0 && (
                        <span className="text-stone-500 font-bold truncate">
                          {selectedSizes.slice(0, 3).join(", ")}
                          {selectedSizes.length > 3 ? "..." : ""}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* READINESS CHECKLIST */}
            <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-xs space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                Publishing Checklist
              </h4>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('basics')}
                  className="w-full flex items-center justify-between text-left p-2 rounded-lg hover:bg-stone-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {name.trim() ? (
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    ) : (
                      <CircleDashed size={16} className="text-stone-300 shrink-0" />
                    )}
                    <span className={cn("text-xs font-semibold", name.trim() ? "text-stone-800" : "text-stone-400")}>
                      Product Title
                    </span>
                  </div>
                  <span className="text-[10px] text-stone-400 font-bold">Required</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('basics')}
                  className="w-full flex items-center justify-between text-left p-2 rounded-lg hover:bg-stone-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {selectedCategoryIds.length > 0 ? (
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    ) : (
                      <CircleDashed size={16} className="text-stone-300 shrink-0" />
                    )}
                    <span className={cn("text-xs font-semibold", selectedCategoryIds.length > 0 ? "text-stone-800" : "text-stone-400")}>
                      Marketplace Category
                    </span>
                  </div>
                  <span className="text-[10px] text-stone-400 font-bold">Required</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('media')}
                  className="w-full flex items-center justify-between text-left p-2 rounded-lg hover:bg-stone-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {uploadedImageUrls.length > 0 ? (
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    ) : (
                      <CircleDashed size={16} className="text-stone-300 shrink-0" />
                    )}
                    <span className={cn("text-xs font-semibold", uploadedImageUrls.length > 0 ? "text-stone-800" : "text-stone-400")}>
                      Product Photos ({uploadedImageUrls.length}/4)
                    </span>
                  </div>
                  <span className="text-[10px] text-stone-400 font-bold">Required</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('pricing')}
                  className="w-full flex items-center justify-between text-left p-2 rounded-lg hover:bg-stone-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {price && parseFloat(price) > 0 ? (
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    ) : (
                      <CircleDashed size={16} className="text-stone-300 shrink-0" />
                    )}
                    <span className={cn("text-xs font-semibold", price && parseFloat(price) > 0 ? "text-stone-800" : "text-stone-400")}>
                      Retail Price
                    </span>
                  </div>
                  <span className="text-[10px] text-stone-400 font-bold">Required</span>
                </button>
              </div>

              <div className="pt-2">
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full bg-stone-900 hover:bg-stone-800 text-white rounded-xl h-11 text-xs font-bold uppercase tracking-wider shadow-sm transition-all"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                      Publishing Product...
                    </>
                  ) : (
                    'Publish Product'
                  )}
                </Button>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* SUCCESS OVERLAY MODAL */}
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl space-y-5 border border-stone-200"
            >
              <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-2xs border border-emerald-100">
                <Check size={28} />
              </div>

              <div>
                <h3 className="text-xl font-serif font-bold text-stone-900">Piece Created Successfully</h3>
                <p className="text-xs text-stone-500 font-medium mt-1">Your new item has been published and is now live in your catalogue.</p>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-left space-y-0.5">
                <span className="text-[9px] font-bold uppercase tracking-wider text-stone-400">Listing Summary</span>
                <p className="text-sm font-bold text-stone-900">{name}</p>
                <p className="text-xs font-bold text-amber-700">{currencySymbol} {finalPrice.toFixed(2)}</p>
              </div>

              <div className="flex flex-col gap-2 pt-1">
                <Button
                  onClick={resetForm}
                  className="bg-stone-900 hover:bg-stone-800 text-white rounded-xl h-11 text-xs font-bold uppercase tracking-wider shadow-sm"
                >
                  Create Another Piece
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push('/dashboard/catalogue/products')}
                  className="rounded-xl h-11 text-xs font-bold uppercase tracking-wider border-stone-300"
                >
                  Return to Catalogue
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

export default function AddProductPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-slate-500 text-sm">Loading product creator...</div>}>
      <AddProductForm />
    </React.Suspense>
  );
}