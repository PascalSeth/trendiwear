"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Clock, DollarSign, ImageIcon, Save, Sparkles, Upload, X, Loader2, Plus, Trash2, HelpCircle } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";

type ServiceCategory = {
  id: string;
  name: string;
};

export default function EditServicePage() {
  const router = useRouter();
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [serviceImages, setServiceImages] = useState<string[]>([]);
  interface ServiceAddon {
    id?: string;
    name: string;
    price: string;
    description: string;
    isActive: boolean;
  }
  interface ServiceRequirement {
    id?: string;
    question: string;
    type: string;
    isRequired: boolean;
    options: string[];
  }
  const [serviceAddons, setServiceAddons] = useState<ServiceAddon[]>([]);
  const [serviceRequirements, setServiceRequirements] = useState<ServiceRequirement[]>([]);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    categoryId: "",
    description: "",
    price: "",
    duration: "",
    isHomeService: false,
    requirements: "",
    isActive: true,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch categories matching specialization
        const meRes = await fetch("/api/me");
        let specializationId = "";
        if (meRes.ok) {
          const meData = await meRes.json();
          specializationId = meData.user?.professionalProfile?.specializationId || "";
        }

        const catRes = await fetch(`/api/service-categories?dashboard=true&professionalTypeId=${specializationId}`);
        if (catRes.ok) {
          const catData = await catRes.json();
          setCategories(catData);
        }

        // Fetch service data with rich fields
        const svcRes = await fetch(`/api/services/${id}`);
        if (!svcRes.ok) throw new Error("Failed to fetch service");
        const data = await svcRes.json();

        setFormData({
          name: data.name,
          categoryId: data.categoryId,
          description: data.description || "",
          price: data.price.toString(),
          duration: data.duration.toString(),
          isHomeService: data.isHomeService,
          requirements: data.requirements || "",
          isActive: data.isActive,
        });

        if (data.imageUrl) setImagePreview(data.imageUrl);
        
        // Populate new enhancement fields
        if (data.images) setServiceImages(data.images.map((img: { url: string }) => img.url));
        if (data.addons) setServiceAddons(data.addons);
        if (data.customRequirements) setServiceRequirements(data.customRequirements);

      } catch (error) {
        console.error("Error:", error);
        alert("Could not load service data");
        router.back();
      } finally {
        setIsFetching(false);
      }
    };
    fetchData();
  }, [id, router]);

  const handleImageUpload = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", "images");
    formData.append("folder", "services");

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Image upload failed");
    }

    const { url } = await response.json();
    return url;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingGallery(true);
    try {
      const uploadPromises = Array.from(files).map(file => handleImageUpload(file));
      const urls = await Promise.all(uploadPromises);
      setServiceImages(prev => [...prev, ...urls]);
    } catch (error) {
      console.error("Gallery upload failed:", error);
      alert("Failed to upload some images");
    } finally {
      setIsUploadingGallery(false);
    }
  };

  const removeGalleryImage = (index: number) => {
    setServiceImages(prev => prev.filter((_, i) => i !== index));
  };

  const addAddon = () => {
    setServiceAddons(prev => [...prev, { name: "", price: "", description: "", isActive: true }]);
  };

  const updateAddon = (index: number, field: string, value: string | boolean) => {
    const updated = [...serviceAddons];
    updated[index] = { ...updated[index], [field]: value } as ServiceAddon;
    setServiceAddons(updated);
  };

  const removeAddon = (index: number) => {
    setServiceAddons(prev => prev.filter((_, i) => i !== index));
  };

  const addRequirement = () => {
    setServiceRequirements(prev => [...prev, { question: "", type: "TEXT", isRequired: true, options: [] }]);
  };

  const updateRequirement = (index: number, field: string, value: string | boolean | string[]) => {
    const updated = [...serviceRequirements];
    updated[index] = { ...updated[index], [field]: value } as ServiceRequirement;
    setServiceRequirements(updated);
  };

  const removeRequirement = (index: number) => {
    setServiceRequirements(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.categoryId || !formData.price || !formData.duration) {
      alert("Required fields are missing");
      return;
    }

    setIsLoading(true);

    try {
      let imageUrl = imagePreview || undefined;

      if (imageFile) {
        imageUrl = await handleImageUpload(imageFile);
      }

      const serviceData = {
        name: formData.name,
        categoryId: formData.categoryId,
        description: formData.description || undefined,
        price: parseFloat(formData.price),
        duration: parseInt(formData.duration),
        imageUrl,
        isHomeService: formData.isHomeService,
        requirements: formData.requirements || undefined,
        isActive: formData.isActive,
        // New rich features
        serviceImages,
        serviceAddons,
        serviceRequirements,
      };

      const response = await fetch(`/api/services/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(serviceData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update service");
      }

      router.push("/dashboard/services?tab=services");
      router.refresh();
    } catch (error) {
      console.error("Error updating service:", error);
      alert(error instanceof Error ? error.message : "Failed to update service");
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="h-10 w-10 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Loading service data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => router.back()}
              className="rounded-full hover:bg-slate-100"
            >
              <ArrowLeft className="h-5 w-5 text-slate-600" />
            </Button>
            <h1 className="text-xl font-bold text-slate-900">
              Edit Service
            </h1>
          </div>
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading || !formData.name.trim() || !formData.categoryId || !formData.price || !formData.duration}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 gap-2"
          >
            {isLoading ? "Saving..." : "Update Service"}
            {!isLoading && <Save size={16} />}
          </Button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 mt-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm mb-12">
            {/* Category selection */}
            <div className="space-y-3">
              <Label className="text-base font-bold text-slate-900">Category *</Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, categoryId: value }))}
              >
                <SelectTrigger className="h-12 bg-slate-50 border-slate-200 rounded-xl">
                  <SelectValue placeholder="Pick a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Service Name */}
            <div className="space-y-3">
              <Label htmlFor="name" className="text-base font-bold text-slate-900">Service Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Custom Suit Tailoring"
                className="h-12 bg-slate-50 border-slate-200 text-lg rounded-xl"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-3">
              <Label htmlFor="description" className="text-base font-bold text-slate-900">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="What exactly will you do for the customer?"
                className="bg-slate-50 border-slate-200 resize-none rounded-xl"
                rows={4}
              />
            </div>

            {/* Price & Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="space-y-3">
                <Label htmlFor="price" className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <DollarSign size={16} className="text-emerald-500" />
                  Price ($) *
                </Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
                  className="h-12 bg-slate-50 border-slate-200 rounded-xl"
                  required
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="duration" className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Clock size={16} className="text-blue-500" />
                  Duration (min) *
                </Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  value={formData.duration}
                  onChange={(e) => setFormData((prev) => ({ ...prev, duration: e.target.value }))}
                  className="h-12 bg-slate-50 border-slate-200 rounded-xl"
                  required
                />
              </div>
            </div>

            {/* Image */}
            {/* Service Image (Main) */}
            <div className="space-y-3 pt-6 border-t border-slate-100">
              <Label className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ImageIcon size={18} className="text-purple-500" />
                Main Service Image
              </Label>
              {imagePreview ? (
                <div className="relative w-full h-64 rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                  <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={removeImage}
                      className="rounded-full"
                    >
                      Change Photo
                    </Button>
                  </div>
                </div>
              ) : (
                <label htmlFor="image" className="block cursor-pointer">
                  <div className="border-2 border-dashed border-slate-200 rounded-2xl p-12 hover:border-indigo-300 hover:bg-slate-50/10 transition-all text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Upload className="h-6 w-6 text-slate-400" />
                    </div>
                    <p className="text-slate-600 font-bold">Click to upload a photo</p>
                  </div>
                  <input id="image" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
              )}
            </div>

            {/* Service Portfolio (Gallery) */}
            <div className="space-y-4 pt-6 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <Label className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ImageIcon size={18} className="text-indigo-500" />
                  Proof of Work Portfolio
                </Label>
                <p className="text-xs text-slate-500">Showcase samples of this specific service</p>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {serviceImages.map((url, idx) => (
                  <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group">
                    <Image src={url} alt={`Gallery ${idx}`} fill className="object-cover" />
                    <button
                      type="button"
                      onClick={() => removeGalleryImage(idx)}
                      className="absolute top-1 right-1 p-1 bg-white/90 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                
                <label className="aspect-square rounded-xl border-2 border-dashed border-slate-200 hover:border-indigo-300 hover:bg-slate-50 transition-all flex flex-col items-center justify-center cursor-pointer">
                  {isUploadingGallery ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-600 border-t-transparent" />
                  ) : (
                    <>
                      <Plus className="h-6 w-6 text-slate-400 mb-1" />
                      <span className="text-[10px] font-bold text-slate-500 text-center">ADD MORE</span>
                    </>
                  )}
                  <input type="file" multiple accept="image/*" onChange={handleGalleryUpload} className="hidden" />
                </label>
              </div>
            </div>

            {/* Service Add-ons (Upselling) */}
            <div className="space-y-4 pt-6 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <Label className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles size={18} className="text-amber-500" />
                  Upsell Add-ons
                </Label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={addAddon}
                  className="rounded-full border-indigo-100 text-indigo-600 hover:bg-indigo-50 h-8 gap-1"
                >
                  <Plus size={14} /> Add Option
                </Button>
              </div>

              {serviceAddons.length === 0 ? (
                <div className="p-8 border border-dashed border-slate-200 rounded-2xl text-center bg-slate-50/50">
                  <p className="text-sm text-slate-500">Offer extras like &quot;Express Delivery&quot; or &quot;Premium Materials&quot;</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {serviceAddons.map((addon, idx) => (
                    <motion.div 
                      key={idx} 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex gap-4 items-start"
                    >
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <Input 
                          placeholder="Name (e.g. Express Delivery)"
                          value={addon.name}
                          onChange={(e) => updateAddon(idx, 'name', e.target.value)}
                          className="bg-white border-slate-200 text-sm h-10 rounded-xl"
                        />
                        <div className="relative">
                          <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                          <Input 
                            type="number"
                            placeholder="Extra Price"
                            value={addon.price}
                            onChange={(e) => updateAddon(idx, 'price', e.target.value)}
                            className="bg-white border-slate-200 pl-8 text-sm h-10 rounded-xl"
                          />
                        </div>
                        <Input 
                          placeholder="Short description"
                          value={addon.description}
                          onChange={(e) => updateAddon(idx, 'description', e.target.value)}
                          className="bg-white border-slate-200 text-sm h-10 rounded-xl"
                        />
                      </div>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => removeAddon(idx)}
                        className="text-slate-400 hover:text-red-500 h-10 w-10"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Booking Requirements (Questions) */}
            <div className="space-y-4 pt-6 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <Label className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <HelpCircle size={18} className="text-blue-500" />
                  Booking Questions
                </Label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={addRequirement}
                  className="rounded-full border-indigo-100 text-indigo-600 hover:bg-indigo-50 h-8 gap-1"
                >
                  <Plus size={14} /> Add Question
                </Button>
              </div>

              {serviceRequirements.length === 0 ? (
                <div className="p-8 border border-dashed border-slate-200 rounded-2xl text-center bg-slate-50/50">
                  <p className="text-sm text-slate-500">Ask customers for things like measurements or event dates</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {serviceRequirements.map((req, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1 space-y-3">
                          <Input 
                            placeholder="e.g. What are your head measurements?"
                            value={req.question}
                            onChange={(e) => updateRequirement(idx, 'question', e.target.value)}
                            className="bg-slate-50 border-none font-bold text-slate-900 rounded-xl"
                          />
                          <div className="flex flex-wrap gap-4 items-center">
                            <Select 
                              value={req.type}
                              onValueChange={(val) => updateRequirement(idx, 'type', val)}
                            >
                              <SelectTrigger className="w-40 h-9 bg-slate-50 border-none text-xs rounded-lg">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="TEXT">Text Answer</SelectItem>
                                <SelectItem value="MULTIPLE_CHOICE">Multiple Choice</SelectItem>
                                <SelectItem value="YES_NO">Yes/No</SelectItem>
                              </SelectContent>
                            </Select>
                            
                            <div className="flex items-center gap-2">
                              <Switch 
                                checked={req.isRequired}
                                onCheckedChange={(val) => updateRequirement(idx, 'isRequired', val)}
                                className="scale-75"
                              />
                              <span className="text-xs text-slate-500 font-bold">Required</span>
                            </div>

                            <Button 
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeRequirement(idx)}
                              className="text-red-400 hover:text-red-600 hover:bg-red-50 ml-auto h-8 px-2"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                          
                          {req.type === "MULTIPLE_CHOICE" && (
                            <div className="space-y-2 pt-2 border-t border-slate-50">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Choices (Comma separated)</p>
                              <Input 
                                placeholder="Choice 1, Choice 2, Choice 3"
                                value={req.options.join(", ")}
                                onChange={(e) => updateRequirement(idx, 'options', e.target.value.split(",").map(s => s.trim()))}
                                className="bg-slate-50 border-none text-xs h-9 rounded-lg"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Toggles */}
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-slate-900 font-bold text-sm">Home Service</Label>
                  <p className="text-xs text-slate-500">I can travel to the customer&apos;s location.</p>
                </div>
                <Switch
                  checked={formData.isHomeService}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isHomeService: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-slate-900 font-bold text-sm">Active</Label>
                  <p className="text-xs text-slate-500">Show this service to customers.</p>
                </div>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isActive: checked }))}
                />
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
