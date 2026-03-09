'use client'
import React, { useState, useEffect } from 'react';
import { Star, ArrowUpRight, Clock, BadgeCheck } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { WishlistButton } from '@/components/ui/wishlist-button';
import { AddToCartButton } from '@/components/ui/add-to-cart-button';

type ClothingItem = {
  id: string;
  name: string;
  images: string[];
  price: number;
  currency: string;
  isNew: boolean;
  sellerName: string;
  sellerProfilePicUrl: string;
  isVerified: boolean;
  isTrendiZip: boolean;
  category: string;
  rating?: number;
  views?: number;
  likes?: number;
  // Discount fields
  effectivePrice?: number;
  isDiscountActive?: boolean;
  discountAmount?: number;
  discountPercentage?: number;
  discountEndDate?: string;
};

// Countdown hook for discount timer
function useCountdown(endDate: string | null | undefined) {
  const [timeLeft, setTimeLeft] = useState('');
  
  useEffect(() => {
    if (!endDate) return;
    
    const calculateTimeLeft = () => {
      const end = new Date(endDate).getTime();
      const now = Date.now();
      const diff = end - now;
      
      if (diff <= 0) return '';
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (days > 0) return `${days}d ${hours}h`;
      if (hours > 0) return `${hours}h ${minutes}m`;
      return `${minutes}m`;
    };
    
    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 60000);
    return () => clearInterval(timer);
  }, [endDate]);
  
  return timeLeft;
}

function NewArrivals() {
  const [newArrivals, setNewArrivals] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNewArrivals = async () => {
      try {
        const response = await fetch('/api/products?sortBy=createdAt&sortOrder=desc&limit=4');
        if (response.ok) {
          const data = await response.json();
          const transformedProducts = data.products.map((product: {
            id: string;
            name: string;
            images: string[];
            price: number;
            currency: string;
            stockQuantity: number;
            isActive: boolean;
            isInStock: boolean;
            viewCount: number;
            soldCount: number;
            createdAt: string;
            tags?: string[];
            avgRating?: number;
            category: { name: string };
            collection?: { name: string };
            professional: {
              firstName: string;
              lastName: string;
              professionalProfile?: {
                businessName: string;
                businessImage: string;
                rating: number;
                totalReviews: number;
                isVerified?: boolean;
              };
            };
            _count: {
              wishlistItems: number;
              cartItems: number;
              orderItems: number;
              reviews: number;
            };
            // Discount fields from API
            effectivePrice?: number;
            isDiscountActive?: boolean;
            discountAmount?: number;
            discountPercentage?: number;
            discountEndDate?: string;
          }) => {
            const sellerName = product.professional.professionalProfile?.businessName || `${product.professional.firstName} ${product.professional.lastName}`;
            return {
            id: product.id,
            name: product.name,
            images: product.images,
            price: product.price,
            currency: product.currency || 'GHS',
            isNew: product.tags?.includes('NEW') || false,
            sellerName,
            sellerProfilePicUrl: product.professional.professionalProfile?.businessImage || '/placeholder-avatar.jpg',
            isVerified: product.professional.professionalProfile?.isVerified || false,
            isTrendiZip: sellerName === 'TrendiZip',
            category: product.category.name,
            rating: product.avgRating || 0,
            views: product.viewCount,
            likes: product._count.wishlistItems,
            // Discount fields
            effectivePrice: product.effectivePrice,
            isDiscountActive: product.isDiscountActive,
            discountAmount: product.discountAmount,
            discountPercentage: product.discountPercentage,
            discountEndDate: product.discountEndDate,
          }});
          setNewArrivals(transformedProducts);
        }
      } catch (error) {
        console.error('Failed to fetch new arrivals:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNewArrivals();
  }, []);

function ProductCard({ item, index }: { item: ClothingItem; index: number }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const timeLeft = useCountdown(item.discountEndDate);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Cycle through images on hover
  useEffect(() => {
    if (!isHovered || item.images.length <= 1 || isMobile) return;
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % item.images.length);
    }, 1500);
    return () => clearInterval(interval);
  }, [isHovered, item.images.length, isMobile]);

  // Reset image index when not hovered
  useEffect(() => {
    if (!isHovered) setCurrentImageIndex(0);
  }, [isHovered]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className={`group relative w-full cursor-pointer bg-white rounded-2xl overflow-hidden shadow-lg transition-all duration-500 ${!isMobile && 'hover:shadow-xl hover:scale-[1.02]'}`}
      onMouseEnter={() => !isMobile && setIsHovered(true)}
      onMouseLeave={() => !isMobile && setIsHovered(false)}
    >
      {/* Image Container - Full Bleed */}
      <div className="relative aspect-[3/4] overflow-hidden bg-stone-100 rounded-t-2xl">

        {/* Images with crossfade */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentImageIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            <motion.img
              src={item.images[currentImageIndex] || "/placeholder-product.jpg"}
              alt={item.name}
              className="w-full h-full object-cover"
              animate={{ scale: !isMobile && isHovered ? 1.05 : 1 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            />
          </motion.div>
        </AnimatePresence>

        {/* Image Indicators */}
        {item.images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 z-10">
            {item.images.slice(0, 4).map((_, idx) => (
              <div
                key={idx}
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-all duration-300",
                  idx === currentImageIndex ? "bg-white w-4" : "bg-white/50"
                )}
              />
            ))}
          </div>
        )}

        {/* Overlay Gradient */}
        <div className={cn(
          "absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-500",
          (isMobile || isHovered) && "opacity-100"
        )} />

        {/* Seller Info Overlay - Top Left */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
          <div className="relative">
            <Image
              src={item.sellerProfilePicUrl}
              alt={item.sellerName}
              width={24}
              height={24}
              className="rounded-full border border-white/50"
            />
            {(item.isTrendiZip || item.isVerified) && (
              <div className={`absolute -bottom-0.5 -right-0.5 rounded-full ${item.isTrendiZip ? 'bg-blue-500' : 'bg-emerald-500'}`}>
                <BadgeCheck size={10} className="text-white" />
              </div>
            )}
          </div>
          <div className="text-white text-xs font-medium drop-shadow-lg">
            {item.sellerName}
          </div>
        </div>

        {/* Top Badges - Discount & New */}
        <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
           {item.isDiscountActive && (
             <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 flex items-center gap-1">
               {item.discountPercentage ? `${item.discountPercentage}% OFF` : 'SALE'}
               {timeLeft && (
                 <span className="flex items-center gap-0.5 ml-1 opacity-90">
                   <Clock size={8} />
                   {timeLeft}
                 </span>
               )}
             </span>
           )}
           {item.isNew && (
             <span className="bg-white/90 backdrop-blur text-black text-[10px] font-bold tracking-widest px-2 py-1 uppercase">
               New Arrival
             </span>
           )}
        </div>

        {/* Floating Actions (Replaces the old centered buttons) */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: isMobile || isHovered ? 0 : 20, opacity: isMobile || isHovered ? 1 : 0 }}
          transition={{ duration: 0.4 }}
          className="absolute bottom-6 left-6 right-6 flex justify-between items-end z-20"
        >
          <div className="flex flex-col gap-2">
             <Link href={`/shopping/products/${item.id}`}>
                <button className="bg-white text-black px-6 py-3 rounded-full font-medium text-sm hover:bg-stone-200 transition-colors flex items-center gap-2">
                  View Details <ArrowUpRight size={16} />
                </button>
             </Link>
          </div>

          <div className="flex flex-col gap-3">
             <div className="bg-white/20 backdrop-blur-md p-3 rounded-full text-white hover:bg-white hover:text-black transition-all">
                <WishlistButton productId={item.id} variant="default" size="sm" />
             </div>
             <div className="bg-white/20 backdrop-blur-md p-3 rounded-full text-white hover:bg-white hover:text-black transition-all">
                <AddToCartButton productId={item.id} variant="default" size="sm" />
             </div>
          </div>
        </motion.div>

      </div>

      {/* Product Info - Editorial Layout */}
      <div className={`mt-6 flex justify-between items-start border-b border-stone-200 pb-4 px-6 ${!isMobile && 'group-hover:border-black'} transition-colors`}>
        <div>
          <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">{item.category}</p>
          <h3 className={`text-xl font-serif font-medium text-stone-900 leading-tight ${!isMobile && 'group-hover:italic'} transition-all`}>
            {item.name}
          </h3>
        </div>
        <div className="text-right">
          {item.isDiscountActive ? (
            <>
              <p className="text-sm text-stone-400 line-through">{item.currency} {item.price.toFixed(2)}</p>
              <p className="text-lg font-medium text-red-600">{item.currency} {(item.effectivePrice || item.price).toFixed(2)}</p>
            </>
          ) : (
            <p className="text-lg font-medium text-stone-900">{item.currency} {item.price.toFixed(2)}</p>
          )}
          <div className="flex items-center justify-end gap-1 mt-1 text-xs text-stone-400">
             <Star size={10} className="fill-current text-stone-400" />
             {item.rating && item.rating > 0 ? item.rating.toFixed(1) : 'New'}
          </div>
        </div>
      </div>

      {/* Hover Effect Ring */}
      <div className={`absolute inset-0 rounded-2xl border-2 border-blue-500/30 opacity-0 ${!isMobile && 'group-hover:opacity-100'} transition-all duration-300 scale-95 ${!isMobile && 'group-hover:scale-100'}`}></div>
    </motion.div>
  );
}

  if (loading) {
    return (
      <div className="bg-white py-16 px-4 lg:px-8">
        <div className="relative z-10 max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-4 animate-fade-in-up">
              New Arrivals
            </h2>
          </div>

          {/* Loading Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="bg-white rounded-2xl overflow-hidden shadow-lg animate-pulse">
                <div className="h-64 lg:h-72 bg-gray-200"></div>
                <div className="p-4">
                  <div className="h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                  <div className="flex justify-between items-center">
                    <div className="h-5 bg-gray-200 rounded w-16"></div>
                    <div className="h-4 bg-gray-200 rounded w-8"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white py-16 px-4 lg:px-8">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 rounded-full bg-gradient-to-r from-pink-400/10 to-purple-500/10 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-24 h-24 rounded-full bg-gradient-to-r from-blue-400/10 to-cyan-500/10 animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-40 left-1/4 w-20 h-20 rounded-full bg-gradient-to-r from-emerald-400/10 to-teal-500/10 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-4 animate-fade-in-up">
            New Arrivals
          </h2>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {newArrivals.map((item, index) => (
            <ProductCard key={item.id} item={item} index={index} />
          ))}
        </div>

        {/* Bottom Section */}
        <div className="text-center mt-12">
          <div className="flex items-center justify-center gap-6 text-sm text-slate-600 animate-fade-in-up" style={{ animationDelay: '800ms' }}>
            <div className="text-center">
              <div className="text-xl font-bold text-slate-900 mb-1">{newArrivals.length}+</div>
              <div>New Items</div>
            </div>
            <div className="w-px h-10 bg-slate-300"></div>
            <div className="text-center">
              <div className="text-xl font-bold text-slate-900 mb-1">5★</div>
              <div>Top Rated</div>
            </div>
            <div className="w-px h-10 bg-slate-300"></div>
            <div className="text-center">
              <div className="text-xl font-bold text-slate-900 mb-1">100%</div>
              <div>Authentic</div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
          opacity: 0;
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}

export default NewArrivals;