'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { LucideIcon } from 'lucide-react';
import {
  Star, MapPin, Phone, Clock,
  ArrowRight, ShoppingBag, MessageSquare,
  Globe, Instagram, Facebook,  Settings
} from 'lucide-react';
import { WishlistButton } from '@/components/ui/wishlist-button';
import { AddToCartButton } from '@/components/ui/add-to-cart-button';

// --- TYPES (Extended for the new design) ---
interface Location {
  address: string;
  city: string;
  country: string;
  hours: string;
  embedUrl?: string;
}

interface Review {
  id: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  date: string;
}

interface ProductPreview {
  id: string;
  name: string;
  price: number;
  images: string[];
  professional: {
    firstName: string;
    lastName: string;
    professionalProfile?: {
      businessName?: string;
      businessImage?: string;
    };
  };
  _count: {
    wishlistItems: number;
  };
  tags?: string[];
}

interface RawReview {
  id: string;
  user: {
    firstName: string;
    lastName: string;
    profileImage?: string;
  };
  rating: number;
  comment: string;
  createdAt: string;
}

interface RawProduct {
  id: string;
  name: string;
  price: number;
  images?: string[];
  professional: {
    firstName: string;
    lastName: string;
    professionalProfile?: {
      businessName?: string;
      businessImage?: string;
    };
  };
  _count: {
    wishlistItems: number;
  };
  tags?: string[];
}

interface SocialMedia {
  platform: string;
  url: string;
}

interface ProfessionalProfile {
  id: string;
  businessName: string;
  businessImage?: string;
  bio?: string;
  rating?: number;
  totalReviews?: number;
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

// --- MAIN PAGE ---

const Profile = ({ params }: { params: Promise<{ slug: string }> }) => {
  const [profile, setProfile] = useState<ProfessionalProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{ email: string } | null>(null);

  const { slug } = React.use(params);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch current user
        const userRes = await fetch('/api/me');
        if (userRes.ok) {
          const userData = await userRes.json();
          setCurrentUser(userData.user);
        }

        const res = await fetch(`/api/professional-profiles/slug/${slug}`);
        if (!res.ok) throw new Error('Failed to fetch profile');
        const data = await res.json();

        const { reviews: rawReviews, products: rawProducts, ...profileData } = data;

        // Map reviews to expected format
        const reviews: Review[] = rawReviews.map((r: RawReview) => ({
          id: r.id,
          userName: `${r.user.firstName} ${r.user.lastName}`,
          userAvatar: r.user.profileImage,
          rating: r.rating,
          comment: r.comment,
          date: new Date(r.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
        }));

        // Map products to expected format
        const featuredProducts: ProductPreview[] = rawProducts.map((p: RawProduct) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          images: p.images || [],
          professional: p.professional,
          _count: p._count,
          tags: p.tags
        }));

        // Parse location from string
        const locationString = profileData.location || '';
        const locationParts = locationString.split(', ');
        const hasValidCoords = profileData.latitude && profileData.longitude && !isNaN(profileData.latitude) && !isNaN(profileData.longitude);
        const location: Location = {
          address: locationParts.slice(0, -2).join(', ') || 'Address not available',
          city: locationParts[locationParts.length - 2] || 'City not available',
          country: locationParts[locationParts.length - 1] || 'Country not available',
          hours: 'Mon-Sat: 9am - 6pm',
          embedUrl: hasValidCoords ? `https://www.google.com/maps/embed/v1/view?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&center=${profileData.latitude},${profileData.longitude}&zoom=15` : undefined
        };

        // Map socialMedia to socials
        const socials = profileData.socialMedia?.reduce((acc: Record<string, string>, sm: SocialMedia) => {
          if (sm.platform === 'website') acc.website = sm.url;
          if (sm.platform === 'instagram') acc.instagram = sm.url;
          if (sm.platform === 'facebook') acc.facebook = sm.url;
          return acc;
        }, {}) || {};

        setProfile({
          ...profileData,
          location,
          reviews,
          featuredProducts,
          socials
        });

      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchData();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

        <div className="relative z-10 flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin"></div>
          <p className="mt-4 text-sm font-medium text-stone-400 tracking-widest uppercase">Loading Profile</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm bg-white/50 backdrop-blur-sm p-8 rounded-3xl shadow-xl border border-white">
          <MapPin className="w-12 h-12 text-stone-300 mx-auto mb-4" />
          <h1 className="text-xl font-serif text-stone-900 mb-2">Profile Not Found</h1>
          <p className="text-stone-500 mb-6 text-sm">{error || 'We couldn\'t find this professional.'}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-stone-900 text-white px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-indigo-600 transition-colors shadow-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const displayName = profile.businessName || `${profile.user.firstName} ${profile.user.lastName}`;
  const coverImage = profile.businessImage || profile.user.profileImage || "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=2000&auto=format&fit=crop";

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
            quality={85}
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
                        src={profile.user.profileImage || '/placeholder-avatar.jpg'} 
                        alt={displayName}
                        width={128}
                        height={128}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  </div>

                  {/* Name & Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 mb-2">
                      <h1 className="text-3xl lg:text-4xl font-serif font-bold text-stone-900">
                        {displayName}
                      </h1>
                      {/* <CheckCircle2 className="w-6 h-6 text-blue-500 flex-shrink-0 mt-1" /> */}
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
                  
                  {(() => {
                    const isOwner = currentUser && currentUser.email === profile.user.email;
                    return isOwner && (
                      <Link 
                        href="/dashboard" 
                        className="bg-amber-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-amber-600 transition-all shadow-sm flex items-center gap-2"
                      >
                        <Settings className="w-4 h-4" />
                        Dashboard
                      </Link>
                    );
                  })()}
                  
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
                {profile.socials.website && <Link href="#" className="text-stone-400 hover:text-stone-900 transition-colors"><Globe size={20}/></Link>}
                {profile.socials.instagram && <Link href="#" className="text-stone-400 hover:text-stone-900 transition-colors"><Instagram size={20}/></Link>}
                {profile.socials.facebook && <Link href="#" className="text-stone-400 hover:text-stone-900 transition-colors"><Facebook size={20}/></Link>}
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
                      <p className="text-xs text-green-600 font-medium">Open Now</p>
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

        {/* RIGHT COLUMN - Reviews & Products (Span 8) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Featured Products */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-serif font-bold">Trending Products</h2>
              <Link href={`/tz/${slug}/shop`} className="text-sm font-bold text-amber-600 flex items-center gap-1 hover:underline">
                View All <ArrowRight size={16} />
              </Link>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {profile.featuredProducts?.map((product) => {
                const sellerName = product.professional.professionalProfile?.businessName || `${product.professional.firstName} ${product.professional.lastName}`;
                const sellerImage = product.professional.professionalProfile?.businessImage || '/placeholder-avatar.jpg';
                return (
                  <Link key={product.id} href={`/shopping/products/${product.id}`} className="group relative w-full cursor-pointer bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-500 transform hover:scale-[1.02]">
                    <div className="relative aspect-[3/4] overflow-hidden bg-stone-100 rounded-t-2xl">
                      <Image
                        src={product.images[0] || "/placeholder-product.jpg"}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
                        <Image
                          src={sellerImage}
                          alt={sellerName}
                          width={24}
                          height={24}
                          className="rounded-full border border-white/50"
                        />
                        <div className="text-white text-xs font-medium drop-shadow-lg">
                          {sellerName}
                        </div>
                      </div>
                      <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-400">
                        <div className="flex flex-col gap-2">
                          <button className="bg-white text-black px-6 py-3 rounded-full font-medium text-sm hover:bg-stone-200 transition-colors flex items-center gap-2">
                            View Details <ArrowRight size={16} />
                          </button>
                        </div>
                        <div className="flex flex-col gap-3">
                          <div className="bg-white/20 backdrop-blur-md p-3 rounded-full text-white hover:bg-white hover:text-black transition-all">
                            <WishlistButton productId={product.id} variant="default" size="sm" />
                          </div>
                          <div className="bg-white/20 backdrop-blur-md p-3 rounded-full text-white hover:bg-white hover:text-black transition-all">
                            <AddToCartButton productId={product.id} variant="default" size="sm" />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-6 flex justify-between items-start border-b border-stone-200 pb-4 group-hover:border-black transition-colors px-6">
                      <div>
                        <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">Category</p>
                        <h3 className="text-xl font-serif font-medium text-stone-900 leading-tight group-hover:italic transition-all">
                          {product.name}
                        </h3>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-medium text-stone-900">${product.price.toFixed(2)}</p>
                        <div className="flex items-center justify-end gap-1 mt-1 text-xs text-stone-400">
                          <Star size={10} className="fill-current text-stone-400" />
                          4.5
                        </div>
                      </div>
                    </div>
                    <div className="absolute inset-0 rounded-2xl border-2 border-blue-500/30 opacity-0 group-hover:opacity-100 transition-all duration-300 scale-95 group-hover:scale-100 pointer-events-none"></div>
                  </Link>
                );
              })}
              {[...Array(3 - (profile.featuredProducts?.length || 0))].map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-stone-100 rounded-2xl border border-dashed border-stone-300 flex items-center justify-center text-stone-400">
                  <ShoppingBag size={24} />
                </div>
              ))}
            </div>
          </section>

          {/* Reviews Section */}
          <section className="bg-white rounded-3xl p-8 border border-stone-100 shadow-sm">
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
                   <p className="text-stone-600 text-sm leading-relaxed pl-13">
                     &apos;{review.comment}&apos;
                   </p>
                 </div>
               ))}
             </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default Profile;