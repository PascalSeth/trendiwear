"use client";

import React, { useState, useEffect, useCallback, useRef, useId } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Star,
  MapPin,
  ShoppingBag,
  MessageSquare,
  Scissors,
  Globe,
  Settings,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  X,
  Copy,
  Check,
  ArrowUpRight,
  Clock,
  Search,
  Images,
  RefreshCw,
} from "lucide-react";
import {
  FaInstagram,
  FaFacebook,
  FaXTwitter,
  FaTiktok,
  FaYoutube,
  FaPinterest,
  FaLinkedin,
} from "react-icons/fa6";
import { cn } from "@/lib/utils";
import { ProductCard } from "@/components/common/ProductCard";
import { ServiceListItem } from "@/app/components/services/ServiceListItem";
import { type ServiceWithVariants } from "@/app/components/services/ServiceCard";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { ChatDrawer } from "@/app/components/chat/ChatDrawer";

// --- TYPES ---
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

interface Location {
  address: string;
  city: string;
  country: string;
  hours: string;
  availabilityRaw?: string;
  latitude?: number;
  longitude?: number;
}

// Helper to check if currently open
function checkIfOpen(availabilityRaw?: string): {
  isOpen: boolean;
  nextChange: string;
} {
  if (!availabilityRaw) return { isOpen: false, nextChange: "" };

  try {
    const hours: BusinessHours = JSON.parse(availabilityRaw);
    const now = new Date();
    const dayNames: (keyof BusinessHours)[] = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    const currentDay = dayNames[now.getDay()];
    const todayHours = hours[currentDay];

    if (!todayHours?.enabled) {
      // Find next open day
      for (let i = 1; i <= 7; i++) {
        const nextDayIndex = (now.getDay() + i) % 7;
        const nextDay = dayNames[nextDayIndex];
        if (hours[nextDay]?.enabled) {
          const dayLabel = nextDay.charAt(0).toUpperCase() + nextDay.slice(1);
          return { isOpen: false, nextChange: `Opens ${dayLabel}` };
        }
      }
      return { isOpen: false, nextChange: "Closed" };
    }

    const [openHour, openMin] = todayHours.open.split(":").map(Number);
    const [closeHour, closeMin] = todayHours.close.split(":").map(Number);
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const openMinutes = openHour * 60 + openMin;
    const closeMinutes = closeHour * 60 + closeMin;

    if (currentMinutes >= openMinutes && currentMinutes < closeMinutes) {
      const closeHour12 = closeHour % 12 || 12;
      const closeAmPm = closeHour >= 12 ? "PM" : "AM";
      return {
        isOpen: true,
        nextChange: `Closes ${closeHour12}:${closeMin.toString().padStart(2, "0")} ${closeAmPm}`,
      };
    } else if (currentMinutes < openMinutes) {
      const openHour12 = openHour % 12 || 12;
      const openAmPm = openHour >= 12 ? "PM" : "AM";
      return {
        isOpen: false,
        nextChange: `Opens ${openHour12}:${openMin.toString().padStart(2, "0")} ${openAmPm}`,
      };
    } else {
      // Past closing time, find next open day
      for (let i = 1; i <= 7; i++) {
        const nextDayIndex = (now.getDay() + i) % 7;
        const nextDay = dayNames[nextDayIndex];
        if (hours[nextDay]?.enabled) {
          const dayLabel = nextDay.charAt(0).toUpperCase() + nextDay.slice(1);
          return { isOpen: false, nextChange: `Opens ${dayLabel}` };
        }
      }
      return { isOpen: false, nextChange: "Closed" };
    }
  } catch {
    return { isOpen: false, nextChange: "" };
  }
}

interface Review {
  id: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  date: string;
  productName?: string;
  productImage?: string;
}

interface ProductPreview {
  id: string;
  slug?: string;
  name: string;
  price: number;
  currency: string;
  images: string[];
  sizes?: string[];
  colors?: string[];
  stockQuantity: number;
  isPreorder?: boolean;
  createdAt?: string | Date;
  professional: {
    firstName: string;
    lastName: string;
    professionalProfile?: {
      businessName?: string;
      businessImage?: string;
      isVerified?: boolean;
    };
  };
  _count: {
    wishlistItems: number;
  };
  categories?: {
    name: string;
    slug: string;
  }[];
  category?: {
    name: string;
    slug: string;
  };
  tags?: string[];
  effectivePrice?: number;
  isDiscountActive?: boolean;
  discountAmount?: number;
  discountPercentage?: number | null;
  discountEndDate?: string | null;
}

export interface ProfessionalProfile {
  id: string;
  businessName: string;
  businessImage?: string;
  coverImage?: string;
  bio?: string;
  rating?: number;
  totalReviews?: number;
  isVerified?: boolean;
  galleryImages?: string[];
  portfolioCollections?: PortfolioCollection[];
  location?: Location;
  reviews?: Review[];
  featuredProducts?: ProductPreview[];
  socials?: Record<string, string>;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    profileImage?: string;
    email: string;
  };
  specialization: {
    name: string;
  };
  slug: string;
}

export interface PortfolioCollection {
  id: string;
  name: string;
  description?: string;
  images: string[];
  coverImage?: string;
  order: number;
}

// --- TYPES ---

export interface ProfileClientProps {
  profile: ProfessionalProfile;
  slug: string;
  isOwner: boolean;
  baseUrl?: string;
}

// Palette is scoped to this component; no global theme changes are required.
const theme = {
  "--studio-bg": "#F6F5EF",
  "--studio-ink": "#173E35",
  "--studio-accent": "#DCE99B",
  "--studio-line": "#DFE4D9",
} as React.CSSProperties;
const primary =
  "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-[var(--studio-ink)] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#25584B]";
const secondary =
  "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-[var(--studio-line)] bg-white px-3 py-2 text-xs font-medium text-[var(--studio-ink)] transition hover:bg-[#EFF3E7]";
const eyebrow = "text-[11px] font-semibold uppercase tracking-[0.18em]";
const socialIcons: Record<string, React.ElementType> = {
  INSTAGRAM: FaInstagram,
  FACEBOOK: FaFacebook,
  X: FaXTwitter,
  TIKTOK: FaTiktok,
  YOUTUBE: FaYoutube,
  PINTEREST: FaPinterest,
  LINKEDIN: FaLinkedin,
  WEBSITE: Globe,
};
function safeExternalUrl(value: string) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}
const ProfileMap = ({ lat, lng }: { lat: number; lng: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let cancelled = false;
    let map: google.maps.Map | undefined;
    let marker: google.maps.Marker | undefined;
    setFailed(false);
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!key) {
      setFailed(true);
      return;
    }
    setOptions({ key, v: "weekly" });
    importLibrary("maps")
      .then(() => {
        if (cancelled || !ref.current) return;
        map = new google.maps.Map(ref.current, {
          center: { lat, lng },
          zoom: 15,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: "cooperative",
          styles: [{ featureType: "poi", stylers: [{ visibility: "off" }] }],
        });
        marker = new google.maps.Marker({
          position: { lat, lng },
          map,
          title: "Studio location",
        });
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
      marker?.setMap(null);
      if (map) google.maps.event.clearInstanceListeners(map);
    };
  }, [lat, lng]);
  return failed ? (
    <div className="flex h-full items-center justify-center gap-2 bg-[#EAF0DF] px-4 text-sm text-[#52665A]">
      <MapPin size={18} /> Map unavailable. Use directions below.
    </div>
  ) : (
    <div ref={ref} className="h-full w-full" aria-label="Studio location map" />
  );
};
function EmptyState({
  icon: Icon,
  title,
  detail,
}: {
  icon: React.ElementType;
  title: string;
  detail: string;
}) {
  return (
    <div className="col-span-full flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-[#CED9CB] bg-white/60 p-8 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF0DF] text-[#476047]">
        <Icon size={23} strokeWidth={1.5} />
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-[#667268]">
        {detail}
      </p>
    </div>
  );
}

type Tab = "products" | "services" | "gallery" | "reviews";
const tabConfig = {
  products: {
    label: "Shop",
    title: "The collection",
    subtitle: "Discover pieces from the studio.",
    icon: ShoppingBag,
  },
  services: {
    label: "Services",
    title: "Made for you",
    subtitle: "Explore services and book your next appointment.",
    icon: Scissors,
  },
  gallery: {
    label: "Portfolio",
    title: "A closer look",
    subtitle: "Explore the work, one collection at a time.",
    icon: Images,
  },
  reviews: {
    label: "Reviews",
    title: "In their words",
    subtitle: "Experiences shared by clients.",
    icon: MessageSquare,
  },
};

const ProfileClient = ({
  profile,
  slug,
  isOwner,
  baseUrl,
}: ProfileClientProps) => {
  const displayName =
    profile.businessName ||
    `${profile.user.firstName} ${profile.user.lastName}`;
  const profileImage =
    profile.businessImage ||
    profile.user.profileImage ||
    "/placeholder-avatar.jpg";
  const isModel = profile.specialization?.name?.toLowerCase().includes("model");
  const [activeTab, setActiveTab] = useState<Tab>(
    isModel ? "gallery" : "products",
  );
  const [services, setServices] = useState<ServiceWithVariants[]>([]);
  const [serviceStatus, setServiceStatus] = useState<
    "idle" | "loading" | "loaded" | "error"
  >("idle");
  const [query, setQuery] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedCollection, setSelectedCollection] =
    useState<PortfolioCollection | null>(null);
  const [viewer, setViewer] = useState<{
    images: string[];
    index: number;
    title: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [bioExpanded, setBioExpanded] = useState(false);
  const [openStatus, setOpenStatus] = useState<{
    isOpen: boolean;
    nextChange: string;
  } | null>(null);
  const requestRef = useRef<AbortController | null>(null);
  const copyTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentRef = useRef<HTMLElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  const tabsId = useId();
  const reducedMotion = useReducedMotion();
  const router = useRouter();
  const { data: session } = useSession();
  const products = profile.featuredProducts || [];
  const collections = [...(profile.portfolioCollections || [])].sort(
    (a, b) => a.order - b.order,
  );
  const legacyImages = profile.galleryImages || [];
  const reviewCount = profile.totalReviews ?? profile.reviews?.length ?? 0;
  const search = query.trim().toLowerCase();
  const visibleProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search),
  );
  const visibleServices = services.filter(
    (s) => !search || JSON.stringify(s).toLowerCase().includes(search),
  );
  const hasCoordinates =
    Number.isFinite(profile.location?.latitude) &&
    Number.isFinite(profile.location?.longitude);
  const address = [
    profile.location?.address,
    profile.location?.city,
    profile.location?.country,
  ]
    .filter(Boolean)
    .join(", ");
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(hasCoordinates ? `${profile.location!.latitude},${profile.location!.longitude}` : address)}`;
  const tabs: Tab[] = isModel
    ? ["gallery", "services", "products", "reviews"]
    : ["products", "services", "gallery", "reviews"];
  const tabInfo = tabConfig[activeTab];

  useEffect(() => {
    const refresh = () =>
      setOpenStatus(checkIfOpen(profile.location?.availabilityRaw));
    refresh();
    const interval = setInterval(refresh, 60000);
    return () => clearInterval(interval);
  }, [profile.location?.availabilityRaw]);
  useEffect(() => {
    requestRef.current?.abort();
    setServices([]);
    setServiceStatus("idle");
    return () => requestRef.current?.abort();
  }, [profile.user.id]);
  useEffect(
    () => () => {
      if (copyTimeout.current) clearTimeout(copyTimeout.current);
    },
    [],
  );
  const fetchServices = useCallback(async () => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setServiceStatus("loading");
    try {
      const response = await fetch(
        `/api/services?professionalId=${encodeURIComponent(profile.user.id)}&limit=50`,
        { signal: controller.signal },
      );
      if (!response.ok) throw new Error("Unable to load services");
      const data: { services: ServiceWithVariants[] } = await response.json();
      if (!controller.signal.aborted) {
        setServices(data.services || []);
        setServiceStatus("loaded");
      }
    } catch {
      if (!controller.signal.aborted) setServiceStatus("error");
    }
  }, [profile.user.id]);
  useEffect(() => {
    if (activeTab === "services" && serviceStatus === "idle")
      void fetchServices();
  }, [activeTab, serviceStatus, fetchServices]);

  const viewerOpen = viewer !== null;
  useEffect(() => {
    if (!viewerOpen) return;
    const dialog = dialogRef.current;
    lastFocus.current = document.activeElement as HTMLElement;
    dialog?.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
      lastFocus.current?.focus();
    };
  }, [viewerOpen]);
  const moveImage = (delta: number) =>
    setViewer((v) =>
      v
        ? {
          ...v,
          index: Math.max(0, Math.min(v.images.length - 1, v.index + delta)),
        }
        : v,
    );
  const handleCopyLink = async () => {
    try {
      const origin = baseUrl?.replace(/\/$/, "") || window.location.origin;
      await navigator.clipboard.writeText(`${origin}/tz/${slug}`);
      setCopied(true);
      toast.success("Profile link copied");
      if (copyTimeout.current) clearTimeout(copyTimeout.current);
      copyTimeout.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(
        "Could not copy the link. Please copy it from your address bar.",
      );
    }
  };
  const openChat = () => {
    if (!session) {
      toast.error("Please sign in to message this professional");
      return;
    }
    setIsChatOpen(true);
  };
  const chooseTab = (tab: Tab, scroll = false) => {
    setActiveTab(tab);
    setQuery("");
    if (scroll)
      contentRef.current?.scrollIntoView({
        behavior: reducedMotion ? "auto" : "smooth",
        block: "start",
      });
  };
  const handleBookService = (service: ServiceWithVariants) =>
    router.push(`/tz/${profile.slug}/book/${service.professionalServiceId}`);
  const photo = (
    src: string,
    title: string,
    onClick: () => void,
    featured = false,
  ) => (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative block w-full overflow-hidden rounded-2xl bg-[#E8ECDF] text-left",
        featured ? "aspect-[4/5] sm:aspect-[4/3]" : "aspect-[4/5]",
      )}
      aria-label={`Open ${title}`}
    >
      <Image
        src={src}
        alt={title}
        fill
        sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 30vw"
        className="object-cover transition-transform duration-500 motion-reduce:transition-none group-hover:scale-[1.035]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5 text-white">
        <span className="font-serif text-xl leading-tight">{title}</span>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/40 bg-white/10 backdrop-blur">
          <ArrowUpRight size={18} />
        </span>
      </div>
    </button>
  );

  return (
    <div
      style={theme}
      className="studio-profile min-h-screen bg-[var(--studio-bg)] pb-12 font-sans text-[var(--studio-ink)] selection:bg-[#DCE99B]"
    >
      <style>{`.studio-profile :is(button,a,input,summary):focus-visible{outline:3px solid #718E35;outline-offset:4px}.studio-profile button:disabled{cursor:not-allowed}.studio-profile dialog::backdrop{background:rgba(8,25,21,.92);backdrop-filter:blur(10px)}`}</style>
      <div className="mx-auto max-w-[1440px] px-3 pt-3 sm:px-5 sm:pt-4 lg:px-8">
        {/* One unified identity and cover composition. */}
        <header className="overflow-hidden rounded-[20px] border border-[#D8E0D1] bg-[#EAF0DF] sm:rounded-[24px]">
          <div className="grid md:grid-cols-[1fr_1fr]">
            <div className="relative order-2 flex flex-col justify-between p-4 sm:p-5 md:order-1 lg:p-6">
              <div className="mb-3 flex items-center justify-between gap-4">
                <span
                  className={cn(
                    eyebrow,
                    "flex items-center gap-2 text-[#52684B]",
                  )}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-[#718E35]" />{" "}
                  {profile.specialization?.name || "Independent creative"}
                </span>
                {isOwner && (
                  <Link
                    href="/settings"
                    className="flex min-h-11 items-center gap-1.5 text-xs font-semibold"
                  >
                    <Settings size={15} /> Edit profile
                  </Link>
                )}
              </div>
              <div>
                <div className="mb-3 flex items-center gap-3">
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border-2 border-white shadow-sm">
                    <Image
                      src={profileImage}
                      alt={displayName}
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  </div>
                  <div className="text-[11px] leading-relaxed text-[#5F715B]">
                    {profile.isVerified ? (
                      <span className="flex items-center gap-1.5 font-semibold text-[#31533E]">
                        <BadgeCheck size={14} /> Verified professional
                      </span>
                    ) : (
                      <span>Meet the creative</span>
                    )}
                    {profile.location?.city && (
                      <span className="mt-1 flex items-center gap-1">
                        <MapPin size={12} />
                        {profile.location.city}
                        {profile.location.country
                          ? `, ${profile.location.country}`
                          : ""}
                      </span>
                    )}
                  </div>
                </div>
                <h1 className="max-w-xl break-words font-serif text-[28px] leading-[1.1] tracking-[-0.025em] sm:text-3xl xl:text-[36px]">
                  {displayName}
                  <span className="text-[#8DA54F]">.</span>
                </h1>
                {profile.bio && (
                  <div className="mt-3 max-w-lg">
                    <p
                      className={cn(
                        "whitespace-pre-line text-xs leading-5 text-[#566650]",
                        !bioExpanded && "line-clamp-3",
                      )}
                    >
                      {profile.bio}
                    </p>
                    {profile.bio.length > 160 && (
                      <button
                        type="button"
                        onClick={() => setBioExpanded(!bioExpanded)}
                        aria-expanded={bioExpanded}
                        className="mt-0.5 min-h-8 text-[11px] font-semibold underline decoration-[#A7BA87] underline-offset-4"
                      >
                        {bioExpanded ? "Read less" : "More about the studio"}
                      </button>
                    )}
                  </div>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  {isModel ? (
                    <button
                      type="button"
                      className={primary}
                      onClick={() => chooseTab("gallery", true)}
                    >
                      Explore portfolio <ArrowUpRight size={15} />
                    </button>
                  ) : (
                    <Link className={primary} href={`/tz/${slug}/shop`}>
                      Explore the shop <ArrowUpRight size={15} />
                    </Link>
                  )}
                  <button
                    type="button"
                    className={cn(secondary, "bg-transparent")}
                    onClick={() => chooseTab("services", true)}
                  >
                    Book a service <Scissors size={14} />
                  </button>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-[#CCD7BF] pt-2 text-[11px]">
                {reviewCount > 0 && typeof profile.rating === "number" ? (
                  <button
                    type="button"
                    className="flex min-h-8 items-center gap-2"
                    onClick={() => chooseTab("reviews", true)}
                  >
                    <Star size={15} className="fill-[#718E35] text-[#718E35]" />
                    <strong>{profile.rating.toFixed(1)}</strong>
                    <span className="text-[#5F715B]">
                      {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
                    </span>
                  </button>
                ) : (
                  <span className="text-[#5F715B]">
                    Independent style. Personal service.
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="ml-auto flex min-h-8 items-center gap-2 font-medium"
                  aria-live="polite"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? "Copied" : "Share profile"}
                </button>
              </div>
            </div>
            <div className="relative order-1 min-h-[160px] bg-[#284A3D] sm:min-h-[190px] md:order-2 md:min-h-[300px]">
              {profile.coverImage ? (
                <Image
                  src={profile.coverImage}
                  alt={`${displayName} — studio cover`}
                  fill
                  priority
                  quality={90}
                  sizes="(max-width: 768px) 100vw, 50vw"
                  unoptimized={profile.coverImage.startsWith("/uploads")}
                  className="object-cover"
                />
              ) : (
                <div
                  className="absolute inset-0 flex items-center justify-center overflow-hidden"
                  aria-hidden="true"
                >
                  <div className="absolute h-[300px] w-[300px] rounded-full border border-[#B6C894]/25" />
                  <div className="absolute h-[210px] w-[210px] rounded-full border border-[#B6C894]/30" />
                  <span className="font-serif text-[100px] italic text-[#DAE6C4]">
                    {displayName.charAt(0)}
                  </span>
                </div>
              )}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#102C23]/65 via-transparent to-black/10" />
              <div className="absolute left-4 top-4 rounded-full border border-white/30 bg-black/20 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-md sm:left-5 sm:top-5">
                The independent edit
              </div>
              <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-4 text-white sm:bottom-5 sm:left-5 sm:right-5">
                <div>
                  <p className="mb-1 text-[10px] uppercase tracking-[0.2em] text-white/80">
                    Inside the studio
                  </p>
                  <p className="font-serif text-lg sm:text-xl">
                    A world of their own.
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Explore portfolio"
                  onClick={() => chooseTab("gallery", true)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--studio-accent)] text-[var(--studio-ink)] transition hover:bg-white"
                >
                  <ArrowUpRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="mt-5 grid items-start gap-5 lg:mt-6 lg:grid-cols-[minmax(0,1fr)_260px] xl:gap-7 xl:grid-cols-[minmax(0,1fr)_280px]">
          <section
            ref={contentRef}
            className="min-w-0 scroll-mt-6"
            aria-label="Explore this professional"
          >
            <div
              role="tablist"
              aria-label="Profile sections"
              className="flex overflow-x-auto border-b border-[#D8E0D1]"
            >
              {tabs.map((tab, index) => {
                const Icon = tabConfig[tab].icon;
                const count =
                  tab === "products"
                    ? products.length
                    : tab === "reviews"
                      ? reviewCount
                      : undefined;
                return (
                  <button
                    key={tab}
                    type="button"
                    role="tab"
                    id={`${tabsId}-${tab}`}
                    aria-selected={activeTab === tab}
                    aria-controls={`${tabsId}-panel-${tab}`}
                    tabIndex={activeTab === tab ? 0 : -1}
                    onClick={() => chooseTab(tab)}
                    onKeyDown={(e) => {
                      let target: Tab | undefined;
                      if (e.key === "ArrowRight")
                        target = tabs[(index + 1) % tabs.length];
                      if (e.key === "ArrowLeft")
                        target = tabs[(index + tabs.length - 1) % tabs.length];
                      if (e.key === "Home") target = tabs[0];
                      if (e.key === "End") target = tabs[tabs.length - 1];
                      if (target) {
                        e.preventDefault();
                        chooseTab(target);
                        document.getElementById(`${tabsId}-${target}`)?.focus();
                      }
                    }}
                    className={cn(
                      "flex min-h-11 shrink-0 items-center gap-1.5 border-b-2 px-3 text-xs font-medium transition sm:px-4",
                      activeTab === tab
                        ? "border-[#173E35] text-[#173E35]"
                        : "border-transparent text-[#737D70] hover:text-[#173E35]",
                    )}
                  >
                    <Icon size={16} />
                    <span>{tabConfig[tab].label}</span>
                    {count !== undefined && (
                      <span
                        className={cn(
                          "hidden rounded-md px-1.5 py-0.5 text-[10px] sm:inline",
                          activeTab === tab ? "bg-[#DFE9C8]" : "bg-[#ECEEE5]",
                        )}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="my-5 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className={cn(eyebrow, "mb-2 text-[#7B886D]")}>
                  {activeTab === "gallery"
                    ? "Selected work"
                    : "Discover the studio"}
                </p>
                <h2 className="font-serif text-2xl tracking-tight sm:text-[28px]">
                  {tabInfo.title}
                </h2>
                <p className="mt-1.5 text-xs text-[#697461]">
                  {tabInfo.subtitle}
                </p>
              </div>
              {(activeTab === "products" || activeTab === "reviews") && (
                <Link
                  href={`/tz/${slug}/${activeTab === "products" ? "shop" : "reviews"}`}
                  className="flex min-h-11 items-center gap-1.5 text-xs font-semibold"
                >
                  View all <ArrowUpRight size={16} />
                </Link>
              )}
            </div>
            {(activeTab === "products" || activeTab === "services") && (
              <label className="mb-6 flex min-h-11 items-center gap-2 rounded-xl border border-[#DEE4D6] bg-white px-3 text-[#7A8573]">
                <Search size={16} />
                <span className="sr-only">
                  Search{" "}
                  {activeTab === "products" ? "featured products" : "services"}
                </span>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={
                    activeTab === "products"
                      ? "Search featured pieces…"
                      : "Find a service…"
                  }
                  className="min-w-0 flex-1 bg-transparent py-3 text-sm text-[#173E35] placeholder:text-[#7A8573]"
                />
                {query && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    className="flex h-9 w-9 items-center justify-center"
                    onClick={() => setQuery("")}
                  >
                    <X size={15} />
                  </button>
                )}
              </label>
            )}
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activeTab}
                role="tabpanel"
                tabIndex={0}
                id={`${tabsId}-panel-${activeTab}`}
                aria-labelledby={`${tabsId}-${activeTab}`}
                initial={{
                  opacity: reducedMotion ? 1 : 0,
                  y: reducedMotion ? 0 : 6,
                }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: reducedMotion ? 1 : 0 }}
                transition={{ duration: reducedMotion ? 0 : 0.15 }}
              >
                {activeTab === "products" && (
                  <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-x-5 xl:grid-cols-3">
                    {visibleProducts.map((product, index) => (
                      <div
                        key={product.id}
                        className="min-w-0 overflow-hidden rounded-2xl border border-[#E1E6DA] bg-white p-2"
                      >
                        <ProductCard
                          item={{ ...product }}
                          index={index}
                          hrefOverride={`/tz/${slug}/shop/${product.slug || product.id}`}
                        />
                      </div>
                    ))}
                    {visibleProducts.length === 0 && (
                      <EmptyState
                        icon={ShoppingBag}
                        title={
                          query
                            ? "No matching pieces"
                            : "The collection is coming together"
                        }
                        detail={
                          query
                            ? "Try a different search or explore the full shop."
                            : "New pieces will appear here when the studio adds them."
                        }
                      />
                    )}
                  </div>
                )}
                {activeTab === "services" && (
                  <div aria-busy={serviceStatus === "loading"}>
                    {serviceStatus === "idle" || serviceStatus === "loading" ? (
                      <div role="status" className="space-y-3">
                        <span className="sr-only">Loading services</span>
                        {[0, 1, 2].map((i) => (
                          <div
                            key={i}
                            className="h-28 animate-pulse rounded-2xl bg-[#E5EADD] motion-reduce:animate-none"
                          />
                        ))}
                      </div>
                    ) : serviceStatus === "error" ? (
                      <div
                        className="rounded-2xl border border-[#DEE4D6] bg-white p-8 text-center"
                        role="alert"
                      >
                        <p className="text-sm">We couldn’t load services.</p>
                        <button
                          type="button"
                          onClick={() => void fetchServices()}
                          className={cn(secondary, "mt-4")}
                        >
                          <RefreshCw size={15} />
                          Try again
                        </button>
                      </div>
                    ) : visibleServices.length ? (
                      <div className="space-y-7">
                        {Object.entries(
                          visibleServices.reduce(
                            (groups, service) => {
                              const name =
                                service.category?.name || "Studio services";
                              (groups[name] ||= []).push(service);
                              return groups;
                            },
                            {} as Record<string, ServiceWithVariants[]>,
                          ),
                        ).map(([category, items]) => (
                          <div key={category}>
                            <h3 className="mb-3 flex items-center gap-3 text-sm font-semibold">
                              <span className="h-2 w-2 rounded-full bg-[#9BAF64]" />
                              {category}
                            </h3>
                            <div className="space-y-3">
                              {items.map((service, index) => (
                                <div
                                  key={service.id}
                                  className="overflow-hidden rounded-2xl border border-[#DFE5D7] bg-white p-3 sm:p-4"
                                >
                                  <ServiceListItem
                                    service={service}
                                    onBook={handleBookService}
                                    index={index}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState
                        icon={Scissors}
                        title={
                          query
                            ? "No matching services"
                            : "No services listed yet"
                        }
                        detail={
                          query
                            ? "Try a different keyword."
                            : "You can message the studio to ask about their work."
                        }
                      />
                    )}
                  </div>
                )}
                {activeTab === "gallery" && (
                  <div>
                    {selectedCollection ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setSelectedCollection(null)}
                          className="mb-5 flex min-h-11 items-center gap-2 text-sm"
                        >
                          <ChevronLeft size={17} />
                          All collections
                        </button>
                        <div className="mb-5">
                          <h3 className="font-serif text-2xl">
                            {selectedCollection.name}
                          </h3>
                          {selectedCollection.description && (
                            <p className="mt-2 text-sm leading-6 text-[#697461]">
                              {selectedCollection.description}
                            </p>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-3 sm:gap-5">
                          {selectedCollection.images.map((src, i) => (
                            <div key={`${src}-${i}`}>
                              {photo(
                                src,
                                `${selectedCollection.name} · ${i + 1}`,
                                () =>
                                  setViewer({
                                    images: selectedCollection.images,
                                    index: i,
                                    title: selectedCollection.name,
                                  }),
                              )}
                            </div>
                          ))}
                          {!selectedCollection.images.length && (
                            <EmptyState
                              icon={Images}
                              title="Images coming soon"
                              detail="The studio hasn’t added images to this collection yet."
                            />
                          )}
                        </div>
                      </>
                    ) : collections.length ? (
                      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        {collections.map((collection, i) => (
                          <div
                            key={collection.id}
                            className={cn(
                              i === 0 &&
                              collections.length > 2 &&
                              "sm:col-span-2",
                            )}
                          >
                            {photo(
                              collection.coverImage ||
                              collection.images[0] ||
                              "/placeholder-portfolio.jpg",
                              collection.name,
                              () => setSelectedCollection(collection),
                              i === 0 && collections.length > 2,
                            )}
                            <p className="mt-2.5 flex items-center justify-between px-1 text-xs text-[#697461]">
                              <span>
                                {collection.images.length}{" "}
                                {collection.images.length === 1
                                  ? "image"
                                  : "images"}
                              </span>
                              <span>Explore collection</span>
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : legacyImages.length ? (
                      <div className="grid grid-cols-2 gap-3 sm:gap-5">
                        {legacyImages.map((src, i) => (
                          <div key={`${src}-${i}`}>
                            {photo(
                              src,
                              `Selected work ${String(i + 1).padStart(2, "0")}`,
                              () =>
                                setViewer({
                                  images: legacyImages,
                                  index: i,
                                  title: "Selected work",
                                }),
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState
                        icon={Images}
                        title="A new perspective is on its way"
                        detail="Portfolio images will appear here when the studio shares them."
                      />
                    )}
                  </div>
                )}
                {activeTab === "reviews" && (
                  <div className="space-y-4">
                    {reviewCount > 0 && typeof profile.rating === "number" && (
                      <div className="mb-6 flex items-center gap-5 rounded-2xl bg-[#E7EDDA] p-6">
                        <span className="font-serif text-5xl">
                          {profile.rating.toFixed(1)}
                        </span>
                        <div>
                          <div
                            className="flex items-center gap-1 text-[#6E853F]"
                            aria-label={`${profile.rating} out of 5 stars`}
                          >
                            {[0, 1, 2, 3, 4].map((i) => (
                              <Star
                                key={i}
                                size={15}
                                className={
                                  i < Math.round(profile.rating!)
                                    ? "fill-current"
                                    : "opacity-30"
                                }
                              />
                            ))}
                          </div>
                          <p className="mt-2 text-xs text-[#697461]">
                            From {reviewCount}{" "}
                            {reviewCount === 1 ? "review" : "reviews"}
                          </p>
                        </div>
                      </div>
                    )}
                    {profile.reviews?.slice(0, 5).map((review) => (
                      <article
                        key={review.id}
                        className="rounded-2xl border border-[#DFE5D7] bg-white p-5 sm:p-6"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#EAF0DF] font-serif">
                            {review.userAvatar ? (
                              <Image
                                src={review.userAvatar}
                                alt=""
                                width={40}
                                height={40}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              review.userName.charAt(0)
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-sm font-semibold">
                              {review.userName}
                            </h3>
                            <p className="mt-1 flex items-center gap-1 text-xs text-[#718547]">
                              <Star size={12} className="fill-current" />
                              {review.rating.toFixed(1)}
                              <span className="ml-2 text-[#7A8573]">
                                {review.date}
                              </span>
                            </p>
                          </div>
                        </div>
                        <p className="mt-4 whitespace-pre-line text-sm leading-7 text-[#566650]">
                          {review.comment}
                        </p>
                        {review.productName && (
                          <div className="mt-4 flex items-center gap-3 border-t border-[#EEF0E9] pt-3">
                            {review.productImage && (
                              <Image
                                src={review.productImage}
                                alt=""
                                width={32}
                                height={40}
                                className="h-10 rounded object-cover"
                              />
                            )}
                            <p className="text-xs text-[#697461]">
                              Reviewed:{" "}
                              <span className="font-medium text-[#31533E]">
                                {review.productName}
                              </span>
                            </p>
                          </div>
                        )}
                      </article>
                    ))}
                    {!profile.reviews?.length && (
                      <EmptyState
                        icon={MessageSquare}
                        title="No reviews to show yet"
                        detail="Client feedback will appear here once it’s available."
                      />
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </section>

          <aside
            className="space-y-4 lg:sticky lg:top-6"
            aria-label="Studio information"
          >
            <div className="relative overflow-hidden rounded-2xl bg-[#173E35] p-4 text-white">
              <span
                aria-hidden="true"
                className="absolute -right-7 -top-7 h-32 w-32 rounded-full border border-[#DCE99B]/20"
              />
              <p className={cn(eyebrow, "relative text-[#C3D699]")}>
                Let’s make it personal
              </p>
              <h2 className="relative mt-2 font-serif text-xl leading-tight">
                Something in mind?
              </h2>
              <p className="relative mt-2 text-xs leading-5 text-[#D0DDCE]">
                Ask about a piece, discuss an idea, or find the right service.
              </p>
              {!isOwner ? (
                <button
                  type="button"
                  onClick={openChat}
                  className="relative mt-4 flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#DCE99B] px-3 py-2 text-xs font-semibold text-[#173E35] transition hover:bg-[#EBF3C4]"
                >
                  <MessageSquare size={16} />
                  Message the studio
                </button>
              ) : (
                <Link
                  href="/settings"
                  className="relative mt-4 flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#DCE99B] px-3 py-2 text-xs font-semibold text-[#173E35]"
                >
                  <Settings size={16} />
                  Manage your profile
                </Link>
              )}
            </div>
            {profile.location && (
              <div className="overflow-hidden rounded-2xl border border-[#DFE5D7] bg-white">
                <div className="p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <MapPin size={17} />
                    <h2 className="text-sm font-semibold">Visit the studio</h2>
                  </div>
                  <p className="text-sm leading-6 text-[#66725F]">
                    {address || "Contact the studio for location details."}
                  </p>
                  <div className="mt-4 border-t border-[#EDF0E7] pt-4">
                    <div className="flex items-center gap-2 text-xs font-medium">
                      <Clock size={14} />
                      {openStatus?.nextChange ? (
                        <>
                          <span
                            className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              openStatus.isOpen
                                ? "bg-[#6B8F3D]"
                                : "bg-[#9DA494]",
                            )}
                          />
                          {openStatus.isOpen ? "Open now" : "Currently closed"}
                        </>
                      ) : (
                        "Opening hours"
                      )}
                    </div>
                    {openStatus?.nextChange && (
                      <p className="mt-1.5 pl-6 text-xs text-[#7A8573]">
                        {openStatus.nextChange}
                      </p>
                    )}
                    <p className="mt-2 whitespace-pre-line text-xs leading-6 text-[#697461]">
                      {profile.location.hours ||
                        (!openStatus?.nextChange
                          ? "Contact the studio to confirm availability."
                          : "")}
                    </p>
                    {openStatus?.nextChange && (
                      <p className="mt-2 text-[10px] text-[#7A8573]">
                        Status uses your device’s local time.
                      </p>
                    )}
                  </div>
                </div>
                {hasCoordinates && (
                  <div className="h-40 border-y border-[#EDF0E7]">
                    <ProfileMap
                      lat={profile.location.latitude!}
                      lng={profile.location.longitude!}
                    />
                  </div>
                )}
                {(hasCoordinates || address) && (
                  <a
                    href={directions}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-12 items-center justify-between px-5 text-xs font-semibold transition hover:bg-[#F0F4E9]"
                  >
                    Get directions <ArrowUpRight size={16} />
                  </a>
                )}
              </div>
            )}
            {profile.socials &&
              Object.entries(profile.socials).some(([, url]) =>
                safeExternalUrl(url),
              ) && (
                <div className="rounded-2xl border border-[#DFE5D7] bg-white p-5">
                  <h2 className={cn(eyebrow, "text-[#7A8573]")}>Elsewhere</h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {Object.entries(profile.socials).map(
                      ([platform, value]) => {
                        const url = safeExternalUrl(value);
                        const Icon =
                          socialIcons[platform.toUpperCase()] || Globe;
                        return url ? (
                          <a
                            key={platform}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Visit ${platform.toLowerCase()}`}
                            title={platform.toLowerCase()}
                            className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F0F3E9] transition hover:bg-[#DCE99B]"
                          >
                            <Icon size={18} />
                          </a>
                        ) : null;
                      },
                    )}
                  </div>
                </div>
              )}
            <p className="px-3 text-center text-[11px] leading-5 text-[#8A9381]">
              Explore the work. Meet the maker.
            </p>
          </aside>
        </div>
      </div>
      <ChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        professionalId={profile.user.id}
        professionalName={displayName}
        professionalImage={profileImage}
        currentUserId={session?.user?.id || ""}
      />
      {viewer && (
        <dialog
          ref={dialogRef}
          onCancel={(e) => {
            e.preventDefault();
            setViewer(null);
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setViewer(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") {
              e.preventDefault();
              moveImage(-1);
            }
            if (e.key === "ArrowRight") {
              e.preventDefault();
              moveImage(1);
            }
          }}
          aria-labelledby={`${tabsId}-viewer-title`}
          className="fixed inset-0 m-auto h-[92dvh] max-h-none w-[96vw] max-w-6xl overflow-hidden rounded-2xl border border-white/15 bg-[#112A23] p-0 text-white shadow-2xl"
        >
          <div className="flex h-full flex-col p-4 sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2
                  id={`${tabsId}-viewer-title`}
                  className="font-serif text-xl"
                >
                  {viewer.title}
                </h2>
                <p className="mt-1 text-xs text-[#C5D3BF]" aria-live="polite">
                  {viewer.index + 1} / {viewer.images.length}
                </p>
              </div>
              <button
                autoFocus
                type="button"
                aria-label="Close image viewer"
                onClick={() => setViewer(null)}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
              >
                <X size={20} />
              </button>
            </div>
            <div className="relative min-h-0 flex-1">
              <Image
                src={viewer.images[viewer.index]}
                alt={`${viewer.title} — image ${viewer.index + 1}`}
                fill
                sizes="96vw"
                className="object-contain"
                priority
              />
            </div>
            <div className="mt-4 flex items-center justify-between">
              <button
                type="button"
                disabled={viewer.index === 0}
                onClick={() => moveImage(-1)}
                className="flex min-h-11 items-center gap-2 rounded-xl bg-white/10 px-4 text-sm disabled:opacity-30"
              >
                <ChevronLeft size={18} />
                Previous
              </button>
              <span className="hidden text-xs text-[#A8BEA1] sm:inline">
                Use ← → to browse · Esc to close
              </span>
              <button
                type="button"
                disabled={viewer.index === viewer.images.length - 1}
                onClick={() => moveImage(1)}
                className="flex min-h-11 items-center gap-2 rounded-xl bg-white/10 px-4 text-sm disabled:opacity-30"
              >
                Next
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
};
export default ProfileClient;
