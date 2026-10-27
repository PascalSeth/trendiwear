'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, MapPin,
  ArrowRight, ShoppingBag, MessageSquare, Scissors,
  Globe, Settings, BadgeCheck, Archive,
  ChevronLeft, X, Copy, Check
} from 'lucide-react';
import { FaInstagram, FaFacebook, FaXTwitter, FaTiktok, FaYoutube, FaPinterest, FaLinkedin } from 'react-icons/fa6';
import { cn } from '@/lib/utils';
import { ProductCard } from '@/components/common/ProductCard';
import { ServiceListItem } from '@/app/components/services/ServiceListItem';
import { type ServiceWithVariants } from '@/app/components/services/ServiceCard';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { ChatDrawer } from '@/app/components/chat/ChatDrawer';
import { AtelierBackground } from '@/app/components/creative/AtelierBackground';

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
function checkIfOpen(availabilityRaw?: string): { isOpen: boolean; nextChange: string } {
  if (!availabilityRaw) return { isOpen: false, nextChange: '' };

  try {
    const hours: BusinessHours = JSON.parse(availabilityRaw);
    const now = new Date();
    const dayNames: (keyof BusinessHours)[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
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
      return { isOpen: false, nextChange: 'Closed' };
    }

    const [openHour, openMin] = todayHours.open.split(':').map(Number);
    const [closeHour, closeMin] = todayHours.close.split(':').map(Number);
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const openMinutes = openHour * 60 + openMin;
    const closeMinutes = closeHour * 60 + closeMin;

    if (currentMinutes >= openMinutes && currentMinutes < closeMinutes) {
      const closeHour12 = closeHour % 12 || 12;
      const closeAmPm = closeHour >= 12 ? 'PM' : 'AM';
      return { isOpen: true, nextChange: `Closes ${closeHour12}:${closeMin.toString().padStart(2, '0')} ${closeAmPm}` };
    } else if (currentMinutes < openMinutes) {
      const openHour12 = openHour % 12 || 12;
      const openAmPm = openHour >= 12 ? 'PM' : 'AM';
      return { isOpen: false, nextChange: `Opens ${openHour12}:${openMin.toString().padStart(2, '0')} ${openAmPm}` };
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
      return { isOpen: false, nextChange: 'Closed' };
    }
  } catch {
    return { isOpen: false, nextChange: '' };
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

// --- Profile Map Component ---
const ProfileMap = ({ lat, lng }: { lat: number, lng: number }) => {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOptions({
      key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
      v: "weekly"
    });

    Promise.all([
      importLibrary("maps"),
      importLibrary("marker")
    ]).then(() => {
      if (mapRef.current) {
        const center = { lat, lng };
        const map = new google.maps.Map(mapRef.current, {
          center,
          zoom: 15,
          disableDefaultUI: true,
          zoomControl: true,
          styles: [
            {
              "featureType": "all",
              "elementType": "all",
              "stylers": [{ "saturation": -100 }, { "gamma": 0.5 }]
            },
            {
              "featureType": "water",
              "elementType": "all",
              "stylers": [{ "color": "#e9e9e9" }, { "visibility": "on" }]
            }
          ]
        });

        new google.maps.Marker({
          position: center,
          map,
          title: "Shop & Studio Location",
          animation: google.maps.Animation.DROP
        });
      }
    }).catch(err => console.error("Google Maps failed to load", err));
  }, [lat, lng]);

  return (
    <div
      ref={mapRef}
      className="w-full h-full grayscale hover:grayscale-0 transition-all duration-1000 ease-out"
    />
  );
};

const ProfileClient = ({ profile, slug, isOwner, baseUrl }: ProfileClientProps) => {
  const displayName = profile.businessName || `${profile.user.firstName} ${profile.user.lastName}`;
  const coverImage = profile.coverImage || "/default-cover.png";
  const profileImage = profile.businessImage || profile.user.profileImage || '/placeholder-avatar.jpg';

  // Tabs & modals state
  const isModel = profile.specialization?.name?.toLowerCase().includes('model');
  const [activeTab, setActiveTab] = useState<'products' | 'services' | 'reviews' | 'gallery'>(isModel ? 'gallery' : 'products')
  const [services, setServices] = useState<ServiceWithVariants[]>([])
  const [servicesLoading, setServicesLoading] = useState(false)
  const router = useRouter();
  const { data: session } = useSession();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<PortfolioCollection | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const fullProfileUrl = baseUrl ? `${baseUrl}/tz/${slug}` : '';

  const handleCopyLink = () => {
    if (!fullProfileUrl) return;
    navigator.clipboard.writeText(fullProfileUrl);
    setCopied(true);
    toast.success("Profile link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  // Real-time open/closed status
  const [openStatus, setOpenStatus] = useState(() => checkIfOpen(profile.location?.availabilityRaw));

  useEffect(() => {
    setOpenStatus(checkIfOpen(profile.location?.availabilityRaw));
    const interval = setInterval(() => {
      setOpenStatus(checkIfOpen(profile.location?.availabilityRaw));
    }, 60000);
    return () => clearInterval(interval);
  }, [profile.location?.availabilityRaw]);

  // Fetch services when tab changes
  const fetchServices = useCallback(async () => {
    try {
      setServicesLoading(true);
      const response = await fetch(`/api/services?professionalId=${profile.user.id}&limit=50`);
      if (response.ok) {
        const data: { services: ServiceWithVariants[] } = await response.json();
        setServices(data.services || []);
      }
    } catch (error) {
      console.error('Failed to fetch services:', error);
    } finally {
      setServicesLoading(false);
    }
  }, [profile.user.id]);

  useEffect(() => {
    if (activeTab === 'services' && services.length === 0) {
      fetchServices();
    }
  }, [activeTab, services.length, fetchServices]);

  const handleBookService = (service: ServiceWithVariants) => {
    // Navigate to full-page booking experience
    router.push(`/tz/${profile.slug}/book/${service.professionalServiceId}`);
  };

  return (
    <div className="min-h-screen text-stone-900 pb-32 font-sans selection:bg-stone-200 relative overflow-x-hidden">

      {/* 1. LAYER 0: Base Page Color */}
      <div className="fixed inset-0 z-[-2] bg-[#FAFAF9]" />

      {/* 2. LAYER 1: Professional Squiggle Background */}
      <div className="fixed inset-0 z-[-1] pointer-events-none">
        <AtelierBackground />
      </div>

      {/* 1. CINEMATIC COVER BANNER (Full view, not cut in half) */}
      <div className="relative w-full h-64 sm:h-80 md:h-96 lg:h-[420px] bg-stone-900 overflow-hidden z-0">
        <motion.div
          initial={{ scale: 1.02 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="absolute inset-0"
        >
          <Image
            src={coverImage}
            alt="Cover"
            fill
            priority
            className="object-cover object-center"
            quality={95}
            sizes="100vw"
            unoptimized={coverImage.startsWith('/uploads')}
          />
        </motion.div>
        {/* Subtle vignette protection */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/25 to-transparent pointer-events-none" />
      </div>

      {/* 2. PROFILE IDENTITY HEADER (Gracefully overlapping cover) */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 sm:-mt-16 md:-mt-20 mb-6 pb-6 border-b border-stone-200/80">
          
          {/* Avatar & Main Info */}
          <div className="flex flex-row items-end gap-3.5 sm:gap-5 min-w-0">
            {/* Signature Floating Avatar */}
            <div className="relative shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-2xl overflow-hidden bg-white p-1.5 shadow-xl border border-stone-200/70">
                <div className="w-full h-full rounded-xl overflow-hidden bg-stone-100 relative">
                  <Image
                    src={profileImage}
                    alt={displayName}
                    fill
                    sizes="128px"
                    className="object-cover"
                  />
                </div>
              </div>
              {profile.isVerified && (
                <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-1 rounded-full border-2 border-white shadow-sm" title="Verified Professional">
                  <BadgeCheck className="w-3.5 h-3.5 text-white" />
                </div>
              )}
            </div>

            {/* Name & Metadata */}
            <div className="space-y-1 pb-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 font-medium text-[10px] tracking-wide border border-stone-200/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {profile.specialization.name}
                </span>
                {profile.rating && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-900 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-full">
                    <Star size={11} className="fill-amber-400 text-amber-400" />
                    <span>{profile.rating.toFixed(1)}</span>
                    <span className="text-[10px] text-amber-700/70 font-normal">({profile.totalReviews})</span>
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif text-stone-900 leading-tight truncate">
                {displayName}
              </h1>

              {profile.location && (
                <p className="flex items-center gap-1 text-xs text-stone-500">
                  <MapPin size={12} className="text-amber-600 shrink-0" />
                  <span className="truncate">{profile.location.address || profile.location.city}</span>
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 self-start sm:self-end pt-2 sm:pt-0">
            <Link
              href={`/tz/${slug}/shop`}
              className="bg-stone-900 hover:bg-stone-800 text-white px-5 py-2.5 rounded-full text-xs font-semibold transition-all shadow-sm flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <ShoppingBag size={13} />
              <span>Enter Shop</span>
            </Link>

            {isOwner && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleCopyLink}
                  className="bg-white border border-stone-200 text-stone-700 hover:text-stone-900 hover:bg-stone-50 px-3 py-2 rounded-full flex items-center justify-center gap-1.5 transition-all text-xs shadow-sm"
                  title="Copy Profile Link"
                >
                  {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                  <span className="hidden sm:inline">Copy Link</span>
                </button>

                <Link
                  href="/settings"
                  className="bg-white border border-stone-200 text-stone-700 hover:text-stone-900 hover:bg-stone-50 px-3 py-2 rounded-full flex items-center justify-center gap-1.5 transition-all text-xs shadow-sm"
                  title="Edit Profile"
                >
                  <Settings size={13} />
                  <span className="hidden sm:inline">Edit Profile</span>
                </Link>
              </div>
            )}

            {(!session || !isOwner) && (
              <button
                onClick={() => {
                  if (!session) {
                    toast.error("Please sign in to message this professional");
                    return;
                  }
                  setIsChatOpen(true);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-sm shrink-0"
                title="Send Message"
              >
                <MessageSquare size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. THE ATELIER FOUNDATION (Bio & Concept) */}
      <section className="pt-8 pb-6 px-4 sm:px-6 relative z-10">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-2"
          >
            {isOwner && (
              <div className="flex flex-col items-center gap-1 mb-4">
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-stone-400">Your Public Profile Link /</span>
                <code className="bg-stone-100 px-3 py-1 rounded text-xs font-mono text-stone-600 border border-stone-200">
                  {fullProfileUrl}
                </code>
              </div>
            )}
            <h3 className="text-[9px] font-mono font-bold uppercase tracking-widest text-stone-400">The Philosophy</h3>
            <p className="font-serif text-base sm:text-lg md:text-xl text-stone-800 leading-relaxed italic">
              &quot;{profile.bio 
                  ? (profile.bio.split(/\s+/).length > 35 ? profile.bio.split(/\s+/).slice(0, 35).join(' ') + '...' : profile.bio) 
                  : `Mastering the art of ${profile.specialization.name} through timeless craftsmanship and contemporary vision.`}&quot;
            </p>
          </motion.div>

          {/* Socials & Status Metadata Bar */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 pt-4 border-t border-stone-200/60 text-xs"
          >
            <div className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full animate-pulse", openStatus.isOpen ? "bg-emerald-500" : "bg-stone-300")} />
              <span className="text-xs font-semibold text-stone-900">
                {openStatus.isOpen ? "Shop Open" : "Shop Closed"}
              </span>
              <span className="text-[10px] text-stone-400">— {openStatus.nextChange}</span>
            </div>

            {profile.socials && Object.keys(profile.socials).length > 0 && (
              <div className="flex items-center gap-5">
                {Object.entries(profile.socials).map(([platform, url]) => {
                  const icons: Record<string, React.ElementType> = {
                    'INSTAGRAM': FaInstagram,
                    'FACEBOOK': FaFacebook,
                    'X': FaXTwitter,
                    'TIKTOK': FaTiktok,
                    'YOUTUBE': FaYoutube,
                    'PINTEREST': FaPinterest,
                    'LINKEDIN': FaLinkedin,
                    'WEBSITE': Globe
                  };
                  const Icon = icons[platform] || Globe;
                  return (
                    <Link key={platform} href={url} target="_blank" rel="noopener noreferrer" className="text-stone-400 hover:text-stone-900 transition-colors transform hover:scale-110">
                      <Icon size={15} />
                    </Link>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* 3. THE ARRIVAL PANORAMA (Map) */}
      {profile.location && (
        <section className="px-4 sm:px-6 pb-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-5xl mx-auto rounded-2xl overflow-hidden border border-stone-200/80 shadow-md relative group bg-stone-100"
          >
            {(profile.location.latitude && profile.location.longitude) ? (
              <div className="aspect-[21/6] max-h-48 w-full">
                <ProfileMap
                  lat={profile.location.latitude}
                  lng={profile.location.longitude}
                />
              </div>
            ) : (
              <div className="aspect-[21/6] max-h-48 flex items-center justify-center bg-stone-50">
                <p className="font-mono text-[10px] uppercase tracking-widest text-stone-300">Location Imagery Pending</p>
              </div>
            )}

            {/* Location Detail Overlay */}
            <div className="absolute bottom-3 left-3 z-20 bg-white/90 backdrop-blur-md p-3 rounded-xl border border-stone-100 shadow-md max-w-xs hidden md:block">
              <h4 className="text-[9px] font-mono font-bold uppercase tracking-wider text-stone-400 mb-0.5">Address</h4>
              <p className="font-serif text-sm text-stone-900 leading-tight mb-0.5">{profile.location.address}</p>
              <p className="text-[10px] text-stone-500">{profile.location.city}, {profile.location.country}</p>
            </div>
          </motion.div>
        </section>
      )}

      {/* 4. THE EXHIBITION WORKSPACE (Tabs) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Navigation Horizon */}
        <div className="flex justify-center mb-6">
          <div className="bg-white border border-stone-200/80 p-1 rounded-full shadow-sm flex items-center gap-1 max-w-full overflow-x-auto no-scrollbar">
            {(isModel
              ? ['gallery', 'products', 'services', 'reviews'] as const
              : ['products', 'services', 'gallery', 'reviews'] as const
            ).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'px-4 py-1.5 rounded-full text-xs font-semibold capitalize tracking-wide transition-all duration-200 flex items-center gap-1.5',
                  activeTab === tab
                    ? 'bg-stone-900 text-white shadow-sm'
                    : 'text-stone-500 hover:text-stone-900 hover:bg-stone-50'
                )}
              >
                {tab === 'products' && <ShoppingBag size={13} />}
                {tab === 'services' && <Scissors size={13} />}
                {tab === 'gallery' && <Archive size={13} />}
                {tab === 'reviews' && <Star size={13} />}
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Full-Width Content Layer */}
        <motion.div
          layout
          className="transition-all duration-500 ease-out snap-start scroll-mt-24 pb-16"
        >
          <AnimatePresence mode="wait">

            {activeTab === 'gallery' && (
              <motion.section
                key="gallery"
                initial={{ opacity: 0, y: 10, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.99 }}
                transition={{ duration: 0.3 }}
                className="relative z-10"
              >
                <div className="flex items-center justify-between mb-6 pb-2 border-b border-stone-200">
                  <div className="flex items-center gap-3">
                    {selectedCollection && (
                      <button
                        onClick={() => setSelectedCollection(null)}
                        className="w-8 h-8 rounded-full border border-stone-200 flex items-center justify-center text-stone-500 hover:bg-stone-50 transition-colors"
                      >
                        <ChevronLeft size={16} />
                      </button>
                    )}
                    <h2 className="text-2xl sm:text-3xl font-serif text-stone-900 leading-tight">
                      {selectedCollection ? selectedCollection.name : "Portfolio Showcase"}
                    </h2>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-stone-400 border border-stone-200 rounded-full px-3 py-1 hidden sm:block">
                      {selectedCollection ? "Collection" : "Works"}
                    </span>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {selectedCollection ? (
                    <motion.div
                      key="collection-detail"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      {selectedCollection.description && (
                        <p className="max-w-2xl mb-8 font-serif text-xl italic text-stone-500 leading-relaxed">
                          &quot;{selectedCollection.description}&quot;
                        </p>
                      )}

                      <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-6 gap-8 space-y-12 transition-all duration-700">
                        {selectedCollection?.images.map((img, i) => (
                          <motion.div
                            layoutId={`gallery-img-${img}`}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.08, duration: 0.8 }}
                            key={i}
                            style={{
                              marginTop: i % 2 === 0 ? '0' : '4rem' // Staggered Museum Wall
                            }}
                            onClick={() => setSelectedImageIndex(i)}
                            className="break-inside-avoid w-full relative group cursor-pointer"
                          >
                            <div className="overflow-hidden rounded-sm bg-stone-100">
                              <Image
                                src={img}
                                alt={`${selectedCollection.name} ${i}`}
                                width={800}
                                height={1000}
                                className="w-full h-auto object-cover transition-all duration-1500 ease-out group-hover:scale-[1.05] md:grayscale md:hover:grayscale-0"
                              />
                            </div>

                            {/* Archive Index Pin - Visible on mobile, hover-revealed on desktop */}
                            <div className="absolute top-4 left-4 opacity-70 md:opacity-0 md:group-hover:opacity-100 transition-all duration-500 pointer-events-none">
                              <span className="text-[7px] font-mono text-stone-900 bg-white/90 backdrop-blur-md px-2 py-0.5 rounded-sm uppercase tracking-[0.3em]">
                                REF.{String(i + 1).padStart(2, '0')}
                              </span>
                            </div>

                            {/* Transparent Signature Detail - Visible on mobile, hover-revealed on desktop */}
                            <div className="absolute bottom-4 right-4 opacity-50 md:opacity-0 md:group-hover:opacity-100 transition-all duration-700">
                              <div className="h-8 w-8 rounded-full border border-white/50 backdrop-blur-sm flex items-center justify-center">
                                <span className="text-[8px] font-mono text-white uppercase italic">S.{i + 1}</span>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="collections-list"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={cn(
                        "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-2.5 sm:gap-x-3.5 lg:gap-x-4 gap-y-4 sm:gap-y-6 transition-all duration-700"
                      )}
                    >
                      {profile.portfolioCollections && profile.portfolioCollections.length > 0 ? (
                        profile.portfolioCollections.map((collection, i) => (
                          <motion.div
                            key={collection.id}
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1, duration: 1, ease: [0.22, 1, 0.36, 1] }}
                            onClick={() => setSelectedCollection(collection)}
                            className="group cursor-pointer relative"
                          >
                            <div className="relative aspect-[3/4] overflow-hidden bg-stone-50 transition-all duration-1000 group-hover:shadow-2xl">
                              <Image
                                src={collection.coverImage || collection.images[0] || '/placeholder-portfolio.jpg'}
                                alt={collection.name}
                                fill
                                className="object-cover md:grayscale md:hover:grayscale-0 transition-all duration-2000 ease-out group-hover:scale-110"
                              />

                              {/* Vertical Archive Index - Persistent on mobile */}
                              <div className="absolute top-0 right-4 h-full flex items-center">
                                <span className="vertical-rl text-[8px] font-mono text-stone-400 uppercase tracking-[0.5em] opacity-80 md:opacity-40 md:group-hover:opacity-100 transition-opacity duration-700 select-none">
                                  Archive / A.{String(i + 1).padStart(2, '0')}
                                </span>
                              </div>

                              {/* Intersecting Typography Label */}
                              <div className="absolute -bottom-2 -left-2 z-20 transition-transform duration-700 group-hover:-translate-y-2">
                                <div className="bg-stone-900 px-6 py-3 shadow-2xl relative overflow-hidden">
                                  <motion.div
                                    className="absolute inset-0 bg-amber-500/10"
                                    initial={{ x: '-100%' }}
                                    whileHover={{ x: '100%' }}
                                    transition={{ duration: 0.5 }}
                                  />
                                  <h3 className="text-lg lg:text-xl font-serif text-white uppercase tracking-tighter leading-none relative z-10">
                                    {collection.name}
                                  </h3>
                                  <p className="text-[7px] font-mono text-stone-400 uppercase tracking-[0.3em] mt-1 relative z-10">
                                    {collection.images.length} Archival Prints
                                  </p>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))
                      ) : (
                        // Fallback to legacy galleryImages if no collections
                        profile.galleryImages && profile.galleryImages.length > 0 ? (
                          <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-6 gap-8 space-y-8 transition-all duration-700">
                            {profile.galleryImages.map((img, i) => (
                              <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                key={i}
                                className="break-inside-avoid w-full relative rounded-3xl overflow-hidden group cursor-pointer bg-stone-100 shadow-sm"
                              >
                                <Image src={img} alt={`Gallery ${i}`} width={600} height={800} className="w-full h-auto object-cover" />
                              </motion.div>
                            ))}
                          </div>
                        ) : (
                          <div className="col-span-2 h-64 flex flex-col items-center justify-center text-stone-400 border border-dashed border-stone-200 rounded-3xl bg-white">
                            <p className="font-mono text-xs uppercase tracking-[0.2em]">No archives found</p>
                          </div>
                        )
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.section>
            )}

            {activeTab === 'products' && (
              <motion.section
                key="products"
                initial={{ opacity: 0, y: 10, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.99 }}
                transition={{ duration: 0.3 }}
                className="space-y-6 relative z-10"
              >
                <div className="flex items-end justify-between border-b border-stone-200 pb-2">
                  <div>
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-stone-400 mb-0.5 block">Collection</span>
                    <h2 className="text-2xl sm:text-3xl font-serif text-stone-900 leading-tight">Ready to Wear</h2>
                  </div>
                  <Link href={`/tz/${slug}/shop`} className="font-mono text-[10px] uppercase tracking-wider text-stone-900 hover:text-amber-600 transition-colors flex items-center gap-1.5 pb-1 group">
                    View Full <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-2.5 sm:gap-x-3.5 lg:gap-x-4 gap-y-4 sm:gap-y-6 transition-all duration-500">
                  {profile.featuredProducts?.map((product, index) => (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      key={product.id}
                    >
                      <ProductCard
                        item={{
                          ...product,
                        }}
                        index={index}
                        hrefOverride={`/tz/${slug}/shop/${product.slug}`}
                      />
                    </motion.div>
                  ))}
                  {(!profile.featuredProducts || profile.featuredProducts.length === 0) && (
                    <div className="col-span-2 py-16 text-center border border-dashed border-stone-200 rounded-2xl bg-white">
                      <p className="font-mono text-xs uppercase tracking-wider text-stone-400">No products available</p>
                    </div>
                  )}
                </div>
              </motion.section>
            )}

            {activeTab === 'services' && (
              <motion.section
                key="services"
                initial={{ opacity: 0, y: 10, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.99 }}
                transition={{ duration: 0.3 }}
                className="relative z-10"
              >
                <div className="mb-6 border-b border-stone-200 pb-2">
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-stone-400 mb-0.5 block">Custom Tailoring & Orders</span>
                  <h2 className="text-2xl sm:text-3xl font-serif text-stone-900 leading-tight">Services</h2>
                </div>

                {servicesLoading ? (
                  <div className="py-16 flex flex-col items-center justify-center gap-4">
                    <div className="w-8 h-8 border-2 border-stone-200 border-t-stone-900 rounded-full animate-spin" />
                    <p className="font-mono text-[9px] uppercase tracking-widest text-stone-400">Loading Services</p>
                  </div>
                ) : services.length === 0 ? (
                  <div className="py-16 border border-dashed border-stone-200 rounded-2xl text-center bg-white">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-stone-400">No services offered presently</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {Object.entries(
                      services.reduce((acc, s) => {
                        const cat = s.category?.name || "Custom Service";
                        if (!acc[cat]) acc[cat] = [];
                        acc[cat].push(s);
                        return acc;
                      }, {} as Record<string, ServiceWithVariants[]>)
                    ).map(([category, catServices], gIdx) => (
                      <div key={category} className="space-y-6">
                        <motion.h3
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: gIdx * 0.05 }}
                          className="text-lg sm:text-xl font-serif text-stone-900 border-l-2 border-amber-500 pl-3 flex flex-col"
                        >
                          <span className="text-[9px] font-mono uppercase tracking-wider text-stone-400 mb-0.5 font-normal">Category</span>
                          {category}
                        </motion.h3>
                        <div className="flex flex-col space-y-3">
                          {catServices.map((service, idx) => (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: (gIdx * 0.05) + (idx * 0.05) }}
                              key={service.id}
                              className="group relative"
                            >
                              {idx !== 0 && <div className="absolute -top-1.5 left-0 w-full h-[1px] bg-stone-100" />}
                              <ServiceListItem service={service} onBook={handleBookService} index={idx} />
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.section>
            )}

            {activeTab === 'reviews' && (
              <motion.section
                key="reviews"
                initial={{ opacity: 0, y: 10, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.99 }}
                transition={{ duration: 0.3 }}
                className="relative z-10"
              >
                <div className="flex items-end justify-between border-b border-stone-200 pb-2 mb-6">
                  <div>
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-stone-400 mb-0.5 block">Client Feedback</span>
                    <h2 className="text-2xl sm:text-3xl font-serif text-stone-900 leading-tight">Reviews</h2>
                  </div>
                  <Link href={`/tz/${slug}/reviews`} className="font-mono text-[10px] uppercase tracking-wider text-stone-900 hover:text-amber-600 transition-colors pb-1 group flex items-center gap-1.5">
                    Read All <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>

                <div className="grid gap-4">
                  {profile.reviews?.slice(0, 5).map((review, rIdx) => (
                    <motion.div
                      key={review.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: rIdx * 0.05 }}
                      className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/70 shadow-sm"
                    >
                      <div className="flex items-start gap-3.5 mb-3">
                        <div className="w-10 h-10 rounded-full bg-stone-100 overflow-hidden flex-shrink-0 ring-2 ring-stone-50">
                          {review.userAvatar ? (
                            <Image src={review.userAvatar} alt={review.userName} width={40} height={40} className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-stone-400 font-serif text-base font-bold">
                              {review.userName.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 mt-0.5">
                          <p className="font-serif text-sm font-semibold text-stone-900 mb-0.5">{review.userName}</p>
                          <div className="flex text-amber-500 gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`${i < Math.floor(review.rating) ? 'fill-current' : 'text-stone-200'}`} size={11} />
                            ))}
                          </div>
                        </div>
                        <span className="font-mono text-[9px] uppercase tracking-wider text-stone-400 bg-stone-50 px-2.5 py-1 rounded-full">{review.date}</span>
                      </div>

                      <p className="font-serif text-sm text-stone-700 leading-relaxed italic border-l-2 border-stone-200 pl-3">
                        &quot;{review.comment}&quot;
                      </p>

                      {review.productName && (
                        <div className="mt-4 pt-3 border-t border-stone-100 flex items-center gap-3">
                          {review.productImage && (
                            <div className="w-9 h-12 rounded bg-stone-100 overflow-hidden shrink-0">
                              <Image src={review.productImage} alt={review.productName} width={36} height={48} className="object-cover w-full h-full" />
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="font-mono text-[9px] uppercase tracking-wider text-stone-400">Reviewed On</span>
                            <span className="text-xs font-medium text-stone-900 font-serif">{review.productName}</span>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                  {(!profile.reviews || profile.reviews.length === 0) && (
                    <div className="py-16 text-center border border-dashed border-stone-200 rounded-2xl bg-white">
                      <p className="font-mono text-[10px] uppercase tracking-wider text-stone-400">No reviews yet.</p>
                    </div>
                  )}
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <ChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        professionalId={profile.user.id}
        professionalName={displayName}
        professionalImage={profileImage}
        currentUserId={session?.user?.id || ''}
      />

      {/* 5. THE LIGHTBOX VERNISSAGE (Archival Viewer) */}
      <AnimatePresence>
        {selectedImageIndex !== null && selectedCollection && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-950/98 backdrop-blur-2xl px-6 lg:px-20 py-10 overflow-hidden"
          >
            {/* Film Grain Texture Overlay */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

            <button
              onClick={() => setSelectedImageIndex(null)}
              className="absolute top-8 right-8 text-stone-400 hover:text-white transition-colors z-[110] flex items-center gap-2 group"
            >
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] opacity-0 group-hover:opacity-100 transition-opacity">Exit Archive</span>
              <X size={24} />
            </button>

            <div className="max-w-7xl w-full h-full flex flex-col lg:flex-row gap-12 lg:gap-20 items-center justify-center relative">

              {/* Previous Handle */}
              <button
                onClick={() => setSelectedImageIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : prev))}
                disabled={selectedImageIndex === 0}
                className={cn(
                  "absolute left-0 top-1/2 -translate-y-1/2 z-[110] text-stone-500 hover:text-white transition-all disabled:opacity-0",
                  "hidden lg:flex flex-col items-center gap-4"
                )}
              >
                <div className="h-40 w-[1px] bg-stone-800 group-hover:bg-amber-500/50 transition-colors" />
                <span className="vertical-rl text-[9px] font-mono uppercase tracking-[0.5em] -rotate-180">Scan Prev</span>
              </button>

              {/* Main Artifact Frame */}
              <motion.div
                layoutId={`gallery-img-${selectedCollection.images[selectedImageIndex]}`}
                className="relative flex-1 h-full max-h-[70vh] lg:max-h-[85vh] aspect-[3/4] lg:aspect-auto flex items-center justify-center"
              >
                <Image
                  src={selectedCollection.images[selectedImageIndex]}
                  alt="Archival Print"
                  fill
                  className="object-contain shadow-2xl"
                  priority
                />
              </motion.div>

              {/* Archive Metadata Sidebar */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="lg:w-80 space-y-12 shrink-0 border-l border-stone-800/60 pl-12 hidden lg:block"
              >
                <div className="space-y-4">
                  <h4 className="text-[10px] font-mono font-bold uppercase tracking-[0.4em] text-amber-500/80">Collection</h4>
                  <div className="space-y-1">
                    <p className="font-serif text-3xl text-white uppercase tracking-tighter leading-tight">{selectedCollection.name}</p>
                    <p className="text-[10px] font-mono text-stone-500 uppercase tracking-widest">
                      Selection {selectedImageIndex + 1} of {selectedCollection.images.length}
                    </p>
                  </div>
                </div>

                <div className="space-y-10">
                  <div className="flex items-center gap-3 pt-6 border-t border-stone-800/50">
                    <div className="h-[1px] w-8 bg-stone-700" />
                    <span className="text-[9px] font-mono text-stone-600 uppercase tracking-[0.3em]">Creative Note</span>
                  </div>
                  <p className="text-sm text-stone-300 font-serif italic leading-relaxed">
                    Handcrafted {profile.specialization.name} styles, blending traditional African fashion with clean, modern tailoring.
                  </p>
                </div>
              </motion.div>

              {/* NEXT Handle */}
              <button
                onClick={() => setSelectedImageIndex((prev) => (prev !== null && prev < selectedCollection.images.length - 1 ? prev + 1 : prev))}
                disabled={selectedImageIndex === selectedCollection.images.length - 1}
                className={cn(
                  "absolute right-0 top-1/2 -translate-y-1/2 z-[110] text-stone-500 hover:text-white transition-all disabled:opacity-0",
                  "hidden lg:flex flex-col items-center gap-4"
                )}
              >
                <span className="vertical-rl text-[9px] font-mono uppercase tracking-[0.5em]">Scan Next</span>
                <div className="h-40 w-[1px] bg-stone-800" />
              </button>

              {/* Mobile Swipe / Progress Indicator */}
              <div className="lg:hidden flex flex-col items-center gap-6 w-full">
                <div className="h-[1px] w-full bg-stone-800 relative">
                  <motion.div
                    className="absolute inset-y-0 left-0 bg-amber-500"
                    animate={{ width: `${((selectedImageIndex + 1) / selectedCollection.images.length) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between w-full font-mono text-[9px] text-stone-500 uppercase tracking-widest">
                  <span>Arch. {selectedImageIndex + 1}</span>
                  <span>Total {selectedCollection.images.length}</span>
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfileClient;
