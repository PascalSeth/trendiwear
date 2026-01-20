"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Upload, ChevronDown, Check, Instagram, Linkedin } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import LocationPicker from "@/app/components/LocationPicker";
import { cn } from "@/lib/utils";

// --- Types ---
interface SocialMedia {
  platform: string;
  url: string;
}

interface ProfessionalType {
  id: string;
  name: string;
  description?: string;
}

export default function RegisterProfessionalForm() {
  // --- State (Preserved) ---
  const [formData, setFormData] = useState({
    businessName: "",
    experience: 0,
    bio: "",
    portfolioUrl: "",
    spotlightVideoUrl: "",
    availability: "",
    freeDeliveryThreshold: 0,
  });

  const [selectedSpecialization, setSelectedSpecialization] = useState<string>("");
  const [socialMedia, setSocialMedia] = useState<SocialMedia[]>([{ platform: "", url: "" }]);
  const [businessImage, setBusinessImage] = useState<File | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [professionalTypes, setProfessionalTypes] = useState<ProfessionalType[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationAddress, setLocationAddress] = useState<string>("");

  // --- Fetch Logic (Preserved) ---
  useEffect(() => {
    const fetchProfessionalTypes = async () => {
      try {
        const response = await fetch('/api/professional-types');
        if (response.ok) {
          const types = await response.json();
          setProfessionalTypes(types);
        }
      } catch (error) {
        console.error('Error fetching professional types:', error);
      } finally {
        setLoadingTypes(false);
      }
    };

    fetchProfessionalTypes();
  }, []);

  // --- Form Logic (Preserved) ---
  const handleImageUpload = async (file: File) => {
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('bucket', 'images');
      uploadFormData.append('folder', 'business-images');
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData
      });
      
      if (!response.ok) throw new Error('Upload failed');
      const { url } = await response.json();
      return url;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const updateSocialMedia = (index: number, field: keyof SocialMedia, value: string) => {
    const updated = [...socialMedia];
    updated[index] = { ...updated[index], [field]: value };
    setSocialMedia(updated);
  };

  const handleLocationChange = (lat: number, lng: number, address: string) => {
    setLatitude(lat);
    setLongitude(lng);
    setLocationAddress(address);
  };

  const handleSubmit = async () => {
    try {
      if (!formData.businessName.trim()) {
        alert('Business name is required');
        setCurrentStep(1);
        return;
      }
      if (!selectedSpecialization) {
        alert('Please select a specialization');
        setCurrentStep(1);
        return;
      }

      let businessImageUrl = "";
      if (businessImage) {
        businessImageUrl = await handleImageUpload(businessImage);
      }

      const profileData = {
        businessName: formData.businessName,
        businessImage: businessImageUrl,
        specializationId: selectedSpecialization,
        experience: formData.experience,
        bio: formData.bio || undefined,
        portfolioUrl: formData.portfolioUrl || undefined,
        spotlightVideoUrl: formData.spotlightVideoUrl || undefined,
        latitude,
        longitude,
        location: locationAddress,
        availability: formData.availability || undefined,
        freeDeliveryThreshold: formData.freeDeliveryThreshold || undefined,
        socialMedia: socialMedia.filter(sm => sm.platform && sm.url).map(sm => ({
          platform: sm.platform.toUpperCase(),
          url: sm.url
        }))
      };

      const response = await fetch('/api/professional-profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      });

      if (!response.ok) throw new Error('Failed to create profile');
      await response.json();
      const isUpdate = response.status === 200;
      alert(`Profile ${isUpdate ? 'updated' : 'created'} successfully!`);
      
    } catch (error) {
      console.error('Registration error:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 2));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  // --- Animation Variants ---
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 50 : -50,
      opacity: 0,
    }),
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans selection:bg-stone-900 selection:text-white overflow-hidden">
      
      {/* Subtle Grid Pattern */}
      <div className="fixed inset-0 z-0 opacity-30 pointer-events-none" 
        style={{ backgroundImage: 'linear-gradient(#d6d3d1 1px, transparent 1px), linear-gradient(90deg, #d6d3d1 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      </div>

      <div className="relative z-10 flex min-h-screen">
        
        {/* LEFT PANEL: Editorial Visual (Light Mode) */}
        <div className="hidden lg:flex lg:w-5/12 relative overflow-hidden border-r border-stone-200">
          {/* Background Image */}
          <div className="absolute inset-0">
            <Image
              src="https://images.unsplash.com/photo-1558171813-4c088753af8f?w=1200&q=80"
              alt="Fashion Atelier"
              fill
              className="object-cover opacity-90 grayscale hover:grayscale-0 transition-all duration-[2000ms]"
            />
            {/* White Gradient Overlay for Text Readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-stone-50 via-transparent to-transparent opacity-90"></div>
          </div>

          {/* Content Overlay */}
          <div className="relative z-10 p-12 flex flex-col justify-between h-full bg-white/10 backdrop-blur-[2px]">
            <div>
              <h1 className="text-6xl font-serif font-medium leading-tight text-stone-900 mb-6">
                Join the <br/> <span className="italic text-stone-600">Vanguard.</span>
              </h1>
              <p className="text-sm font-mono text-stone-500 tracking-widest uppercase border-l border-stone-900 pl-4">
                Professional Registration
              </p>
            </div>

            <div className="space-y-8">
              <div className="p-8 bg-white/80 backdrop-blur-md border border-stone-200 shadow-sm">
                <p className="text-lg font-serif italic text-stone-800 mb-4">
                  &apos;Trendizip gave my boutique the visibility it deserved.&apos;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-stone-200 rounded-full"></div>
                  <div className="text-xs font-mono uppercase tracking-wider text-stone-600">
                    Elena V., Designer
                  </div>
                </div>
              </div>
              
              <div className="flex gap-12 text-stone-600 font-mono text-xs">
                <div>
                  <div className="text-2xl text-stone-900 mb-1">10k+</div>
                  <div>Artisans</div>
                </div>
                <div>
                  <div className="text-2xl text-stone-900 mb-1">4.9</div>
                  <div>Rating</div>
                </div>
                <div>
                  <div className="text-2xl text-stone-900 mb-1">24/7</div>
                  <div>Support</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: The Form */}
        <div className="flex-1 flex flex-col relative">
          {/* Mobile Header */}
          <div className="lg:hidden p-6 border-b border-stone-200 flex justify-between items-center bg-stone-50">
            <span className="font-serif text-xl font-bold text-stone-900">Trendizip.</span>
            <span className="text-xs font-mono uppercase tracking-widest text-stone-500">Registration</span>
          </div>

          {/* Scrollable Form Area */}
          <div className="flex-1 overflow-y-auto px-6 py-12 lg:px-20 lg:py-20">
            <div className="max-w-xl mx-auto">
              
              {/* Progress Indicator */}
              <div className="flex items-center justify-between mb-16 font-mono text-xs tracking-widest text-stone-400">
                <span className={currentStep >= 1 ? "text-stone-900 transition-colors" : ""}>01. IDENTITY</span>
                <div className="h-px w-24 bg-stone-200 relative">
                  <motion.div 
                    className="absolute inset-0 bg-stone-900"
                    initial={{ width: "0%" }}
                    animate={{ width: currentStep === 2 ? "100%" : "0%" }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <span className={currentStep >= 2 ? "text-stone-900 transition-colors" : ""}>02. PORTFOLIO</span>
              </div>

              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={currentStep}
                  custom={currentStep}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    x: { type: "spring", stiffness: 300, damping: 30 },
                    opacity: { duration: 0.2 }
                  }}
                >
                  {/* STEP 1 */}
                  {currentStep === 1 && (
                    <div className="space-y-10">
                      <div className="space-y-1">
                        <h2 className="text-3xl font-serif text-stone-900 mb-2">Basic Identity</h2>
                        <p className="text-stone-500 text-sm">Tell us who you are.</p>
                      </div>

                      <div className="space-y-8">
                        <div className="group">
                          <Label className="text-xs font-mono uppercase tracking-widest text-stone-400 mb-2 block group-focus-within:text-stone-900 transition-colors">
                            Business Name
                          </Label>
                          <Input
                            value={formData.businessName}
                            onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                            placeholder="e.g. Maison Noir"
                            className="bg-transparent border-b border-stone-300 rounded-none px-0 py-3 text-lg text-stone-900 placeholder-stone-300 focus:border-stone-900 focus:ring-0"
                          />
                        </div>

                        <div className="group">
                          <Label className="text-xs font-mono uppercase tracking-widest text-stone-400 mb-2 block group-focus-within:text-stone-900 transition-colors">
                            Specialization
                          </Label>
                          <Select value={selectedSpecialization} onValueChange={setSelectedSpecialization} disabled={loadingTypes}>
                            <SelectTrigger className="bg-transparent border-b border-stone-300 rounded-none px-0 py-3 text-stone-900 focus:border-stone-900 focus:ring-0">
                              <SelectValue placeholder="Select your craft" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border border-stone-200 text-stone-900">
                              {professionalTypes.map((type) => (
                                <SelectItem key={type.id} value={type.id} className="hover:bg-stone-50 focus:bg-stone-50">
                                  {type.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                          <div className="group">
                            <Label className="text-xs font-mono uppercase tracking-widest text-stone-400 mb-2 block">Experience (Years)</Label>
                            <Input
                              type="number"
                              min="0"
                              value={formData.experience}
                              onChange={(e) => setFormData(prev => ({ ...prev, experience: parseInt(e.target.value) || 0 }))}
                              className="bg-transparent border-b border-stone-300 rounded-none px-0 py-3 text-stone-900 focus:border-stone-900 focus:ring-0"
                            />
                          </div>
                          <div className="group">
                            <Label className="text-xs font-mono uppercase tracking-widest text-stone-400 mb-2 block">Portfolio Image</Label>
                            <div className="relative">
                              <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setBusinessImage(e.target.files?.[0] || null)}
                                className="opacity-0 absolute inset-0 z-10 cursor-pointer"
                              />
                              <div className="border-b border-stone-300 py-3 flex items-center justify-between text-stone-500 group-focus-within:text-stone-900 transition-colors">
                                <span className="truncate">{businessImage ? businessImage.name : "Upload Image"}</span>
                                <Upload size={16} />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="group">
                           <Label className="text-xs font-mono uppercase tracking-widest text-stone-400 mb-2 block">Location</Label>
                           <div className="bg-white border border-stone-200 p-4 rounded-sm hover:border-stone-400 transition-colors shadow-sm">
                             <LocationPicker
                               latitude={latitude}
                               longitude={longitude}
                               location={locationAddress}
                               onLocationChange={handleLocationChange}
                             />
                           </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 2 */}
                  {currentStep === 2 && (
                    <div className="space-y-10">
                      <div className="space-y-1">
                        <h2 className="text-3xl font-serif text-stone-900 mb-2">Professional Details</h2>
                        <p className="text-stone-500 text-sm">The finer points of your craft.</p>
                      </div>

                      <div className="space-y-8">
                        <div className="group">
                          <Label className="text-xs font-mono uppercase tracking-widest text-stone-400 mb-2 block">Bio</Label>
                          <Textarea
                            value={formData.bio}
                            onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                            placeholder="Briefly describe your aesthetic..."
                            rows={4}
                            className="bg-transparent border-b border-stone-300 rounded-none px-0 py-3 text-stone-900 placeholder-stone-300 focus:border-stone-900 focus:ring-0 resize-none"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           <div className="group">
                              <Label className="text-xs font-mono uppercase tracking-widest text-stone-400 mb-2 block">Portfolio URL</Label>
                              <Input
                                type="url"
                                value={formData.portfolioUrl}
                                onChange={(e) => setFormData(prev => ({ ...prev, portfolioUrl: e.target.value }))}
                                className="bg-transparent border-b border-stone-300 rounded-none px-0 py-3 text-stone-900 placeholder-stone-300 focus:border-stone-900 focus:ring-0"
                              />
                           </div>
                           <div className="group">
                              <Label className="text-xs font-mono uppercase tracking-widest text-stone-400 mb-2 block">Spotlight Video</Label>
                              <Input
                                type="url"
                                value={formData.spotlightVideoUrl}
                                onChange={(e) => setFormData(prev => ({ ...prev, spotlightVideoUrl: e.target.value }))}
                                className="bg-transparent border-b border-stone-300 rounded-none px-0 py-3 text-stone-900 placeholder-stone-300 focus:border-stone-900 focus:ring-0"
                              />
                           </div>
                        </div>

                        {/* Advanced Toggle */}
                        <div className="pt-4">
                          <button
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="flex items-center gap-3 text-xs font-mono uppercase tracking-widest text-stone-500 hover:text-stone-900 transition-colors"
                          >
                            <span className={cn("transition-transform duration-300", showAdvanced ? "rotate-180" : "")}>
                              <ChevronDown size={14} />
                            </span>
                            {showAdvanced ? "Hide" : "Show"} Advanced Settings
                          </button>

                          <AnimatePresence>
                            {showAdvanced && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="overflow-hidden"
                              >
                                <div className="pt-6 space-y-6">
                                  <div className="group">
                                    <Label className="text-xs font-mono uppercase tracking-widest text-stone-400 mb-2 block">Availability</Label>
                                    <Input
                                      value={formData.availability}
                                      onChange={(e) => setFormData(prev => ({ ...prev, availability: e.target.value }))}
                                      placeholder="Mon-Fri, 9am - 6pm"
                                      className="bg-transparent border-b border-stone-300 rounded-none px-0 py-3 text-stone-900 placeholder-stone-300 focus:border-stone-900 focus:ring-0"
                                    />
                                  </div>

                                  <div className="group">
                                    <Label className="text-xs font-mono uppercase tracking-widest text-stone-400 mb-2 block">Primary Social</Label>
                                    <div className="flex gap-2">
                                      <Select value={socialMedia[0]?.platform} onValueChange={(val) => updateSocialMedia(0, 'platform', val)}>
                                        <SelectTrigger className="bg-transparent border-b border-stone-300 rounded-none px-0 w-1/3 text-stone-500 focus:text-stone-900 focus:border-stone-900 focus:ring-0">
                                          <SelectValue placeholder="Platform" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white border border-stone-200 text-stone-900">
                                          <SelectItem value="INSTAGRAM"><Instagram className="w-4 h-4 mr-2" /> Instagram</SelectItem>
                                          <SelectItem value="LINKEDIN"><Linkedin className="w-4 h-4 mr-2" /> LinkedIn</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <Input
                                        type="url"
                                        placeholder="Link"
                                        value={socialMedia[0]?.url}
                                        onChange={(e) => updateSocialMedia(0, 'url', e.target.value)}
                                        className="bg-transparent border-b border-stone-300 rounded-none px-0 flex-1 text-stone-900 placeholder-stone-300 focus:border-stone-900 focus:ring-0"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between mt-20 pt-8 border-t border-stone-200">
                <Button
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  variant="ghost"
                  className={cn(
                    "text-stone-400 hover:text-stone-900 font-mono text-sm uppercase tracking-widest transition-colors",
                    currentStep === 1 && "opacity-0 pointer-events-none"
                  )}
                >
                  Back
                </Button>

                {currentStep < 2 ? (
                  <Button
                    onClick={nextStep}
                    className="bg-stone-900 text-white hover:bg-stone-800 px-8 py-6 rounded-none font-mono text-sm uppercase tracking-widest transition-colors group"
                  >
                    Continue <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    className="bg-stone-900 text-white hover:bg-stone-800 px-8 py-6 rounded-none font-mono text-sm uppercase tracking-widest transition-colors group"
                  >
                    Create Profile <Check className="ml-2 w-4 h-4" />
                  </Button>
                )}
              </div>

              <div className="text-center mt-8">
                <p className="text-xs text-stone-400">
                  Already a member? <a href="#" className="text-stone-600 hover:text-stone-900 underline decoration-stone-300 underline-offset-4">Sign in</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}