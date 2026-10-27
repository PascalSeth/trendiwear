'use client';

import React, { useState, useEffect } from 'react';
import { Star, ArrowUpRight, Clock, BadgeCheck } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { WishlistButton } from '@/components/ui/wishlist-button';
import { AddToCartButton } from '@/components/ui/add-to-cart-button';
import { QuickAddModal } from '@/components/common/QuickAddModal';

interface ProductCardProps {
  item: {
    id: string;
    slug?: string;
    name: string;
    images: string[];
    price: number;
    currency: string;
    categories?: { name: string; slug: string }[];
    category?: string | { name: string; slug: string };
    isNew?: boolean;
    isPreorder?: boolean;
    estimatedDelivery?: number;
    stockQuantity: number;
    professional: {
      firstName: string;
      lastName: string;
      professionalProfile?: {
        businessName?: string;
        businessImage?: string;
        rating?: number;
        isVerified?: boolean;
      };
    };
    // Discount fields
    effectivePrice?: number;
    isDiscountActive?: boolean;
    discountAmount?: number;
    discountPercentage?: number | null;
    discountEndDate?: string | null;
    sizes?: string[];
    colors?: string[];
    createdAt?: string | Date;
  };
  index: number;
  hrefOverride?: string;
}

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

export const ProductCard = ({ item, index, hrefOverride }: ProductCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const timeLeft = useCountdown(item.discountEndDate);

  const cardRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Click outside listener for mobile
    const handleClickOutside = (e: MouseEvent) => {
      if (isMobile && cardRef.current && !cardRef.current.contains(e.target as Node)) {
        setIsHovered(false);
      }
    };
    
    if (isMobile) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobile]);

  // Image cycling on hover
  useEffect(() => {
    if (!isHovered || item.images.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % item.images.length);
    }, 1500);
    return () => clearInterval(interval);
  }, [isHovered, item.images.length]);

  useEffect(() => {
    if (!isHovered) setCurrentImageIndex(0);
  }, [isHovered]);

  const sellerName = item.professional.professionalProfile?.businessName || `${item.professional.firstName} ${item.professional.lastName}`;
  const sellerProfilePicUrl = item.professional.professionalProfile?.businessImage || '/placeholder-avatar.jpg';
  const isVerified = item.professional.professionalProfile?.isVerified || false;
  const isTrendiZip = sellerName === 'TrendiZip';
  const categoryName = item.categories?.[0]?.name || (typeof item.category === 'string' ? item.category : item.category?.name) || 'Fashion';
  const hasVariations = (item.sizes?.length || 0) > 0 || (item.colors?.length || 0) > 0;
  
  // Calculate if the product is 'NEW' (less than 7 days old)
  const isActuallyNew = item.createdAt ? (Date.now() - new Date(item.createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000 : item.isNew;

  const productHref = hrefOverride || `/shopping/products/${item.slug || item.id}`;

  return (
    <>
      <motion.div
        ref={cardRef}
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-20px" }}
        transition={{ duration: 0.4, delay: index * 0.04 }}
        className="group relative w-full bg-white rounded-xl sm:rounded-2xl overflow-hidden border border-stone-200/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_10px_24px_-4px_rgba(0,0,0,0.1)] hover:-translate-y-1 hover:border-stone-300 transition-all duration-300 flex flex-col"
        onMouseEnter={() => !isMobile && setIsHovered(true)}
        onMouseLeave={() => !isMobile && setIsHovered(false)}
        onClick={() => isMobile && setIsHovered(!isHovered)}
      >
        {/* Media Content */}
        <div className="relative aspect-[4/4.7] overflow-hidden bg-stone-100">
          <Link href={productHref} className="block w-full h-full relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentImageIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="absolute inset-0"
              >
                <Image
                  src={item.images[currentImageIndex] || "/placeholder-product.jpg"}
                  alt={item.name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
              </motion.div>
            </AnimatePresence>

            {/* Subtle Vignette on Hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          </Link>

          {/* Top Badges */}
          <div className="absolute top-2 left-2 z-20 flex flex-wrap gap-1 pointer-events-none">
            {item.isPreorder && (
              <span className="bg-stone-900/85 backdrop-blur-md text-white text-[8px] sm:text-[8.5px] font-mono uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded-full border border-white/15 shadow-xs">
                Pre-order
              </span>
            )}
            {isActuallyNew && !item.isPreorder && (
              <span className="bg-amber-500/95 backdrop-blur-md text-white text-[8px] sm:text-[8.5px] font-mono uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded-full border border-white/15 shadow-xs">
                New
              </span>
            )}
            {item.isDiscountActive && (
              <span className="bg-rose-500/95 backdrop-blur-md text-white text-[8px] sm:text-[8.5px] font-mono font-medium px-1.5 sm:px-2 py-0.5 rounded-full border border-white/15 shadow-xs">
                {item.discountPercentage ? `${Math.round(item.discountPercentage)}% OFF` : 'Sale'}
              </span>
            )}
          </div>

          {/* Top-Right Wishlist Button */}
          <div 
            className="absolute top-2 right-2 z-20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white/85 hover:bg-white backdrop-blur-md p-1 rounded-full shadow-xs transition-transform duration-200 hover:scale-110 active:scale-95 border border-stone-200/60 flex items-center justify-center">
              <WishlistButton productId={item.id} variant="default" size="sm" />
            </div>
          </div>

          {/* Quick-Add Button Overlay (Floating on hover) */}
          <div 
            className="absolute bottom-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white/95 hover:bg-white backdrop-blur-md p-1 rounded-full shadow-md transition-transform duration-200 hover:scale-110 active:scale-95 border border-stone-200/80 flex items-center justify-center">
              <AddToCartButton 
                productId={item.id} 
                variant="default" 
                size="sm" 
                isOutOfStock={item.stockQuantity === 0 && !item.isPreorder} 
                hasVariations={hasVariations}
                onShowSelection={() => setIsQuickAddOpen(true)}
              />
            </div>
          </div>

          {/* Subtle Stock indicator on bottom-left of image on hover */}
          <div className="absolute bottom-2 left-2 z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
            <span className="text-[7.5px] sm:text-[8px] font-mono uppercase tracking-wider text-white/95 bg-stone-900/70 backdrop-blur-md px-1.5 py-0.5 rounded-full border border-white/10">
              {item.isPreorder ? "Pre-order" : item.stockQuantity > 0 ? "In Stock" : "Low Stock"}
            </span>
          </div>
        </div>

        {/* Info Content */}
        <div className="p-2.5 sm:p-3 flex flex-col flex-1 justify-between gap-1.5">
          <div>
            {/* Category & Designer Header */}
            <div className="flex items-center justify-between text-[8.5px] sm:text-[9px] font-mono text-stone-400 uppercase tracking-wider mb-0.5">
              <span className="truncate max-w-[55%] text-stone-500 font-medium">{categoryName}</span>
              <span className="text-stone-400 truncate max-w-[42%] text-right">{sellerName}</span>
            </div>

            {/* Product Title */}
            <Link href={productHref} className="block group/title">
              <h3 className="text-xs sm:text-[13px] font-serif font-medium text-stone-900 leading-snug group-hover/title:text-stone-600 line-clamp-1 transition-colors">
                {item.name}
              </h3>
            </Link>
          </div>

          {/* Price & Rating Row */}
          <div className="flex items-baseline justify-between pt-1.5 border-t border-stone-100">
            <div className="flex items-baseline gap-1">
              {item.isDiscountActive ? (
                <>
                  <span className="text-xs sm:text-[13px] font-semibold font-mono text-rose-600">
                    {item.currency}{(item.effectivePrice || item.price).toFixed(2)}
                  </span>
                  <span className="text-[9.5px] font-mono text-stone-400 line-through">
                    {item.currency}{item.price.toFixed(2)}
                  </span>
                </>
              ) : (
                <span className="text-xs sm:text-[13px] font-semibold font-mono text-stone-900">
                  {item.currency}{item.price.toFixed(2)}
                </span>
              )}
            </div>

            <div className="flex items-center gap-0.5 text-[9.5px] sm:text-[10px] font-mono text-stone-500 font-medium">
              <Star size={9} className="fill-stone-900 text-stone-900" />
              <span>{item.professional.professionalProfile?.rating ? Number(item.professional.professionalProfile.rating).toFixed(1) : '4.9'}</span>
            </div>
          </div>
        </div>
      </motion.div>
      <QuickAddModal 
        isOpen={isQuickAddOpen} 
        onClose={() => setIsQuickAddOpen(false)} 
        product={item} 
      />
    </>
  );
};
