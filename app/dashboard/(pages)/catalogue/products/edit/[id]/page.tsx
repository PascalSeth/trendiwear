'use client';
import React, { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { ColorPicker } from "@/components/ui/color-picker";
import { MultiCategoryPicker } from "@/app/components/MultiCategoryPicker";

import { 
  Upload, X, Video, ChevronRight, ChevronLeft, 
  Check, Tag, Package, Palette, Image as ImageIcon, 
  Loader2, DollarSign, Award,
  Save, Plus
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { suggestTags } from "@/lib/fashion-engine";
import { Sparkles } from "lucide-react";

type SizeOption =
  | "US 2" | "US 4" | "US 6" | "US 8" | "US 10" | "US 12" | "US 14" | "US 16"
  | "EU 34" | "EU 36" | "EU 38" | "EU 40" | "EU 42" | "EU 44" | "EU 46" | "EU 48"
  | "UK 6" | "UK 8" | "UK 10" | "UK 12" | "UK 14" | "UK 16" | "UK 18" | "UK 20"
  | "XS" | "S" | "M" | "L" | "XL" | "XXL";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface ParentCategory extends Category {
  children: Category[];
}

interface Collection {
  id: string;
  name: string;
  slug: string;
}

const STEPS = [
  { id: 'basics', title: 'Basics', icon: <Tag className="w-5 h-5" /> },
  { id: 'media', title: 'Media', icon: <ImageIcon className="w-5 h-5" /> },
  { id: 'pricing', title: 'Pricing', icon: <DollarSign className="w-5 h-5" /> },
  { id: 'details', title: 'Details', icon: <Palette className="w-5 h-5" /> },
];

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);

  // --- Form State ---
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("GHS");
  const [stockQuantity, setStockQuantity] = useState("0");
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState("");
  const [selectedSizes, setSelectedSizes] = useState<SizeOption[]>([]);
  const [denomination, setDenomination] = useState<"US" | "EU" | "UK" | "General">("US");
  const [colors, setColors] = useState<string[]>([]);
  const [material, setMaterial] = useState("");
  const [careInstructions, setCareInstructions] = useState("");
  const [isCustomizable, setIsCustomizable] = useState(false);
  const [isUnisex, setIsUnisex] = useState(true);
  const [isOnSale, setIsOnSale] = useState(false);
  const [isPreorder, setIsPreorder] = useState(false);
  const [discountPercentage, setDiscountPercentage] = useState("");
  // Removed unused discountStartDate/EndDate state
  const [submittedForShowcase, setSubmittedForShowcase] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // --- Discovery Preview ---
  const discoveryPreview = useMemo(() => {
    return suggestTags(name, description);
  }, [name, description]);

  // --- Data States ---
  const [parentCategories, setParentCategories] = useState<ParentCategory[]>([]);
  const [selectedCategoryCollections, setSelectedCategoryCollections] = useState<Collection[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      setFetchLoading(true);
      try {
        // 1. Fetch Product
        const pRes = await fetch(`/api/products/${productId}`);
        if (!pRes.ok) throw new Error("Failed to fetch product");
        const productData = await pRes.json();
        
        setName(productData.name || "");
        setDescription(productData.description || "");
        
        // Multi-category support: use 'categories' array if present, otherwise fallback to 'categoryId'
        const catIds = productData.categories?.map((c: Category) => c.id) || (productData.categoryId ? [productData.categoryId] : []);
        setSelectedCategoryIds(catIds);
        
        setSelectedCollections(productData.collections?.map((c: Collection) => c.id) || []);
        setSelectedSizes(productData.sizes || []);
        setColors(productData.colors || []);
        setMaterial(productData.material || "");
        setCareInstructions(productData.careInstructions || "");
        setIsCustomizable(productData.isCustomizable || false);
        setIsUnisex(productData.isUnisex || true);
        setSubmittedForShowcase(productData.submittedForShowcase || false);
        setIsOnSale(productData.isOnSale || false);
        setDiscountPercentage(productData.discountPercentage?.toString() || "");
        setIsPreorder(productData.isPreorder || false);
        setUploadedImageUrls(productData.images || []);
        setUploadedVideoUrl(productData.videoUrl || "");
        setPrice(productData.price?.toString() || "0");
        setCurrency(productData.currency || "GHS");
        setStockQuantity(productData.stockQuantity?.toString() || "0");

        // 2. Fetch Filters (Categories/Collections)
        const mainCatId = catIds[0] || "";
        const fUrl = mainCatId ? `/api/product-selection-filters?categoryId=${mainCatId}` : "/api/product-selection-filters";
        const fRes = await fetch(fUrl);
        const fData = await fRes.json();
        setParentCategories(fData.parentCategories);
        setSelectedCategoryCollections(fData.selectedCategoryCollections);
      } catch (err) {
        console.error(err);
        router.push('/dashboard/catalogue/products');
      } finally {
        setFetchLoading(false);
      }
    };
    fetchAll();
  }, [productId, router]);

  const sizeOptions = {
    US: ["US 2", "US 4", "US 6", "US 8", "US 10", "US 12", "US 14", "US 16"] as SizeOption[],
    EU: ["EU 34", "EU 36", "EU 38", "EU 40", "EU 42", "EU 44", "EU 46", "EU 48"] as SizeOption[],
    UK: ["UK 6", "UK 8", "UK 10", "UK 12", "UK 14", "UK 16", "UK 18", "UK 20"] as SizeOption[],
    General: ["XS", "S", "M", "L", "XL", "XXL"] as SizeOption[],
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    if (uploadedImageUrls.length + selectedImages.length + files.length > 4) return;
    setSelectedImages(prev => [...prev, ...files]);
    const urls = files.map(f => URL.createObjectURL(f));
    setUploadedImageUrls(prev => [...prev, ...urls]);
  };

  const removeImage = (index: number) => {
    // Determine if it was an existing image or a new one
    const existingCount = uploadedImageUrls.length - selectedImages.length;
    if (index < existingCount) {
       // It's an existing image being removed
       setUploadedImageUrls(prev => prev.filter((_, i) => i !== index));
    } else {
       // It's a new image being removed
       const newIdx = index - existingCount;
       setSelectedImages(prev => prev.filter((_, i) => i !== newIdx));
       setUploadedImageUrls(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) return;
    setSelectedVideo(file);
    setUploadedVideoUrl(URL.createObjectURL(file));
  };

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Logic for keeping existing URLs and uploading new ones
      const existingCount = uploadedImageUrls.length - selectedImages.length;
      const keepUrls = uploadedImageUrls.slice(0, existingCount);
      
      const newImgUrls = await Promise.all(selectedImages.map(async file => {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const data = await res.json();
        return data.url;
      }));

      const finalImages = [...keepUrls, ...newImgUrls];

      let finalVideoUrl = uploadedVideoUrl;
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
        description,
        price,
        currency,
        stockQuantity: parseInt(stockQuantity),
        images: finalImages,
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
        submittedForShowcase,
        discountPercentage: discountPercentage || undefined,
        isOnSale,
      };

      const res = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });

      if (res.ok) {
        setShowSuccessModal(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const canGoNext = useMemo(() => {
    if (currentStep === 0) return name && description && selectedCategoryIds.length > 0;
    if (currentStep === 1) return uploadedImageUrls.length > 0;
    if (currentStep === 2) return price && currency;
    return true;
  }, [currentStep, name, description, selectedCategoryIds, uploadedImageUrls, price, currency]);

  if (fetchLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-[#F8FAFC] flex flex-col relative">
      <div className="flex flex-col min-w-0">
        {/* Horizontal Progress Stepper */}
        <div className="relative bg-white border-b border-slate-200 px-6 py-4">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-slate-900 rounded-lg text-white">
                <Package className="w-4 h-4" />
              </div>
              <span className="text-sm font-black uppercase tracking-widest text-slate-900">Product Studio</span>
            </div>
            
            <div className="flex items-center gap-4">
              {STEPS.map((step, i) => (
                <button
                   key={step.id}
                   onClick={() => i <= currentStep && setCurrentStep(i)}
                   className="flex items-center gap-2 group"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
                    i === currentStep 
                      ? 'bg-blue-600 text-white shadow-lg' 
                      : i < currentStep 
                        ? 'bg-blue-50 text-blue-600' 
                        : 'bg-slate-50 text-slate-300'
                  }`}>
                    {i < currentStep ? <Check className="w-4 h-4" /> : step.icon}
                  </div>
                  <span className={`hidden md:block text-[10px] font-black uppercase tracking-widest transition-colors ${
                    i === currentStep ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                  }`}>
                    {step.title}
                  </span>
                  {i < STEPS.length - 1 && (
                    <div className="h-px w-4 bg-slate-200 ml-2" />
                  )}
                </button>
              ))}
            </div>

            <button 
              onClick={() => router.back()}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="max-w-5xl mx-auto w-full px-6 pt-12 pb-6 lg:pt-20 lg:pb-8">
          
          <motion.div key={currentStep + "header"} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12 lg:mb-20">
             <div className="flex items-center gap-3 mb-4">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600">Editing Product — Step {currentStep + 1}</span>
                <div className="h-px w-12 bg-blue-200" />
             </div>
             <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                {currentStep === 0 && "Update the identity."}
                {currentStep === 1 && "Refine the presentation."}
                {currentStep === 2 && "Update the value."}
                {currentStep === 3 && "Fine-tune the details."}
             </h1>
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              {/* STEP 1: BASICS (The Soul) */}
              {currentStep === 0 && (
                <div className="flex flex-col gap-8">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column: Focused Identity */}
                    <div className="lg:col-span-8 space-y-8">
                      {/* Identity Bento Block */}
                      <div className="p-8 bg-white border border-slate-100 rounded-[2rem] shadow-sm space-y-8">
                        <div className="space-y-4">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Creation Identity</Label>
                          <Input 
                            placeholder="What is the name of this piece?"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="h-16 rounded-2xl border-slate-100 focus:border-blue-600 text-xl font-bold px-6 bg-slate-50/30"
                          />
                        </div>
                        
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">The Story</Label>
                            <span className="text-[10px] font-bold text-slate-300 italic">{description.length}/1000</span>
                          </div>
                          <textarea 
                            rows={6}
                            placeholder="Describe the fit, the fabric, and the feeling..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full rounded-2xl border border-slate-100 focus:border-blue-600 p-6 text-base font-medium leading-relaxed bg-slate-50/30 shadow-none resize-none transition-all outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Intelligence & Collections */}
                    <div className="lg:col-span-4 space-y-8">
                      {/* AI Insights Card */}
                      <div className="p-8 bg-slate-900 rounded-[2rem] text-white relative overflow-hidden">
                        <Sparkles className="absolute top-6 right-6 w-5 h-5 text-blue-400 animate-pulse" />
                        <h3 className="text-[10px] font-black uppercase tracking-widest mb-6 opacity-60">Discovery Preview</h3>
                        
                        {(discoveryPreview.styles.length > 0 || discoveryPreview.keywords.length > 0) ? (
                          <div className="space-y-4">
                            <div className="flex flex-wrap gap-2">
                              {discoveryPreview.keywords.map(kw => (
                                <span key={kw} className="px-3 py-1 bg-white/10 rounded-lg text-[10px] font-bold text-blue-100 backdrop-blur-md">
                                  {kw}
                                </span>
                              ))}
                            </div>
                            <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
                              Automated search indexing active.
                            </p>
                          </div>
                        ) : (
                          <div className="h-20 flex items-center justify-center text-center">
                            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wider italic">Input intelligence active...</p>
                          </div>
                        )}
                        <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-blue-600/20 rounded-full blur-2xl" />
                      </div>

                      {/* Collections Bento Block */}
                      <div className="p-8 bg-white border border-slate-100 rounded-[2rem] shadow-sm space-y-6">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Curated Collections</Label>
                        <div className="space-y-2">
                          {selectedCategoryCollections.length > 0 ? (
                            selectedCategoryCollections.map(col => (
                              <button
                                key={col.id}
                                onClick={() => setSelectedCollections(prev => prev.includes(col.id) ? prev.filter(id => id !== col.id) : [...prev, col.id])}
                                className={`w-full text-left px-5 py-4 rounded-xl border transition-all flex items-center justify-between group ${
                                  selectedCollections.includes(col.id) 
                                    ? 'bg-slate-900 border-slate-900 text-white shadow-md' 
                                    : 'bg-slate-50 border-transparent text-slate-500 hover:border-slate-200'
                                }`}
                              >
                                <span className="text-[10px] font-black uppercase tracking-widest">{col.name}</span>
                                {selectedCollections.includes(col.id) ? (
                                  <Check className="w-4 h-4 text-blue-400" />
                                ) : (
                                  <Plus className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                                )}
                              </button>
                            ))
                          ) : (
                            <div className="p-8 bg-slate-50/50 rounded-xl border border-dashed border-slate-100 text-center">
                              <Package className="w-5 h-5 text-slate-200 mx-auto mb-2" />
                              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Select Category First</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* BOTTOM ROW: Taxonomy & Filters (Full Width) */}
                  <div className="w-full">
                    <div className="p-8 bg-white border border-slate-100 rounded-[2rem] shadow-sm space-y-6">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center">
                          <Tag className="w-3 h-3 text-blue-600" />
                        </div>
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-900">Taxonomy & Filters</Label>
                      </div>
                      
                      <MultiCategoryPicker 
                        parentCategories={parentCategories}
                        selectedCategoryIds={selectedCategoryIds}
                        onChange={setSelectedCategoryIds}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: MEDIA (The Visuals) */}
              {currentStep === 1 && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Left Column: Focused Hero Gallery */}
                  <div className="lg:col-span-8 bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-sm space-y-10">
                    <div className="flex items-center justify-between border-b border-slate-50 pb-8">
                      <div>
                        <h3 className="text-xl font-black text-slate-900">Hero Gallery</h3>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Refine the presentation</p>
                      </div>
                      <div className="px-4 py-2 bg-slate-50 rounded-xl">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">{uploadedImageUrls.length} / 4 Images</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-6">
                      {/* Hero Image (Slot 1) */}
                      <div className="col-span-4 lg:col-span-2 aspect-[4/5] relative rounded-3xl overflow-hidden group shadow-2xl shadow-slate-100 ring-4 ring-slate-50">
                        {uploadedImageUrls[0] ? (
                          <>
                            <Image src={uploadedImageUrls[0]} alt="Main Preview" fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute top-6 right-6 flex gap-2">
                               <span className="bg-white/90 backdrop-blur-md text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg text-slate-900 border border-white/20">Cover</span>
                               <button onClick={() => removeImage(0)} className="bg-rose-500 text-white p-2 rounded-lg shadow-lg hover:bg-rose-600 transition-all">
                                  <X className="w-4 h-4" />
                               </button>
                            </div>
                          </>
                        ) : (
                          <label className="w-full h-full flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-slate-50 transition-all border-4 border-dashed border-slate-100 rounded-3xl group/label">
                            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover/label:bg-blue-600 group-hover/label:text-white transition-all scale-110">
                              <Upload className="w-8 h-8" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">Mandatory Hero Slot</span>
                          </label>
                        )}
                      </div>

                      {/* Secondary Grid */}
                      <div className="col-span-4 lg:col-span-2 grid grid-cols-2 gap-4">
                        {[1, 2, 3].map((idx) => (
                           <div key={idx} className="aspect-[4/5] relative rounded-2xl overflow-hidden group border-2 border-slate-50 bg-slate-50/10">
                              {uploadedImageUrls[idx] ? (
                                <>
                                  <Image src={uploadedImageUrls[idx]} alt={`Preview ${idx}`} fill className="object-cover" />
                                  <button onClick={() => removeImage(idx)} className="absolute top-3 right-3 p-1.5 bg-white/90 rounded-lg shadow-sm text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                                     <X className="w-3 h-3" />
                                  </button>
                                </>
                              ) : (
                                <label className="w-full h-full flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-50 transition-all group/sub">
                                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center group-hover/sub:bg-blue-50 group-hover/sub:text-blue-600 transition-all">
                                    <Plus className="w-5 h-5" />
                                  </div>
                                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-300">Add Image</span>
                                </label>
                              )}
                           </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Video & Performance */}
                  <div className="lg:col-span-4 space-y-8">
                     <div className="p-8 bg-blue-50 border border-blue-100 rounded-[2rem] space-y-6">
                        <div className="flex items-center gap-2 mb-2">
                           <Video className="w-4 h-4 text-blue-600" />
                           <Label className="text-[10px] font-black uppercase tracking-widest text-blue-900">In-Motion Experience</Label>
                        </div>
                        
                        {uploadedVideoUrl ? (
                           <div className="aspect-square rounded-[1.5rem] overflow-hidden relative group ring-4 ring-white shadow-xl">
                              <video src={uploadedVideoUrl} className="w-full h-full object-cover" autoPlay muted loop />
                              <button onClick={() => {setUploadedVideoUrl(""); setSelectedVideo(null);}} className="absolute top-4 right-4 p-2 bg-white/90 text-rose-500 rounded-xl shadow-lg hover:scale-110 transition-transform">
                                 <X className="w-4 h-4" />
                              </button>
                           </div>
                        ) : (
                           <label className="aspect-square rounded-[1.5rem] border-4 border-dashed border-blue-200 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-blue-100/50 transition-all group/video">
                              <input type="file" className="hidden" accept="video/*" onChange={handleVideoUpload} />
                              <div className="w-14 h-14 rounded-full bg-white text-blue-400 flex items-center justify-center group-hover/video:scale-110 transition-transform shadow-sm">
                                <Video className="w-6 h-6" />
                              </div>
                              <div className="text-center">
                                 <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">Upload Video</p>
                                 <p className="text-[8px] text-blue-400 font-bold uppercase mt-1">Short Loops · MP4 preferred</p>
                              </div>
                           </label>
                        )}
                     </div>
                  </div>
                </div>
              )}

              {/* STEP 3: PRICING (The Value) */}
              {currentStep === 2 && (
                <div className="max-w-4xl space-y-8">
                   <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                      {/* Price Bento Block */}
                      <div className="md:col-span-7 bg-white border border-slate-100 rounded-[2rem] p-8 shadow-sm space-y-8">
                         <div className="flex items-center gap-2">
                           <DollarSign className="w-4 h-4 text-slate-400" />
                           <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Valuation</Label>
                         </div>
                         
                         <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-3">
                               <Label className="text-[10px] font-bold text-slate-400">Currency</Label>
                               <select 
                                  value={currency} 
                                  onChange={(e) => setCurrency(e.target.value)}
                                  className="w-full h-14 bg-slate-50 px-6 rounded-xl font-black text-sm outline-none border border-transparent focus:border-blue-600 transition-all cursor-pointer"
                               >
                                  <option value="GHS">GHS (Cedis)</option>
                                  <option value="USD">USD (Dollars)</option>
                                  <option value="EUR">EUR (Euros)</option>
                               </select>
                            </div>
                            <div className="space-y-3">
                               <Label className="text-[10px] font-bold text-slate-400">Retail Price</Label>
                               <div className="relative">
                                  <input 
                                    type="number"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    className="w-full h-14 bg-slate-50 border border-transparent focus:border-blue-600 rounded-xl outline-none px-6 text-xl font-black transition-all"
                                    placeholder="0.00"
                                  />
                               </div>
                            </div>
                         </div>
                      </div>

                      {/* Stock Bento Block */}
                      <div className="md:col-span-5 bg-white border border-slate-100 rounded-[2rem] p-8 shadow-sm space-y-8">
                         <div className="flex items-center gap-2">
                           <Package className="w-4 h-4 text-slate-400" />
                           <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Inventory</Label>
                         </div>
                         <div className="space-y-3">
                           <Label className="text-[10px] font-bold text-slate-400">In-Stock Quantity</Label>
                           <input 
                              type="number"
                              value={stockQuantity}
                              onChange={(e) => setStockQuantity(e.target.value)}
                              className="w-full h-14 bg-slate-50 border border-transparent focus:border-blue-600 rounded-xl outline-none px-6 text-xl font-black transition-all"
                           />
                         </div>
                      </div>
                   </div>

                   {/* Promotion Bento Block */}
                   <div className="p-8 bg-gradient-to-br from-orange-50/50 to-amber-50/50 rounded-[2.5rem] border border-orange-100 space-y-8">
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-4">
                            <div className="p-3 bg-white rounded-2xl shadow-sm text-orange-600 ring-4 ring-orange-50/50">
                               <Award className="w-5 h-5" />
                            </div>
                            <div>
                               <h3 className="text-lg font-black text-slate-900 leading-tight">Flash Sale Campaign</h3>
                               <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Special promotional pricing</p>
                            </div>
                         </div>
                         <div 
                           onClick={() => setIsOnSale(!isOnSale)}
                           className={`w-14 h-8 rounded-full transition-all cursor-pointer p-1 ${isOnSale ? 'bg-orange-600' : 'bg-slate-200'}`}
                         >
                            <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform ${isOnSale ? 'translate-x-6' : 'translate-x-0'}`} />
                         </div>
                      </div>
                      
                      <AnimatePresence>
                         {isOnSale && (
                           <motion.div 
                             initial={{ height: 0, opacity: 0 }}
                             animate={{ height: 'auto', opacity: 1 }}
                             exit={{ height: 0, opacity: 0 }}
                             className="space-y-6 pt-6 border-t border-orange-200/30 overflow-hidden"
                           >
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                 <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Discount %</Label>
                                    <div className="relative">
                                       <Input 
                                         value={discountPercentage} 
                                         onChange={e => setDiscountPercentage(e.target.value)} 
                                         className="h-14 rounded-xl bg-white border border-orange-100 font-black text-xl px-6 focus:ring-orange-200" 
                                         placeholder="20" 
                                       />
                                       <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-orange-200">%</span>
                                    </div>
                                 </div>
                                 <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Final Price</Label>
                                    <div className="h-14 rounded-xl bg-slate-900 flex items-center px-6 text-white text-xl font-black shadow-inner shadow-black/20">
                                       {currency} {(parseFloat(price) * (1 - (parseFloat(discountPercentage) || 0) / 100)).toFixed(2)}
                                    </div>
                                 </div>
                              </div>
                           </motion.div>
                         )}
                      </AnimatePresence>
                   </div>
                </div>
              )}

              {/* STEP 4: DETAILS (The Tailoring) */}
              {currentStep === 3 && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                   {/* Left Column: Sizing & Colors */}
                   <div className="lg:col-span-7 space-y-8">
                      {/* Sizing Bento Block */}
                      <div className="p-8 bg-white border border-slate-100 rounded-[2rem] shadow-sm space-y-8">
                        {/* Grouped Size Summary */}
                        <div className="space-y-6">
                           <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                              <div className="flex items-center gap-2">
                                <Package className="w-4 h-4 text-slate-400" />
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-900">Selected Matrix</Label>
                              </div>
                              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{selectedSizes.length} Variants</span>
                           </div>

                           <div className="flex flex-wrap gap-6">
                              {Object.entries(sizeOptions).map(([denom, sizes]) => {
                                 const selectedInDenom = selectedSizes.filter(s => (sizes as string[]).includes(s));
                                 if (selectedInDenom.length === 0) return null;
                                 return (
                                   <div key={denom} className="space-y-3">
                                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block ml-1">{denom} System</span>
                                      <div className="flex flex-wrap gap-2">
                                         <AnimatePresence mode="popLayout">
                                            {selectedInDenom.map(size => (
                                              <motion.button
                                                key={size}
                                                layout
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.8 }}
                                                onClick={() => setSelectedSizes(prev => prev.filter(s => s !== size))}
                                                className="px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-tight flex items-center gap-2 border border-blue-100/50 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all group"
                                              >
                                                 {size}
                                                 <X className="w-3 h-3 opacity-40 group-hover:opacity-100" />
                                              </motion.button>
                                            ))}
                                         </AnimatePresence>
                                      </div>
                                   </div>
                                 );
                              })}
                              {selectedSizes.length === 0 && (
                                <div className="py-4 w-full flex items-center justify-center border-2 border-dashed border-slate-50 rounded-2xl">
                                   <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">No sizes defined yet...</p>
                                </div>
                              )}
                           </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                           <div className="flex items-center gap-2">
                             <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Denomination Focus</Label>
                           </div>
                           <div className="flex gap-1 p-1 bg-slate-100 rounded-lg">
                              {["US", "EU", "UK", "General"].map(t => (
                                <button 
                                 key={t}
                                 onClick={() => setDenomination(t as "US" | "EU" | "UK" | "General")}
                                 className={`px-3 py-1.5 rounded-md text-[8px] font-black uppercase transition-all ${denomination === t ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                  {t}
                                </button>
                              ))}
                           </div>
                        </div>
                        
                        <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                           {sizeOptions[denomination].map(size => (
                             <button
                                key={size}
                                onClick={() => setSelectedSizes(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size])}
                                className={`h-12 rounded-xl border transition-all flex items-center justify-center text-[10px] font-black ${
                                  selectedSizes.includes(size) 
                                    ? 'bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-200' 
                                    : 'bg-slate-50 border-transparent text-slate-400 hover:border-slate-200'
                                }`}
                             >
                                {size}
                             </button>
                           ))}
                        </div>
                      </div>

                      {/* Color Bento Block */}
                      <div className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm space-y-6">
                         <div className="flex items-center gap-2">
                           <Palette className="w-4 h-4 text-slate-400" />
                           <Label className="text-[10px] font-black uppercase tracking-widest text-slate-900">Chromatics</Label>
                         </div>
                         <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-50">
                            <ColorPicker value={colors} onChange={setColors} />
                         </div>
                      </div>
                   </div>

                   {/* Right Column: Materials & Options */}
                   <div className="lg:col-span-5 space-y-8">
                      {/* Material Bento Block */}
                      <div className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm space-y-6">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Material Composition</Label>
                        <div className="flex flex-wrap gap-2">
                           {["Silk", "Cotton", "Linen", "Leather", "Lace", "Organza", "Wool", "Denim"].map(m => (
                             <button
                                key={m}
                                onClick={() => setMaterial(m)}
                                className={`px-4 py-3 rounded-xl border transition-all text-[10px] font-black uppercase tracking-widest ${
                                  material === m 
                                    ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100' 
                                    : 'bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100'
                                }`}
                             >
                                {m}
                             </button>
                           ))}
                        </div>
                      </div>

                      {/* Options List Block */}
                      <div className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm space-y-6">
                         <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Creative Toggles</Label>
                         <div className="space-y-3">
                            {[
                              { id: 'custom', label: 'Customizable Request', state: isCustomizable, set: setIsCustomizable, icon: <Save className="w-3 h-3" /> },
                              { id: 'unisex', label: 'Gender Neutral', state: isUnisex, set: setIsUnisex, icon: <Check className="w-3 h-3" /> },
                              { id: 'preorder', label: 'Early Access', state: isPreorder, set: setIsPreorder, icon: <Loader2 className="w-3 h-3" /> },
                              { id: 'showcase', label: 'Marketplace Showcase', state: submittedForShowcase, set: setSubmittedForShowcase, icon: <Sparkles className="w-3 h-3" /> },
                            ].map(opt => (
                              <button
                                key={opt.id}
                                onClick={() => opt.set(!opt.state)}
                                className={`w-full flex items-center justify-between p-5 rounded-2xl border transition-all ${
                                  opt.state 
                                    ? 'bg-blue-50/50 border-blue-100 text-blue-900' 
                                    : 'bg-slate-50 border-transparent text-slate-400 opacity-60'
                                }`}
                              >
                                 <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${opt.state ? 'bg-white text-blue-600 shadow-sm' : 'bg-slate-100'}`}>
                                       {opt.icon}
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest">{opt.label}</span>
                                 </div>
                                 <div className={`w-10 h-6 rounded-full p-1 transition-all ${opt.state ? 'bg-blue-600' : 'bg-slate-200'}`}>
                                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${opt.state ? 'translate-x-4' : 'translate-x-0'}`} />
                                 </div>
                              </button>
                            ))}
                         </div>
                      </div>
                   </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation Dock (Static at bottom) */}
      <div className="relative mt-4 mb-16 left-1/2 -translate-x-1/2 z-10 w-full max-w-sm px-6">
         <div className="bg-slate-900/90 backdrop-blur-2xl px-3 py-3 rounded-full flex items-center justify-between shadow-2xl border border-white/10 overflow-hidden relative group">
            <Button variant="ghost" onClick={prevStep} disabled={currentStep === 0 || loading} className="text-white hover:bg-white/10 rounded-full h-12 w-12 p-0 transition-all disabled:opacity-20">
               <ChevronLeft className="w-6 h-6" />
            </Button>
            <div className="flex-1 flex flex-col items-center">
              <span className="text-[8px] font-black uppercase tracking-[0.3em] text-blue-400 mb-1">{STEPS[currentStep].title}</span>
              <div className="flex gap-1.5">{STEPS.map((_, i) => <div key={i} className={`h-1 rounded-full transition-all duration-500 ${i === currentStep ? 'w-6 bg-blue-500' : 'w-1 bg-white/20'}`} />)}</div>
            </div>
            {currentStep === STEPS.length - 1 ? (
              <Button onClick={handleSubmit} disabled={loading || !canGoNext} className="bg-blue-600 hover:bg-blue-700 text-white rounded-full h-12 px-6 font-black uppercase tracking-widest text-[10px] group/btn">
                 {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Save <Save className="w-4 h-4 ml-2 group-hover/btn:translate-y-[-2px] transition-transform" /></>}
              </Button>
            ) : (
              <Button onClick={nextStep} disabled={!canGoNext} className="bg-white hover:bg-slate-100 text-slate-900 rounded-full h-12 w-24 p-0 font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-1 group/btn">Next <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" /></Button>
            )}
            <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:left-[200%] transition-all duration-1000 pointer-events-none" />
         </div>
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => router.push('/dashboard/catalogue/products')}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-500" />
              
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                  <Check className="w-10 h-10" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-2xl font-serif text-slate-900 italic">Saved.</h3>
                  <p className="text-slate-500 text-xs font-medium leading-relaxed">
                    Your changes have been successfully applied to this creation.
                  </p>
                </div>

                <div className="grid grid-cols-1 w-full gap-3 pt-4">
                  <Button
                    onClick={() => setShowSuccessModal(false)}
                    className="h-14 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                  >
                    Continue Editing
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => router.push('/dashboard/catalogue/products')}
                    className="h-14 text-slate-400 hover:text-slate-900 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all"
                  >
                    Back to Catalogue
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}