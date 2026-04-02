'use client';
import React, { useEffect, useState, useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ColorPicker } from "@/components/ui/color-picker";

import { 
  Upload, X, Video, ChevronRight, ChevronLeft, 
  Check, Info, Tag, Package, Palette, Image as ImageIcon, 
  GripVertical, Loader2, Sparkles, DollarSign
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import Image from "next/image";

// --- Types ---
type SizeOption =
  | "US 2" | "US 4" | "US 6" | "US 8" | "US 10" | "US 12" | "US 14" | "US 16"
  | "EU 34" | "EU 36" | "EU 38" | "EU 40" | "EU 42" | "EU 44" | "EU 46" | "EU 48"
  | "UK 6" | "UK 8" | "UK 10" | "UK 12" | "UK 14" | "UK 16" | "UK 18" | "UK 20"
  | "XS" | "S" | "M" | "L" | "XL" | "XXL";


const STEPS = [
  { id: 'basics', title: 'Basics', icon: <Tag className="w-4 h-4" /> },
  { id: 'media', title: 'Media', icon: <ImageIcon className="w-4 h-4" /> },
  { id: 'pricing', title: 'Pricing', icon: <DollarSign className="w-4 h-4" /> },
  { id: 'details', title: 'Details', icon: <Palette className="w-4 h-4" /> },
];

export default function AddProductPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // --- Form State ---
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedCollection, setSelectedCollection] = useState("");
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

  const [discountStartDate, setDiscountStartDate] = useState("");
  const [discountEndDate, setDiscountEndDate] = useState("");
  const [submittedForShowcase, setSubmittedForShowcase] = useState(false);

  // --- Data States ---
  interface CategoryWithChildren {
    id: string;
    name: string;
    children: { id: string; name: string }[];
  }
  interface Collection {
    id: string;
    name: string;
  }
  const [parentCategories, setParentCategories] = useState<CategoryWithChildren[]>([]);
  const [selectedCategoryCollections, setSelectedCategoryCollections] = useState<Collection[]>([]);

  useEffect(() => {
    async function fetchFilters() {
      const url = selectedCategory ? `/api/product-selection-filters?categoryId=${selectedCategory}` : "/api/product-selection-filters";
      const res = await fetch(url);
      const data = await res.json();
      setParentCategories(data.parentCategories);
      setSelectedCategoryCollections(data.selectedCategoryCollections);
    }
    fetchFilters();
  }, [selectedCategory]);

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
      alert("Max 4 images allowed");
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
      alert("Video too large (max 50MB)");
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

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // 1. Upload Images
      const imgUrls = await Promise.all(selectedImages.map(async file => {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const data = await res.json();
        return data.url;
      }));

      // 2. Upload Video
      let finalVideoUrl = "";
      if (selectedVideo) {
        const fd = new FormData();
        fd.append('file', selectedVideo);
        fd.append('bucket', 'videos');
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const data = await res.json();
        finalVideoUrl = data.url;
      }

      // 3. Create Product
      const productData = {
        name,
        description,
        price,
        currency,
        stockQuantity: parseInt(stockQuantity),
        images: imgUrls,
        videoUrl: finalVideoUrl || undefined,
        categoryId: selectedCategory,
        collectionId: selectedCollection || undefined,
        sizes: selectedSizes,
        colors,
        material: material || undefined,
        careInstructions: careInstructions || undefined,
        isCustomizable,
        isUnisex,
        isPreorder,
        submittedForShowcase,
        discountPercentage: discountPercentage || undefined,

        discountStartDate: discountStartDate || undefined,
        discountEndDate: discountEndDate || undefined,
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
        router.push('/dashboard/catalogue/products');
      } else {
         const err = await res.json();
         alert(err.error || "Failed to add product");
      }
    } catch (err) {
      console.error(err);
      alert("Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const canGoNext = useMemo(() => {
    if (currentStep === 0) return name && description && selectedCategory;
    if (currentStep === 1) return uploadedImageUrls.length > 0;
    if (currentStep === 2) return price && currency;
    return true;
  }, [currentStep, name, description, selectedCategory, uploadedImageUrls, price, currency]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40 backdrop-blur-md bg-white/80">
        <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              Product Creation
            </h1>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Step {currentStep + 1} of {STEPS.length}</p>
          </div>

          <div className="flex items-center gap-4">
             <Button variant="ghost" onClick={() => router.back()} disabled={loading}>Discard</Button>
             {currentStep === STEPS.length - 1 ? (
               <Button 
                onClick={handleSubmit} 
                disabled={loading || !canGoNext}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-100 px-6 font-bold"
               >
                 {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                 Launch Product
               </Button>
             ) : (
               <Button 
                onClick={nextStep} 
                disabled={!canGoNext}
                className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-lg px-6 font-bold"
               >
                 Next Section <ChevronRight className="w-4 h-4 ml-1" />
               </Button>
             ) }
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-slate-100 w-full overflow-hidden">
           <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
            className="h-full bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.5)]"
           />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 mt-8">
        {/* Step Indicator Desktop */}
        <div className="hidden md:flex items-center justify-between mb-12">
           {STEPS.map((step, idx) => (
             <React.Fragment key={step.id}>
                <div 
                  className={`flex flex-col items-center gap-2 transition-all duration-500 ${idx === currentStep ? 'opacity-100 scale-110' : 'opacity-40'}`}
                >
                   <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${idx <= currentStep ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'bg-white border-2 border-slate-200 text-slate-400'}`}>
                      {idx < currentStep ? <Check className="w-5 h-5" /> : step.icon}
                   </div>
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">{step.title}</span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-4 rounded-full transition-colors ${idx < currentStep ? 'bg-blue-600' : 'bg-slate-200'}`} />
                )}
             </React.Fragment>
           ))}
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50 p-8 md:p-12 min-h-[500px] relative overflow-hidden">
           <AnimatePresence mode="wait">
             <motion.div
               key={currentStep}
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -20 }}
               transition={{ duration: 0.3 }}
               className="space-y-8"
             >
                {/* STEP 1: BASICS */}
                {currentStep === 0 && (
                  <div className="space-y-8">
                    <div className="space-y-2">
                       <h2 className="text-3xl font-black text-slate-900">What are you listing?</h2>
                       <p className="text-slate-500 font-medium">Start with the fundamental details of your product.</p>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-3">
                        <Label className="text-xs font-black uppercase tracking-widest mb-1 text-slate-400">Product Identity</Label>
                        <Input 
                          placeholder="e.g. Midnight Silk Evening Gown"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="h-14 rounded-2xl border-2 border-slate-100 focus:border-blue-600 focus:ring-4 focus:ring-blue-50 text-lg font-bold px-6"
                        />
                      </div>

                      <div className="space-y-3">
                        <Label className="text-xs font-black uppercase tracking-widest mb-1 text-slate-400">The Story / Description</Label>
                        <textarea 
                          rows={4}
                          placeholder="Describe the aesthetic, fit, and soul of this piece..."
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          className="w-full h-32 rounded-[2rem] border-2 border-slate-100 focus:border-blue-600 focus:ring-4 focus:ring-blue-50 text-md font-medium px-6 py-4 transition-all resize-none"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <Label className="text-xs font-black uppercase tracking-widest mb-1 text-slate-400">Core Category</Label>
                          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                            <SelectTrigger className="h-14 rounded-2xl border-2 border-slate-100 focus:border-blue-600 focus:ring-4 focus:ring-blue-50 font-bold px-6">
                               <SelectValue placeholder="Where does it fit?" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-none shadow-2xl">
                               {parentCategories.flatMap((parent: CategoryWithChildren) =>
                                parent.children.map((child: { id: string; name: string }) => (
                                  <SelectItem key={child.id} value={child.id} className="rounded-xl py-3 font-medium">
                                    {parent.name} › {child.name}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-3">
                          <Label className="text-xs font-black uppercase tracking-widest mb-1 text-slate-400">Collection (Optional)</Label>
                          <Select value={selectedCollection} onValueChange={setSelectedCollection} disabled={selectedCategoryCollections.length === 0}>
                            <SelectTrigger className="h-14 rounded-2xl border-2 border-slate-100 focus:border-blue-600 focus:ring-4 focus:ring-blue-50 font-bold px-6">
                               <SelectValue placeholder={selectedCategoryCollections.length === 0 ? "No collections" : "Select collection"} />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-none shadow-2xl">
                                {selectedCategoryCollections.map((col: { id: string; name: string }) => (
                                  <SelectItem key={col.id} value={col.id} className="rounded-xl py-3 font-medium">
                                    {col.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: MEDIA */}
                {currentStep === 1 && (
                  <div className="space-y-8">
                    <div className="space-y-2">
                       <h2 className="text-3xl font-black text-slate-900">Visual Showcase</h2>
                       <p className="text-slate-500 font-medium">High quality visuals drive 80% of purchasing decisions.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                       <div className="space-y-6">
                          <Label className="text-xs font-black uppercase tracking-widest mb-1 text-slate-400">Imagery (Max 4)</Label>
                          <div className="grid grid-cols-2 gap-4">
                             {uploadedImageUrls.map((url, idx) => (
                               <div key={idx} className="relative aspect-square rounded-[2rem] overflow-hidden group shadow-md">
                                  <Image src={url} alt={`Product preview ${idx + 1}`} fill className="w-full h-full object-cover" />
                                  <button 
                                    onClick={() => removeImage(idx)}
                                    className="absolute top-3 right-3 p-2 bg-white/90 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-white"
                                  >
                                    <X className="w-4 h-4 text-rose-500" />
                                  </button>
                                  <div className="absolute bottom-0 inset-x-0 h-1 bg-blue-600 shadow-[0_0_10px_blue]" />
                               </div>
                             ))}

                             {uploadedImageUrls.length < 4 && (
                               <label className="aspect-square rounded-[2rem] border-4 border-dashed border-slate-100 hover:border-blue-200 hover:bg-blue-50/20 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 group">
                                  <input type="file" className="hidden" accept="image/*" multiple onChange={handleImageUpload} />
                                  <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                                     <Upload className="w-6 h-6" />
                                  </div>
                                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-blue-600 transition-all">Add Photo</span>
                               </label>
                             )}
                          </div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Recommended: 1080x1080px, PNG or JPG, Under 2MB</p>
                       </div>

                       <div className="space-y-6">
                          <Label className="text-xs font-black uppercase tracking-widest mb-1 text-slate-400">Product Cinematic (Optional)</Label>
                          {uploadedVideoUrl ? (
                            <div className="relative aspect-square rounded-[2rem] overflow-hidden group shadow-lg border-4 border-slate-50">
                               <video src={uploadedVideoUrl} className="w-full h-full object-cover" autoPlay muted loop />
                               <button 
                                  onClick={() => { setSelectedVideo(null); setUploadedVideoUrl(""); }}
                                  className="absolute top-4 right-4 p-3 bg-white rounded-2xl shadow-xl opacity-0 group-hover:opacity-100 transition-all"
                               >
                                  <X className="w-5 h-5 text-rose-500" />
                               </button>
                               <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                               <div className="absolute bottom-6 left-6 flex items-center gap-2 text-white">
                                  <Video className="w-4 h-4" />
                                  <span className="text-xs font-black uppercase tracking-widest">Cinema Ready</span>
                               </div>
                            </div>
                          ) : (
                            <label className="aspect-square rounded-[2.5rem] bg-slate-50 border-4 border-slate-100 border-dashed hover:border-indigo-200 hover:bg-indigo-50/10 transition-all cursor-pointer flex flex-col items-center justify-center gap-3 group">
                              <input type="file" className="hidden" accept="video/*" onChange={handleVideoUpload} />
                              <div className="w-16 h-16 rounded-3xl bg-white text-slate-300 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-xl group-hover:scale-110 transition-all">
                                 <Video className="w-8 h-8" />
                              </div>
                              <div className="text-center">
                                <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-indigo-600 transition-all">Add Cinematic</span>
                                <span className="text-[9px] text-slate-300 font-bold tracking-tight">Max 50MB · Square / Vertical</span>
                              </div>
                            </label>
                          )}
                       </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: PRICING */}
                {currentStep === 2 && (
                  <div className="space-y-8">
                    <div className="space-y-2">
                       <h2 className="text-3xl font-black text-slate-900">Commercials</h2>
                       <p className="text-slate-500 font-medium">Set your price and inventory levels.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                       <div className="space-y-8">
                          <div className="space-y-4">
                            <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Active Price</Label>
                            <div className="flex gap-4">
                               <Select value={currency} onValueChange={setCurrency}>
                                  <SelectTrigger className="w-28 h-16 rounded-2xl border-2 border-slate-100 focus:border-blue-600 focus:ring-4 focus:ring-blue-50 font-black text-lg">
                                     <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="rounded-xl">
                                     <SelectItem value="GHS">GHS</SelectItem>
                                     <SelectItem value="USD">USD</SelectItem>
                                     <SelectItem value="EUR">EUR</SelectItem>
                                     <SelectItem value="KES">KES</SelectItem>
                                  </SelectContent>
                               </Select>
                               <div className="relative flex-1">
                                  <Input 
                                    type="number"
                                    placeholder="0.00"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    className="h-16 rounded-2xl border-2 border-slate-100 focus:border-blue-600 focus:ring-4 focus:ring-blue-50 text-2xl font-black px-6"
                                  />
                                  <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 font-black">.00</div>
                               </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Inventory Status</Label>
                            <div className="flex items-center gap-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                               <Package className="w-8 h-8 text-blue-600" />
                               <div className="flex-1">
                                  <p className="text-xs font-black uppercase text-slate-900">Units in Stock</p>
                                  <input 
                                    type="number"
                                    value={stockQuantity}
                                    onChange={(e) => setStockQuantity(e.target.value)}
                                    className="w-full bg-transparent border-none text-2xl font-black focus:ring-0 p-0"
                                  />
                               </div>
                            </div>
                          </div>
                       </div>

                       <div className="bg-slate-50/50 rounded-[2.5rem] border border-slate-100 p-8 space-y-6">
                          <div className="flex items-center justify-between">
                             <div className="flex items-center gap-2">
                                <span className="p-2 bg-orange-100 text-orange-600 rounded-xl">
                                   <Sparkles className="w-4 h-4" />
                                </span>
                                <span className="text-sm font-black uppercase tracking-widest">Promotion Mode</span>
                             </div>
                             <Checkbox 
                                checked={isOnSale} 
                                onCheckedChange={(v) => setIsOnSale(!!v)} 
                                className="w-6 h-6 rounded-lg data-[state=checked]:bg-orange-600"
                             />
                          </div>
                          
                          <AnimatePresence>
                             {isOnSale && (
                               <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="space-y-6 overflow-hidden pt-4 border-t border-slate-200"
                               >
                                  <div className="space-y-3">
                                     <Label className="text-[10px] font-black uppercase text-slate-400">Discount Percentage</Label>
                                     <div className="relative">
                                        <Input 
                                          type="number"
                                          placeholder="e.g. 20"
                                          value={discountPercentage}
                                          onChange={(e) => setDiscountPercentage(e.target.value)}
                                          className="h-12 rounded-xl border-slate-200 font-bold"
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-slate-300">%</div>
                                     </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-3">
                                     <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-slate-400">Start Date</Label>
                                        <input type="date" value={discountStartDate} onChange={e => setDiscountStartDate(e.target.value)} className="w-full h-10 rounded-xl border-slate-200 text-xs px-3 font-bold" />
                                     </div>
                                     <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-slate-400">End Date</Label>
                                        <input type="date" value={discountEndDate} onChange={e => setDiscountEndDate(e.target.value)} className="w-full h-10 rounded-xl border-slate-200 text-xs px-3 font-bold" />
                                     </div>
                                  </div>
                               </motion.div>
                             )}
                          </AnimatePresence>

                          <div className="pt-4 mt-auto">
                              <div className="p-4 bg-blue-600 rounded-2xl text-white">
                                 <p className="text-[10px] font-black uppercase opacity-60">Customer Sees</p>
                                 <p className="text-2xl font-black">
                                    {currency} {isOnSale && discountPercentage ? (parseFloat(price) * (1 - parseFloat(discountPercentage)/100 || 0)).toFixed(2) : (parseFloat(price) || 0).toFixed(2)}
                                 </p>
                                 {isOnSale && <p className="text-[10px] font-bold line-through opacity-40">{currency} {price}</p>}
                              </div>
                          </div>
                       </div>
                    </div>
                  </div>
                )}

                {/* STEP 4: DETAILS */}
                {currentStep === 3 && (
                  <div className="space-y-12">
                    <div className="space-y-2">
                       <h2 className="text-3xl font-black text-slate-900">Final Touches</h2>
                       <p className="text-slate-500 font-medium">Define variants and special options.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                       <div className="space-y-10">
                          <div className="space-y-6">
                            <div className="flex items-center justify-between">
                               <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Size Matrix</Label>
                               <Select value={denomination} onValueChange={(v: "US" | "EU" | "UK" | "General") => setDenomination(v)}>
                                  <SelectTrigger className="w-24 h-8 text-[10px] font-black uppercase tracking-widest border-none bg-slate-100 rounded-lg">
                                     <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="rounded-xl">
                                     <SelectItem value="US">US</SelectItem>
                                     <SelectItem value="EU">EU</SelectItem>
                                     <SelectItem value="UK">UK</SelectItem>
                                     <SelectItem value="General">General</SelectItem>
                                  </SelectContent>
                               </Select>
                            </div>
                            <div className="flex flex-wrap gap-2">
                               {sizeOptions[denomination].map((size) => (
                                 <button
                                    key={size}
                                    type="button"
                                    onClick={() => setSelectedSizes(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size])}
                                    className={`px-4 py-2.5 rounded-xl border-2 transition-all font-black text-xs ${selectedSizes.includes(size) ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
                                 >
                                    {size}
                                 </button>
                               ))}
                            </div>
                          </div>

                          <div className="space-y-4">
                             <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Color Palette</Label>
                             <div className="p-4 bg-slate-50 rounded-[2rem] border border-slate-100">
                                <ColorPicker value={colors} onChange={setColors} maxColors={10} />
                             </div>
                          </div>
                       </div>

                       <div className="space-y-10">
                          <div className="space-y-4">
                             <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Material & Craft</Label>
                             <Select value={material} onValueChange={setMaterial}>
                                <SelectTrigger className="h-14 rounded-2xl border-2 border-slate-100 font-bold px-6">
                                   <SelectValue placeholder="Select primary material" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-none shadow-2xl overflow-y-auto max-h-[300px]">
                                   {["Cotton", "Silk", "Linen", "Denim", "Leather", "Wool", "Satin", "Velvet", "Cashmere", "Synthetic"].map(m => (
                                     <SelectItem key={m} value={m} className="font-medium rounded-xl">{m}</SelectItem>
                                   ))}
                                </SelectContent>
                             </Select>
                             <textarea 
                              placeholder="Care instructions (e.g. Dry clean only)"
                              value={careInstructions}
                              onChange={e => setCareInstructions(e.target.value)}
                              className="w-full h-24 rounded-2xl border-2 border-slate-100 focus:border-blue-600 p-4 text-xs font-medium resize-none"
                             />
                          </div>

                          <div className="space-y-4">
                             <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Product Attributes</Label>
                             <div className="space-y-3">
                                {[
                                  { id: 'unisex', label: 'Unisex Design', state: isUnisex, set: setIsUnisex, icon: <GripVertical className="w-4 h-4" /> },
                                  { id: 'custom', label: 'Accept Customizations', state: isCustomizable, set: setIsCustomizable, icon: <Palette className="w-4 h-4 text-pink-500" /> },
                                  { id: 'preorder', label: 'Enable Pre-order', state: isPreorder, set: setIsPreorder, icon: <Package className="w-4 h-4 text-blue-500" /> },
                                  { id: 'showcase', label: 'Request SuperAdmin Showcase', state: submittedForShowcase, set: setSubmittedForShowcase, icon: <Sparkles className="w-4 h-4 text-amber-500" /> },
                                ].map(opt => (
                                  <div key={opt.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                                     <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                                           {opt.icon}
                                        </div>
                                        <span className="text-xs font-black uppercase text-slate-700">{opt.label}</span>
                                     </div>
                                     <Checkbox 
                                        checked={opt.state} 
                                        onCheckedChange={(v) => opt.set(!!v)}
                                        className="w-5 h-5 rounded-md"
                                     />
                                  </div>
                                ))}
                             </div>
                          </div>
                       </div>
                    </div>
                  </div>
                )}
             </motion.div>
           </AnimatePresence>

           {/* Mobile Navigation */}
           <div className="md:hidden flex items-center justify-between mt-12 pt-8 border-t border-slate-100">
              <Button variant="ghost" onClick={prevStep} disabled={currentStep === 0} className="font-bold">
                 <ChevronLeft className="w-4 h-4 mr-2" /> Back
              </Button>
              <div className="flex items-center gap-1">
                 {STEPS.map((_, i) => (
                   <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === currentStep ? 'bg-blue-600 w-4' : 'bg-slate-200'} transition-all`} />
                 ))}
              </div>
              <Button 
                onClick={currentStep === STEPS.length - 1 ? handleSubmit : nextStep} 
                disabled={!canGoNext || loading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl"
              >
                 {currentStep === STEPS.length - 1 ? 'Finish' : 'Next'}
              </Button>
           </div>
        </div>

        {/* Support Card */}
        <div className="mt-8 p-6 bg-gradient-to-r from-slate-900 to-slate-800 rounded-[2rem] text-white flex items-center justify-between overflow-hidden relative">
           <div className="relative z-10 flex items-center gap-4">
              <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                 <Info className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                 <p className="text-sm font-black uppercase tracking-widest">Need help with your listing?</p>
                 <p className="text-xs text-slate-400 font-medium tracking-tight">Professional sellers follow our high-converting guide.</p>
              </div>
           </div>
           <Button variant="outline" className="relative z-10 border-white/20 hover:bg-white/10 text-white font-bold rounded-xl whitespace-nowrap hidden sm:flex">
              View Guide
           </Button>
           <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-blue-600/20 rounded-full blur-[60px]" />
        </div>
      </div>
    </div>
  );
}