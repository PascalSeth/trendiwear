'use client';

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, X, Video, ChevronRight, ChevronLeft,
  Check, Tag, Palette, Image as ImageIcon,
  Loader2, DollarSign, Sparkles, Wand2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ColorPicker } from "@/components/ui/color-picker";
import { MultiCategoryPicker, type ParentCategory } from "@/app/components/MultiCategoryPicker";
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

const STEPS = [
  { id: 'basics', title: 'Product Identity', description: 'Name, categories & DeepSeek AI description', icon: Tag },
  { id: 'media', title: 'Studio Gallery', description: 'High-definition photography & lookbook video', icon: ImageIcon },
  { id: 'pricing', title: 'Pricing & Stock', description: 'Pricing in GH₵, pre-orders & promotional sales', icon: DollarSign },
  { id: 'details', title: 'Craftsmanship & Sizing', description: 'Materials, care advice & size specifications', icon: Palette },
];

export default function AddProductPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiEngineName, setAiEngineName] = useState<string | null>(null);

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

  // --- Data States ---
  const [parentCategories, setParentCategories] = useState<ParentCategory[]>([]);
  const [selectedCategoryCollections, setSelectedCategoryCollections] = useState<Collection[]>([]);

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

  // DeepSeek AI Magic Generation Handler
  const handleDeepSeekGenerate = async () => {
    if (!name.trim()) {
      alert("Please enter a product name first before generating AI enhancements.");
      return;
    }

    setAiGenerating(true);
    setAiEngineName(null);

    const activeCatName = parentCategories.find(c => selectedCategoryIds.includes(c.id))?.name || "";

    try {
      const res = await fetch("/api/ai/product-enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: name,
          description,
          categoryName: activeCatName,
          material,
          colors,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.enhancedDescription) {
          setDescription(data.enhancedDescription);
        }
        if (Array.isArray(data.suggestedTags)) {
          setAiTags(data.suggestedTags);
        }
        if (data.suggestedMaterial && !material) {
          setMaterial(data.suggestedMaterial);
        }
        if (data.suggestedCare && !careInstructions) {
          setCareInstructions(data.suggestedCare);
        }
        if (data.engineUsed) {
          setAiEngineName(data.engineUsed);
        }
      } else {
        alert("Failed to generate AI enhancements. Please try again.");
      }
    } catch (err) {
      console.error("DeepSeek enhancement error:", err);
      alert("Network error connecting to DeepSeek AI Engine.");
    } finally {
      setAiGenerating(false);
    }
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
      alert("Maximum 4 product photos allowed.");
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

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      alert("File is too large. Max limit is 50MB");
      return;
    }
    setSelectedVideo(file);
    setUploadedVideoUrl(URL.createObjectURL(file));
  };

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const resetForm = () => {
    setName(""); setDescription(""); setSelectedCategoryIds([]); setSelectedCollections([]);
    setPrice(""); setStockQuantity("1"); setPreorderLimit("0"); setDiscountPercentage("");
    setDiscountPrice(""); setDiscountType("PERCENTAGE"); setSelectedImages([]); setUploadedImageUrls([]);
    setSelectedVideo(null); setUploadedVideoUrl(""); setSelectedSizes([]); setColors([]);
    setMaterial(""); setCareInstructions(""); setIsCustomizable(false); setIsUnisex(true);
    setIsPreorder(false); setEstimatedDelivery("0"); setSubmittedForShowcase(false);
    setAiTags([]); setAiEngineName(null);
    setCurrentStep(0); setShowSuccessModal(false); setIsOnSale(false);
  };

  const handleSubmit = async () => {
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
        name, description, price: parseFloat(price), currency, stockQuantity: parseInt(stockQuantity),
        images: imgUrls, videoUrl: finalVideoUrl || undefined, categoryIds: selectedCategoryIds,
        collectionIds: selectedCollections, sizes: selectedSizes, colors, material: material || undefined,
        careInstructions: careInstructions || undefined, isCustomizable, isUnisex, isPreorder,
        preorderLimit: parseInt(preorderLimit), estimatedDelivery: parseInt(estimatedDelivery),
        submittedForShowcase, discountPercentage: discountType === 'PERCENTAGE' ? (parseFloat(discountPercentage) || undefined) : undefined,
        discountPrice: discountType === 'FIXED' ? (parseFloat(discountPrice) || undefined) : undefined,
        isOnSale, allowPickup: true, allowDelivery: true,
      };

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });

      if (res.ok) setShowSuccessModal(true);
      else {
        const errorData = await res.json();
        if (res.status === 403 && errorData.error?.includes('limit')) {
          alert("Monthly listing limit reached for your current subscription tier. Please upgrade to add more products.");
          router.push('/dashboard/subscription');
        } else alert(`Error: ${errorData.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error("Submission failed:", err);
      alert("Failed to publish product. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const canGoNext = useMemo(() => {
    if (currentStep === 0) return name.trim().length > 0 && description.trim().length > 0 && selectedCategoryIds.length > 0;
    if (currentStep === 1) return uploadedImageUrls.length > 0;
    if (currentStep === 2) return price && parseFloat(price) > 0;
    return true;
  }, [currentStep, name, description, selectedCategoryIds, uploadedImageUrls, price]);

  return (
    <div className="min-h-screen bg-[#FAFAF9] font-sans selection:bg-stone-900 selection:text-white pb-32">

      {/* STICKY TOP HEADER */}
      <div className="sticky top-0 z-30 bg-[#FAFAF9]/95 backdrop-blur-xl border-b border-stone-200/80">
        <div className="max-w-7xl mx-auto px-6 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Left Title & Back Navigation */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="w-8 h-8 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-700 hover:bg-stone-100 transition-colors shadow-xs shrink-0"
              title="Return to Products"
            >
              <ChevronLeft size={16} />
            </button>
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="flex h-1.5 w-1.5 rounded-full bg-amber-600 animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-widest text-stone-500">Creation Studio</span>
              </div>
              <h1 className="text-base sm:text-lg font-serif font-bold text-stone-900 tracking-tight">Add New Product</h1>
            </div>
          </div>

          {/* STEPPER PROGRESS PILLS */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
            {STEPS.map((step, i) => {
              const isCurrent = i === currentStep;
              const isPast = i < currentStep;

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => (isPast || isCurrent) && setCurrentStep(i)}
                  disabled={!isPast && !isCurrent}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all shrink-0 ${
                    isCurrent
                      ? 'bg-stone-900 text-white shadow-xs'
                      : isPast
                      ? 'bg-stone-200 text-stone-900 hover:bg-stone-300'
                      : 'bg-stone-100 text-stone-400 cursor-not-allowed'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black ${
                    isCurrent ? 'bg-white text-stone-900' : isPast ? 'bg-emerald-600 text-white' : 'bg-stone-200 text-stone-500'
                  }`}>
                    {isPast ? <Check size={10} /> : i + 1}
                  </span>
                  <span>{step.title}</span>
                </button>
              );
            })}
          </div>

          {/* Exit Button */}
          <div className="hidden lg:flex items-center">
            <button
              type="button"
              onClick={() => router.push('/dashboard/catalogue/products')}
              className="px-3 py-1.5 rounded-full text-xs font-semibold text-stone-500 hover:text-stone-900 hover:bg-stone-200/60 transition-colors"
            >
              Exit
            </button>
          </div>
        </div>

        {/* Progress Line Indicator */}
        <div className="w-full bg-stone-200/60 h-0.5 overflow-hidden">
          <div
            className="bg-stone-900 h-full transition-all duration-300 ease-out"
            style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <div className="max-w-4xl mx-auto px-6 mt-6">

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >

            {/* --- STEP 0: PRODUCT IDENTITY & TRENDI AI --- */}
            {currentStep === 0 && (
              <div className="space-y-6">
                {/* TRENDI AI MAGIC HERO BANNER */}
                <div className="relative bg-gradient-to-r from-stone-900 via-stone-800 to-amber-950 rounded-2xl p-5 md:p-6 text-white shadow-md overflow-hidden border border-stone-800">
                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5 max-w-lg">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-500/20 rounded-full border border-amber-500/30 text-amber-300 text-[9px] font-bold uppercase tracking-wider">
                        <Sparkles size={11} className="animate-spin" /> Trendi AI Copywriter
                      </div>
                      <h2 className="text-lg font-serif font-bold text-white tracking-tight">Auto-Enhance with Trendi AI</h2>
                      <p className="text-xs text-stone-300 font-normal leading-relaxed">
                        Enter your product name below. Trendi AI will generate natural clothing copy, SEO tags, and garment details.
                      </p>
                    </div>

                    <Button
                      onClick={handleDeepSeekGenerate}
                      disabled={aiGenerating || !name.trim()}
                      className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs uppercase tracking-wider rounded-xl px-4 py-2.5 shadow-md transition-all shrink-0 active:scale-95 border-0 h-10"
                    >
                      {aiGenerating ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                          Writing...
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-3.5 h-3.5 mr-2" />
                          Generate with AI
                        </>
                      )}
                    </Button>
                  </div>

                  {aiEngineName && (
                    <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-500/20 rounded-full text-emerald-300 text-[10px] font-bold">
                      <Check size={11} /> Powered by {aiEngineName}
                    </div>
                  )}
                </div>

                {/* FORM FIELDS */}
                <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-xs space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Product Name *</Label>
                    <Input
                      placeholder="e.g. Vintage Heavyweight Cotton T-Shirt"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-11 rounded-xl border-stone-200 focus:border-stone-900 text-sm font-semibold px-4 bg-stone-50/50 focus:bg-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Product Description *</Label>
                      <span className="text-[10px] font-bold text-stone-400">{description.length}/1000</span>
                    </div>
                    <textarea
                      rows={4}
                      placeholder="Describe the soft cotton feel, fit, everyday comfort, and styling tips..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full rounded-xl border border-stone-200 focus:border-stone-900 p-4 text-xs font-medium leading-relaxed bg-stone-50/50 focus:bg-white resize-none transition-all outline-none"
                    />
                  </div>

                  {/* AI GENERATED TAGS PREVIEW */}
                  {aiTags.length > 0 && (
                    <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200/60 space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Trendi AI Recommended Keywords</p>
                      <div className="flex flex-wrap gap-1.5">
                        {aiTags.map((tag) => (
                          <span key={tag} className="px-2.5 py-0.5 bg-white border border-amber-200 rounded-full text-[11px] font-bold text-amber-900 shadow-2xs">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* MULTI CATEGORY PICKER */}
                  <div className="space-y-4 pt-6 border-t border-stone-100">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Marketplace Category *</Label>
                    <MultiCategoryPicker
                      parentCategories={parentCategories}
                      selectedCategoryIds={selectedCategoryIds}
                      onChange={setSelectedCategoryIds}
                    />
                  </div>

                  {/* BRAND COLLECTIONS */}
                  {selectedCategoryCollections.length > 0 && (
                    <div className="space-y-4 pt-6 border-t border-stone-100">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Brand Collections (Optional)</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {selectedCategoryCollections.map(col => {
                          const isSel = selectedCollections.includes(col.id);
                          return (
                            <button
                              key={col.id}
                              type="button"
                              onClick={() => setSelectedCollections(prev => isSel ? prev.filter(id => id !== col.id) : [...prev, col.id])}
                              className={cn(
                                "px-5 py-4 rounded-2xl border text-left flex items-center justify-between transition-all font-bold text-xs uppercase tracking-wider",
                                isSel ? "bg-stone-900 border-stone-900 text-white shadow-md" : "bg-stone-50 border-stone-200 text-stone-700 hover:border-stone-400"
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
                </div>
              </div>
            )}

            {/* --- STEP 1: STUDIO GALLERY & MEDIA --- */}
            {currentStep === 1 && (
              <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-xs space-y-6">
                <div>
                  <h2 className="text-lg font-serif font-bold text-stone-900 mb-0.5">Studio Photography & Video</h2>
                  <p className="text-xs text-stone-500 font-medium">Upload up to 4 high-resolution photos and an optional lookbook video.</p>
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
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-stone-900 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={13} />
                        </button>
                        {idx === 0 && (
                          <span className="absolute bottom-2 left-2 bg-stone-900/90 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md shadow-2xs">
                            Cover
                          </span>
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
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Lookbook Video (Optional)</Label>
                    <p className="text-[11px] text-stone-500 font-medium mt-0.5">Max 50MB. Vertical 9:16 format recommended for mobile showcase.</p>
                  </div>

                  {uploadedVideoUrl ? (
                    <div className="relative aspect-video max-w-sm rounded-xl bg-stone-900 overflow-hidden shadow-md">
                      <video src={uploadedVideoUrl} className="w-full h-full object-cover" autoPlay loop muted playsInline />
                      <button
                        type="button"
                        onClick={() => setUploadedVideoUrl("")}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 text-stone-900 flex items-center justify-center shadow-md"
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
              </div>
            )}

            {/* --- STEP 2: PRICING & STOCK --- */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-xs space-y-6">
                  <h2 className="text-lg font-serif font-bold text-stone-900 mb-0.5">Pricing & Inventory</h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Currency</Label>
                        <span className="text-[10px] font-bold text-amber-700">Ghanaian Cedi (GH₵)</span>
                      </div>
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
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Retail Base Price *</Label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="h-11 rounded-xl border-stone-200 focus:border-stone-900 text-sm font-semibold px-4 bg-stone-50/50 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 pt-4 border-t border-stone-100">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Stock Inventory Quantity *</Label>
                    <Input
                      type="number"
                      placeholder="1"
                      value={stockQuantity}
                      onChange={(e) => setStockQuantity(e.target.value)}
                      className="h-11 rounded-xl border-stone-200 focus:border-stone-900 text-sm font-semibold px-4 bg-stone-50/50 focus:bg-white"
                    />
                  </div>

                  {/* PRE-ORDER MODULE */}
                  <div className="pt-4 border-t border-stone-100 space-y-3">
                    <div className="flex items-center justify-between p-4 bg-stone-50/60 rounded-xl border border-stone-200">
                      <div>
                        <h4 className="text-xs font-bold text-stone-900">Allow Pre-orders / Back-orders</h4>
                        <p className="text-[11px] text-stone-500 font-medium">Buyers can order even if inventory count is zero.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (!isVerified) {
                            alert("You must be a Verified Seller to enable Pre-orders.");
                            return;
                          }
                          setIsPreorder(!isPreorder);
                        }}
                        className={`w-10 h-5 rounded-full p-0.5 transition-colors ${isPreorder ? 'bg-stone-900' : 'bg-stone-300'}`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white shadow-2xs transition-transform ${isPreorder ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </div>

                    {isPreorder && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-amber-50/50 rounded-xl border border-amber-200/60">
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-amber-900">Waitlist Cap</Label>
                          <Input type="number" placeholder="50" value={preorderLimit} onChange={e => setPreorderLimit(e.target.value)} className="h-10 bg-white border-amber-200 rounded-lg text-xs" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-amber-900">Delivery Lead Time (Days)</Label>
                          <Input type="number" placeholder="14" value={estimatedDelivery} onChange={e => setEstimatedDelivery(e.target.value)} className="h-10 bg-white border-amber-200 rounded-lg text-xs" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* PROMOTIONAL SALE MODULE */}
                  <div className="pt-4 border-t border-stone-100 space-y-3">
                    <div className="flex items-center justify-between p-4 bg-stone-50/60 rounded-xl border border-stone-200">
                      <div>
                        <h4 className="text-xs font-bold text-stone-900">Put Product on Sale</h4>
                        <p className="text-[11px] text-stone-500 font-medium">Apply promotional percentage or fixed discount price.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsOnSale(!isOnSale)}
                        className={`w-10 h-5 rounded-full p-0.5 transition-colors ${isOnSale ? 'bg-stone-900' : 'bg-stone-300'}`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white shadow-2xs transition-transform ${isOnSale ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </div>

                    {isOnSale && (
                      <div className="p-4 bg-stone-900 text-white rounded-xl space-y-4">
                        <div className="flex gap-1.5 bg-stone-800 p-1 rounded-lg w-fit">
                          <button
                            type="button"
                            onClick={() => setDiscountType("PERCENTAGE")}
                            className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${discountType === "PERCENTAGE" ? "bg-white text-stone-900" : "text-stone-400"}`}
                          >
                            Percentage %
                          </button>
                          <button
                            type="button"
                            onClick={() => setDiscountType("FIXED")}
                            className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${discountType === "FIXED" ? "bg-white text-stone-900" : "text-stone-400"}`}
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
                              <Label className="text-[10px] font-bold uppercase tracking-wider text-stone-300">Sale Price (GH₵)</Label>
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
                            <span className="text-[9px] font-bold uppercase tracking-wider text-stone-400 block mb-0.5">Customer Price</span>
                            <span className="font-serif font-bold text-xl text-amber-400">
                              GH₵ {(discountType === 'PERCENTAGE'
                                ? (parseFloat(price || "0") * (1 - (parseFloat(discountPercentage || "0") || 0) / 100))
                                : Math.max(0, parseFloat(discountPrice || price || "0"))).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* --- STEP 3: CRAFTSMANSHIP & SIZING --- */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-xs space-y-6">
                  <h2 className="text-lg font-serif font-bold text-stone-900 mb-0.5">Craftsmanship & Specifications</h2>

                  {/* MATERIALS */}
                  <div className="space-y-3">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Primary Material</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {["Silk", "Cotton", "Linen", "Leather", "Lace", "Organza", "Wool", "Denim", "Satin", "Viscose", "Kente", "Ankara"].map(m => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setMaterial(m)}
                          className={cn(
                            "px-3 py-1.5 rounded-full border text-[11px] font-bold uppercase tracking-wider transition-all",
                            material === m ? "bg-stone-900 border-stone-900 text-white shadow-xs" : "bg-stone-50 border-stone-200 text-stone-700 hover:border-stone-400"
                          )}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* CARE INSTRUCTIONS */}
                  <div className="space-y-2 pt-4 border-t border-stone-100">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Garment Care Advice</Label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Dry clean only. Iron inside out on low heat."
                      value={careInstructions}
                      onChange={e => setCareInstructions(e.target.value)}
                      className="w-full rounded-xl border border-stone-200 focus:border-stone-900 p-3 text-xs font-medium bg-stone-50/50 resize-none outline-none focus:bg-white"
                    />
                  </div>

                  {/* COLOR VARIANTS */}
                  <div className="space-y-3 pt-4 border-t border-stone-100">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Color Palette</Label>
                    <ColorPicker value={colors} onChange={setColors} />
                  </div>

                  {/* SIZING MATRIX */}
                  <div className="space-y-3 pt-4 border-t border-stone-100">
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
                              denomination === t ? "bg-stone-900 text-white shadow-xs" : "text-stone-600 hover:text-stone-900"
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
                              isSel ? "bg-stone-900 border-stone-900 text-white shadow-xs" : "bg-stone-50 border-stone-200 text-stone-700 hover:border-stone-400"
                            )}
                          >
                            {size}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* OPTION TOGGLES */}
                  <div className="pt-4 border-t border-stone-100 space-y-2.5">
                    <div className="flex items-center justify-between p-3 bg-stone-50/60 rounded-xl border border-stone-200">
                      <div>
                        <span className="text-xs font-bold text-stone-900 block">Made-to-Measure Requestable</span>
                        <span className="text-[10px] text-stone-500 font-medium">Buyers can submit custom tailoring measurements.</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsCustomizable(!isCustomizable)}
                        className={`w-9 h-5 rounded-full p-0.5 transition-colors ${isCustomizable ? 'bg-stone-900' : 'bg-stone-300'}`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white shadow-2xs transition-transform ${isCustomizable ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-stone-50/60 rounded-xl border border-stone-200">
                      <div>
                        <span className="text-xs font-bold text-stone-900 block">Submit for Marketplace Showcase</span>
                        <span className="text-[10px] text-stone-500 font-medium">Feature on public community feed for increased exposure.</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSubmittedForShowcase(!submittedForShowcase)}
                        className={`w-9 h-5 rounded-full p-0.5 transition-colors ${submittedForShowcase ? 'bg-stone-900' : 'bg-stone-300'}`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white shadow-2xs transition-transform ${submittedForShowcase ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>

      </div>

      {/* STICKY FOOTER ACTIONS */}
      <div className="sticky bottom-0 z-30 bg-white/95 backdrop-blur-xl border-t border-stone-200/80 py-3 px-4 sm:px-6 shadow-xl mt-12 rounded-t-2xl sm:rounded-t-3xl">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          {currentStep > 0 ? (
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              className="rounded-xl px-4 h-10 text-xs font-bold uppercase tracking-wider border-stone-300 hover:bg-stone-100 transition-all shrink-0"
            >
              <ChevronLeft size={15} className="mr-1" /> Back
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-3">
            <span className="text-[11px] font-bold text-stone-400 hidden sm:inline-block">
              Step {currentStep + 1} of {STEPS.length}
            </span>

            {currentStep < STEPS.length - 1 ? (
              <Button
                type="button"
                disabled={!canGoNext}
                onClick={nextStep}
                className="bg-stone-900 hover:bg-stone-800 text-white rounded-xl px-5 sm:px-6 h-10 text-xs font-bold uppercase tracking-wider shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                Next Step <ChevronRight size={15} className="ml-1" />
              </Button>
            ) : (
              <Button
                type="button"
                disabled={!canGoNext || loading}
                onClick={handleSubmit}
                className="bg-stone-900 hover:bg-stone-800 text-white rounded-xl px-6 h-10 text-xs font-bold uppercase tracking-wider shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> Publishing...
                  </>
                ) : (
                  'Publish Product'
                )}
              </Button>
            )}
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
                <p className="text-xs text-stone-500 font-medium mt-1">Your new item has been processed and published to your catalogue.</p>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-left space-y-0.5">
                <span className="text-[9px] font-bold uppercase tracking-wider text-stone-400">Listing Summary</span>
                <p className="text-sm font-bold text-stone-900">{name}</p>
                <p className="text-xs font-bold text-amber-700">GH₵ {parseFloat(price || "0").toFixed(2)}</p>
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