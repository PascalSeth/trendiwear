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
    name: string;
    images: string[];
    price: number;
    currency: string;
    category: string | { name: string; slug: string };
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

export const ProductCard = ({ item, index }: ProductCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const timeLeft = useCountdown(item.discountEndDate);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Image cycling on hover
  useEffect(() => {
    if (!isHovered || item.images.length <= 1 || isMobile) return;
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % item.images.length);
    }, 1500);
    return () => clearInterval(interval);
  }, [isHovered, item.images.length, isMobile]);

  useEffect(() => {
    if (!isHovered) setCurrentImageIndex(0);
  }, [isHovered]);

  const sellerName = item.professional.professionalProfile?.businessName || `${item.professional.firstName} ${item.professional.lastName}`;
  const sellerProfilePicUrl = item.professional.professionalProfile?.businessImage || '/placeholder-avatar.jpg';
  const isVerified = item.professional.professionalProfile?.isVerified || false;
  const isTrendiZip = sellerName === 'TrendiZip';
  const categoryName = typeof item.category === 'string' ? item.category : item.category.name;
  const hasVariations = (item.sizes?.length || 0) > 0 || (item.colors?.length || 0) > 0;
  
  // Calculate if the product is 'NEW' (less than 7 days old)
  const isActuallyNew = item.createdAt ? (Date.now() - new Date(item.createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000 : item.isNew;

  return (
    <>
      <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="group relative w-full cursor-pointer bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-700 hover:scale-[1.02]"
      onMouseEnter={() => !isMobile && setIsHovered(true)}
      onMouseLeave={() => !isMobile && setIsHovered(false)}
    >
      {/* Media Content */}
      <div className="relative aspect-[4/5] overflow-hidden bg-stone-50 rounded-t-xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentImageIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            <Image
              src={item.images[currentImageIndex] || "/placeholder-product.jpg"}
              alt={item.name}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110"
            />
          </motion.div>
        </AnimatePresence>

        {/* Status Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Pre-order Badge */}
        {item.isPreorder && (
          <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
            <div className="bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
              <span className="text-[9px] font-black text-white uppercase tracking-widest">Pre-order</span>
            </div>
            {item.estimatedDelivery && (
              <div className="bg-blue-500/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-2 translate-x-1">
                <Clock size={10} className="text-white" />
                <span className="text-[8px] font-black text-white uppercase">{item.estimatedDelivery} Days Arrival</span>
              </div>
            )}
          </div>
        )}

        {/* NEW Badge */}
        {isActuallyNew && !item.isPreorder && (
          <div className="absolute top-4 left-4 z-20">
            <div className="bg-[#FFA126] text-white px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest">NEW</span>
            </div>
          </div>
        )}

        {/* Discount Badge */}
        {item.isDiscountActive && (
          <div className="absolute top-4 right-4 z-20">
            <div className="bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded-md shadow-lg shadow-red-500/20 flex items-center gap-1.5">
              {item.discountPercentage ? `${Math.round(item.discountPercentage)}% OFF` : 'SALE'}
              {timeLeft && (
                <div className="flex items-center gap-0.5 border-l border-white/30 pl-1.5 ml-1.5">
                  <Clock size={8} />
                  <span>{timeLeft}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Seller Info */}
        <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
           <div className="relative">
              <div className="w-7 h-7 rounded-full overflow-hidden border-2 border-white/80 shadow-lg">
                <Image
                  src={sellerProfilePicUrl}
                  alt={sellerName}
                  width={28}
                  height={28}
                  className="w-full h-full object-cover"
                />
              </div>
              {(isTrendiZip || isVerified) && (
                <div className={`absolute -bottom-0.5 -right-0.5 rounded-full p-0.5 ${isTrendiZip ? 'bg-blue-600' : 'bg-emerald-600'}`}>
                  <BadgeCheck size={8} className="text-white" />
                </div>
              )}
           </div>
           <span className="text-white text-[10px] font-black uppercase tracking-widest drop-shadow-md">{sellerName}</span>
        </div>

        {/* Hover Actions */}
        <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-2 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-500 delay-75">
          <div className="bg-white/90 backdrop-blur-sm p-2 rounded-full hover:bg-black hover:text-white transition-colors">
            <WishlistButton productId={item.id} variant="default" size="sm" />
          </div>
          <div className="bg-white/90 backdrop-blur-sm p-2 rounded-full hover:bg-black hover:text-white transition-colors">
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
      </div>

      {/* Info & Actions */}
      <div className="p-3 sm:p-4 space-y-3">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-[8px] font-black text-stone-300 uppercase tracking-widest mb-1">{categoryName}</p>
            <h3 className="text-sm font-serif font-medium text-stone-900 group-hover:italic transition-all duration-500 line-clamp-1">
               {item.name}
            </h3>
          </div>
          <div className="text-right">
            {item.isDiscountActive ? (
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-stone-400 line-through leading-none mb-1">{item.currency}{item.price.toFixed(2)}</span>
                <span className="text-sm font-black text-rose-600 tracking-tighter leading-none">{item.currency}{(item.effectivePrice || item.price).toFixed(2)}</span>
              </div>
            ) : (
              <span className="text-sm font-black text-stone-900 tracking-tighter leading-none">{item.currency}{item.price.toFixed(2)}</span>
            )}
          </div>
        </div>

        {/* Status & Social */}
        <div className="flex items-center justify-between pt-3 border-t border-stone-50">
           <div className="flex items-center gap-2">
              <div className={cn("w-1.5 h-1.5 rounded-full", item.stockQuantity > 0 ? "bg-emerald-400" : "bg-stone-200")} />
              <span className="text-[8px] font-black text-stone-400 uppercase tracking-[0.2em]">
                {item.isPreorder ? "Pre-order" : item.stockQuantity > 0 ? "Available" : "Stock low"}
              </span>
           </div>
           <div className="flex items-center gap-1 text-[9px] font-black text-stone-900">
              <Star size={9} className="fill-stone-900" />
              <span>{item.professional.professionalProfile?.rating || '4.9'}</span>
           </div>
        </div>

        {/* View Link */}
        <Link href={`/shopping/products/${item.id}`} className="block">
          <button className="w-full py-2.5 rounded-lg border border-stone-100 text-[9px] font-black uppercase tracking-[0.2em] hover:bg-stone-900 hover:text-white transition-all duration-700 flex items-center justify-center gap-2 group/btn">
             Explore <ArrowUpRight size={12} className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
          </button>
        </Link>
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
