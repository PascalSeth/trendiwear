'use client'
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Play, Pause, Star,  Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { WishlistButton } from '@/components/ui/wishlist-button';
import { AddToCartButton } from '@/components/ui/add-to-cart-button';

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
  category: {
    id: string;
    name: string;
  };
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
        'Artisan';
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
      category: p.category?.name || 'Fashion',
      rating: p.averageRating || 0,
      reviews: p._count?.reviews || 0,
      badge: p.tags?.[0] || undefined,
      description: p.description || '',
      seller: sellerName,
      seller_url: sellerUrl,
      seller_image: sellerImage,
      isTrendiZip,
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
      <div className="relative min-h-screen pt-20 bg-[#FAFAF9] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
          <span className="font-mono text-xs uppercase tracking-widest text-stone-500">Loading Showcase</span>
        </div>
      </div>
    );
  }

  // Empty state
  if (products.length === 0) {
    return (
      <div className="relative min-h-screen pt-20 bg-[#FAFAF9] flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <span className="font-mono text-[10px] uppercase tracking-widest text-stone-400 block mb-4">Showcase</span>
          <h2 className="text-2xl font-serif text-stone-900 mb-2">Coming Soon</h2>
          <p className="text-stone-500 text-sm">Curated pieces from our finest artisans will appear here.</p>
        </div>
      </div>
    );
  }

  const product = products[currentIndex];
  const nextProduct = products[(currentIndex + 1) % products.length];

  return (
    <div className="relative min-h-screen pt-20 bg-[#FAFAF9] text-stone-900 font-sans selection:bg-stone-900 selection:text-stone-50 overflow-hidden">
      
      {/* Header (Fixed) */}
      <header className="sticky  left-0 right-0 z-10 px-6 py-3 flex justify-between items-center bg-[#FAFAF9]/80 backdrop-blur-sm border-b border-stone-200/50">
        <div className="flex items-center gap-2">
          <div className="w-1 h-1 bg-stone-900 rounded-full"></div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-stone-500">Curated</span>
        </div>
        <button
          onClick={() => setAutoPlay(!autoPlay)}
          className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-stone-600 hover:text-stone-900 transition-colors"
        >
          {autoPlay ? <Pause size={12} /> : <Play size={12} />}
          <span className="hidden sm:inline">Showcase</span>
        </button>
      </header>

      {/* --- MOBILE & TABLET VIEW: OVERLAY (Perfect as requested) --- */}
      <div className="lg:hidden relative h-screen w-full">
        {/* Full Screen Background Image */}
        <div className="absolute inset-0 z-0 bg-stone-100">
           <AnimatePresence mode="wait">
              <motion.div
                key={product.id}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="w-full h-full relative"
              >
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover"
                  priority
                  sizes="100vw"
                />
              </motion.div>
            </AnimatePresence>
        </div>

        {/* Floating Controls */}
        <button onClick={() => moveSlide('left')} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 hover:bg-white/40 backdrop-blur-md border border-white/30 rounded-full transition-all text-white z-40">
           <ChevronLeft size={18} />
        </button>
        <button onClick={() => moveSlide('right')} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 hover:bg-white/40 backdrop-blur-md border border-white/30 rounded-full transition-all text-white z-40">
           <ChevronRight size={18} />
        </button>
        
        {/* Badge & Wishlist */}
        {product.badge && (
           <div className="absolute top-20 left-6 bg-stone-900 text-white px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest border border-stone-800 z-40">
              {product.badge}
           </div>
        )}
        <WishlistButton
           productId={product.id}
           variant="overlay"
           className="absolute top-20 right-6 p-2 bg-white/20 hover:bg-white/40 backdrop-blur-md border border-white/30 rounded-full transition-all z-40"
        />

        {/* BOTTOM OVERLAY SHEET (Info) */}
        <div className="absolute bottom-0 inset-x-0 z-50 bg-gradient-to-t from-[#FAFAF9] via-[#FAFAF9]/95 to-transparent pt-8 pb-12 px-6 animate-fade-in-up">
           <div className="max-w-3xl mx-auto space-y-6">
              <div className="flex justify-between items-start">
                 <div>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-stone-500 block mb-1">{product.category}</span>
                    <h1 className="text-3xl sm:text-4xl font-serif text-stone-900 leading-none">{product.name}</h1>
                 </div>
                 <div className="text-right">
                    <span className="text-2xl sm:text-3xl font-serif text-stone-900 block">{product.currency} {product.price.toFixed(2)}</span>
                    <div className="flex items-center gap-1 justify-end text-stone-600 mt-1">
                       <Star size={12} className="fill-current" />
                       <span className="text-xs font-mono">({product.reviews})</span>
                    </div>
                 </div>
              </div>
            
              <AddToCartButton
                 productId={product.id}
                 variant="primary"
                 className="w-full bg-stone-900 text-stone-50 py-4 font-mono text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-stone-800 transition-colors"
              />

              <div className="flex justify-between items-center border-t border-stone-100 pt-4">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-stone-200 rounded-full overflow-hidden border border-stone-200 relative">
                       <Image src={product.seller_image} alt={product.seller} fill className="object-cover" sizes="40px" />
                    </div>
                    <div className="overflow-hidden">
                       <p className="font-serif text-sm text-stone-900 leading-none truncate">{product.seller}</p>
                       <p className="text-[10px] font-mono uppercase tracking-widest text-stone-500">{product.isTrendiZip ? 'Official Store' : 'Artisan'}</p>
                    </div>
                 </div>
                 {!product.isTrendiZip && (
                   <Link href={product.seller_url} className="text-xs font-mono uppercase tracking-widest text-stone-900 border-b border-stone-300">
                      Visit
                   </Link>
                 )}
              </div>
           </div>
        </div>
      </div>

      {/* --- DESKTOP VIEW: SIDE-BY-SIDE (Constrained Size) --- */}
      <div className="hidden lg:grid lg:grid-cols-12 max-w-5xl mx-auto gap-10 items-center min-h-[80vh] py-3 px-8">
         
         {/* Left Column: Image (7 cols) */}
         <div className="lg:col-span-7 w-full">
            <div className="relative aspect-[4/4] bg-stone-100 overflow-hidden border border-stone-200">
               
              {/* Main Image */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, x: direction === 'right' ? 30 : -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: direction === 'right' ? -30 : 30 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="w-full h-full relative"
                >
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width: 1024px) 100vw, 60vw"
                  />
                </motion.div>
              </AnimatePresence>

              {/* Navigation */}
              <button onClick={() => moveSlide('left')} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/40 hover:bg-white border border-white/20 rounded-full backdrop-blur-md transition-all text-stone-800">
                 <ChevronLeft size={18} />
              </button>
              <button onClick={() => moveSlide('right')} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/40 hover:bg-white border border-white/20 rounded-full backdrop-blur-md transition-all text-stone-800">
                 <ChevronRight size={18} />
              </button>

              {product.badge && (
                 <div className="absolute top-4 left-4 bg-stone-900 text-white px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest border border-stone-800">
                    {product.badge}
                 </div>
              )}
              <WishlistButton
                 productId={product.id}
                 variant="overlay"
                 className="absolute top-4 right-4 p-2 bg-white/40 hover:bg-white border border-white/20 rounded-full backdrop-blur-md transition-all"
              />

              {/* Next Preview */}
              <div 
                 className="absolute bottom-4 right-4 w-24 h-32 overflow-hidden border border-white/50 shadow-lg cursor-pointer"
                 onClick={() => moveSlide('right')}
              >
                 <div className="relative w-full h-full">
                   <Image src={nextProduct.image} alt="Next" fill className="object-cover opacity-80" sizes="96px" />
                 </div>
              </div>
            </div>

            {/* Pagination Dots */}
            <div className="flex gap-2 justify-center mt-4">
              {products.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setDirection(idx > currentIndex ? 'right' : 'left');
                    setCurrentIndex(idx);
                  }}
                  className={`h-px transition-all ${idx === currentIndex ? 'w-8 bg-stone-900' : 'w-2 bg-stone-300'}`}
                />
              ))}
            </div>
         </div>
         
         {/* Right Column: Info (5 cols) */}
         <div className="lg:col-span-5 h-full flex flex-col justify-center space-y-8">
            
            {/* Header */}
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-stone-500 block mb-2">
                {product.category}
              </span>
              <h1 className="text-4xl lg:text-5xl font-serif text-stone-900 leading-[0.95]">
                {product.name}
              </h1>
            </div>

            {/* Price & Rating */}
            <div className="flex items-end justify-between border-b border-stone-200 pb-4">
              <div>
                <span className="block font-mono text-[10px] uppercase tracking-widest text-stone-500 mb-2">Price</span>
                <span className="text-3xl font-serif text-stone-900">
                  {product.currency} {product.price.toFixed(2)}
                </span>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 justify-end text-stone-900 mb-1">
                  <Star size={16} className="fill-current" />
                  <span className="font-medium">{product.rating > 0 ? product.rating.toFixed(1) : 'New'}</span>
                </div>
                <span className="text-xs font-mono text-stone-500">({product.reviews} reviews)</span>
              </div>
            </div>

            {/* Description */}
            <p className="text-base text-stone-600 font-light leading-relaxed">
              {product.description}
            </p>

            {/* Seller Card */}
            <div className="border border-stone-200 p-6">
              <div className="flex items-center justify-between mb-4">
                 <span className="font-mono text-[10px] uppercase tracking-widest text-stone-400">{product.isTrendiZip ? 'Official Store' : 'The Artisan'}</span>
                 {!product.isTrendiZip && (
                   <Link 
                      href={product.seller_url} 
                      className="text-xs font-mono uppercase tracking-widest text-stone-900 border-b border-transparent hover:border-stone-900 transition-colors"
                    >
                      Visit
                    </Link>
                 )}
              </div>
              <div className="flex items-center gap-4">
                 <div className="w-14 h-14 bg-stone-100 overflow-hidden border border-stone-200 relative">
                    <Image 
                      src={product.seller_image} 
                      alt={product.seller} 
                      fill
                      className="object-cover" 
                      sizes="56px"
                    />
                 </div>
                 <div>
                    <h3 className="font-serif text-xl text-stone-900">{product.seller}</h3>
                    <p className="text-xs font-mono uppercase tracking-widest text-stone-500">{product.isTrendiZip ? 'TrendiZip Collection' : 'Verified Seller'}</p>
                 </div>
              </div>
            </div>

            {/* CTA Button */}
            <AddToCartButton
              productId={product.id}
              variant="primary"
              className="w-full bg-stone-900 text-stone-50 py-5 font-mono text-sm uppercase tracking-widest hover:bg-stone-800 transition-colors flex items-center justify-center gap-3"
            />

            {/* Footer Stats */}
            <div className="text-center pt-6">
               <p className="font-mono text-[10px] uppercase tracking-widest text-stone-400">
                 {String(currentIndex + 1).padStart(2, '0')} / {String(products.length).padStart(2, '0')}
               </p>
            </div>

         </div>
      </div>
    </div>
  );
}

export default LuxuryShowcase;