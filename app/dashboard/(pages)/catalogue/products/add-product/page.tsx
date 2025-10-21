'use client';
import React, { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ColorPicker } from "@/components/ui/color-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Upload, X, Video, HelpCircle } from "lucide-react";

type SizeOption =
  | "US 2" | "US 4" | "US 6" | "US 8" | "US 10" | "US 12" | "US 14" | "US 16"
  | "EU 34" | "EU 36" | "EU 38" | "EU 40" | "EU 42" | "EU 44" | "EU 46" | "EU 48"
  | "UK 6" | "UK 8" | "UK 10" | "UK 12" | "UK 14" | "UK 16" | "UK 18" | "UK 20"
  | "XS" | "S" | "M" | "L" | "XL" | "XXL";

type ProductTag = "NEW" | "TRENDING" | "BESTSELLER" | "SALE" | "LIMITED_EDITION" | "CUSTOM_MADE" | "ECO_FRIENDLY" | "HANDMADE" | "FEATURED";

function AddProductPage() {
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string>("");
  const [selectedSizes, setSelectedSizes] = useState<SizeOption[]>([]);
  const [denomination, setDenomination] = useState<"US" | "EU" | "UK" | "General">("US");
  const [parentCategories, setParentCategories] = useState<Array<{
    id: string;
    name: string;
    children: Array<{ id: string; name: string; slug: string; imageUrl?: string }>;
    collections: Array<{ id: string; name: string; slug: string; imageUrl?: string }>;
  }>>([]);
  const [selectedCategoryCollections, setSelectedCategoryCollections] = useState<Array<{ id: string; name: string; slug: string; imageUrl?: string }>>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedCollection, setSelectedCollection] = useState<string>("");
  const [currency, setCurrency] = useState<string>("GHS");
  const [selectedCategoryImage, setSelectedCategoryImage] = useState<string>("");
  const [selectedCollectionImage, setSelectedCollectionImage] = useState<string>("");
  const [colors, setColors] = useState<string[]>([]);
  const [material, setMaterial] = useState<string>("");
  const [careInstructions, setCareInstructions] = useState<string>("");
  const [isCustomizable, setIsCustomizable] = useState<boolean>(false);
  const [selectedTags, setSelectedTags] = useState<ProductTag[]>([]);
  const [isUnisex, setIsUnisex] = useState<boolean>(true);
  const [submittedForShowcase, setSubmittedForShowcase] = useState<boolean>(false);
  const [isShipped, setIsShipped] = useState<boolean>(false);
  const [discountPercentage, setDiscountPercentage] = useState<string>("");
  const [discountPrice, setDiscountPrice] = useState<string>("");
  const [discountStartDate, setDiscountStartDate] = useState<string>("");
  const [discountEndDate, setDiscountEndDate] = useState<string>("");
  const [isOnSale, setIsOnSale] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const sizeOptions = {
    US: ["US 2", "US 4", "US 6", "US 8", "US 10", "US 12", "US 14", "US 16"] as SizeOption[],
    EU: ["EU 34", "EU 36", "EU 38", "EU 40", "EU 42", "EU 44", "EU 46", "EU 48"] as SizeOption[],
    UK: ["UK 6", "UK 8", "UK 10", "UK 12", "UK 14", "UK 16", "UK 18", "UK 20"] as SizeOption[],
    General: ["XS", "S", "M", "L", "XL", "XXL"] as SizeOption[],
  };

  useEffect(() => {
    const fetchFilters = async () => {
      const url = selectedCategory ? `/api/product-selection-filters?categoryId=${selectedCategory}` : "/api/product-selection-filters";
      const res = await fetch(url);
      const data = await res.json();
      setParentCategories(data.parentCategories);
      setSelectedCategoryCollections(data.selectedCategoryCollections);
    };
    fetchFilters();
  }, [selectedCategory]);

  // Update selected category image when category changes
  useEffect(() => {
    if (selectedCategory) {
      // Find the selected category across all parent categories
      for (const parent of parentCategories) {
        const category = parent.children.find(child => child.id === selectedCategory);
        if (category) {
          setSelectedCategoryImage(category.imageUrl || "");
          break;
        }
      }
    } else {
      setSelectedCategoryImage("");
    }
  }, [selectedCategory, parentCategories]);

  // Update selected collection image when collection changes
  useEffect(() => {
    if (selectedCollection) {
      const collection = selectedCategoryCollections.find(col => col.id === selectedCollection);
      setSelectedCollectionImage(collection?.imageUrl || "");
    } else {
      setSelectedCollectionImage("");
    }
  }, [selectedCollection, selectedCategoryCollections]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const totalImages = selectedImages.length + files.length;
    if (totalImages > 4) {
      alert(`You can only upload up to 4 images. Currently ${selectedImages.length} selected.`);
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    const oversizedFiles = files.filter(file => file.size > maxSize);
    if (oversizedFiles.length > 0) {
      alert(`Some images are too large. Maximum size per image is 5MB.`);
      return;
    }

    // Store files locally
    setSelectedImages((prev) => [...prev, ...files]);

    // Create preview URLs for display
    const previewUrls = files.map((file) => URL.createObjectURL(file));
    setUploadedImageUrls((prev) => [...prev, ...previewUrls]);
  };

  const handleSizeSelection = (size: SizeOption) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const handleTagSelection = (tag: ProductTag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // First, upload all selected images
      let uploadedUrls: string[] = [];
      if (selectedImages.length > 0) {
        const uploadPromises = selectedImages.map(async (file) => {
          const formData = new FormData();
          formData.append('file', file);
          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });
          if (!response.ok) throw new Error(`Upload failed: ${response.statusText}`);
          const result = await response.json();
          return result.url;
        });

        uploadedUrls = await Promise.all(uploadPromises);
      }

      // Upload video if selected
      let finalVideoUrl = uploadedVideoUrl;
      if (selectedVideo) {
        const formData = new FormData();
        formData.append('file', selectedVideo);
        formData.append('bucket', 'videos');
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        if (!response.ok) throw new Error(`Video upload failed: ${response.statusText}`);
        const result = await response.json();
        finalVideoUrl = result.url;
      }

      const formData = new FormData(e.target as HTMLFormElement);
      const data = {
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        price: formData.get('price') as string,
        currency,
        stockQuantity: isShipped ? undefined : formData.get('stockQuantity') as string,
        images: uploadedUrls,
        videoUrl: finalVideoUrl || undefined,
        categoryId: selectedCategory,
        collectionId: selectedCollection || undefined,
        sizes: selectedSizes,
        colors,
        material: material || undefined,
        careInstructions: careInstructions || undefined,
        estimatedDelivery: isShipped ? parseInt(formData.get('estimatedArrivalTime') as string) : undefined,
        isCustomizable,
        tags: selectedTags,
        isUnisex,
        submittedForShowcase,
        discountPercentage: discountPercentage || undefined,
        discountPrice: discountPrice || undefined,
        discountStartDate: discountStartDate || undefined,
        discountEndDate: discountEndDate || undefined,
        isOnSale,
      };

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        alert('Product added successfully!');
        (e.target as HTMLFormElement).reset();
        setSelectedImages([]);
        setUploadedImageUrls([]);
        setSelectedVideo(null);
        setUploadedVideoUrl('');
        setSelectedSizes([]);
        setColors([]);
        setMaterial('');
        setCareInstructions('');
        setIsCustomizable(false);
        setCurrency("GHS");
        setSelectedTags([]);
        setIsUnisex(true);
        setSubmittedForShowcase(false);
        setIsShipped(false);
        setDiscountPercentage("");
        setDiscountPrice("");
        setDiscountStartDate("");
        setDiscountEndDate("");
        setIsOnSale(false);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('An error occurred while adding the product.');
    } finally {
      setLoading(false);
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (selectedVideo) {
      alert('Only one video can be uploaded per product.');
      return;
    }

    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('Video file is too large. Maximum size is 50MB.');
      return;
    }

    // Store video file locally
    setSelectedVideo(file);

    // Create preview URL for display
    const previewUrl = URL.createObjectURL(file);
    setUploadedVideoUrl(previewUrl);
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-neutral-900 tracking-tight">Add Product</h1>
          <p className="text-sm text-neutral-500 mt-1">Create a new product listing</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="bg-white border border-neutral-200 rounded-lg shadow-sm">
            <div className="p-8 space-y-10">
              {/* Basic Information */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Product Name</label>
                    <input
                      type="text"
                      name="name"
                      placeholder="Enter product name"
                      required
                      className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Description</label>
                    <textarea
                      name="description"
                      rows={5}
                      placeholder="Product description and key features"
                      required
                      className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">Price</label>
                      <div className="flex gap-2">
                        <Select value={currency} onValueChange={setCurrency}>
                          <SelectTrigger className="w-20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="GHS">GHS</SelectItem>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                            <SelectItem value="GBP">GBP</SelectItem>
                            <SelectItem value="KES">KES</SelectItem>
                            <SelectItem value="CAD">CAD</SelectItem>
                            <SelectItem value="AUD">AUD</SelectItem>
                            <SelectItem value="JPY">JPY</SelectItem>
                            <SelectItem value="CNY">CNY</SelectItem>
                            <SelectItem value="INR">INR</SelectItem>
                            <SelectItem value="BRL">BRL</SelectItem>
                          </SelectContent>
                        </Select>
                        <input
                          type="number"
                          name="price"
                          placeholder="0.00"
                          step="0.01"
                          required
                          className="flex-1 px-3 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900"
                        />
                      </div>
                    </div>

                    {!isShipped && (
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">Stock</label>
                        <input
                          type="number"
                          name="stockQuantity"
                          placeholder="0"
                          required
                          className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Images ({uploadedImageUrls.length}/4)</label>
                  <div className="border border-dashed border-neutral-300 rounded p-6 text-center hover:border-neutral-400 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                      disabled={uploadedImageUrls.length >= 4}
                    />
                    <label htmlFor="image-upload" className={`cursor-pointer block ${uploadedImageUrls.length >= 4 ? 'opacity-40 cursor-not-allowed' : ''}`}>
                      <Upload className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                      <p className="text-xs text-neutral-600">Click to upload</p>
                      <p className="text-xs text-neutral-400 mt-1">Up to 5MB each</p>
                    </label>
                  </div>

                  {uploadedImageUrls.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      {uploadedImageUrls.map((url, index) => (
                        <div key={index} className="relative group aspect-square">
                          <img
                            src={url}
                            alt={`Product ${index + 1}`}
                            className="w-full h-full object-cover rounded border border-neutral-200"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedImages(prev => prev.filter((_, i) => i !== index));
                              setUploadedImageUrls(prev => prev.filter((_, i) => i !== index));
                            }}
                            className="absolute top-1 right-1 bg-white rounded-full p-1 shadow opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3 text-neutral-600" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-neutral-200" />

              {/* Video Upload */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Video (Optional)</label>
                <div className="border border-dashed border-neutral-300 rounded p-6 text-center hover:border-neutral-400 transition-colors">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoUpload}
                    className="hidden"
                    id="video-upload"
                    disabled={!!selectedVideo}
                  />
                  <label htmlFor="video-upload" className={`cursor-pointer block ${uploadedVideoUrl ? 'opacity-40 cursor-not-allowed' : ''}`}>
                    <Video className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                    <p className="text-xs text-neutral-600">{selectedVideo ? 'Video selected' : 'Upload video'}</p>
                    <p className="text-xs text-neutral-400 mt-1">Up to 50MB</p>
                  </label>
                </div>

                {uploadedVideoUrl && (
                  <div className="relative group mt-3 flex justify-center">
                    <div className="relative max-w-md">
                      <video src={uploadedVideoUrl} controls className="w-60 h-48 rounded border border-neutral-200" />
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedVideo(null);
                          setUploadedVideoUrl('');
                        }}
                        className="absolute top-2 right-2 bg-white rounded-full p-1 shadow opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3 text-neutral-600" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-neutral-200" />

              {/* Category & Collection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Category</label>
                  <Select value={selectedCategory} onValueChange={(value) => { setSelectedCategory(value); setSelectedCollection(""); }} required>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {parentCategories.flatMap((parent) =>
                        parent.children.map((child) => (
                          <SelectItem key={child.id} value={child.id}>
                            {parent.name} / {child.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {selectedCategoryImage && (
                    <div className="mt-3">
                      <img
                        src={selectedCategoryImage}
                        alt="Selected category"
                        className="w-full h-32 object-contain rounded-lg border border-neutral-200 shadow-sm"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Collection</label>
                  <Select value={selectedCollection} onValueChange={setSelectedCollection} required disabled={selectedCategoryCollections.length === 0}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={selectedCategoryCollections.length === 0 ? "Select category first" : "Select collection"} />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedCategoryCollections.map((collection) => (
                        <SelectItem key={collection.id} value={collection.id}>
                          {collection.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedCollectionImage && (
                    <div className="mt-3">
                      <img
                        src={selectedCollectionImage}
                        alt="Selected collection"
                        className="w-full h-32 object-contain rounded-lg border border-neutral-200 shadow-sm"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-neutral-200" />

              {/* Sizes */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-3">Sizes</label>
                <div className="mb-4">
                  <Select value={denomination} onValueChange={(value) => setDenomination(value as "US" | "EU" | "UK" | "General")}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="US">US</SelectItem>
                      <SelectItem value="EU">EU</SelectItem>
                      <SelectItem value="UK">UK</SelectItem>
                      <SelectItem value="General">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-wrap gap-2">
                  {sizeOptions[denomination].map((size) => (
                    <label
                      key={size}
                      className={`px-4 py-2 border rounded text-sm cursor-pointer transition-colors ${
                        selectedSizes.includes(size)
                          ? 'border-neutral-900 bg-neutral-900 text-white'
                          : 'border-neutral-300 hover:border-neutral-400'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedSizes.includes(size)}
                        onChange={() => handleSizeSelection(size)}
                        className="hidden"
                      />
                      {size}
                    </label>
                  ))}
                </div>
              </div>

              <div className="border-t border-neutral-200" />

              {/* Discount/Promotion Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-3">Discount & Promotions</label>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">Discount Percentage (%)</label>
                      <input
                        type="number"
                        value={discountPercentage}
                        onChange={(e) => setDiscountPercentage(e.target.value)}
                        placeholder="20"
                        min="0"
                        max="100"
                        step="0.1"
                        className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">Fixed Discount Price</label>
                      <div className="flex gap-2">
                        <Select value={currency} onValueChange={() => {}}>
                          <SelectTrigger className="w-20">
                            <SelectValue />
                          </SelectTrigger>
                        </Select>
                        <input
                          type="number"
                          value={discountPrice}
                          onChange={(e) => setDiscountPrice(e.target.value)}
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          className="flex-1 px-3 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">Start Date</label>
                        <input
                          type="datetime-local"
                          value={discountStartDate}
                          onChange={(e) => setDiscountStartDate(e.target.value)}
                          className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">End Date</label>
                        <input
                          type="datetime-local"
                          value={discountEndDate}
                          onChange={(e) => setDiscountEndDate(e.target.value)}
                          className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Checkbox checked={isOnSale} onCheckedChange={() => setIsOnSale((prev) => !prev)} />
                      <span className="text-sm text-neutral-700">Mark as On Sale</span>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button type="button" className="inline-flex">
                            <HelpCircle className="w-4 h-4 text-neutral-400 hover:text-neutral-600 cursor-help" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                          <p className="text-sm text-neutral-600">
                            <strong>On Sale:</strong> This product will be prominently displayed as on sale. You can set either a percentage discount or a fixed discounted price.
                          </p>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-neutral-200" />

              {/* Additional Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Colors</label>
                    <ColorPicker value={colors} onChange={setColors} maxColors={10} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Material</label>
                    <Select value={material} onValueChange={setMaterial}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select material" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60 overflow-y-auto">
                        <SelectItem value="Cotton">Cotton</SelectItem>
                        <SelectItem value="Polyester">Polyester</SelectItem>
                        <SelectItem value="Wool">Wool</SelectItem>
                        <SelectItem value="Silk">Silk</SelectItem>
                        <SelectItem value="Linen">Linen</SelectItem>
                        <SelectItem value="Denim">Denim</SelectItem>
                        <SelectItem value="Leather">Leather</SelectItem>
                        <SelectItem value="Satin">Satin</SelectItem>
                        <SelectItem value="Velvet">Velvet</SelectItem>
                        <SelectItem value="Chiffon">Chiffon</SelectItem>
                        <SelectItem value="Lace">Lace</SelectItem>
                        <SelectItem value="Spandex">Spandex</SelectItem>
                        <SelectItem value="Nylon">Nylon</SelectItem>
                        <SelectItem value="Rayon">Rayon</SelectItem>
                        <SelectItem value="Acrylic">Acrylic</SelectItem>
                        <SelectItem value="Cashmere">Cashmere</SelectItem>
                        <SelectItem value="Mohair">Mohair</SelectItem>
                        <SelectItem value="Angora">Angora</SelectItem>
                        <SelectItem value="Tulle">Tulle</SelectItem>
                        <SelectItem value="Organza">Organza</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Care Instructions</label>
                    <textarea
                      value={careInstructions}
                      onChange={(e) => setCareInstructions(e.target.value)}
                      rows={3}
                      placeholder="Washing and care guidelines"
                      className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 resize-none"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-3">Options</label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <Checkbox checked={isUnisex} onCheckedChange={() => setIsUnisex((prev) => !prev)} />
                          <span className="text-neutral-700">Unisex</span>
                        </label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <button type="button" className="inline-flex">
                              <HelpCircle className="w-4 h-4 text-neutral-400 hover:text-neutral-600 cursor-help" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80">
                            <p className="text-sm text-neutral-600">
                              <strong>Unisex:</strong> This product can be worn by both men and women. It will appear in search results for all genders.
                            </p>
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <Checkbox checked={isCustomizable} onCheckedChange={() => setIsCustomizable((prev) => !prev)} />
                          <span className="text-neutral-700">Customizable</span>
                        </label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <button type="button" className="inline-flex" >
                              <HelpCircle className="w-4 h-4 text-neutral-400 hover:text-neutral-600 cursor-help" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80">
                            <p className="text-sm text-neutral-600">
                              <strong>Customizable:</strong> Customers can request customizations like different colors, sizes, or modifications. You&apos;ll receive customization requests through the platform.
                            </p>
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <Checkbox checked={submittedForShowcase} onCheckedChange={() => setSubmittedForShowcase((prev) => !prev)} />
                          <span className="text-neutral-700">Request showcase approval</span>
                        </label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <button type="button" className="inline-flex" >
                              <HelpCircle className="w-4 h-4 text-neutral-400 hover:text-neutral-600 cursor-help" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80">
                            <p className="text-sm text-neutral-600">
                              <strong>Request showcase approval:</strong> Submit your product for review by super administrators. If approved, your product will be featured prominently on the platform, increasing visibility and potential sales. You can check the status in the Showcase section.
                            </p>
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <Checkbox checked={isShipped} onCheckedChange={() => setIsShipped((prev) => !prev)} />
                          <span className="text-neutral-700">Custom order (shipped)</span>
                        </label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <button type="button" className="inline-flex" >
                              <HelpCircle className="w-4 h-4 text-neutral-400 hover:text-neutral-600 cursor-help" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80">
                            <p className="text-sm text-neutral-600">
                              <strong>Custom order (shipped):</strong> This is a made-to-order item that will be produced after purchase. You&apos;ll need to provide an estimated delivery time, and stock quantity won&apos;t be required.
                            </p>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </div>

                  {isShipped && (
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">Estimated Delivery (days)</label>
                      <input
                        type="number"
                        name="estimatedArrivalTime"
                        placeholder="7"
                        min={1}
                        required={isShipped}
                        className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-3">Tags</label>
                    <div className="flex flex-wrap gap-2">
                      {["LIMITED_EDITION", "HANDMADE", "CUSTOM_MADE"].map((tag) => (
                        <label
                          key={tag}
                          className={`px-3 py-1.5 border rounded text-xs cursor-pointer transition-colors ${
                            selectedTags.includes(tag as ProductTag)
                              ? 'border-neutral-900 bg-neutral-900 text-white'
                              : 'border-neutral-300 hover:border-neutral-400'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedTags.includes(tag as ProductTag)}
                            onChange={() => handleTagSelection(tag as ProductTag)}
                            className="hidden"
                          />
                          {tag.replace('_', ' ')}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-neutral-200 px-8 py-4 bg-neutral-50 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-neutral-900 text-white text-sm font-medium rounded hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Adding...' : 'Add Product'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddProductPage;