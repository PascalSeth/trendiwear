"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowRight, Upload, ChevronLeft, Check, Store, 
  Palette, Scissors, Loader2, Info, MapPin,
  Smartphone, Award, Sparkles, Building2, Archive,
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import LocationPicker from "@/app/components/LocationPicker";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// --- Constants & Types ---
interface ProfessionalType {
  id: string;
  name: string;
  description?: string;
  _count?: { professionals: number };
}

interface MOMOProvider {
  code: string;
  displayName: string;
  name?: string;
}

const STEPS = [
  { id: 1, name: "About You", description: "Business details" },
  { id: 2, name: "Your Work", description: "Photos & bio" },
  { id: 3, name: "Location", description: "Where you are" },
  { id: 4, name: "Payments", description: "Mobile Money setup" },
];

interface FormData {
  businessName: string;
  experience: number;
  bio: string;
  portfolioUrl: string;
  spotlightVideoUrl: string;
  momoNumber: string;
  momoProvider: string;
}

interface StepIdentityProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  professionalTypes: ProfessionalType[];
  selectedSpecialization: string;
  setSelectedSpecialization: React.Dispatch<React.SetStateAction<string>>;
}

// --- Sub-Components (Defined outside to prevent focus loss) ---

const StepIdentity = ({ 
  formData, setFormData, professionalTypes, selectedSpecialization, setSelectedSpecialization 
}: StepIdentityProps) => (
  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
    <div className="space-y-2">
      <Label className="text-[10px] font-mono uppercase tracking-[0.2em] text-stone-400">Step 01 / Business Info</Label>
      <h2 className="text-3xl font-serif text-stone-900 tracking-tight">Tell us your <br />Business Name.</h2>
    </div>

    <div className="space-y-6">
      <div className="group relative">
        <Input 
          value={formData.businessName}
          onChange={(e) => setFormData((p: FormData) => ({ ...p, businessName: e.target.value }))}
          placeholder="e.g. Maison Noir Design"
          className="h-14 bg-white/50 border-stone-200 focus:border-stone-900 focus:ring-0 text-lg rounded-2xl px-6 transition-all"
        />
        <Building2 className="absolute right-5 top-1/2 -translate-y-1/2 text-stone-300 pointer-events-none" size={18} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {professionalTypes.slice(0, 6).map((type: ProfessionalType) => {
          const isSelected = selectedSpecialization === type.id;
          return (
            <button
              key={type.id}
              type="button"
              onClick={() => setSelectedSpecialization(type.id)}
              className={cn(
                "flex items-start p-5 rounded-3xl border-2 transition-all duration-500 gap-5 text-left group relative overflow-hidden",
                isSelected 
                  ? "bg-stone-900 border-stone-900 text-white shadow-2xl scale-[1.02]" 
                  : "bg-white border-stone-100 text-stone-600 hover:border-stone-300"
              )}
            >
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-500",
                isSelected ? "bg-white/10 rotate-12" : "bg-stone-50 group-hover:bg-stone-100"
              )}>
                {type.name.toLowerCase().includes('tailor') ? <Scissors size={22} /> : 
                 type.name.toLowerCase().includes('designer') ? <Palette size={22} /> :
                 type.name.toLowerCase().includes('boutique') ? <Store size={22} /> : <Archive size={22} />}
              </div>
              
              <div className="space-y-1">
                <span className="text-[11px] font-mono uppercase tracking-[0.2em] font-bold block">{type.name}</span>
                <p className={cn(
                  "text-[10px] leading-relaxed transition-colors",
                  isSelected ? "text-stone-400" : "text-stone-400 group-hover:text-stone-500"
                )}>
                  {type.description || `Specialized services in ${type.name.toLowerCase()}.`}
                </p>
              </div>

              {isSelected && (
                <div className="absolute top-2 right-2">
                  <div className="w-5 h-5 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <Check size={10} className="text-white" />
                  </div>
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  </div>
);

interface StepCraftProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  businessImagePreview: string;
  setBusinessImage: React.Dispatch<React.SetStateAction<File | null>>;
}

const StepCraft = ({ 
  formData, setFormData, businessImagePreview, setBusinessImage 
}: StepCraftProps) => (
  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
    <div className="space-y-2">
      <Label className="text-[10px] font-mono uppercase tracking-[0.2em] text-stone-400">Step 02 / Photos & Bio</Label>
      <h2 className="text-3xl font-serif text-stone-900 tracking-tight">Show off your best <br />work and photos.</h2>
    </div>

    <div className="space-y-6">
      <div className="relative group/upload h-48 rounded-3xl overflow-hidden border-2 border-dashed border-stone-200 hover:border-stone-400 transition-all bg-white/50 flex flex-col items-center justify-center gap-3 cursor-pointer">
        {businessImagePreview ? (
          <>
            <Image src={businessImagePreview} alt="Preview" fill className="object-cover" />
            <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] opacity-0 group-hover/upload:opacity-100 transition-all flex items-center justify-center">
              <span className="text-white text-xs font-mono uppercase tracking-widest bg-black/40 px-4 py-2 rounded-full">Change Image</span>
            </div>
          </>
        ) : (
          <>
            <div className="w-12 h-12 bg-stone-50 rounded-2xl flex items-center justify-center text-stone-400"><Upload size={20} /></div>
            <p className="text-xs font-mono uppercase tracking-widest text-stone-500">Business Cover Photo</p>
          </>
        )}
        <input 
          type="file" 
          accept="image/*" 
          className="absolute inset-0 opacity-0 cursor-pointer" 
          onChange={(e) => setBusinessImage(e.target.files?.[0] || null)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-[10px] font-mono uppercase tracking-widest text-stone-500 ml-1">Experience (Years)</Label>
          <Input 
            type="number" 
            value={formData.experience}
            onChange={(e) => setFormData((p: FormData) => ({ ...p, experience: parseInt(e.target.value) || 0 }))}
            className="bg-white/50 border-stone-200 rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] font-mono uppercase tracking-widest text-stone-500 ml-1">Your Website or Socials</Label>
          <Input 
            placeholder="e.g. instagram.com/name"
            value={formData.portfolioUrl}
            onChange={(e) => setFormData((p: FormData) => ({ ...p, portfolioUrl: e.target.value }))}
            className="bg-white/50 border-stone-200 rounded-xl"
          />
        </div>
      </div>

      <Textarea 
        placeholder="Short description of your business..."
        value={formData.bio}
        onChange={(e) => setFormData((p: FormData) => ({ ...p, bio: e.target.value }))}
        className="h-24 bg-white/50 border-stone-200 rounded-2xl p-4 resize-none"
      />
    </div>
  </div>
);

interface StepAtelierProps {
  latitude: number | null;
  longitude: number | null;
  locationAddress: string;
  setLatitude: React.Dispatch<React.SetStateAction<number | null>>;
  setLongitude: React.Dispatch<React.SetStateAction<number | null>>;
  setLocationAddress: React.Dispatch<React.SetStateAction<string>>;
}

const StepAtelier = ({ 
  latitude, longitude, locationAddress, setLatitude, setLongitude, setLocationAddress 
}: StepAtelierProps) => (
  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
    <div className="space-y-2">
      <Label className="text-[10px] font-mono uppercase tracking-[0.2em] text-stone-400">Step 03 / Location</Label>
      <h2 className="text-3xl font-serif text-stone-900 tracking-tight">Where can customers <br />find your shop?</h2>
    </div>

    <div className="rounded-3xl overflow-hidden border-2 border-stone-100 shadow-xl bg-white p-2">
      <LocationPicker 
        latitude={latitude}
        longitude={longitude}
        location={locationAddress}
        onLocationChange={(lat: number, lng: number, addr: string) => {
          setLatitude(lat);
          setLongitude(lng);
          setLocationAddress(addr);
        }}
      />
    </div>
    
    <div className="p-4 bg-stone-50 rounded-2xl flex items-center gap-3">
      <MapPin className="text-stone-400 flex-shrink-0" size={18} />
      <p className="text-xs text-stone-600 line-clamp-2">{locationAddress || "Pin your location on the map above."}</p>
    </div>
  </div>
);

interface StepConnectivityProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  momoProviders: MOMOProvider[];
}

const StepConnectivity = ({ 
  formData, setFormData, momoProviders 
}: StepConnectivityProps) => (
  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
    <div className="space-y-2">
      <Label className="text-[10px] font-mono uppercase tracking-[0.2em] text-stone-400">Step 04 / Payments</Label>
      <h2 className="text-3xl font-serif text-stone-900 tracking-tight">How should we pay <br />you your money?</h2>
    </div>

    <div className="p-6 bg-amber-50/50 border border-amber-100 rounded-3xl flex items-start gap-4">
      <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 flex-shrink-0">
        <Info size={20} />
      </div>
      <div className="space-y-1">
        <p className="text-xs font-bold text-amber-900">Get Paid Automatically</p>
        <p className="text-[10px] text-amber-700 leading-relaxed font-medium">
          We use these details to send your sales money directly to your Mobile Money account as soon as customers buy.
        </p>
      </div>
    </div>

    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-2">
        {momoProviders.map((provider: MOMOProvider) => (
          <button
            key={provider.code}
            type="button"
            onClick={() => setFormData((p: FormData) => ({ ...p, momoProvider: provider.code }))}
            className={cn(
              "flex items-center justify-between p-4 rounded-2xl border-2 transition-all",
              formData.momoProvider === provider.code 
                ? "bg-stone-900 border-stone-900 text-stone-50 shadow-md" 
                : "bg-white border-stone-100 text-stone-600 hover:border-stone-300"
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center",
                formData.momoProvider === provider.code ? "bg-white/10" : "bg-stone-50"
              )}>
                <Smartphone size={16} />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest">{provider.displayName}</span>
            </div>
            {formData.momoProvider === provider.code && <Check size={16} className="text-emerald-400" />}
          </button>
        ))}
      </div>

      <div className="group relative">
        <Input 
          placeholder="Mobile Money Number"
          value={formData.momoNumber}
          onChange={(e) => setFormData((p: FormData) => ({ ...p, momoNumber: e.target.value }))}
          className="h-14 bg-white/50 border-stone-200 focus:border-stone-900 focus:ring-0 text-lg rounded-2xl px-6"
        />
        <Award className="absolute right-5 top-1/2 -translate-y-1/2 text-stone-300 pointer-events-none" size={18} />
      </div>
    </div>
  </div>
);

// --- Main Form Component ---

export default function RegisterProfessionalForm() {
  const router = useRouter();
  const { update } = useSession();
  
  // --- Form State ---
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState("");
  
  const [formData, setFormData] = useState({
    businessName: "",
    experience: 0,
    bio: "",
    portfolioUrl: "",
    spotlightVideoUrl: "",
    momoNumber: "",
    momoProvider: "",
  });

  const [selectedSpecialization, setSelectedSpecialization] = useState<string>("");
  const [businessImage, setBusinessImage] = useState<File | null>(null);
  const [businessImagePreview, setBusinessImagePreview] = useState<string>("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationAddress, setLocationAddress] = useState<string>("");
  
  // --- Metadata State ---
  const [professionalTypes, setProfessionalTypes] = useState<ProfessionalType[]>([]);
  const [momoProviders, setMomoProviders] = useState<MOMOProvider[]>([]);

  // --- Initialization ---
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [typesRes, providersRes] = await Promise.all([
          fetch('/api/professional-types'),
          fetch('/api/payments/momo-providers')
        ]);
        
        if (typesRes.ok) setProfessionalTypes(await typesRes.json());
        if (providersRes.ok) {
          const data = await providersRes.json();
          const list = (data.providers || data.fallbackProviders || []).map((p: MOMOProvider) => ({
            code: p.code || '',
            displayName: p.displayName || p.name || ''
          }));
          setMomoProviders(list);
        }
      } catch (err) {
        console.error('Failed to load metadata', err);
      }
    };
    fetchData();
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

  // --- Actions ---
  const handleImageUpload = async (file: File) => {
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
    uploadFormData.append('bucket', 'images');
    uploadFormData.append('folder', 'business-images');

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: uploadFormData
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data.details || data.error || 'Upload failed';
      throw new Error(errorMsg);
    }
    
    return data.url;
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!formData.businessName) return toast.error("Business Name is required.");
      if (!selectedSpecialization) return toast.error("Select your craft.");
    }
    if (currentStep === 3) {
        if (!latitude || !longitude) return toast.error("Please select your location on the map.");
    }
    if (currentStep === 4) {
      if (!formData.momoNumber || !formData.momoProvider) {
        return toast.error("Payment details are required to receive your earnings.");
      }
      return handleSubmit();
    }
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmissionStatus("Opening your shop...");
    
    try {
      let uploadedImageUrl = undefined;
      if (businessImage) {
        setSubmissionStatus("Uploading photo...");
        uploadedImageUrl = await handleImageUpload(businessImage);
      }

      setSubmissionStatus("Setting up your profile...");
      const response = await fetch('/api/professional-profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          businessImage: uploadedImageUrl,
          specializationId: selectedSpecialization,
          latitude,
          longitude,
          location: locationAddress,
          socialMedia: [],
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        if (response.status === 409) {
          throw new Error("This Mobile Money number is already registered to another professional. Please use a unique number.");
        }
        throw new Error(errData.error || 'Failed to create shop.');
      }
      const profile = await response.json();

      setSubmissionStatus("Activating your 90-day free trial...");
      await fetch('/api/subscriptions/trial/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ professionalId: profile.id })
      });

      setSubmissionStatus("All set! Redirecting...");
      await update({ role: "PROFESSIONAL" });
      router.push("/dashboard");

    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An unknown error occurred.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 bg-stone-50 selection:bg-stone-900 selection:text-white overflow-hidden pt-[72px] lg:pt-[88px]">
      {/* Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-violet-200/30 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-200/30 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row h-full overflow-y-auto lg:overflow-hidden snap-y snap-proximity scrollbar-hide">
        
        {/* Sidebar */}
        <div className="relative w-full lg:w-[450px] xl:w-[500px] h-[350px] lg:h-full flex-shrink-0 bg-stone-900 overflow-hidden snap-start scroll-mt-[72px]">
          <Image 
            src="https://images.unsplash.com/photo-1558171813-4c088753af8f?w=1200q=80" 
            alt="Atelier" 
            fill 
            className="object-cover opacity-60 grayscale scale-110"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-transparent to-transparent lg:bg-gradient-to-r" />
          
          <div className="absolute inset-0 p-12 flex flex-col justify-between">
            <div className="pt-10">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}>
                <h1 className="text-5xl font-serif text-white tracking-tight leading-tight">
                  Grow Your <br /> <span className="italic text-stone-400">Business.</span>
                </h1>
              </motion.div>
            </div>

            <div className="space-y-8 lg:block hidden">
              <div className="p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl">
                 <p className="text-stone-300 text-sm italic mb-4">&quot;This platform helped me reach more customers and manage my shop easily from my phone.&quot;</p>
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-stone-700" />
                    <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-white">Sophie K., Master Tailor</span>
                 </div>
              </div>
              
              <div className="flex justify-between items-center text-white/40 font-mono text-[9px] uppercase tracking-[0.3em]">
                <span>90 Day Free Trial</span>
                <span>•</span>
                <span>Get Paid Daily</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 min-h-[calc(100vh-72px)] lg:h-full lg:overflow-y-auto bg-stone-50/10 snap-start scroll-mt-[72px]">
          <div className="min-h-full flex flex-col items-center justify-start lg:justify-center p-6 lg:p-12 xl:p-24 w-full">
            <div className="w-full max-w-xl space-y-12 py-10 lg:py-0">
              
              <div className="flex items-center justify-between">
                 <div className="flex gap-1.5 h-1">
                   {STEPS.map((s) => (
                     <div 
                      key={s.id} 
                      className={cn(
                        "w-12 h-full rounded-full transition-all duration-700",
                        currentStep >= s.id ? "bg-stone-900" : "bg-stone-200"
                      )} 
                     />
                   ))}
                 </div>
                 <span className="text-[10px] font-mono text-stone-400 uppercase tracking-widest">{STEPS[currentStep-1].name} — {currentStep}/4</span>
              </div>

              <div className="min-h-[400px]">
                {currentStep === 1 && (
                  <StepIdentity 
                    formData={formData} 
                    setFormData={setFormData}
                    professionalTypes={professionalTypes}
                    selectedSpecialization={selectedSpecialization}
                    setSelectedSpecialization={setSelectedSpecialization}
                  />
                )}
                {currentStep === 2 && (
                  <StepCraft 
                    formData={formData} 
                    setFormData={setFormData}
                    businessImagePreview={businessImagePreview}
                    setBusinessImage={setBusinessImage}
                  />
                )}
                {currentStep === 3 && (
                  <StepAtelier 
                    latitude={latitude}
                    longitude={longitude}
                    locationAddress={locationAddress}
                    setLatitude={setLatitude}
                    setLongitude={setLongitude}
                    setLocationAddress={setLocationAddress}
                  />
                )}
                {currentStep === 4 && (
                  <StepConnectivity 
                    formData={formData} 
                    setFormData={setFormData}
                    momoProviders={momoProviders}
                  />
                )}
              </div>

              {/* Sticky Actions Bar */}
              <div className="sticky bottom-0 left-0 right-0 bg-stone-50/80 backdrop-blur-md border-t border-stone-100 py-6 px-1 z-20 mt-8 flex items-center gap-4">
                {currentStep > 1 && (
                  <Button 
                    type="button"
                    variant="outline" 
                    onClick={handleBack}
                    className="h-14 w-14 rounded-2xl border-stone-200 text-stone-500 hover:text-stone-900 hover:bg-white bg-white"
                  >
                    <ChevronLeft size={20} />
                  </Button>
                )}
                <Button 
                  type="button"
                  onClick={handleNext}
                  disabled={isSubmitting}
                  className="flex-1 h-14 rounded-2xl bg-stone-900 text-white hover:bg-stone-800 shadow-2xl shadow-stone-900/10 transition-all font-mono text-xs uppercase tracking-widest gap-3"
                >
                  {isSubmitting ? (
                    <><Loader2 className="animate-spin" size={18} /> {submissionStatus}</>
                  ) : (
                    <>
                      {currentStep === 4 ? "Open My Shop" : "Next Step"}
                      <ArrowRight size={18} />
                    </>
                  )}
                </Button>
              </div>
              
              <p className="text-center text-[10px] font-mono uppercase tracking-widest text-stone-400">
                Personalized for the Master Artisan Collective
              </p>
            </div>
          </div>
        </main>
      </div>

      {/* Success Success Overlay */}
      <AnimatePresence>
        {isSubmitting && submissionStatus.includes("Success") && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[100] bg-stone-900 flex flex-col items-center justify-center text-white p-6"
          >
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center space-y-8"
            >
              <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto ring-1 ring-white/20">
                <Sparkles className="text-stone-100" size={40} />
              </div>
              <div className="space-y-4">
                <h2 className="text-5xl font-serif">Welcome home.</h2>
                <p className="text-stone-400 font-mono tracking-widest uppercase text-xs">Opening your shop now...</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}