'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, MapPin, Clock,
  ArrowRight, ShoppingBag, MessageSquare, Zap,
  Globe, Instagram, Facebook, Settings, BadgeCheck, ImageIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProductCard } from '@/components/common/ProductCard';
import { ServiceListItem } from '@/app/components/services/ServiceListItem';
import { type ServiceWithVariants } from '@/app/components/services/ServiceCard';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { ChatDrawer } from '@/app/components/chat/ChatDrawer';

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
  embedUrl?: string;
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
  name: string;
  price: number;
  currency: string;
  images: string[];
  sizes?: string[];
  colors?: string[];
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
  category?: {
    name: string;
    slug: string;
  };
  tags?: string[];
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
  location?: Location;
  reviews?: Review[];
  featuredProducts?: ProductPreview[];
  socials?: {
    website?: string;
    instagram?: string;
    facebook?: string;
  };
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

// --- TYPES ---

interface ProfileClientProps {
  profile: ProfessionalProfile;
  slug: string;
  isOwner: boolean;
}

const ProfileClient = ({ profile, slug, isOwner }: ProfileClientProps) => {
  const displayName = profile.businessName || `${profile.user.firstName} ${profile.user.lastName}`;
  const coverImage = profile.coverImage || "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=2000&auto=format&fit=crop";
  const profileImage = profile.businessImage || profile.user.profileImage || '/placeholder-avatar.jpg';

  // Tabs & modals state
  const isModel = profile.specialization?.name?.toLowerCase().includes('model');
  const [activeTab, setActiveTab] = useState<'products' | 'services' | 'reviews' | 'gallery'>(isModel ? 'gallery' : 'products')
  const [services, setServices] = useState<ServiceWithVariants[]>([])
  const [servicesLoading, setServicesLoading] = useState(false)
  const router = useRouter();
  const { data: session } = useSession();
  const [isChatOpen, setIsChatOpen] = useState(false);

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
    <div className="min-h-screen bg-[#FAFAF9] text-stone-900 pb-32 font-sans selection:bg-stone-200">
      
      {/* 1. CINEMATIC HERO */}
      <div className="relative w-full h-[70vh] lg:h-[80vh] overflow-hidden">
        <Image 
          src={coverImage} 
          alt="Cover" 
          fill 
          priority 
          className="object-cover"
          quality={100}
          sizes="100vw"
          unoptimized={coverImage.startsWith('/uploads')}
        />
        {/* Soft, deep gradient for legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-900/60 to-transparent" />
        
        {/* Hero Content Overlay */}
        <div className="absolute bottom-0 left-0 w-full p-6 lg:p-16 flex flex-col md:flex-row items-end justify-between gap-8 z-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-end w-full">
            {/* Avatar */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative flex-shrink-0"
            >
              <div className="w-32 h-32 md:w-48 md:h-48 rounded-full overflow-hidden bg-stone-100 shadow-2xl border-4 border-white/10 backdrop-blur-sm relative z-10">
                <Image 
                  src={profileImage} 
                  alt={displayName}
                  width={192}
                  height={192}
                  className="object-cover w-full h-full"
                />
              </div>
              {profile.isVerified && (
                <div className="absolute bottom-2 right-2 bg-emerald-500 p-2 rounded-full shadow-xl border-4 border-stone-900 z-20">
                  <BadgeCheck className="w-6 h-6 text-white" />
                </div>
              )}
            </motion.div>

            {/* Typography */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex-1 min-w-0 pb-2 md:pb-6"
            >
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif text-white leading-[0.9] tracking-tight mb-4 drop-shadow-md">
                {displayName}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-stone-200 font-mono text-xs uppercase tracking-[0.2em]">
                <span className="font-bold">{profile.specialization.name}</span>
                {profile.location && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-stone-500" />
                    <span className="flex items-center gap-2">
                      <MapPin size={14} className="text-stone-400" /> {profile.location.city}
                    </span>
                  </>
                )}
                {profile.rating && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-stone-500" />
                    <span className="flex items-center gap-1.5 text-amber-400 font-bold">
                      <Star size={14} className="fill-current" />
                      {profile.rating.toFixed(1)} <span className="text-stone-400">({profile.totalReviews})</span>
                    </span>
                  </>
                )}
              </div>
            </motion.div>

            {/* Actions */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-wrap gap-4 pb-2 md:pb-6"
            >
                  <Link 
                href={`/tz/${slug}/shop`} 
                className="bg-white text-stone-900 px-8 py-4 rounded-full font-mono text-xs font-bold uppercase tracking-widest hover:bg-stone-50 hover:scale-105 transition-all shadow-xl flex items-center gap-3"
              >
                <ShoppingBag size={16} /> Enter Shop
              </Link>
              {isOwner && (
                <Link 
                  href="/dashboard" 
                  className="bg-stone-900/40 backdrop-blur-lg border border-stone-700 text-white px-8 py-4 rounded-full font-mono text-xs font-bold uppercase tracking-widest hover:bg-stone-900/60 hover:scale-105 transition-all shadow-xl flex items-center gap-3"
                >
                  <Settings size={16} /> Dashboard
                </Link>
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
                  className="bg-stone-900/40 backdrop-blur-lg border border-stone-700 text-white w-14 h-14 rounded-full flex items-center justify-center hover:bg-stone-900/60 transition-all hover:scale-105"
                >
                  <MessageSquare size={18} />
                </button>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* 2. FLOATING NAVIGATION PILL */}
      <div className="sticky top-20 z-50 flex justify-center -mt-8 pt-2 pb-6 px-4 pointer-events-none">
        <div className="bg-white/85 backdrop-blur-xl border border-stone-200/60 p-1.5 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.08)] flex items-center gap-1 pointer-events-auto overflow-x-auto max-w-full no-scrollbar">
          {(isModel 
            ? ['gallery', 'products', 'services', 'reviews'] as const
            : ['products', 'services', 'gallery', 'reviews'] as const
          ).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-6 py-3 rounded-full text-xs font-mono font-bold uppercase tracking-widest transition-all duration-300 flex items-center gap-2 flex-shrink-0',
                activeTab === tab
                  ? 'bg-stone-900 text-white shadow-lg scale-105'
                  : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100/50'
              )}
            >
              {tab === 'products' && <ShoppingBag size={14} className={activeTab === tab ? '' : 'text-stone-400'}/>}
              {tab === 'services' && <Zap size={14} className={activeTab === tab ? '' : 'text-stone-400'}/>}
              {tab === 'gallery' && <ImageIcon size={14} className={activeTab === tab ? '' : 'text-stone-400'}/>}
              {tab === 'reviews' && <MessageSquare size={14} className={activeTab === tab ? '' : 'text-stone-400'}/>}
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* 3. BENTO GRID LAYOUT */}
      <div className="max-w-7xl mx-auto px-6 mt-12 lg:mt-24 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24 items-start">
        
        {/* LEFT COLUMN - Editorial Info (Span 4) */}
        <div className="lg:col-span-4 space-y-16 sticky top-40">
          {/* About Statement */}
          <div className="space-y-6">
            <h3 className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-stone-400 flex items-center gap-3">
              <span className="w-8 h-[1px] bg-stone-300" /> The Atelier
            </h3>
            <p className="font-serif text-2xl lg:text-3xl text-stone-800 leading-snug italic px-4 border-l-4 border-amber-500/20">
              &quot;{profile.bio || `A premium ${profile.specialization.name} business dedicated to bringing you the finest quality materials and craftsmanship.`}&quot;
            </p>
            {profile.socials && (
              <div className="flex gap-6 pt-6 px-4">
                {profile.socials.website && <Link href={profile.socials.website} className="text-stone-400 hover:text-stone-900 transition-colors hover:-translate-y-1 transform"><Globe size={20}/></Link>}
                {profile.socials.instagram && <Link href={profile.socials.instagram} className="text-stone-400 hover:text-stone-900 transition-colors hover:-translate-y-1 transform"><Instagram size={20}/></Link>}
                {profile.socials.facebook && <Link href={profile.socials.facebook} className="text-stone-400 hover:text-stone-900 transition-colors hover:-translate-y-1 transform"><Facebook size={20}/></Link>}
              </div>
            )}
          </div>

          {/* Location Minimal */}
          {profile.location && (
            <div className="space-y-6">
              <h3 className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-stone-400 flex items-center gap-3">
                <span className="w-8 h-[1px] bg-stone-300" /> Location
              </h3>
              <div className="bg-white rounded-[2rem] p-8 border border-stone-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-8">
                {profile.location.embedUrl && (
                  <div className="aspect-[4/3] rounded-2xl overflow-hidden grayscale hover:grayscale-0 transition-all duration-700 bg-stone-100 ring-1 ring-stone-900/5">
                    <iframe
                      src={profile.location.embedUrl}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                )}
                <div className="space-y-6">
                  <div>
                    <p className="font-serif text-xl text-stone-900 mb-2">{profile.location.address}</p>
                    <p className="text-sm font-mono text-stone-500 uppercase tracking-widest">{profile.location.city}</p>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono uppercase tracking-widest text-stone-500 pt-6 border-t border-stone-100">
                    <span className="font-bold flex items-center gap-2"><Clock size={14} className="text-stone-400"/> Status</span>
                    <span className={openStatus.isOpen ? 'text-emerald-600 font-bold bg-emerald-50 px-3 py-1 rounded-full' : 'text-stone-500 font-bold bg-stone-100 px-3 py-1 rounded-full'}>
                      {openStatus.isOpen ? 'Open Now' : 'Closed'}
                    </span>
                  </div>
                  <p className="text-[10px] font-mono text-stone-400 text-right uppercase tracking-[0.2em]">{openStatus.nextChange && `${openStatus.nextChange}`}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN - Dynamic Content (Span 8) */}
        <div className="lg:col-span-8 min-h-[60vh]">
          <AnimatePresence mode="wait">
            
            {/* ---------------- 1. GALLERY TAB ---------------- */}
            {activeTab === 'gallery' && (
              <motion.section
                key="gallery"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -40 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="flex items-center justify-between mb-12">
                  <h2 className="text-4xl lg:text-5xl font-serif text-stone-900">Selected Works</h2>
                  <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-stone-400 border border-stone-200 rounded-full px-4 py-2">Portfolio</span>
                </div>
                
                {profile.galleryImages && profile.galleryImages.length > 0 ? (
                  <div className="columns-1 md:columns-2 gap-8 space-y-8">
                    {profile.galleryImages.map((img, i) => (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={i} 
                        className="break-inside-avoid w-full relative rounded-3xl overflow-hidden group cursor-pointer bg-stone-100 shadow-sm"
                      >
                        <Image 
                          src={img} 
                          alt={`Gallery ${i}`} 
                          width={600} 
                          height={800} 
                          className="w-full h-auto object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-[1.03]" 
                        />
                        <div className="absolute inset-0 bg-stone-900/0 group-hover:bg-stone-900/10 transition-colors duration-500" />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center text-stone-400 border border-dashed border-stone-200 rounded-3xl bg-white">
                    <p className="font-mono text-xs uppercase tracking-[0.2em]">No works documented yet</p>
                  </div>
                )}
              </motion.section>
            )}

            {/* ---------------- 2. PRODUCTS TAB ---------------- */}
            {activeTab === 'products' && (
              <motion.section
                 key="products"
                 initial={{ opacity: 0, y: 40 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -40 }}
                 transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                 className="space-y-16"
               >
                 <div className="flex items-end justify-between border-b border-stone-200 pb-8">
                   <div>
                     <span className="text-[10px] font-mono font-bold uppercase tracking-[0.4em] text-stone-400 mb-4 block">Collection</span>
                     <h2 className="text-5xl lg:text-7xl font-serif text-stone-900 leading-none">Ready to Wear</h2>
                   </div>
                   <Link href={`/tz/${slug}/shop`} className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-900 hover:text-amber-600 transition-colors flex items-center gap-2 pb-2 group">
                     View Full <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform"/>
                   </Link>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-16">
                   {profile.featuredProducts?.map((product, index) => (
                     <motion.div 
                       initial={{ opacity: 0, scale: 0.95 }}
                       animate={{ opacity: 1, scale: 1 }}
                       transition={{ delay: index * 0.1 }}
                       key={product.id}
                     >
                       <ProductCard 
                         item={{ 
                           ...product, 
                           category: { name: "Featured", slug: "featured" }, 
                           stockQuantity: 1 
                         }} 
                         index={index} 
                       />
                     </motion.div>
                   ))}
                   {(!profile.featuredProducts || profile.featuredProducts.length === 0) && (
                     <div className="col-span-2 py-32 text-center border border-dashed border-stone-200 rounded-3xl bg-white">
                       <p className="font-mono text-xs uppercase tracking-[0.2em] text-stone-400">No products available</p>
                     </div>
                   )}
                 </div>
               </motion.section>
            )}

            {/* ---------------- 3. SERVICES TAB ---------------- */}
            {activeTab === 'services' && (
              <motion.section
                key="services"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -40 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="mb-16 border-b border-stone-200 pb-8">
                   <span className="text-[10px] font-mono font-bold uppercase tracking-[0.4em] text-stone-400 mb-4 block">Consultation & Bespoke</span>
                   <h2 className="text-5xl lg:text-7xl font-serif text-stone-900 leading-none">Services</h2>
                </div>

                {servicesLoading ? (
                  <div className="py-32 flex flex-col items-center justify-center gap-6">
                    <div className="w-12 h-12 border-2 border-stone-200 border-t-stone-900 rounded-full animate-spin" />
                    <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-stone-400">Loading Services</p>
                  </div>
                ) : services.length === 0 ? (
                  <div className="py-32 border border-dashed border-stone-200 rounded-3xl text-center bg-white">
                    <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-stone-400">No services offered presently</p>
                  </div>
                ) : (
                  <div className="space-y-32">
                    {Object.entries(
                      services.reduce((acc, s) => {
                        const cat = s.category?.name || "Curated Offering";
                        if (!acc[cat]) acc[cat] = [];
                        acc[cat].push(s);
                        return acc;
                      }, {} as Record<string, ServiceWithVariants[]>)
                    ).map(([category, catServices], gIdx) => (
                      <div key={category} className="space-y-12">
                        <motion.h3 
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: gIdx * 0.1 }}
                          className="text-3xl font-serif text-stone-900 border-l-4 border-amber-500 pl-6 flex flex-col"
                        >
                          <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-stone-400 mb-2 font-normal">Category</span>
                          {category}
                        </motion.h3>
                        <div className="flex flex-col space-y-6">
                          {catServices.map((service, idx) => (
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: (gIdx * 0.1) + (idx * 0.1) }}
                              key={service.id}
                              className="group relative"
                            >
                              {/* Simple aesthetic line between items */}
                              {idx !== 0 && <div className="absolute -top-3 left-0 w-full h-[1px] bg-stone-100" />}
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

            {/* ---------------- 4. REVIEWS TAB ---------------- */}
            {activeTab === 'reviews' && (
              <motion.section
                key="reviews"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -40 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="flex items-end justify-between border-b border-stone-200 pb-8 mb-16">
                   <div>
                     <span className="text-[10px] font-mono font-bold uppercase tracking-[0.4em] text-stone-400 mb-4 block">Client Feedback</span>
                     <h2 className="text-5xl lg:text-7xl font-serif text-stone-900 leading-none">Reviews</h2>
                   </div>
                   <Link href={`/tz/${slug}/reviews`} className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-900 hover:text-amber-600 transition-colors pb-2 group flex items-center gap-2">
                     Read All <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                   </Link>
                </div>

                <div className="grid gap-8">
                  {profile.reviews?.slice(0, 5).map((review, rIdx) => (
                    <motion.div 
                      key={review.id} 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: rIdx * 0.1 }}
                      className="bg-white rounded-3xl p-8 lg:p-12 border border-stone-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
                    >
                      <div className="flex items-start gap-6 mb-8">
                        <div className="w-16 h-16 rounded-full bg-stone-100 overflow-hidden flex-shrink-0 ring-4 ring-stone-50">
                          {review.userAvatar ? (
                            <Image src={review.userAvatar} alt={review.userName} width={64} height={64} className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-stone-400 font-serif text-2xl">
                              {review.userName.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 mt-1">
                          <p className="font-serif text-2xl text-stone-900 mb-1">{review.userName}</p>
                          <div className="flex text-amber-500 gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`${i < Math.floor(review.rating) ? 'fill-current' : 'text-stone-200'}`} size={14} />
                            ))}
                          </div>
                        </div>
                        <span className="font-mono text-[10px] uppercase tracking-widest text-stone-400 bg-stone-50 px-3 py-1.5 rounded-full">{review.date}</span>
                      </div>
                      
                      <p className="font-serif text-xl md:text-2xl text-stone-700 leading-relaxed italic border-l-4 border-stone-200 pl-6 lg:pl-8">
                        &quot;{review.comment}&quot;
                      </p>

                      {review.productName && (
                        <div className="mt-10 pt-6 border-t border-stone-100 flex items-center gap-4">
                          {review.productImage && (
                            <div className="w-12 h-16 rounded-lg bg-stone-100 overflow-hidden shrink-0">
                              <Image src={review.productImage} alt={review.productName} width={48} height={64} className="object-cover w-full h-full" />
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-400 mb-1">Reviewed On</span>
                            <span className="text-sm font-medium text-stone-900 font-serif">{review.productName}</span>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                  {(!profile.reviews || profile.reviews.length === 0) && (
                    <div className="py-24 text-center border border-dashed border-stone-200 rounded-3xl bg-white">
                      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-400">No reviews yet.</p>
                    </div>
                  )}
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </div>
      </div>

      <ChatDrawer 
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        professionalId={profile.user.id}
        professionalName={displayName}
        professionalImage={profileImage}
        currentUserId={session?.user?.id || ''}
      />
    </div>
  );
};

export default ProfileClient;
