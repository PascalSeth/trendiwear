"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Upload, ChevronDown, Check, Instagram, Linkedin, Scissors, Palette, Store, Sparkles, Layers, Camera, User, Info, Facebook, Globe } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import LocationPicker from "@/app/components/LocationPicker";
import { toast } from "sonner";
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
  _count?: {
    professionals: number;
  };
}

interface DayHours {
  enabled: boolean;
  open: string;
  close: string;
}

interface BusinessHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

const DEFAULT_HOURS: BusinessHours = {
  monday: { enabled: true, open: '09:00', close: '17:00' },
  tuesday: { enabled: true, open: '09:00', close: '17:00' },
  wednesday: { enabled: true, open: '09:00', close: '17:00' },
  thursday: { enabled: true, open: '09:00', close: '17:00' },
  friday: { enabled: true, open: '09:00', close: '17:00' },
  saturday: { enabled: false, open: '09:00', close: '17:00' },
  sunday: { enabled: false, open: '09:00', close: '17:00' },
};

const DAY_LABELS: Record<keyof BusinessHours, string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
};

export default function RegisterProfessionalForm() {
  // --- State (Preserved) ---
  const [formData, setFormData] = useState({
    businessName: "",
    experience: 0,
    bio: "",
    portfolioUrl: "",
    spotlightVideoUrl: "",
    availability: JSON.stringify(DEFAULT_HOURS),
    freeDeliveryThreshold: 0,
    momoNumber: "",
    momoProvider: "",
  });

  const [businessHours, setBusinessHours] = useState<BusinessHours>(DEFAULT_HOURS);

  const [selectedSpecialization, setSelectedSpecialization] = useState<string>("");
  const [socialMedia, setSocialMedia] = useState<SocialMedia[]>([{ platform: "", url: "" }]);
  const [businessImage, setBusinessImage] = useState<File | null>(null);
  const [businessImagePreview, setBusinessImagePreview] = useState<string>("");
  const [currentStep, setCurrentStep] = useState(1);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [professionalTypes, setProfessionalTypes] = useState<ProfessionalType[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [momoProviders, setMomoProviders] = useState<{ code: string; displayName: string }[]>([])
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationAddress, setLocationAddress] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMomoInfo, setShowMomoInfo] = useState(false);

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

    const fetchMomoProviders = async () => {
      try {
        const res = await fetch('/api/payments/momo-providers')
        if (res.ok) {
          const data = await res.json()
          const list = (data.providers || data.fallbackProviders || []).map((p: { code?: string; displayName?: string; name?: string }) => ({ code: p.code || '', displayName: p.displayName || p.name || '' }))
          setMomoProviders(list)
        }
      } catch (err) {
        console.error('Failed to fetch momo providers', err)
      } finally {
        // finished
      }
    }

    fetchMomoProviders()
  }, []);

  useEffect(() => {
    if (!businessImage) {
      setBusinessImagePreview("");
      return;
    }
    const objectUrl = URL.createObjectURL(businessImage);
    setBusinessImagePreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [businessImage]);

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

  const updateBusinessHours = (day: keyof BusinessHours, updates: Partial<DayHours>) => {
    const newHours = {
      ...businessHours,
      [day]: { ...businessHours[day], ...updates }
    };
    setBusinessHours(newHours);
    setFormData(prev => ({ ...prev, availability: JSON.stringify(newHours) }));
  };

  const applyPreset = (preset: '9-5' | '24/7' | 'closed') => {
    const newHours = { ...businessHours };
    if (preset === '9-5') {
      Object.keys(newHours).forEach(day => {
        newHours[day as keyof BusinessHours] = { enabled: !['saturday', 'sunday'].includes(day), open: '09:00', close: '17:00' };
      });
    } else if (preset === '24/7') {
      Object.keys(newHours).forEach(day => {
        newHours[day as keyof BusinessHours] = { enabled: true, open: '00:00', close: '23:59' };
      });
    }
    setBusinessHours(newHours);
    setFormData(prev => ({ ...prev, availability: JSON.stringify(newHours) }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      if (!formData.businessName.trim()) {
        toast.error('Business name is required');
        setCurrentStep(1);
        setIsSubmitting(false);
        return;
      }
      if (!selectedSpecialization) {
        toast.error('Please select a specialization');
        setCurrentStep(1);
        setIsSubmitting(false);
        return;
      }
      
      if ((formData.momoNumber && !formData.momoProvider) || (!formData.momoNumber && formData.momoProvider)) {
        toast.error('Both Mobile Money Provider and Number are required if you want to set up payouts.');
        setIsSubmitting(false);
        return;
      }

      // 1. Submit Profile Data First
      const profileData = {
        businessName: formData.businessName,
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
        })),
        ...(formData.momoNumber ? { momoNumber: formData.momoNumber } : {}),
        ...(formData.momoProvider ? { momoProvider: formData.momoProvider } : {}),
      };

      const response = await fetch('/api/professional-profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create profile. Please check your inputs.');
      }
      
      const profileResult = await response.json();
      const profileId = profileResult.id;

      // 2. Upload Image and Update Profile if Successful
      if (businessImage && profileId) {
        try {
          const businessImageUrl = await handleImageUpload(businessImage);
          await fetch(`/api/professional-profiles/${profileId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ businessImage: businessImageUrl })
          });
        } catch (imgError) {
          console.error("Image upload failed, but profile was created", imgError);
          toast.warning("Profile created, but image upload failed. You can upload it later in Settings.");
        }
      }

      // 3. Initialize trial for new professional
      if (profileId) {
        try {
          const trialResponse = await fetch('/api/subscriptions/trial/setup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ professionalId: profileId })
          });

          if (!trialResponse.ok) console.error('Failed to initialize trial');
        } catch (trialError) {
          console.error('Trial setup error:', trialError);
        }
      }

      const isUpdate = response.status === 200;
      toast.success(`Profile ${isUpdate ? 'updated' : 'created'} successfully!`);

    } catch (error) {
      console.error('Registration error:', error);
      toast.error(`${error instanceof Error ? error.message : 'An unknown error occurred'}`);
    } finally {
      setIsSubmitting(false)
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
    <div className="min-h-screen pt-20 bg-stone-50 text-stone-900 font-sans selection:bg-stone-900 selection:text-white overflow-hidden">

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
                Join the <br /> <span className="italic text-stone-600">Vanguard.</span>
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

                        <div className="space-y-4">
                          <Label className="text-xs font-mono uppercase tracking-widest text-stone-400 mb-2 block group-focus-within:text-stone-900 transition-colors">
                            Specialization
                          </Label>
                          {loadingTypes ? (
                            <div className="flex items-center justify-center p-12 border border-dashed border-stone-200">
                              <span className="text-xs font-mono animate-pulse">Loading crafts...</span>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 gap-4">
                              {professionalTypes.map((type) => {
                                // Map icons based on name
                                let Icon = User;
                                const name = type.name.toLowerCase();
                                if (name.includes('tailor')) Icon = Scissors;
                                else if (name.includes('designer')) Icon = Palette;
                                else if (name.includes('boutique')) Icon = Store;
                                else if (name.includes('stylist')) Icon = Sparkles;
                                else if (name.includes('fabric') || name.includes('lace')) Icon = Layers;
                                else if (name.includes('model')) Icon = User;
                                else if (name.includes('photographer')) Icon = Camera;

                                const isSelected = selectedSpecialization === type.id;

                                return (
                                  <motion.div
                                    key={type.id}
                                    whileHover={{ y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setSelectedSpecialization(type.id)}
                                    className={cn(
                                      "relative flex items-start gap-4 p-5 cursor-pointer transition-all duration-300 border",
                                      isSelected
                                        ? "bg-stone-900 border-stone-900 shadow-lg"
                                        : "bg-white border-stone-200 hover:border-stone-400 hover:shadow-md"
                                    )}
                                  >
                                    <div className={cn(
                                      "flex-shrink-0 w-12 h-12 flex items-center justify-center transition-colors",
                                      isSelected ? "text-stone-200" : "text-stone-900 bg-stone-50"
                                    )}>
                                      <Icon size={24} strokeWidth={1.5} />
                                    </div>
                                    <div className="flex-1 pr-6">
                                      <div className="flex items-center gap-2 mb-1">
                                        <h3 className={cn(
                                          "text-sm font-serif font-medium",
                                          isSelected ? "text-white" : "text-stone-900"
                                        )}>
                                          {type.name}
                                        </h3>
                                        {type._count && type._count.professionals > 5 && (
                                          <span className={cn(
                                            "text-[10px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded-full",
                                            isSelected ? "bg-stone-700 text-stone-200" : "bg-stone-100 text-stone-500"
                                          )}>
                                            Popular
                                          </span>
                                        )}
                                      </div>
                                      <p className={cn(
                                        "text-xs leading-relaxed",
                                        isSelected ? "text-stone-400" : "text-stone-500"
                                      )}>
                                        {type.description}
                                      </p>
                                    </div>
                                    {isSelected && (
                                      <motion.div
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="absolute top-4 right-4 text-stone-200"
                                      >
                                        <Check size={16} strokeWidth={3} />
                                      </motion.div>
                                    )}
                                  </motion.div>
                                );
                              })}
                            </div>
                          )}
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
                            <Label className="text-xs font-mono uppercase tracking-widest text-stone-400 mb-4 block">Portfolio Archive</Label>
                            <div className="relative group/upload">
                              {businessImagePreview ? (
                                <motion.div 
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  className="relative aspect-video rounded-3xl overflow-hidden border border-stone-200 shadow-sm"
                                >
                                  <Image src={businessImagePreview} alt="Preview" fill className="object-cover transition-transform duration-700 group-hover/upload:scale-105" />
                                  <div className="absolute inset-0 bg-stone-900/40 opacity-0 group-hover/upload:opacity-100 transition-all flex items-center justify-center">
                                    <Button variant="outline" className="text-white border-white hover:bg-white hover:text-stone-900 rounded-full px-6 font-mono text-[10px] uppercase tracking-widest pointer-events-none">
                                      Change Image
                                    </Button>
                                  </div>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setBusinessImage(e.target.files?.[0] || null)}
                                    className="opacity-0 absolute inset-0 z-10 cursor-pointer"
                                  />
                                </motion.div>
                              ) : (
                                <div className="border border-dashed border-stone-300 rounded-3xl p-12 transition-all hover:border-stone-900 group-focus-within:border-stone-900 bg-stone-50/50 flex flex-col items-center justify-center gap-4 text-center cursor-pointer relative">
                                  <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-stone-400 group-hover:text-stone-900 transition-colors">
                                    <Upload size={20} />
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-sm font-serif text-stone-600">Select Portfolio Masterpiece</p>
                                    <p className="text-[10px] font-mono text-stone-400 uppercase tracking-widest">PNG, JPG up to 10MB</p>
                                  </div>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setBusinessImage(e.target.files?.[0] || null)}
                                    className="opacity-0 absolute inset-0 z-10 cursor-pointer"
                                  />
                                </div>
                              )}
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

                          <div className="group space-y-3">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs font-mono uppercase tracking-widest text-stone-400 block">Mobile Money Provider</Label>
                              <button
                                type="button"
                                onClick={() => setShowMomoInfo(!showMomoInfo)}
                                className="text-[10px] font-bold text-stone-900 flex items-center gap-1 hover:text-stone-600 transition-colors"
                              >
                                <Info size={12} className={cn("transition-transform", showMomoInfo ? "scale-110" : "")} />
                                Why is this needed?
                              </button>
                            </div>

                            <AnimatePresence>
                              {showMomoInfo && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="bg-stone-100/50 border border-stone-200 p-4 rounded-xl text-xs text-stone-500 leading-relaxed mb-4">
                                    <p className="font-semibold text-stone-900 mb-2">Automated Payouts via Paystack</p>
                                    TrendiWear uses your Mobile Money details to automate your earnings. When a customer buys your product or books a service, your money is automatically deposited into this account through our secure payment partner, Paystack.
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>

                            <div className="bg-transparent border-b border-stone-300 rounded-none px-0 py-3">
                              <select
                                value={formData.momoProvider}
                                onChange={(e) => setFormData(prev => ({ ...prev, momoProvider: e.target.value }))}
                                className="w-full bg-transparent text-stone-900 outline-none"
                              >
                                <option value="">Select provider (optional)</option>
                                {momoProviders.map(p => (
                                  <option key={p.code} value={p.code}>{p.displayName}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="group">
                            <Label className="text-xs font-mono uppercase tracking-widest text-stone-400 mb-2 block">Mobile Money Number</Label>
                            <Input
                              type="tel"
                              value={formData.momoNumber}
                              onChange={(e) => setFormData(prev => ({ ...prev, momoNumber: e.target.value }))}
                              placeholder="e.g. 0241234567 (optional)"
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
                                  <div className="group space-y-6">
                                     <div className="flex items-center justify-between">
                                        <Label className="text-xs font-mono uppercase tracking-widest text-stone-400 block">Availability Registry</Label>
                                        <div className="flex gap-2">
                                          <button 
                                            type="button"
                                            onClick={() => applyPreset('9-5')}
                                            className="text-[10px] font-mono px-2 py-1 bg-stone-100 border border-stone-200 hover:border-stone-400 transition-colors uppercase tracking-widest"
                                          >
                                            Weekdays
                                          </button>
                                          <button 
                                            type="button"
                                            onClick={() => applyPreset('24/7')}
                                            className="text-[10px] font-mono px-2 py-1 bg-stone-100 border border-stone-200 hover:border-stone-400 transition-colors uppercase tracking-widest"
                                          >
                                            24/7
                                          </button>
                                        </div>
                                     </div>
                                     
                                     <div className="space-y-4">
                                        <div className="flex justify-between items-center gap-2 mb-8">
                                          {(Object.keys(businessHours) as Array<keyof BusinessHours>).map((day) => (
                                            <button
                                              key={day}
                                              type="button"
                                              onClick={() => updateBusinessHours(day, { enabled: !businessHours[day].enabled })}
                                              className={cn(
                                                "w-10 h-10 rounded-full text-[10px] font-bold transition-all border flex items-center justify-center",
                                                businessHours[day].enabled 
                                                  ? "bg-stone-900 border-stone-900 text-stone-100 shadow-md scale-110" 
                                                  : "bg-white border-stone-200 text-stone-400"
                                              )}
                                            >
                                              {DAY_LABELS[day]}
                                            </button>
                                          ))}
                                        </div>

                                        <div className="grid grid-cols-1 gap-3">
                                          {(Object.keys(businessHours) as Array<keyof BusinessHours>).filter(d => businessHours[d].enabled).map((day) => (
                                            <motion.div 
                                              key={day} 
                                              initial={{ opacity: 0, x: -10 }}
                                              animate={{ opacity: 1, x: 0 }}
                                              className="flex items-center justify-between p-4 bg-stone-50 border border-stone-100 rounded-2xl"
                                            >
                                              <span className="text-xs font-mono uppercase tracking-widest text-stone-900 font-bold w-12">{DAY_LABELS[day]}</span>
                                              <div className="flex items-center gap-2">
                                                <select 
                                                  value={businessHours[day].open}
                                                  onChange={(e) => updateBusinessHours(day, { open: e.target.value })}
                                                  className="bg-transparent text-[11px] font-mono border-b border-stone-200 focus:border-stone-900 outline-none"
                                                >
                                                  {Array.from({ length: 24 }).map((_, i) => {
                                                    const hour = i.toString().padStart(2, '0') + ':00';
                                                    return <option key={hour} value={hour}>{hour}</option>;
                                                  })}
                                                </select>
                                                <span className="text-stone-300">—</span>
                                                <select 
                                                  value={businessHours[day].close}
                                                  onChange={(e) => updateBusinessHours(day, { close: e.target.value })}
                                                  className="bg-transparent text-[11px] font-mono border-b border-stone-200 focus:border-stone-900 outline-none"
                                                >
                                                  {Array.from({ length: 24 }).map((_, i) => {
                                                    const hour = i.toString().padStart(2, '0') + ':00';
                                                    return <option key={hour} value={hour}>{hour}</option>;
                                                  })}
                                                </select>
                                              </div>
                                            </motion.div>
                                          ))}
                                        </div>
                                     </div>
                                  </div>

                                  <div className="group space-y-6">
                                    <Label className="text-xs font-mono uppercase tracking-widest text-stone-400 block">Digital Presence (Socials)</Label>
                                    
                                    <div className="flex gap-4 p-2 bg-stone-100/50 rounded-2xl w-fit">
                                      {[
                                        { id: 'INSTAGRAM', Icon: Instagram, color: 'hover:text-pink-600' },
                                        { id: 'LINKEDIN', Icon: Linkedin, color: 'hover:text-blue-600' },
                                        { id: 'FACEBOOK', Icon: Facebook, color: 'hover:text-blue-800' },
                                        { id: 'WEBSITE', Icon: Globe, color: 'hover:text-stone-900' }
                                      ].map((platform) => {
                                        const isActive = socialMedia.some(sm => sm.platform === platform.id);
                                        return (
                                          <button
                                            key={platform.id}
                                            type="button"
                                            onClick={() => {
                                              if (isActive) {
                                                setSocialMedia(socialMedia.filter(sm => sm.platform !== platform.id));
                                              } else {
                                                setSocialMedia([...socialMedia.filter(sm => sm.platform !== ""), { platform: platform.id, url: "" }]);
                                              }
                                            }}
                                            className={cn(
                                              "p-3 rounded-xl transition-all duration-300",
                                              isActive 
                                                ? "bg-white text-stone-900 shadow-sm scale-110 ring-1 ring-stone-200" 
                                                : "text-stone-400 hover:bg-white " + platform.color
                                            )}
                                          >
                                            <platform.Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
                                          </button>
                                        );
                                      })}
                                    </div>

                                    <div className="space-y-4">
                                      <AnimatePresence>
                                        {socialMedia.filter(sm => sm.platform).map((sm, index) => {
                                          const platformInfo = [
                                            { id: 'INSTAGRAM', label: 'Instagram', prefix: 'instagram.com/', placeholder: 'handle', Icon: Instagram },
                                            { id: 'LINKEDIN', label: 'LinkedIn', prefix: 'linkedin.com/in/', placeholder: 'username', Icon: Linkedin },
                                            { id: 'FACEBOOK', label: 'Facebook', prefix: 'facebook.com/', placeholder: 'page', Icon: Facebook },
                                            { id: 'WEBSITE', label: 'Website', prefix: 'https://', placeholder: 'yourdomain.com', Icon: Globe }
                                          ].find(p => p.id === sm.platform);

                                          if (!platformInfo) return null;

                                          return (
                                            <motion.div
                                              key={sm.platform}
                                              initial={{ opacity: 0, y: -10 }}
                                              animate={{ opacity: 1, y: 0 }}
                                              exit={{ opacity: 0, scale: 0.95 }}
                                              className="relative overflow-hidden group"
                                            >
                                              <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-stone-200 focus-within:border-stone-900 transition-all shadow-sm">
                                                <platformInfo.Icon size={16} className="text-stone-400" />
                                                <span className="text-[10px] font-mono text-stone-300 uppercase tracking-tighter">{platformInfo.prefix}</span>
                                                <input
                                                  type="text"
                                                  value={sm.url}
                                                  onChange={(e) => updateSocialMedia(index, 'url', e.target.value)}
                                                  placeholder={platformInfo.placeholder}
                                                  className="bg-transparent flex-1 text-sm text-stone-900 outline-none placeholder-stone-200"
                                                />
                                              </div>
                                            </motion.div>
                                          );
                                        })}
                                      </AnimatePresence>
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
                    disabled={isSubmitting}
                    className="bg-stone-900 text-white hover:bg-stone-800 px-8 py-6 rounded-none font-mono text-sm uppercase tracking-widest transition-colors group"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center">
                        <span className="inline-block w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Processing…
                      </span>
                    ) : (
                      <>
                        Create Profile <Check className="ml-2 w-4 h-4" />
                      </>
                    )}
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