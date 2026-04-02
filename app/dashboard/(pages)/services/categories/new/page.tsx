"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Upload, X, Sparkles, ImageIcon, Save, Check } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";

export default function NewServiceCategoryPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingRoles, setIsFetchingRoles] = useState(false);
  const [userRole, setUserRole] = useState<string>("CUSTOMER");
  interface ProfessionalType {
    id: string;
    name: string;
    isActive: boolean;
  }
  const [professionalTypes, setProfessionalTypes] = useState<ProfessionalType[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    selectedRoleIds: [] as string[],
  });

  const isAdmin = userRole === "ADMIN" || userRole === "SUPER_ADMIN";

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const meRes = await fetch("/api/me");
        if (meRes.ok) {
          const meData = await meRes.json();
          const role = meData.user?.role || "CUSTOMER";
          setUserRole(role);

          if (role === "ADMIN" || role === "SUPER_ADMIN") {
            setIsFetchingRoles(true);
            const rolesRes = await fetch("/api/professional-types");
            if (rolesRes.ok) {
              const rolesData = await rolesRes.json();
              setProfessionalTypes(rolesData);
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch initial data:", error);
      } finally {
        setIsFetchingRoles(false);
      }
    };
    fetchData();
  }, []);

  const handleImageUpload = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", "images");
    formData.append("folder", "service-categories");

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert("Category name is required");
      return;
    }

    setIsLoading(true);

    try {
      let imageUrl: string | undefined;

      if (imageFile) {
        imageUrl = await handleImageUpload(imageFile);
      }

      const categoryData = {
        name: formData.name,
        description: formData.description || undefined,
        imageUrl,
        isActive: true,
        professionalTypeIds: formData.selectedRoleIds,
      };

      const response = await fetch("/api/service-categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(categoryData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create category");
      }

      router.push("/dashboard/services?tab=categories");
      router.refresh();
    } catch (error) {
      console.error("Error creating category:", error);
      alert(error instanceof Error ? error.message : "Failed to create category");
    } finally {
      setIsLoading(false);
    }
  };

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
            <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-indigo-800 bg-clip-text text-transparent">
              Add New Category
            </h1>
          </div>
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading || !formData.name.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 gap-2"
          >
            {isLoading ? "Saving..." : "Save Category"}
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
          {/* Quick Tip */}
          <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-100 flex items-start gap-4">
            <div className="p-2 bg-white/20 rounded-xl">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="font-bold text-lg">What is a category?</h3>
              <p className="text-indigo-100 text-sm mt-1">
                Categories help customers find your services (e.g., &quot;Tailoring&quot;, &quot;Modeling&quot;, &quot;Styling&quot;). 
                Pick a clear name that anyone can understand!
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            {/* Category Name */}
            <div className="space-y-3">
              <Label htmlFor="name" className="text-base font-bold text-slate-900">
                Category Name *
              </Label>
              <p className="text-xs text-slate-500">Give your category a simple, easy name.</p>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Fashion Tailoring"
                className="h-12 bg-slate-50 border-slate-200 focus:bg-white text-lg rounded-xl"
                required
              />
            </div>

            {/* Role Selection (Admin only) */}
            {isAdmin && (
              <div className="space-y-4 p-6 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-indigo-100 rounded-lg text-indigo-600">
                    <Sparkles size={16} />
                  </div>
                  <Label className="text-base font-bold text-slate-900">
                    Who is this for? *
                  </Label>
                </div>
                <p className="text-xs text-slate-500 mb-4">
                  Select which professional roles should see this category.
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {professionalTypes.map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => {
                        const isSelected = formData.selectedRoleIds.includes(type.id);
                        setFormData(prev => ({
                          ...prev,
                          selectedRoleIds: isSelected
                            ? prev.selectedRoleIds.filter(id => id !== type.id)
                            : [...prev.selectedRoleIds, type.id]
                        }));
                      }}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                        formData.selectedRoleIds.includes(type.id)
                          ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100"
                          : "bg-white border-slate-200 text-slate-600 hover:border-indigo-300"
                      }`}
                    >
                      <span className="font-medium text-sm">{type.name}</span>
                      {formData.selectedRoleIds.includes(type.id) && <Check className="h-4 w-4" />}
                    </button>
                  ))}
                  {isFetchingRoles && (
                    <div className="col-span-full py-4 text-center text-sm text-slate-400">
                      Loading roles...
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Description */}
            <div className="space-y-3">
              <Label htmlFor="description" className="text-base font-bold text-slate-900">
                Description (Optional)
              </Label>
              <p className="text-xs text-slate-500">Briefly explain what&apos;s inside this category.</p>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Describe this category here..."
                className="bg-slate-50 border-slate-200 focus:bg-white resize-none rounded-xl"
                rows={4}
              />
            </div>

            {/* Image */}
            <div className="space-y-3">
              <Label className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ImageIcon size={18} className="text-indigo-500" />
                Category Image
              </Label>
              <p className="text-xs text-slate-500">A nice picture helps people choose your category.</p>
              
              {imagePreview ? (
                <div className="relative w-full h-64 rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                  <Image
                    src={imagePreview}
                    alt="Category preview"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={removeImage}
                      className="gap-2 rounded-full"
                    >
                      <X className="h-4 w-4" />
                      Remove Image
                    </Button>
                  </div>
                </div>
              ) : (
                <label htmlFor="image" className="block cursor-pointer">
                  <div className="border-2 border-dashed border-slate-200 rounded-2xl p-12 hover:border-indigo-300 hover:bg-indigo-50/10 transition-all text-center">
                    <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Upload className="h-6 w-6 text-indigo-600" />
                    </div>
                    <p className="text-slate-600 font-bold text-lg">
                      Click to upload a photo
                    </p>
                    <p className="text-sm text-slate-400 mt-2">
                      JPEG, PNG or WebP (Max 5MB)
                    </p>
                  </div>
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
