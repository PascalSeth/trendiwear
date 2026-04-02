'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import {
  Star, MapPin, Phone, Clock,
  ArrowRight, ShoppingBag, MessageSquare, Zap,
  Globe, Instagram, Facebook, Settings, BadgeCheck, Loader, ImageIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProductCard } from '@/components/common/ProductCard';
import { ServiceListItem } from '@/app/components/services/ServiceListItem';
import { type ServiceWithVariants } from '@/app/components/services/ServiceCard';
import { useRouter } from 'next/navigation';

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

// --- COMPONENTS ---

const RatingBadge = ({ rating, count }: { rating: number; count?: number }) => (
  <div className="flex items-center gap-2 bg-white/90 backdrop-blur border border-stone-200 px-3 py-1.5 rounded-full shadow-sm">
    <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
    <span className="font-bold text-stone-900">{rating?.toFixed(1)}</span>
    {count && <span className="text-xs text-stone-400">({count})</span>}
  </div>
);

const InfoCard = ({ icon: Icon, title, children, className = "" }: { icon: LucideIcon, title: string, children: React.ReactNode, className?: string }) => (
  <div className={`bg-white rounded-3xl p-6 border border-stone-100 shadow-sm hover:shadow-md transition-shadow ${className}`}>
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2 bg-stone-50 rounded-full text-stone-700">
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="font-bold text-stone-900">{title}</h3>
    </div>
    {children}
  </div>
);


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
    <div className="min-h-screen bg-stone-50 text-stone-900 pb-20">
      
      {/* HERO SECTION - Clean Modern Layout */}
      <div className="relative w-full bg-white">
        {/* Cover Image */}
        <div className="relative h-72 lg:h-96 w-full overflow-hidden">
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
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/60" />
        </div>

        {/* Profile Content Container */}
        <div className="max-w-7xl mx-auto px-6">
          <div className="relative">
            {/* Profile Card - Overlapping the cover image */}
            <div className="relative -mt-20 bg-white rounded-3xl shadow-2xl border border-stone-100 p-8">
              <div className="flex flex-col lg:flex-row gap-8 items-start">
                
                {/* Left: Avatar & Basic Info */}
                <div className="flex flex-col sm:flex-row gap-6 items-start flex-1">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-32 h-32 rounded-2xl overflow-hidden bg-stone-100 shadow-lg border-4 border-white">
                      <Image 
                        src={profileImage} 
                        alt={displayName}
                        width={128}
                        height={128}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    {/* Verified Badge */}
                    {profile.isVerified && (
                      <div className="absolute -bottom-1 -right-1 bg-emerald-500 p-1.5 rounded-full shadow-lg border-2 border-white">
                        <BadgeCheck className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Name & Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-3xl lg:text-4xl font-serif font-bold text-stone-900">
                        {displayName}
                      </h1>
                      {profile.isVerified && (
                        <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200">
                          <BadgeCheck className="w-4 h-4" />
                          <span className="text-xs font-semibold">Verified</span>
                        </div>
                      )}
                    </div>
                    
                    <p className="text-lg text-stone-600 mb-4">
                      {profile.specialization.name}
                    </p>
                    
                    <div className="flex flex-wrap gap-3">
                      {profile.rating && (
                        <RatingBadge rating={profile.rating} count={profile.totalReviews} />
                      )}
                      {profile.location && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-full text-sm">
                          <MapPin className="w-4 h-4 text-stone-500" />
                          <span className="text-stone-700 font-medium">{profile.location.city}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Action Buttons */}
                <div className="flex flex-wrap gap-3 lg:pt-0">
                  <Link 
                    href={`/tz/${slug}/shop`} 
                    className="bg-stone-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-stone-800 transition-all shadow-sm flex items-center gap-2"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    Visit Shop
                  </Link>
                  
                  {isOwner && (
                    <>
                      <Link 
                        href="/settings" 
                        className="bg-white border border-stone-200 text-stone-800 px-6 py-3 rounded-xl font-semibold hover:bg-stone-50 transition-all shadow-sm flex items-center gap-2"
                      >
                        <Settings className="w-4 h-4" />
                        Edit Profile
                      </Link>
                      <Link 
                        href="/dashboard" 
                        className="bg-amber-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-amber-600 transition-all shadow-sm flex items-center gap-2"
                      >
                        Dashboard
                      </Link>
                    </>
                  )}
                  
                  <button 
                    className="bg-stone-100 text-stone-700 px-4 py-3 rounded-xl hover:bg-stone-200 transition-all shadow-sm"
                  >
                    <MessageSquare className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT BENTO GRID */}
      <div className="max-w-7xl mx-auto px-6 mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN - Business Info (Span 4) */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Bio Card */}
          <InfoCard icon={Globe} title="About">
            <p className="text-stone-600 leading-relaxed text-sm">
              {profile.bio || `We are a premium ${profile.specialization.name} business dedicated to bringing you the finest quality materials and craftsmanship.`}
            </p>
            {profile.socials && (
              <div className="flex gap-4 mt-6 pt-6 border-t border-stone-100">
                {profile.socials.website && <Link href={profile.socials.website} className="text-stone-400 hover:text-stone-900 transition-colors"><Globe size={20}/></Link>}
                {profile.socials.instagram && <Link href={profile.socials.instagram} className="text-stone-400 hover:text-stone-900 transition-colors"><Instagram size={20}/></Link>}
                {profile.socials.facebook && <Link href={profile.socials.facebook} className="text-stone-400 hover:text-stone-900 transition-colors"><Facebook size={20}/></Link>}
              </div>
            )}
          </InfoCard>

          {/* Location Card */}
          {profile.location && (
            <InfoCard icon={MapPin} title="Studio Location">
              <div className="space-y-4">
                <div className="relative h-40 w-full rounded-2xl overflow-hidden group">
                   {profile.location.embedUrl ? (
                     <iframe
                       src={profile.location.embedUrl}
                       width="100%"
                       height="100%"
                       style={{ border: 0 }}
                       allowFullScreen
                       loading="lazy"
                       referrerPolicy="no-referrer-when-downgrade"
                       title="Location Map"
                     />
                   ) : (
                     <div className="w-full h-full bg-stone-200 flex items-center justify-center">
                       <p className="text-stone-500 text-sm">Map not available</p>
                     </div>
                   )}
                 </div>
                
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-stone-400 shrink-0 mt-0.5" />
                    <p className="text-stone-600">{profile.location.address}, {profile.location.city}</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-stone-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-stone-600">{profile.location.hours}</p>
                      <p className={`text-xs font-medium ${openStatus.isOpen ? 'text-green-600' : 'text-red-500'}`}>
                        {openStatus.isOpen ? 'Open Now' : 'Closed'} {openStatus.nextChange && `· ${openStatus.nextChange}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-stone-400 shrink-0 mt-0.5" />
                    <p className="text-stone-600">+1 (555) 000-0000</p>
                  </div>
                </div>
              </div>
            </InfoCard>
          )}
        </div>

        {/* RIGHT COLUMN - Tabbed Content (Span 8) */}
        <div className="lg:col-span-8">
          {/* Tab Navigation */}
          <div className="flex gap-2 mb-6 border-b border-stone-200">
            {(isModel 
              ? ['gallery', 'products', 'services', 'reviews'] as const
              : ['products', 'services', 'gallery', 'reviews'] as const
            ).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'px-4 py-3 font-semibold text-sm border-b-2 transition-all capitalize',
                  activeTab === tab
                    ? 'border-amber-600 text-amber-600'
                    : 'border-transparent text-stone-600 hover:text-stone-900'
                )}
              >
                {tab === 'gallery' && <ImageIcon className="w-4 h-4 inline mr-2" />}
                {tab === 'products' && <ShoppingBag className="w-4 h-4 inline mr-2" />}
                {tab === 'services' && <Zap className="w-4 h-4 inline mr-2" />}
                {tab === 'reviews' && <MessageSquare className="w-4 h-4 inline mr-2" />}
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {/* Gallery Tab */}
            {activeTab === 'gallery' && (
              <motion.section
                key="gallery"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-serif font-bold">Portfolio Gallery</h2>
                </div>
                
                {profile.galleryImages && profile.galleryImages.length > 0 ? (
                  <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
                    {profile.galleryImages.map((img, i) => (
                      <div key={i} className="break-inside-avoid relative rounded-2xl overflow-hidden group cursor-pointer bg-stone-100 mb-4 ring-1 ring-stone-200">
                        <Image src={img} alt={`Gallery ${i}`} width={800} height={1200} className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <ImageIcon className="text-white w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <ImageIcon className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                    <p className="text-stone-600">No images in portfolio yet.</p>
                  </div>
                )}
              </motion.section>
            )}

            {/* Products Tab */}
            {activeTab === 'products' && (
              <motion.section
                key="products"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-serif font-bold">Trending Products</h2>
                  <Link href={`/tz/${slug}/shop`} className="text-sm font-bold text-amber-600 flex items-center gap-1 hover:underline">
                    View All <ArrowRight size={16} />
                  </Link>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {profile.featuredProducts?.map((product, index) => (
                    <ProductCard 
                      key={product.id} 
                      item={{ 
                        ...product, 
                        category: { name: "Featured", slug: "featured" }, 
                        stockQuantity: 1 
                      }} 
                      index={index} 
                    />
                  ))}
                  {[...Array(Math.max(0, 3 - (profile.featuredProducts?.length || 0)))].map((_, i) => (
                    <div key={i} className="aspect-[3/4] bg-stone-100 rounded-2xl border border-dashed border-stone-300 flex items-center justify-center text-stone-400">
                      <ShoppingBag size={24} />
                    </div>
                  ))}
                </div>
              </motion.section>
            )}

            {/* Services Tab */}
            {activeTab === 'services' && (
              <motion.section
                key="services"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-12"
              >
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-amber-50 rounded-2xl text-amber-600">
                      <Zap className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-serif font-bold">Catalogue of Services</h2>
                      <p className="text-sm text-stone-500">Expertly curated to match your needs</p>
                    </div>
                  </div>
                </div>

                {servicesLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="flex flex-col items-center gap-4">
                       <Loader className="w-8 h-8 animate-spin text-amber-600" />
                       <p className="text-xs font-black text-stone-400 uppercase tracking-widest">Loading our services...</p>
                    </div>
                  </div>
                ) : services.length === 0 ? (
                  <div className="text-center py-20 bg-stone-50 rounded-[2rem] border border-dashed border-stone-200">
                    <Zap className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                    <p className="text-stone-600 font-medium">No services currently listed</p>
                  </div>
                ) : (
                  <div className="space-y-32 py-12">
                    {/* Group services by category if available, otherwise just list them */}
                    {Object.entries(
                      services.reduce((acc, s) => {
                        const cat = s.category?.name || "Premium Selection";
                        if (!acc[cat]) acc[cat] = [];
                        acc[cat].push(s);
                        return acc;
                      }, {} as Record<string, ServiceWithVariants[]>)
                    ).map(([category, catServices]) => (
                      <div key={category} className="space-y-16">
                         <div className="flex items-center gap-10">
                            <div className="flex flex-col">
                               <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.4em] mb-2">Category</span>
                               <h3 className="text-4xl md:text-5xl font-serif font-bold text-stone-900 tracking-tight">{category}</h3>
                            </div>
                            <div className="h-[2px] flex-1 bg-stone-900/5 mt-auto mb-2" />
                         </div>
                         <div className="flex flex-col">
                           {catServices.map((service, idx) => (
                             <ServiceListItem
                               key={service.id}
                               service={service}
                               onBook={handleBookService}
                               index={idx}
                             />
                           ))}
                         </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.section>
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <motion.section
                key="reviews"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-amber-50 rounded-2xl text-amber-600">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-serif font-bold">Customer Reviews</h2>
                      <p className="text-sm text-stone-500">What people are saying</p>
                    </div>
                  </div>
                  <Link href={`/tz/${slug}/reviews`} className="text-xs font-bold uppercase tracking-wider border-b border-stone-300 pb-1 hover:border-black transition-colors">
                    Read All
                  </Link>
                </div>

                <div className="space-y-6">
                  {profile.reviews?.slice(0, 3).map((review) => (
                    <div key={review.id} className="border-b border-stone-100 pb-6 last:border-0 last:pb-0">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-stone-200 overflow-hidden">
                            {review.userAvatar ? (
                              <Image src={review.userAvatar} alt={review.userName} width={40} height={40} className="object-cover"/>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-stone-400 text-xs font-bold">
                                {review.userName.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-stone-900 text-sm">{review.userName}</p>
                            <div className="flex text-amber-500 text-[10px] gap-0.5">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`${i < Math.floor(review.rating) ? 'fill-current' : 'text-stone-200'}`} size={10} />
                              ))}
                            </div>
                          </div>
                        </div>
                        <span className="text-xs text-stone-400">{review.date}</span>
                      </div>
                      {review.productName && (
                        <div className="flex items-center gap-2 mb-2 pl-13">
                          {review.productImage && (
                            <div className="w-8 h-8 rounded bg-stone-100 overflow-hidden">
                              <Image src={review.productImage} alt={review.productName} width={32} height={32} className="object-cover w-full h-full"/>
                            </div>
                          )}
                          <span className="text-xs text-stone-500">Review on <span className="font-medium text-stone-700">{review.productName}</span></span>
                        </div>
                      )}
                      <p className="text-stone-600 text-sm leading-relaxed pl-13">
                        &apos;{review.comment}&apos;
                      </p>
                    </div>
                  ))}
                  {(!profile.reviews || profile.reviews.length === 0) && (
                    <p className="text-stone-500 text-sm text-center py-4">No reviews yet.</p>
                  )}
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default ProfileClient;
