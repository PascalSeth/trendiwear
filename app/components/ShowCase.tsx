'use client'
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Play, Pause, Star,  Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { WishlistButton } from '@/components/ui/wishlist-button';
import { AddToCartButton } from '@/components/ui/add-to-cart-button';
import { Skeleton } from '@/components/ui/skeleton';

interface Product {
  id: string;
  name: string;
  price: number;
  currency: string;
  image: string;
  category: string;
  rating: number;
  reviews: number;
  badge?: string;
  description: string;
  seller: string;
  seller_url: string;
  seller_image: string;
  isTrendiZip: boolean;
  isPreorder: boolean;
}

interface APIProduct {
  id: string;
  name: string;
  price: number;
  currency: string;
  images: string[];
  description: string | null;
  tags: string[];
  isTrendiZip: boolean;
  categories: {
    id: string;
    name: string;
  }[];
  professional: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
    professionalProfile?: {
      businessName?: string;
      businessImage?: string;
      rating?: number;
      totalReviews?: number;
      slug?: string;
    };
  };
  _count: {
    wishlistItems: number;
    orderItems: number;
    reviews: number;
  };
  isPreorder: boolean;
  averageRating: number;
}

function LuxuryShowcase({ initialProducts }: { initialProducts?: APIProduct[] }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const [autoPlay, setAutoPlay] = useState(true);
  const autoplayRef = useRef<NodeJS.Timeout>();

  const mapApiProduct = useCallback((p: APIProduct) => {
    const isTrendiZip = p.isTrendiZip || p.professional?.role === 'SUPER_ADMIN';
    const sellerName = isTrendiZip 
      ? 'TrendiZip'
      : p.professional?.professionalProfile?.businessName || 
        `${p.professional?.firstName || ''} ${p.professional?.lastName || ''}`.trim() || 
        'Seller';
    const sellerImage = isTrendiZip
      ? '/logo3d.jpg'
      : p.professional?.professionalProfile?.businessImage || '/placeholder-avatar.jpg';
    const sellerUrl = isTrendiZip
      ? '/'
      : p.professional?.professionalProfile?.slug 
        ? `/tz/${p.professional.professionalProfile.slug}`
        : `/tz/${p.professional?.id}`;

    return {
      id: p.id,
      name: p.name,
      price: p.price,
      currency: p.currency || 'GHS',
      image: p.images?.[0] || '/placeholder.jpg',
      category: p.categories?.[0]?.name || 'Fashion',
      rating: p.averageRating || 0,
      reviews: p._count?.reviews || 0,
      description: p.description || '',
      seller: sellerName,
      seller_url: sellerUrl,
      seller_image: sellerImage,
      isTrendiZip,
      isPreorder: p.isPreorder || false,
      badge: p.isPreorder ? "Pre-order" : (p.tags?.[0] || undefined),
    };
  }, []);

  // Hydrate from server or fetch on client
  useEffect(() => {
    if (initialProducts && initialProducts.length > 0) {
      const mapped = initialProducts.map(mapApiProduct);
      setProducts(mapped);
      setLoading(false);
      return;
    }

    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/showcase-products');
        if (!response.ok) throw new Error('Failed to fetch');
        const data: APIProduct[] = await response.json();
        
        const mappedProducts = data.map(mapApiProduct);
        setProducts(mappedProducts);
      } catch (error) {
        console.error('Error fetching showcase products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [initialProducts, mapApiProduct]);

  const moveSlide = useCallback((newDirection: 'left' | 'right') => {
    if (products.length === 0) return;
    setDirection(newDirection);
    setCurrentIndex(prev => 
      newDirection === 'right' 
        ? (prev + 1) % products.length 
        : (prev - 1 + products.length) % products.length
    );
  }, [products.length]);

  useEffect(() => {
    if (!autoPlay || products.length === 0) return;
    autoplayRef.current = setInterval(() => moveSlide('right'), 6000);
    return () => clearInterval(autoplayRef.current);
  }, [autoPlay, moveSlide, products.length]);

  // Loading state
  if (loading) {
    return (
      <div className="relative pt-18 sm:pt-20 lg:pt-22 pb-10 sm:pb-12 lg:pb-14 bg-[#FAFAF9] text-stone-900 font-sans overflow-hidden border-b border-stone-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Control Bar Skeleton */}
          <div className="flex justify-between items-center pb-3.5 sm:pb-4 mb-5 sm:mb-7 border-b border-stone-200/80">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-stone-900" />
              <span className="font-mono text-[10px] sm:text-xs uppercase tracking-wider text-stone-500 font-medium">Showcase</span>
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-3 w-16 bg-stone-200/70" />
              <div className="h-3 w-px bg-stone-200" />
              <Skeleton className="h-3 w-12 bg-stone-200/70" />
            </div>
          </div>

          {/* Main Grid Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-10 items-center">
            {/* Left Image Skeleton */}
            <div className="lg:col-span-7 w-full">
              <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] lg:aspect-[4/3] max-h-[440px] bg-stone-100 rounded-2xl overflow-hidden border border-stone-200/90 shadow-2xs">
                <Skeleton className="w-full h-full rounded-none bg-stone-200/70" />
                <div className="absolute bottom-3.5 right-3.5 w-16 h-20 sm:w-18 sm:h-22 rounded-xl overflow-hidden border-2 border-white shadow-md">
                  <Skeleton className="w-full h-full rounded-none bg-stone-300/80" />
                </div>
              </div>
              <div className="flex gap-1.5 justify-center mt-3 sm:mt-3.5">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className={`h-1 rounded-full ${i === 0 ? 'w-7 bg-stone-400' : 'w-2 bg-stone-200'}`} />
                ))}
              </div>
            </div>

            {/* Right Information Skeleton */}
            <div className="lg:col-span-5 flex flex-col justify-center space-y-4 sm:space-y-4.5">
              <div>
                <Skeleton className="h-3 w-24 bg-stone-200/70 mb-2" />
                <Skeleton className="h-8 sm:h-10 w-4/5 bg-stone-200/80 mb-1" />
                <Skeleton className="h-4 w-1/2 bg-stone-200/50" />
              </div>

              <div className="flex items-baseline justify-between border-b border-stone-200/80 pb-3">
                <Skeleton className="h-7 w-28 bg-stone-200/80" />
                <Skeleton className="h-4 w-16 bg-stone-200/60" />
              </div>

              {/* Seller Card Skeleton */}
              <div className="p-3 bg-white/70 border border-stone-200/70 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Skeleton className="w-9 h-9 rounded-full bg-stone-200" />
                  <div className="space-y-1">
                    <Skeleton className="h-3.5 w-24 bg-stone-200/80" />
                    <Skeleton className="h-2.5 w-16 bg-stone-200/60" />
                  </div>
                </div>
                <Skeleton className="h-6 w-14 rounded-full bg-stone-100" />
              </div>

              {/* Action Buttons Skeleton */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <Skeleton className="h-11 rounded-xl bg-stone-200/70" />
                <Skeleton className="h-11 rounded-xl bg-stone-900/40" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (products.length === 0) {
    return (
      <div className="relative py-16 bg-[#FAFAF9] flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <h2 className="text-lg font-medium text-stone-900 mb-1">No products in showcase</h2>
          <p className="text-stone-500 text-xs">Featured products will appear here.</p>
        </div>
      </div>
    );
  }

  const product = products[currentIndex];
  const nextProduct = products[(currentIndex + 1) % products.length];

  return (
    <div className="relative pt-18 sm:pt-20 lg:pt-22 pb-10 sm:pb-12 lg:pb-14 bg-[#FAFAF9] text-stone-900 font-sans selection:bg-stone-900 selection:text-stone-50 overflow-hidden border-b border-stone-200/70">
      
      {/* Background Subtle Radial Accent */}
      <div className="absolute inset-0 pointer-events-none opacity-20" 
        style={{ backgroundImage: 'radial-gradient(#d6d3d1 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Control Bar */}
        <div className="flex justify-between items-center pb-3.5 sm:pb-4 mb-5 sm:mb-7 border-b border-stone-200/80">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-stone-900" />
            <span className="font-mono text-[10px] sm:text-xs uppercase tracking-wider text-stone-500 font-medium">Showcase</span>
          </div>

          <div className="flex items-center gap-3.5">
            <span className="font-mono text-[10px] uppercase tracking-widest text-stone-400">
              {String(currentIndex + 1).padStart(2, '0')} / {String(products.length).padStart(2, '0')}
            </span>
            <div className="h-3 w-px bg-stone-200" />
            <button
              onClick={() => setAutoPlay(!autoPlay)}
              className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-stone-500 hover:text-stone-900 transition-colors"
            >
              {autoPlay ? <Pause size={11} /> : <Play size={11} />}
              <span className="hidden sm:inline">{autoPlay ? 'Pause' : 'Auto'}</span>
            </button>
          </div>
        </div>

        {/* Main Showcase Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-10 items-center">
          
          {/* Left: Product Image Card (7 cols) */}
          <div className="lg:col-span-7 w-full">
            <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] lg:aspect-[4/3] max-h-[440px] bg-stone-100 rounded-2xl overflow-hidden border border-stone-200/90 shadow-2xs">
              <AnimatePresence mode="wait">
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, x: direction === 'right' ? 24 : -24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: direction === 'right' ? -24 : 24 }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                  className="w-full h-full relative"
                >
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width: 1024px) 100vw, 55vw"
                  />
                </motion.div>
              </AnimatePresence>

              {/* Navigation Arrows */}
              <button 
                onClick={() => moveSlide('left')} 
                className="absolute left-3.5 top-1/2 -translate-y-1/2 p-2 bg-white/70 hover:bg-white border border-stone-200/60 rounded-full backdrop-blur-xs transition-all text-stone-800 shadow-2xs z-20"
                aria-label="Previous product"
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                onClick={() => moveSlide('right')} 
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-2 bg-white/70 hover:bg-white border border-stone-200/60 rounded-full backdrop-blur-xs transition-all text-stone-800 shadow-2xs z-20"
                aria-label="Next product"
              >
                <ChevronRight size={16} />
              </button>

              {/* Badges */}
              {product.badge && (
                <div className="absolute top-3.5 left-3.5 bg-stone-900/90 text-white px-2.5 py-1 text-[9px] font-mono uppercase tracking-wider rounded-full backdrop-blur-xs border border-white/15 z-20">
                  {product.badge}
                </div>
              )}

              <WishlistButton
                productId={product.id}
                variant="overlay"
                className="absolute top-3.5 right-3.5 p-2 bg-white/70 hover:bg-white border border-stone-200/60 rounded-full backdrop-blur-xs transition-all shadow-2xs z-20"
              />

              {/* Next Product Thumbnail Preview */}
              <div 
                className="absolute bottom-3.5 right-3.5 w-16 h-20 sm:w-18 sm:h-22 rounded-xl overflow-hidden border-2 border-white shadow-md cursor-pointer group/next z-20 transition-transform duration-300 hover:scale-105"
                onClick={() => moveSlide('right')}
                title={`Next: ${nextProduct.name}`}
              >
                <div className="relative w-full h-full">
                  <Image src={nextProduct.image} alt={nextProduct.name} fill className="object-cover" sizes="72px" />
                  <div className="absolute inset-0 bg-black/25 group-hover/next:bg-black/10 transition-colors flex items-center justify-center">
                    <span className="text-[8px] font-mono text-white uppercase tracking-widest bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-xs">Next</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pagination Line / Indicator */}
            <div className="flex gap-1.5 justify-center mt-3 sm:mt-3.5">
              {products.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setDirection(idx > currentIndex ? 'right' : 'left');
                    setCurrentIndex(idx);
                  }}
                  className={`h-1 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-7 bg-stone-900' : 'w-2 bg-stone-300 hover:bg-stone-400'}`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Right: Product Information Column (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-center space-y-4 sm:space-y-4.5">
            
            {/* Category & Title */}
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-stone-500 font-medium block mb-1.5">
                {product.category}
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-medium text-stone-900 leading-tight tracking-tight">
                {product.name}
              </h2>
            </div>

            {/* Price & Rating Bar */}
            <div className="flex items-baseline justify-between border-b border-stone-200/80 pb-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-xs font-mono text-stone-500">{product.currency}</span>
                <span className="text-xl sm:text-2xl font-serif font-semibold text-stone-900">
                  {product.price.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-stone-700">
                <Star size={13} className="fill-stone-900 text-stone-900" />
                <span className="text-xs font-mono font-medium">{product.rating > 0 ? product.rating.toFixed(1) : 'New'}</span>
                <span className="text-[10px] font-mono text-stone-400">({product.reviews})</span>
              </div>
            </div>

            {/* Description */}
            {product.description && (
              <p className="text-xs sm:text-sm text-stone-600 font-light leading-relaxed line-clamp-2 sm:line-clamp-3">
                {product.description}
              </p>
            )}

            {/* Seller Compact Card */}
            <div className="rounded-xl border border-stone-200/80 bg-white/70 p-3 sm:p-3.5 flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden border border-stone-200 relative shrink-0 bg-stone-100">
                  <Image 
                    src={product.seller_image} 
                    alt={product.seller} 
                    fill
                    className="object-cover" 
                    sizes="40px"
                  />
                </div>
                <div className="min-w-0">
                  <h3 className="font-serif text-sm font-medium text-stone-900 truncate">{product.seller}</h3>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-stone-400 truncate">
                    {product.isTrendiZip ? 'Official Store' : 'Verified Artisan'}
                  </p>
                </div>
              </div>
              
              {!product.isTrendiZip && (
                <Link 
                  href={product.seller_url} 
                  className="text-[10px] font-mono uppercase tracking-wider text-stone-900 border-b border-stone-300 hover:border-stone-900 transition-colors shrink-0"
                >
                  Visit
                </Link>
              )}
            </div>

            {/* CTA Action */}
            <div className="pt-1">
              <AddToCartButton
                productId={product.id}
                variant="primary"
                className="w-full bg-stone-900 hover:bg-black text-white py-3 px-6 rounded-full font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-xs"
              />
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

export default LuxuryShowcase;