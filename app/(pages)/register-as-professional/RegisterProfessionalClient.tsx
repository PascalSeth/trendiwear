"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Upload,
  ChevronLeft,
  Check,
  Store,
  Scissors,
  Loader2,
  MapPin,
  Briefcase,
  Globe,
  AlertCircle,
  RefreshCw,
  X,
  CreditCard,
  Building2,
  CheckCircle2,
  Image as ImageIcon,
  Share2,
  Copy,
  ChevronDown,
  Plus,
  BadgeCheck,
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import LocationPicker from "@/app/components/LocationPicker";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import imageCompression from "browser-image-compression";

const BIO_CHAR_LIMIT = 300;

// Popular pre-made style tags in clear, everyday English
const HARDCODED_STYLE_TAGS = [
  "Kente Styles",
  "Custom Agbada",
  "Wedding & Bridal",
  "Men's Suits",
  "Women's Dresses",
  "Corsets & Tops",
  "Casual & Streetwear",
  "Church Wear",
  "Embroidery & Beads",
  "Kids African Wear",
];

const STEPS = [
  { id: 1, label: "Business Info", sub: "Name & What you do" },
  { id: 2, label: "Photos & Styles", sub: "Your work & specialties" },
  { id: 3, label: "Location & Payment", sub: "Shop address & MoMo" },
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
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    businessName: "",
    experience: 0,
    bio: "",
    portfolioUrl: "",
    momoNumber: "",
    momoProvider: "",
  });

  const [selectedSpecialization, setSelectedSpecialization] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<string[]>([
    "Kente Styles",
    "Wedding & Bridal",
  ]);
  const [customTagInput, setCustomTagInput] = useState<string>("");
  const [businessImage, setBusinessImage] = useState<File | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [businessImagePreview, setBusinessImagePreview] = useState<string>("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationAddress, setLocationAddress] = useState<string>("");
  const [professionalTypes, setProfessionalTypes] = useState<ProfessionalType[]>([]);
  const [isLoadingTypes, setIsLoadingTypes] = useState(true);
  const [momoProviders, setMomoProviders] = useState<MomoProvider[]>([]);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isMobilePassExpanded, setIsMobilePassExpanded] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoadingTypes(true);
        const [t, p] = await Promise.all([
          fetch("/api/professional-types"),
          fetch("/api/payments/momo-providers"),
        ]);
        if (t.ok) {
          const typesData = await t.json();
          setProfessionalTypes(typesData);
        }
        if (p.ok) {
          const d = await p.json();
          const providers = d.providers || d.fallbackProviders || [];
          setMomoProviders(providers);
          if (providers.length > 0 && !formData.momoProvider) {
            setFormData((prev) => ({ ...prev, momoProvider: providers[0].code }));
          }
        }
      } catch (err) {
        console.error("Failed to load setup data:", err);
      } finally {
        setIsLoadingTypes(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!businessImage) {
      if (businessImagePreview !== "/reg.jpg") {
        setBusinessImagePreview("");
      }
      return;
    }
    const url = URL.createObjectURL(businessImage);
    setBusinessImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [businessImage]);

  const clearError = (field: string) => {
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  const handleToggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags((prev) => prev.filter((t) => t !== tag));
    } else {
      if (selectedTags.length >= 6) {
        toast.info("You can choose up to 6 styles.");
        return;
      }
      setSelectedTags((prev) => [...prev, tag]);
    }
  };

  const handleAddCustomTag = () => {
    const cleanTag = customTagInput.trim().replace(/^#+/, "");
    if (!cleanTag) return;

    if (
      selectedTags.some(
        (t) => t.toLowerCase() === cleanTag.toLowerCase()
      )
    ) {
      toast.info("You already added this style tag.");
      return;
    }

    if (selectedTags.length >= 6) {
      toast.info("You can choose up to 6 styles in total.");
      return;
    }

    setSelectedTags((prev) => [...prev, cleanTag]);
    setCustomTagInput("");
    toast.success(`Added "${cleanTag}" to your styles!`);
  };

  const handleNext = () => {
    const errors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!selectedSpecialization) {
        errors.specialization = "Please choose what type of fashion business you run.";
      }
      if (!formData.businessName.trim()) {
        errors.businessName = "Please enter your business or brand name.";
      }

      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        if (errors.specialization && errors.businessName) {
          toast.error("Please select your business type and enter your business name.");
        } else if (errors.specialization) {
          toast.error(errors.specialization);
        } else if (errors.businessName) {
          toast.error(errors.businessName);
          document.getElementById("businessName")?.focus();
        }
        return;
      }
      setValidationErrors({});
    }

    if (currentStep === 2) {
      if (!businessImage && !businessImagePreview) {
        errors.businessImage = "Please add a photo of your shop or work.";
      }
      if (!formData.bio.trim()) {
        errors.bio = "Please write a short description of what you make.";
      } else if (formData.bio.length > BIO_CHAR_LIMIT) {
        errors.bio = `Description must be under ${BIO_CHAR_LIMIT} characters.`;
      }

      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        if (errors.businessImage && errors.bio) {
          toast.error("Please upload a photo and write a short description of your work.");
        } else if (errors.businessImage) {
          toast.error(errors.businessImage);
        } else if (errors.bio) {
          toast.error(errors.bio);
          document.getElementById("bio")?.focus();
        }
        return;
      }
      setValidationErrors({});
    }

    if (currentStep === 3) {
      if (!latitude || !longitude || !locationAddress.trim()) {
        errors.location = "Please enter or pin your workshop address.";
      }
      if (!formData.momoProvider) {
        errors.momoProvider = "Please pick your Mobile Money network.";
      }
      if (!formData.momoNumber.trim()) {
        errors.momoNumber = "Please enter your Mobile Money phone number.";
      } else if (!/^[0-9+() -]{9,15}$/.test(formData.momoNumber.trim())) {
        errors.momoNumber = "Please enter a valid Ghana phone number (e.g. 024 123 4567).";
      }

      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        const missingParts: string[] = [];
        if (errors.location) missingParts.push("shop address");
        if (errors.momoProvider) missingParts.push("Mobile Money network");
        if (errors.momoNumber) missingParts.push("Mobile Money phone number");

        if (missingParts.length === 1) {
          const firstError = Object.values(errors)[0];
          toast.error(firstError);
        } else if (missingParts.length > 1) {
          const lastPart = missingParts.pop();
          toast.error(`Please provide your ${missingParts.join(", ")} and ${lastPart}.`);
        }

        if (errors.location) {
          document.getElementById("location-search")?.focus();
        } else if (errors.momoNumber) {
          document.getElementById("momoNumber")?.focus();
        }
        return;
      }
      setValidationErrors({});
      return handleSubmit();
    }

    setCurrentStep((p) => p + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmissionStatus("Creating your store profile...");

    try {
      let businessImageUrl = businessImagePreview || "";

      // 1. Upload Business Image if user selected a custom file
      if (businessImage) {
        const formDataUpload = new FormData();
        formDataUpload.append("file", businessImage);
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formDataUpload,
        });

        if (!uploadRes.ok) {
          throw new Error("Failed to upload your photo. Please try again.");
        }
        const uploadData = await uploadRes.json();
        businessImageUrl = uploadData.url;
      }

      setSubmissionStatus("Saving your business profile...");

      // Append selected styles to bio
      const enrichedBio =
        selectedTags.length > 0
          ? `${formData.bio.trim()}\n\nStyles: ${selectedTags.join(", ")}`
          : formData.bio;

      // 2. Submit Professional Profile
      const registrationRes = await fetch("/api/professional-profiles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          bio: enrichedBio,
          businessImage: businessImageUrl,
          specializationId: selectedSpecialization,
          latitude,
          longitude,
          location: locationAddress,
        }),
      });

      const result = await registrationRes.json();

      if (!registrationRes.ok) {
        throw new Error(result.error || "Failed to create your profile");
      }

      setSubmissionStatus("Profile Created Successfully!");
      await update({ role: "PROFESSIONAL" });
      setIsSuccessModalOpen(true);
    } catch (err) {
      console.error("[RegisterProfessionalForm] Submission failed:", err);
      toast.error(err instanceof Error ? err.message : "Something went wrong during registration");
      setSubmissionStatus("");
      setIsSubmitting(false);
    }
  };

  const handleImageFileChange = async (file?: File) => {
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      toast.error("Photo is too large. Please pick a picture under 15MB.");
      return;
    }

    setIsCompressing(true);
    clearError("businessImage");
    const toastId = toast.loading("Preparing your photo...");

    try {
      const options = {
        maxSizeMB: 2.5,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };
      const compressed = await imageCompression(file, options);
      setBusinessImage(compressed);
      toast.success("Photo ready!", { id: toastId });
    } catch (error) {
      console.error("Image compression error:", error);
      toast.error("Could not optimize photo. Using original image.", { id: toastId });
      setBusinessImage(file);
    } finally {
      setIsCompressing(false);
    }
  };

  const currentSpecializationName =
    professionalTypes.find((t) => t.id === selectedSpecialization)?.name || "Fashion Designer & Tailor";

  if (status === "unauthenticated") return <LoginPrompt />;

  return (
    <div className="relative min-h-screen bg-[#fafaf9] text-stone-900 flex flex-col pt-[58px] sm:pt-[64px] lg:pt-[72px]">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & CLEAR STEP INDICATOR                                      */}
      {/* ========================================================================= */}
      <header className="relative z-10 bg-white border-b border-stone-200 px-4 sm:px-8 lg:px-12 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Header Title & Tag */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-700 shadow-2xs">
              <Store size={15} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-stone-600 bg-stone-100 px-2 py-0.5 rounded-md border border-stone-200">
                  TrendiZip Partner
                </span>
                <span className="text-[11px] text-stone-400 hidden sm:inline">
                  • Sell Fashion Online in Ghana
                </span>
              </div>
              <h1 className="text-base font-semibold text-stone-900 tracking-tight">
                Register as a Tailor or Fashion Designer
              </h1>
            </div>
          </div>

          {/* Clean Step Pills */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {STEPS.map((s, idx) => {
              const isActive = currentStep === s.id;
              const isCompleted = currentStep > s.id;

              return (
                <div key={s.id} className="flex items-center gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => isCompleted && setCurrentStep(s.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-colors cursor-pointer",
                      isActive
                        ? "bg-stone-900 text-white border-stone-900 shadow-2xs font-medium"
                        : isCompleted
                        ? "bg-stone-100 text-stone-800 border-stone-200 hover:bg-stone-200/70 font-medium"
                        : "bg-white text-stone-400 border-stone-200 hover:text-stone-600"
                    )}
                  >
                    <span
                      className={cn(
                        "w-4 h-4 rounded-full flex items-center justify-center text-[10px]",
                        isActive
                          ? "bg-stone-700 text-white font-medium"
                          : isCompleted
                          ? "bg-stone-200 text-stone-800 font-bold"
                          : "bg-stone-100 text-stone-400 font-normal"
                      )}
                    >
                      {isCompleted ? <Check size={10} strokeWidth={2.5} /> : s.id}
                    </span>
                    <span className="text-[11px] font-medium">{s.label}</span>
                  </button>

                  {idx < STEPS.length - 1 && (
                    <span className="text-stone-300 text-xs hidden md:inline">→</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile Live Store Card Toggle */}
        <div className="block lg:hidden mt-3 pt-2.5 border-t border-stone-100">
          <button
            type="button"
            onClick={() => setIsMobilePassExpanded(!isMobilePassExpanded)}
            className="w-full flex items-center justify-between bg-white border border-stone-200 hover:border-stone-300 rounded-lg px-3.5 py-2 text-xs transition-colors shadow-2xs"
          >
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-stone-500" />
              <span className="text-stone-700">
                Store Card:{" "}
                <span className="font-semibold text-stone-900">
                  {formData.businessName || "Your Business Name"}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-medium text-stone-600">
              <span>{isMobilePassExpanded ? "Hide Card" : "Preview Card"}</span>
              <ChevronDown
                size={14}
                className={cn("transition-transform duration-200", isMobilePassExpanded && "rotate-180")}
              />
            </div>
          </button>

          {/* Mobile Collapsible Card Drawer */}
          <AnimatePresence>
            {isMobilePassExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden pt-3"
              >
                <AtelierPassCard
                  brandName={formData.businessName}
                  specialty={currentSpecializationName}
                  imagePreview={businessImagePreview}
                  experience={formData.experience}
                  location={locationAddress}
                  selectedTags={selectedTags}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. SPLIT WORKSPACE: STORE PROFILE CARD (LEFT) & FORM (RIGHT)              */}
      {/* ========================================================================= */}
      <div className="flex-1 relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-8 lg:px-12 py-6 sm:py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
        {/* DESKTOP LEFT COLUMN: LIVE STORE CARD */}
        <aside className="hidden lg:block lg:col-span-5 sticky top-[96px]">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-medium text-stone-600">
                <Store size={14} className="text-stone-500" />
                <span>Customer Storefront Preview</span>
              </div>
              <span className="text-[10px] font-medium text-stone-500 bg-stone-100 border border-stone-200 px-2 py-0.5 rounded-md">
                LIVE PREVIEW
              </span>
            </div>

            {/* The Live Store Profile Card */}
            <AtelierPassCard
              brandName={formData.businessName}
              specialty={currentSpecializationName}
              imagePreview={businessImagePreview}
              experience={formData.experience}
              location={locationAddress}
              selectedTags={selectedTags}
            />

            {/* Simple Benefits Box */}
            <div className="bg-white rounded-xl p-4 border border-stone-200 shadow-2xs space-y-2.5 text-xs text-stone-600">
              <p className="font-semibold text-stone-900 text-xs flex items-center gap-1.5">
                <BadgeCheck size={15} className="text-stone-700" />
                <span>What you get on TrendiZip:</span>
              </p>
              <ul className="space-y-1.5 text-xs text-stone-600 pt-0.5">
                <li className="flex items-center gap-2">
                  <Check size={13} className="text-stone-700 shrink-0" />
                  <span>Your own web page link to share with customers</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={13} className="text-stone-700 shrink-0" />
                  <span>Receive customer orders and measurement bookings</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={13} className="text-stone-700 shrink-0" />
                  <span>Direct Mobile Money payments straight to your phone</span>
                </li>
              </ul>
            </div>
          </div>
        </aside>

        {/* RIGHT COLUMN: MAIN FORM */}
        <main className="lg:col-span-7 pb-32 lg:pb-16">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="bg-white rounded-xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-6 sm:space-y-7"
            >
              {/* Step Header in Simple English */}
              <div className="space-y-1 border-b border-stone-100 pb-4">
                <span className="text-xs font-medium text-stone-500">
                  Step {currentStep} of 3
                </span>
                <h2 className="text-xl sm:text-2xl font-semibold text-stone-900 tracking-tight">
                  {currentStep === 1 && "Tell us about your business"}
                  {currentStep === 2 && "Add your photo and specialty styles"}
                  {currentStep === 3 && "Your shop location and payment details"}
                </h2>
                <p className="text-xs sm:text-sm text-stone-500 leading-relaxed pt-0.5">
                  {currentStep === 1 &&
                    "Choose what describes your work best and enter your business name."}
                  {currentStep === 2 &&
                    "Show customers your best work, pick your styles, and write a short welcome note."}
                  {currentStep === 3 &&
                    "Enter your shop address and Mobile Money number so you can get paid for orders."}
                </p>
              </div>

              {/* ======================================================= */}
              {/* STEP 1: BUSINESS INFO                                   */}
              {/* ======================================================= */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  {/* Specialization Options */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <Label className="text-xs font-medium text-stone-700 flex items-center gap-1.5">
                        <Scissors size={14} className="text-stone-500" />
                        <span>What describes your business best?</span>
                        <span className="text-amber-600">*</span>
                      </Label>
                      {validationErrors.specialization && (
                        <span className="text-[11px] text-red-600 font-medium flex items-center gap-1">
                          <AlertCircle size={12} /> {validationErrors.specialization}
                        </span>
                      )}
                    </div>

                    {isLoadingTypes ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="h-28 rounded-xl bg-stone-50 animate-pulse border border-stone-200" />
                        <div className="h-28 rounded-xl bg-stone-50 animate-pulse border border-stone-200" />
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {professionalTypes.map((type) => {
                          const isSelected = selectedSpecialization === type.id;
                          const isTailor =
                            type.name.toLowerCase().includes("tailor") ||
                            type.name.toLowerCase().includes("designer") ||
                            type.name.toLowerCase().includes("couture");

                          return (
                            <button
                              key={type.id}
                              type="button"
                              onClick={() => {
                                setSelectedSpecialization(type.id);
                                clearError("specialization");
                              }}
                              className={cn(
                                "p-4 text-left rounded-xl border transition-colors relative flex flex-col justify-between group cursor-pointer",
                                isSelected
                                  ? "bg-stone-900 text-white border-stone-900 shadow-2xs"
                                  : "bg-white hover:bg-stone-50/70 border-stone-200 hover:border-stone-300 text-stone-800 shadow-2xs"
                              )}
                            >
                              <div className="flex items-start justify-between w-full mb-3">
                                <div
                                  className={cn(
                                    "w-9 h-9 rounded-lg flex items-center justify-center transition-colors",
                                    isSelected
                                      ? "bg-white/10 text-white"
                                      : "bg-stone-100 border border-stone-200 text-stone-700 group-hover:border-stone-300"
                                  )}
                                >
                                  {isTailor ? <Scissors size={17} /> : <Store size={17} />}
                                </div>
                                {isSelected ? (
                                  <div className="w-4 h-4 rounded-full bg-white text-stone-900 flex items-center justify-center shadow-2xs">
                                    <Check size={11} strokeWidth={3} />
                                  </div>
                                ) : (
                                  <div className="w-4 h-4 rounded-full border border-stone-300 group-hover:border-stone-400" />
                                )}
                              </div>

                              <div>
                                <p
                                  className={cn(
                                    "text-sm font-semibold tracking-tight",
                                    isSelected ? "text-white" : "text-stone-900"
                                  )}
                                >
                                  {type.name}
                                </p>
                                <p
                                  className={cn(
                                    "text-xs mt-0.5 leading-snug",
                                    isSelected ? "text-stone-300" : "text-stone-500"
                                  )}
                                >
                                  {isTailor
                                    ? "You sew custom clothing, take measurements, and handle custom orders"
                                    : "You sell ready-made clothes, fabrics, shoes, or fashion accessories"}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Brand / Business Name Input */}
                  <div className="space-y-1.5 pt-2 border-t border-stone-100">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <Label
                        htmlFor="businessName"
                        className="text-xs font-medium text-stone-700 flex items-center gap-1.5"
                      >
                        <Building2 size={14} className="text-stone-500" />
                        <span>Your Business or Brand Name</span>
                        <span className="text-amber-600">*</span>
                      </Label>
                      {validationErrors.businessName && (
                        <span className="text-[11px] text-red-600 font-medium flex items-center gap-1">
                          <AlertCircle size={12} /> {validationErrors.businessName}
                        </span>
                      )}
                    </div>

                    <Input
                      id="businessName"
                      value={formData.businessName}
                      onChange={(e) => {
                        setFormData({ ...formData, businessName: e.target.value });
                        clearError("businessName");
                      }}
                      placeholder="e.g. Akosua Designs, Kwame Tailoring, Osu Fashion"
                      className={cn(
                        "h-11 bg-white border text-sm font-normal rounded-lg px-3.5 transition-colors placeholder:text-stone-400 text-stone-900 shadow-2xs",
                        validationErrors.businessName
                          ? "border-red-500 focus-visible:ring-1 focus-visible:ring-red-500"
                          : "border-stone-300 focus-visible:ring-1 focus-visible:ring-stone-900 focus-visible:border-stone-900"
                      )}
                    />
                    <p className="text-xs text-stone-500 leading-normal">
                      This is the name customers will see when they visit your shop page and on receipts.
                    </p>
                  </div>
                </div>
              )}

              {/* ======================================================= */}
              {/* STEP 2: PHOTOS & STYLES                                 */}
              {/* ======================================================= */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  {/* Photo Upload */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <Label className="text-xs font-medium text-stone-700 flex items-center gap-1.5">
                        <Upload size={14} className="text-stone-500" />
                        <span>Photo of your work or shop</span>
                        <span className="text-amber-600">*</span>
                      </Label>
                      {validationErrors.businessImage && (
                        <span className="text-[11px] text-red-600 font-medium flex items-center gap-1">
                          <AlertCircle size={12} /> {validationErrors.businessImage}
                        </span>
                      )}
                    </div>

                    {businessImagePreview ? (
                      /* Preview Card with Controls */
                      <div className="relative rounded-lg overflow-hidden border border-stone-200 bg-stone-950 aspect-[16/9] sm:aspect-[2/1] max-h-56 group shadow-xs">
                        <Image
                          src={businessImagePreview}
                          alt="Shop Preview"
                          fill
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-transparent to-black/10" />

                        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                          <div className="flex items-center gap-1.5 bg-stone-900/80 backdrop-blur-xs px-2.5 py-1 rounded-md text-white text-xs font-medium border border-white/10">
                            <CheckCircle2 size={13} className="text-emerald-400" />
                            <span className="truncate max-w-[140px] sm:max-w-[240px]">
                              {businessImage?.name || "Photo Selected"}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="bg-white hover:bg-stone-50 text-stone-900 text-xs font-medium px-2.5 py-1 rounded-md shadow-2xs border border-stone-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <RefreshCw size={12} />
                              <span>Change</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setBusinessImage(null);
                                setBusinessImagePreview("");
                              }}
                              className="bg-red-600 hover:bg-red-700 text-white p-1 rounded-md shadow-2xs transition-colors cursor-pointer"
                              title="Remove photo"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Upload Dropzone */
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className={cn(
                          "relative rounded-xl border border-dashed p-6 sm:p-7 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-stone-50/40 hover:bg-stone-50/80 group shadow-2xs",
                          validationErrors.businessImage
                            ? "border-red-400 bg-red-50/20"
                            : "border-stone-300 hover:border-stone-400"
                        )}
                      >
                        <div className="w-10 h-10 rounded-lg bg-white border border-stone-200 flex items-center justify-center text-stone-700 mb-2 group-hover:border-stone-300 transition-colors shadow-2xs">
                          {isCompressing ? (
                            <Loader2 size={18} className="animate-spin text-stone-800" />
                          ) : (
                            <Upload size={18} />
                          )}
                        </div>

                        <p className="text-sm font-semibold text-stone-900 mb-0.5">
                          {isCompressing
                            ? "Preparing photo..."
                            : "Click to upload a photo"}
                        </p>
                        <p className="text-xs text-stone-500 max-w-xs leading-relaxed mb-3">
                          Pick a clear picture of an outfit you made or your shop. PNG, JPG, or WebP up to 15MB.
                        </p>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setBusinessImagePreview("/reg.jpg");
                            clearError("businessImage");
                          }}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-700 hover:text-stone-900 bg-white hover:bg-stone-50 px-3 py-1.5 rounded-md border border-stone-200 transition-colors shadow-2xs cursor-pointer"
                        >
                          <ImageIcon size={13} className="text-stone-500" />
                          <span>Use sample fashion picture</span>
                        </button>
                      </div>
                    )}

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageFileChange(file);
                        e.target.value = "";
                      }}
                    />
                  </div>

                  {/* Style Tags Section with Hardcoded & Custom Input */}
                  <div className="space-y-2.5 pt-2 border-t border-stone-100">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <Label className="text-xs font-medium text-stone-700 flex items-center gap-1.5">
                        <Scissors size={14} className="text-stone-500" />
                        <span>What styles do you make?</span>
                      </Label>
                      <span className="text-xs text-stone-500">
                        {selectedTags.length}/6 styles chosen
                      </span>
                    </div>

                    <p className="text-xs text-stone-500">
                      Tap any style below to select it, or type your own custom style:
                    </p>

                    {/* Pre-made style tags */}
                    <div className="flex flex-wrap gap-1.5">
                      {HARDCODED_STYLE_TAGS.map((tag) => {
                        const isSelected = selectedTags.includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => handleToggleTag(tag)}
                            className={cn(
                              "px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 border",
                              isSelected
                                ? "bg-stone-900 text-white border-stone-900 shadow-2xs"
                                : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50 hover:border-stone-300"
                            )}
                          >
                            <span>{tag}</span>
                            {isSelected && <Check size={11} strokeWidth={2.5} />}
                          </button>
                        );
                      })}
                    </div>

                    {/* Custom Style Tag Input */}
                    <div className="pt-1.5">
                      <div className="flex gap-2">
                        <Input
                          value={customTagInput}
                          onChange={(e) => setCustomTagInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddCustomTag();
                            }
                          }}
                          placeholder="Type your own style (e.g. Prom Dresses, Plus Size, Two-Piece)..."
                          className="h-10 bg-white border border-stone-300 text-xs rounded-lg text-stone-900 placeholder:text-stone-400 focus-visible:ring-1 focus-visible:ring-stone-900 shadow-2xs"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleAddCustomTag}
                          disabled={!customTagInput.trim()}
                          className="h-10 px-3.5 rounded-lg border-stone-300 bg-white text-stone-800 hover:bg-stone-50 text-xs font-medium shrink-0 cursor-pointer shadow-2xs"
                        >
                          <Plus size={14} className="mr-1 text-stone-600" />
                          <span>Add Style</span>
                        </Button>
                      </div>

                      {/* Currently selected tags pill row (with delete button) */}
                      {selectedTags.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-2">
                          <span className="text-[11px] font-medium text-stone-500 mr-1">
                            Selected:
                          </span>
                          {selectedTags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center gap-1 bg-stone-100 text-stone-800 border border-stone-200 text-xs font-medium px-2.5 py-1 rounded-md"
                            >
                              <span>{tag}</span>
                              <button
                                type="button"
                                onClick={() => handleToggleTag(tag)}
                                className="text-stone-500 hover:text-red-600 rounded p-0.5 cursor-pointer transition-colors"
                                title="Remove style"
                              >
                                <X size={11} />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Experience & Portfolio row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="experience"
                        className="text-xs font-medium text-stone-700 flex items-center gap-1.5"
                      >
                        <Briefcase size={14} className="text-stone-500" />
                        <span>Years in Business</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="experience"
                          type="number"
                          min={0}
                          max={60}
                          value={formData.experience}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              experience: Math.max(0, parseInt(e.target.value) || 0),
                            })
                          }
                          className="h-11 bg-white border border-stone-300 text-stone-900 rounded-lg pr-14 text-sm font-normal shadow-2xs focus-visible:ring-1 focus-visible:ring-stone-900"
                        />
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-stone-400 pointer-events-none">
                          Years
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label
                        htmlFor="portfolioUrl"
                        className="text-xs font-medium text-stone-700 flex items-center gap-1.5"
                      >
                        <Globe size={14} className="text-stone-500" />
                        <span>Instagram or Website Link</span>
                      </Label>
                      <Input
                        id="portfolioUrl"
                        placeholder="e.g. instagram.com/mystudio"
                        value={formData.portfolioUrl}
                        onChange={(e) =>
                          setFormData({ ...formData, portfolioUrl: e.target.value })
                        }
                        className="h-11 bg-white border border-stone-300 text-stone-900 rounded-lg text-sm shadow-2xs focus-visible:ring-1 focus-visible:ring-stone-900"
                      />
                    </div>
                  </div>

                  {/* About your business */}
                  <div className="space-y-1.5 pt-2">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <Label
                        htmlFor="bio"
                        className="text-xs font-medium text-stone-700 flex items-center gap-1.5"
                      >
                        <span>About your business</span>
                        <span className="text-amber-600">*</span>
                      </Label>
                      <span
                        className={cn(
                          "text-xs font-mono px-2 py-0.5 rounded-md border",
                          formData.bio.length > BIO_CHAR_LIMIT
                            ? "bg-red-50 text-red-600 border-red-200 font-bold"
                            : formData.bio.length > BIO_CHAR_LIMIT - 40
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-stone-50 text-stone-500 border-stone-200"
                        )}
                      >
                        {formData.bio.length} / {BIO_CHAR_LIMIT} characters
                      </span>
                    </div>

                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => {
                        setFormData({ ...formData, bio: e.target.value });
                        clearError("bio");
                      }}
                      maxLength={BIO_CHAR_LIMIT}
                      placeholder="Write a short message for customers. Example: We make custom African wear and modern bridal outfits. We take careful measurements and ensure every order is delivered on time..."
                      className={cn(
                        "min-h-[110px] bg-white border text-sm leading-relaxed rounded-lg p-3 shadow-2xs resize-none transition-colors",
                        validationErrors.bio
                          ? "border-red-500 focus-visible:ring-1 focus-visible:ring-red-500"
                          : "border-stone-300 focus-visible:ring-1 focus-visible:ring-stone-900 focus-visible:border-stone-900"
                      )}
                    />

                    {validationErrors.bio && (
                      <p className="text-[11px] text-red-600 font-medium flex items-center gap-1">
                        <AlertCircle size={12} /> {validationErrors.bio}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* ======================================================= */}
              {/* STEP 3: LOCATION & PAYMENT                              */}
              {/* ======================================================= */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  {/* Workshop Address */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <Label className="text-xs font-medium text-stone-700 flex items-center gap-1.5">
                        <MapPin size={14} className="text-stone-500" />
                        <span>Where is your shop located?</span>
                        <span className="text-amber-600">*</span>
                      </Label>
                      {validationErrors.location && (
                        <span className="text-[11px] text-red-600 font-medium flex items-center gap-1">
                          <AlertCircle size={12} /> {validationErrors.location}
                        </span>
                      )}
                    </div>

                    <div className="bg-white p-4 sm:p-5 rounded-xl border border-stone-200 shadow-2xs">
                      <LocationPicker
                        latitude={latitude}
                        longitude={longitude}
                        location={locationAddress}
                        onLocationChange={(lat, lng, addr) => {
                          setLatitude(lat);
                          setLongitude(lng);
                          setLocationAddress(addr);
                          clearError("location");
                        }}
                      />
                    </div>
                  </div>

                  {/* Mobile Money Payouts */}
                  <div className="space-y-3 pt-2 border-t border-stone-100">
                    <div>
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <Label className="text-xs font-medium text-stone-700 flex items-center gap-1.5">
                          <CreditCard size={14} className="text-stone-500" />
                          <span>Where should we send your payments?</span>
                          <span className="text-amber-600">*</span>
                        </Label>
                        {validationErrors.momoProvider && (
                          <span className="text-[11px] text-red-600 font-medium flex items-center gap-1">
                            <AlertCircle size={12} /> {validationErrors.momoProvider}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-500 mt-0.5">
                        Whenever a customer buys an outfit or books you, your earnings will be sent straight to this Mobile Money account.
                      </p>
                    </div>

                    {/* Network Provider Buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {momoProviders.map((p) => {
                        const isSelected = formData.momoProvider === p.code;
                        const isMtn = p.code.toLowerCase().includes("mtn");
                        const isVodafone =
                          p.code.toLowerCase().includes("vod") ||
                          p.code.toLowerCase().includes("telecel");

                        return (
                          <button
                            key={p.code}
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, momoProvider: p.code });
                              clearError("momoProvider");
                            }}
                            className={cn(
                              "p-3 rounded-lg border text-left flex items-center justify-between transition-colors cursor-pointer",
                              isSelected
                                ? "bg-stone-900 border-stone-900 text-white shadow-2xs"
                                : validationErrors.momoProvider
                                ? "bg-white hover:bg-stone-50 border-red-300 text-stone-800 shadow-2xs"
                                : "bg-white hover:bg-stone-50 border-stone-200 text-stone-800 shadow-2xs"
                            )}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span
                                className={cn(
                                  "w-2 h-2 rounded-full shrink-0",
                                  isMtn
                                    ? "bg-amber-400"
                                    : isVodafone
                                    ? "bg-red-500"
                                    : "bg-blue-500"
                                )}
                              />
                              <span className="text-xs font-semibold truncate">
                                {p.displayName || p.name || p.code}
                              </span>
                            </div>

                            {isSelected && (
                              <Check size={13} className="text-white shrink-0" strokeWidth={2.5} />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* MoMo Number Input */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <Label
                          htmlFor="momoNumber"
                          className="text-xs font-medium text-stone-700 flex items-center gap-1.5"
                        >
                          <span>Your Mobile Money Phone Number</span>
                          <span className="text-amber-600">*</span>
                        </Label>
                        {validationErrors.momoNumber && (
                          <span className="text-[11px] text-red-600 font-medium flex items-center gap-1">
                            <AlertCircle size={12} /> {validationErrors.momoNumber}
                          </span>
                        )}
                      </div>

                      <div className="relative">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs font-mono text-stone-500 pointer-events-none">
                          <span className="font-semibold text-stone-800">🇬🇭 +233</span>
                          <span className="text-stone-300">|</span>
                        </div>
                        <Input
                          id="momoNumber"
                          placeholder="024 123 4567"
                          value={formData.momoNumber}
                          onChange={(e) => {
                            setFormData({ ...formData, momoNumber: e.target.value });
                            clearError("momoNumber");
                          }}
                          className={cn(
                            "h-11 bg-white border text-sm font-normal rounded-lg pl-24 pr-4 transition-colors shadow-2xs text-stone-900",
                            validationErrors.momoNumber
                              ? "border-red-500 focus-visible:ring-1 focus-visible:ring-red-500"
                              : "border-stone-300 focus-visible:ring-1 focus-visible:ring-stone-900 focus-visible:border-stone-900"
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Summary Check Card */}
                  <div className="p-4 bg-stone-50 border border-stone-200 rounded-lg space-y-1.5 text-xs text-stone-600">
                    <div className="flex items-center gap-1.5 font-semibold text-stone-900 text-xs">
                      <BadgeCheck size={14} className="text-stone-700" />
                      <span>Summary before submitting</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5 text-xs">
                      <div>
                        <span className="text-stone-500">Business Name: </span>
                        <span className="font-medium text-stone-900">
                          {formData.businessName || "Not set"}
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-500">Shop Address: </span>
                        <span className="font-medium text-stone-900 truncate block">
                          {locationAddress || "Address required"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ACTION BUTTONS (Desktop) */}
              <div className="pt-5 border-t border-stone-100 hidden lg:flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (currentStep > 1) {
                      setCurrentStep((p) => p - 1);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }
                  }}
                  disabled={currentStep === 1 || isSubmitting}
                  className={cn(
                    "h-10 px-4 rounded-lg border-stone-200 text-stone-700 hover:bg-stone-50 text-xs font-medium transition-colors cursor-pointer",
                    currentStep === 1 ? "opacity-0 pointer-events-none" : ""
                  )}
                >
                  <ChevronLeft size={15} className="mr-1" />
                  <span>Previous</span>
                </Button>

                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={isSubmitting || isCompressing}
                  className="h-10 px-6 bg-stone-900 text-white hover:bg-stone-800 rounded-lg text-xs font-medium tracking-wide transition-colors shadow-2xs active:scale-[0.99] cursor-pointer"
                >
                  {isSubmitting || isCompressing ? (
                    <span className="flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin text-stone-400" />
                      <span>{isCompressing ? "Preparing photo..." : submissionStatus || "Saving..."}</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <span>{currentStep === 3 ? "Complete Registration & Open Shop" : "Continue to Next Step"}</span>
                      <ArrowRight size={14} />
                    </span>
                  )}
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* ========================================================================= */}
      {/* 3. MOBILE STICKY BOTTOM BAR                                               */}
      {/* ========================================================================= */}
      <div className="block lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-stone-200 px-4 py-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] shadow-md">
        <div className="flex items-center justify-between gap-3 max-w-md mx-auto">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (currentStep > 1) {
                setCurrentStep((p) => p - 1);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
            disabled={currentStep === 1 || isSubmitting}
            className={cn(
              "h-9 px-3 rounded-lg border-stone-200 text-stone-700 text-xs font-medium",
              currentStep === 1 ? "opacity-0 pointer-events-none" : ""
            )}
          >
            <ChevronLeft size={14} className="mr-0.5" />
            <span>Previous</span>
          </Button>

          <div className="text-center">
            <span className="text-xs font-medium text-stone-600">
              Step {currentStep} of 3
            </span>
          </div>

          <Button
            type="button"
            onClick={handleNext}
            disabled={isSubmitting || isCompressing}
            className="h-9 px-4 bg-stone-900 text-white hover:bg-stone-800 rounded-lg text-xs font-medium transition-colors shadow-2xs active:scale-95"
          >
            {isSubmitting || isCompressing ? (
              <span className="flex items-center gap-1.5">
                <Loader2 size={13} className="animate-spin text-stone-400" />
                <span>{isCompressing ? "Saving..." : "Creating..."}</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <span>{currentStep === 3 ? "Open Shop" : "Continue"}</span>
                <ArrowRight size={13} />
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. SUCCESS POPUP MODAL                                                    */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isSuccessModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 bg-stone-950/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white rounded-xl p-6 sm:p-7 max-w-md w-full shadow-xl border border-stone-200 text-center space-y-5"
            >
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
                <BadgeCheck size={26} strokeWidth={2} />
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200/80">
                  Registration Successful
                </span>
                <h3 className="text-xl font-semibold text-stone-900 tracking-tight">
                  Welcome, {formData.businessName || "Partner"}!
                </h3>
                <p className="text-xs text-stone-500 leading-relaxed max-w-xs mx-auto">
                  Your fashion profile is live. Customers across Ghana can now find your work and place orders.
                </p>
              </div>

              {/* Pass Mini Preview */}
              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 flex items-center gap-3 text-left">
                <div className="w-12 h-12 rounded-md overflow-hidden relative bg-stone-200 shrink-0">
                  <Image
                    src={businessImagePreview || "/reg.jpg"}
                    alt="Store Photo"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-stone-900 truncate">
                    {formData.businessName}
                  </p>
                  <p className="text-xs text-stone-600">
                    {currentSpecializationName}
                  </p>
                  <p className="text-[11px] text-stone-400 truncate">
                    {locationAddress || "Ghana"}
                  </p>
                </div>
              </div>

              {/* Buttons */}
              <div className="space-y-2 pt-1">
                <Button
                  onClick={() => router.push("/dashboard")}
                  className="w-full h-10 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-medium text-xs tracking-wide transition-colors shadow-2xs"
                >
                  Go to My Dashboard
                </Button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.origin);
                      toast.success("Link copied!");
                    }}
                    className="h-9 rounded-lg bg-stone-100 hover:bg-stone-200/70 text-stone-700 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-stone-200"
                  >
                    <Copy size={13} />
                    <span>Copy Link</span>
                  </button>

                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(
                      `Hello! I just opened my fashion profile "${formData.businessName}" on TrendiZip! Check out my styles and place orders.`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="h-9 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Share2 size={13} />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ========================================================================= */
/* STORE PROFILE CARD COMPONENT                                              */
/* ========================================================================= */
interface AtelierPassCardProps {
  brandName: string;
  specialty: string;
  imagePreview?: string;
  experience: number;
  location: string;
  selectedTags: string[];
}

function AtelierPassCard({
  brandName,
  specialty,
  imagePreview,
  experience,
  location,
  selectedTags,
}: AtelierPassCardProps) {
  const currentYear = new Date().getFullYear();
  const estYear = experience > 0 ? currentYear - experience : currentYear;
  const shortCity = location ? location.split(",")[0] : "Accra, Ghana";

  return (
    <div className="relative rounded-xl overflow-hidden p-5 bg-white border border-stone-200 shadow-xs space-y-4">
      {/* Top Card Header */}
      <div className="flex items-center justify-between border-b border-stone-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-stone-900 text-white flex items-center justify-center text-[10px] font-semibold tracking-wider">
            TZ
          </div>
          <div>
            <p className="text-xs font-semibold text-stone-900 leading-tight">
              TrendiZip Designer Profile
            </p>
            <p className="text-[11px] text-stone-500">Verified Seller in Ghana</p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[11px] text-stone-400 block font-mono">EST. {estYear}</span>
          <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60">
            ACTIVE
          </span>
        </div>
      </div>

      {/* Photo Preview */}
      <div className="relative aspect-[16/10] rounded-lg overflow-hidden bg-stone-100 border border-stone-200">
        <Image
          src={imagePreview || "/reg.jpg"}
          alt="Profile Preview"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/60 via-transparent to-transparent" />

        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white text-xs">
          <span className="bg-stone-900/80 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] font-medium border border-white/10">
            {specialty.split("&")[0].trim()}
          </span>
          <span className="flex items-center gap-1 text-[10px]">
            <MapPin size={11} className="text-amber-400" /> {shortCity}
          </span>
        </div>
      </div>

      {/* Business Name & Specialty */}
      <div className="space-y-0.5">
        <h3 className="text-lg font-semibold text-stone-900 tracking-tight leading-snug truncate">
          {brandName || "Your Business Name"}
        </h3>
        <p className="text-xs text-stone-600 font-normal">
          {specialty}
        </p>
      </div>

      {/* Selected Style Tags */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedTags.map((tag) => (
            <span
              key={tag}
              className="text-[11px] bg-stone-100 text-stone-700 border border-stone-200 px-2 py-0.5 rounded-md font-medium"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer & QR Icon */}
      <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-stone-100 text-stone-700 border border-stone-200 flex items-center justify-center">
            <BadgeCheck size={16} />
          </div>
          <div>
            <p className="text-xs font-semibold text-stone-900">
              Verified Fashion Seller
            </p>
            <p className="text-[10px] text-stone-400 font-mono">Instant MoMo Payouts</p>
          </div>
        </div>

        {/* Mini QR Icon */}
        <div className="w-8 h-8 bg-stone-50 rounded-md border border-stone-200 p-1 flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-full h-full text-stone-800" fill="currentColor">
            <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm10-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm13-2h3v3h-3v-3zm0 5h3v3h-3v-3zm-3-5h2v2h-2v-2zm0 4h2v4h-2v-4zm5-1h2v3h-2v-3z" />
          </svg>
        </div>
      </div>
    </div>
  );
}

const LoginPrompt = () => (
  <div className="min-h-[calc(100dvh-64px)] lg:min-h-[calc(100dvh-80px)] bg-[#fafaf9] flex items-center justify-center p-6 text-stone-900 relative">
    <div className="max-w-md w-full text-center space-y-6 p-7 sm:p-8 rounded-xl bg-white border border-stone-200 shadow-sm">
      <div className="w-12 h-12 rounded-lg bg-stone-100 border border-stone-200 text-stone-700 flex items-center justify-center mx-auto shadow-2xs">
        <Store size={22} />
      </div>

      <div className="space-y-1.5">
        <span className="text-[11px] font-medium text-stone-600 bg-stone-100 px-2.5 py-0.5 rounded-md border border-stone-200">
          Partner Portal
        </span>
        <h1 className="text-xl font-semibold text-stone-900 leading-tight">
          Join TrendiZip as a Tailor or Designer
        </h1>
        <p className="text-stone-500 text-xs leading-relaxed max-w-xs mx-auto">
          Please sign in to your TrendiZip account to set up your business profile and start taking orders.
        </p>
      </div>

      <Button
        onClick={() => signIn(undefined, { callbackUrl: "/register-as-professional" })}
        className="w-full h-10 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-medium text-xs transition-colors shadow-2xs"
      >
        Sign In to Continue
      </Button>
    </div>
  </div>
);