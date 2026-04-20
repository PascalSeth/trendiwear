"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Upload, ChevronLeft, Check, Store,
  Scissors, Loader2,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import LocationPicker from "@/app/components/LocationPicker";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const BIO_CHAR_LIMIT = 50;

const STEPS = [
  { id: 1, label: "Identity", sub: "Brand & Craft" },
  { id: 2, label: "Showcase", sub: "Visual Portfolio" },
  { id: 3, label: "Logistics", sub: "Location & Payouts" },
];

interface ProfessionalType {
  id: string;
  name: string;
}

interface MomoProvider {
  code: string;
  name?: string;
  displayName?: string;
}

export default function RegisterProfessionalForm() {
  const router = useRouter();
  const { status, update } = useSession();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState("");

  const [formData, setFormData] = useState({
    businessName: "",
    experience: 0,
    bio: "",
    portfolioUrl: "",
    momoNumber: "",
    momoProvider: "",
  });

  const [selectedSpecialization, setSelectedSpecialization] = useState<string>("");
  const [businessImage, setBusinessImage] = useState<File | null>(null);
  const [businessImagePreview, setBusinessImagePreview] = useState<string>("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationAddress, setLocationAddress] = useState<string>("");
  const [professionalTypes, setProfessionalTypes] = useState<ProfessionalType[]>([]);
  const [momoProviders, setMomoProviders] = useState<MomoProvider[]>([]);

  useEffect(() => {
    // API Fetching logic remains same
    const fetchData = async () => {
      try {
        const [t, p] = await Promise.all([fetch('/api/professional-types'), fetch('/api/payments/momo-providers')]);
        if (t.ok) setProfessionalTypes(await t.json());
        if (p.ok) {
          const d = await p.json();
          setMomoProviders(d.providers || d.fallbackProviders || []);
        }
      } catch { }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!businessImage) return;
    const url = URL.createObjectURL(businessImage);
    setBusinessImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [businessImage]);

  const handleNext = () => {
    if (currentStep === 1) {
      if (!selectedSpecialization) return toast.error("Please select your craft.");
      if (!formData.businessName) return toast.error("Please name your business.");
    }
    if (currentStep === 2) {
      if (!businessImage) return toast.error("Please upload a profile photo.");
      if (!formData.bio) return toast.error("Please share your business story.");
      if (formData.bio.length > BIO_CHAR_LIMIT) return toast.error(`Bio must be under ${BIO_CHAR_LIMIT} characters.`);
    }
    if (currentStep === 3) {
      if (!latitude || !longitude) return toast.error("Please pin your location.");
      if (!formData.momoNumber || !formData.momoProvider) return toast.error("Payment details are required.");
      return handleSubmit();
    }
    setCurrentStep(p => p + 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmissionStatus("Verifying Identity...");
    // ... Submission logic ...
    setTimeout(() => { // Mocking redirect for UI demo
      setSubmissionStatus("Account Verified");
      update({ role: "PROFESSIONAL" });
      router.push("/dashboard");
    }, 2000);
  };

  if (status === "unauthenticated") return <LoginPrompt />;

  return (
    // Main container follows the global layout flow with padding for the fixed navbar
    <div className="relative min-h-[calc(100dvh-64px)] lg:min-h-[calc(100dvh-80px)] bg-white flex flex-col lg:flex-row">
      {/* 1. LEFT SIDEBAR (EDITORIAL) - Hero Header on mobile, Sticky Sidebar on desktop */}
      <aside className="flex w-full lg:w-[380px] xl:w-[450px] bg-stone-950 flex-col sticky top-[64px] lg:top-[80px] h-[320px] lg:h-[calc(100dvh-80px)] overflow-hidden border-b lg:border-b-0 lg:border-r border-white/5 relative shrink-0 z-20">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/reg.jpg"
            alt="Atelier" fill className="object-cover opacity-30 grayscale"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-stone-950 via-stone-950/40 to-stone-950" />
        </div>

        <div className="relative z-10 flex flex-col h-full p-8 lg:p-12 justify-between">
          <div className="space-y-8 lg:space-y-12">
            <div className="space-y-2">
              <h3 className="text-white font-serif text-2xl lg:text-3xl leading-tight">Grow Your <br /><span className="italic text-stone-500">Business</span></h3>
              <div className="h-px w-12 bg-stone-700" />
            </div>

            <nav className="hidden lg:block space-y-10 relative">
              {/* THE SQUIGGLY LINE CONNECTOR */}
              <svg className="absolute left-[7px] top-2 w-4 h-[calc(100%-20px)] opacity-20" stroke="white" fill="none">
                <path d="M1 0 Q 10 50, 1 100 T 1 200 T 1 300" strokeDasharray="4 4" />
              </svg>

              {STEPS.map((s) => (
                <div key={s.id} className="group flex items-start gap-6 relative z-10">
                  <div className={cn(
                    "w-4 h-4 rounded-full border-2 mt-1 transition-all duration-500 flex items-center justify-center",
                    currentStep === s.id ? "bg-white border-white scale-125" :
                      currentStep > s.id ? "bg-stone-500 border-stone-500" : "bg-transparent border-stone-800"
                  )}>
                    {currentStep > s.id && <Check size={10} className="text-stone-950" />}
                  </div>
                  <div className="space-y-1">
                    <p className={cn(
                      "text-[11px] font-mono uppercase tracking-[0.3em] transition-colors",
                      currentStep === s.id ? "text-white font-bold" : "text-stone-600"
                    )}>{s.label}</p>
                    <p className={cn("text-[10px] transition-colors", currentStep === s.id ? "text-stone-400" : "text-stone-800")}>{s.sub}</p>
                  </div>
                </div>
              ))}
            </nav>
          </div>

          <div className="hidden lg:block bg-white/5 border border-white/10 p-6 backdrop-blur-sm">
            <p className="text-[10px] text-stone-400 leading-relaxed font-serif italic">
              &quot;Design is not just what it looks like and feels like. Design is how it works.&quot;
            </p>
          </div>
        </div>
      </aside>

      {/* 2. RIGHT CONTENT AREA - Overlaps Hero on Mobile */}
      <main className="flex-1 relative bg-[#fafafa] min-h-full -mt-12 lg:mt-0 rounded-t-[40px] lg:rounded-t-none z-30 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] lg:shadow-none">
        {/* Decorative Background Element (Squiggly) */}
        <div className="absolute top-20 right-0 opacity-[0.03] pointer-events-none">
          <svg width="600" height="600" viewBox="0 0 600 600" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M50 300C50 100 250 50 300 250C350 450 550 500 550 300" stroke="black" strokeWidth="2" />
          </svg>
        </div>

        <div className="max-w-2xl mx-auto px-8 pt-16 pb-24 lg:px-20 lg:py-24 relative z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="mb-12 space-y-4">
                <span className="text-[10px] font-mono text-stone-400 uppercase tracking-[0.4em]">Step 0{currentStep} — 03</span>
                <h2 className="text-5xl lg:text-6xl font-serif text-stone-900 tracking-tight">
                  {currentStep === 1 && <>Your Craft <br /><span className="text-stone-400 italic">& Brand.</span></>}
                  {currentStep === 2 && <>Visual <br /><span className="text-stone-400 italic">Storytelling.</span></>}
                  {currentStep === 3 && <>Presence <br /><span className="text-stone-400 italic">& Settlement.</span></>}
                </h2>
              </div>

              {/* FORM FIELDS */}
              <div className="min-h-[300px]">
                {currentStep === 1 && (
                  <div className="space-y-12">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {professionalTypes.map((type) => (
                        <button
                          key={type.id}
                          onClick={() => setSelectedSpecialization(type.id)}
                          className={cn(
                            "p-8 text-left border transition-all relative group",
                            selectedSpecialization === type.id ? "bg-stone-900 border-stone-900 text-white" : "bg-white border-stone-100 hover:border-stone-300"
                          )}
                        >
                          <div className="mb-12">
                            {type.name.toLowerCase().includes('tailor') ? <Scissors size={20} /> : <Store size={20} />}
                          </div>
                          <p className="text-xs font-mono uppercase tracking-widest font-bold">{type.name}</p>
                          {selectedSpecialization === type.id && <div className="absolute top-4 right-4 w-2 h-2 bg-white rounded-full" />}
                        </button>
                      ))}
                    </div>

                    <div className="space-y-2 group pt-8 border-t border-stone-100">
                      <Label className="text-[10px] font-mono uppercase tracking-widest text-stone-400">Official Brand / Trading Name</Label>
                      <Input
                        value={formData.businessName}
                        onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                        placeholder="e.g. Maison de Couture"
                        className="h-20 bg-transparent border-0 border-b-2 border-stone-200 rounded-none text-2xl focus-visible:ring-0 focus:border-stone-900 transition-all px-0 placeholder:text-stone-200 shadow-none"
                      />
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-12">
                    <div className="relative aspect-[16/7] border-2 border-dashed border-stone-200 flex flex-col items-center justify-center bg-white hover:border-stone-400 transition-all cursor-pointer overflow-hidden group">
                      {businessImagePreview ? (
                        <Image src={businessImagePreview} alt="Preview" fill className="object-cover" />
                      ) : (
                        <div className="text-center space-y-2">
                          <Upload className="mx-auto text-stone-300 group-hover:text-stone-900 transition-colors" size={24} strokeWidth={1} />
                          <p className="text-[9px] font-mono uppercase tracking-widest text-stone-400">Profile Image Upload</p>
                        </div>
                      )}
                      <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => setBusinessImage(e.target.files?.[0] || null)} />
                    </div>

                    <div className="grid grid-cols-2 gap-8 border-y border-stone-100 py-10">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-mono uppercase tracking-widest text-stone-400">Experience (Years)</Label>
                        <Input
                          type="number"
                          value={formData.experience}
                          onChange={(e) => setFormData({ ...formData, experience: parseInt(e.target.value) || 0 })}
                          className="h-14 border-0 border-b border-stone-200 focus-visible:ring-0 focus:border-stone-950 rounded-none px-0 bg-transparent transition-all shadow-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-mono uppercase tracking-widest text-stone-400">Portfolio Link</Label>
                        <Input
                          placeholder="Instagram or Website"
                          value={formData.portfolioUrl}
                          onChange={(e) => setFormData({ ...formData, portfolioUrl: e.target.value })}
                          className="h-14 border-0 border-b border-stone-200 focus-visible:ring-0 focus:border-stone-950 rounded-none px-0 bg-transparent transition-all shadow-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-end">
                        <Label className="text-[10px] font-mono uppercase tracking-widest text-stone-400">Your Business Story</Label>
                        <span className={cn(
                          "text-[9px] font-mono uppercase tracking-widest",
                          formData.bio.length > BIO_CHAR_LIMIT ? "text-red-500 font-bold" : "text-stone-400"
                        )}>
                          {formData.bio.length} / {BIO_CHAR_LIMIT} characters
                        </span>
                      </div>
                      <Textarea
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        maxLength={BIO_CHAR_LIMIT}
                        placeholder="Write a brief story of your craft..."
                        className="min-h-[120px] border-0 border-b border-stone-200 focus-visible:ring-0 focus:border-stone-950 rounded-none px-0 bg-transparent transition-all textAlign-left resize-none italic font-serif text-lg py-4 shadow-none"
                      />
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-16 lg:space-y-12">
                    <div className="relative">
                      <LocationPicker
                        latitude={latitude} longitude={longitude} location={locationAddress}
                        onLocationChange={(lat, lng, addr) => { setLatitude(lat); setLongitude(lng); setLocationAddress(addr); }}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-8 border-t border-stone-100">
                      <div className="space-y-6">
                        <p className="text-[10px] font-mono uppercase tracking-widest text-stone-400">Settlement Account</p>
                        <div className="grid grid-cols-1 gap-2">
                          {momoProviders.map((p) => (
                            <button
                              key={p.code}
                              onClick={() => setFormData({ ...formData, momoProvider: p.code })}
                              className={cn(
                                "flex justify-between p-4 border transition-all font-mono text-[10px] uppercase tracking-widest",
                                formData.momoProvider === p.code ? "bg-stone-900 text-white" : "bg-white text-stone-500"
                              )}
                            >
                              {p.displayName || p.name}
                              {formData.momoProvider === p.code && <Check size={14} />}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-6">
                        <p className="text-[10px] font-mono uppercase tracking-widest text-stone-400">Wallet Number</p>
                        <Input
                          placeholder="Momo Wallet Number"
                          value={formData.momoNumber}
                          onChange={(e) => setFormData({ ...formData, momoNumber: e.target.value })}
                          className="h-16 border-0 border-b border-stone-200 focus-visible:ring-0 focus:border-stone-950 rounded-none px-0 bg-transparent transition-all text-xl shadow-none"
                        />
                        <div className="p-4 bg-stone-50 border border-stone-100 italic text-[11px] text-stone-500">
                          Selected Location: {locationAddress || "Not set"}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* STICKY FOOTER NAVIGATION */}
              <div className="mt-20 pt-10 border-t border-stone-100 flex items-center justify-between">
                <button
                  onClick={() => currentStep > 1 && setCurrentStep(p => p - 1)}
                  className={cn(
                    "flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest transition-all",
                    currentStep === 1 ? "opacity-0 pointer-events-none" : "text-stone-400 hover:text-stone-950"
                  )}
                >
                  <ChevronLeft size={14} /> Previous
                </button>

                <Button
                  onClick={handleNext}
                  disabled={isSubmitting}
                  className="h-16 px-12 bg-stone-900 text-white rounded-none font-mono text-[10px] uppercase tracking-[0.2em] hover:bg-stone-800 transition-all"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-3"><Loader2 size={14} className="animate-spin" /> {submissionStatus}</span>
                  ) : (
                    <span className="flex items-center gap-3">{currentStep === 3 ? "Open Atelier" : "Continue"} <ArrowRight size={14} /></span>
                  )}
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* SUCCESS SCREEN */}
      <AnimatePresence>
        {isSubmitting && submissionStatus.includes("Verified") && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="fixed inset-0 z-[100] bg-stone-950 flex flex-col items-center justify-center text-white"
          >
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center space-y-8">
              <Sparkles className="mx-auto text-stone-500" size={48} strokeWidth={1} />
              <h2 className="text-5xl font-serif">Welcome to the <br /> <span className="italic text-stone-500">Collective.</span></h2>
              <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-stone-600 animate-pulse">Launching Digital Storefront</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; }
      `}</style>
    </div>
  );
}

const LoginPrompt = () => (
  <div className="fixed inset-0 z-[100] bg-stone-950 flex items-center justify-center p-6">
    <div className="max-w-sm w-full text-center space-y-10">
      <div className="space-y-4">
        <h2 className="text-3xl font-serif text-white leading-tight">Private Registration</h2>
        <p className="text-stone-500 text-[10px] font-mono uppercase tracking-[0.2em] leading-relaxed">
          You must be signed into TrendiZip <br /> to access professional services.
        </p>
      </div>
      <Button
        onClick={() => signIn(undefined, { callbackUrl: '/register-as-professional' })}
        className="w-full h-16 rounded-none bg-white text-stone-950 hover:bg-stone-100 font-mono text-[10px] uppercase tracking-widest"
      >
        Authenticate Access
      </Button>
    </div>
  </div>
);