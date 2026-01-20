'use client'
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Heart, ChevronLeft, ChevronRight, Play, Pause, ShoppingBag, Star, ArrowUpRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  rating: number;
  reviews: number;
  badge?: string;
  description: string;
  seller: string;
  seller_url: string;
  seller_image: string;
}

// --- Data (Preserved) ---
const PRODUCTS: Product[] = [
  {
    id: '1',
    name: "Cashmere",
    price: 299,
    image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=1200&h=1600&auto=format&fit=crop&q=80",
    category: "Knitwear",
    rating: 4.9,
    reviews: 1247,
    badge: "Bestseller",
    description: "Mongolian highlands",
    seller: "Luxe Knitwear Co.",
    seller_url: "https://luxe-knitwear.example.com",
    seller_image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&auto=format&fit=crop&q=80"
  },
  {
    id: '2',
    name: "Silk Midi",
    price: 450,
    image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=1200&h=1600&auto=format&fit=crop&q=80",
    category: "Dresses",
    rating: 4.8,
    reviews: 892,
    badge: "New",
    description: "Flowing elegance",
    seller: "Atelier Élegance",
    seller_url: "https://atelier-elegance.example.com",
    seller_image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&auto=format&fit=crop&q=80"
  },
  {
    id: '3',
    name: "Leather",
    price: 599,
    image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=1200&h=1600&auto=format&fit=crop&q=80",
    category: "Outerwear",
    rating: 4.9,
    reviews: 2156,
    badge: "Limited",
    description: "Italian craft",
    seller: "Bellafiora Milano",
    seller_url: "https://bellafiora-milano.example.com",
    seller_image: "https://images.unsplash.com/photo-1517841905240-8cc0dbb12e97?w=150&h=150&auto=format&fit=crop&q=80"
  },
  {
    id: '4',
    name: "Silk Blouse",
    price: 199,
    image: "https://i.pinimg.com/736x/a3/bf/76/a3bf764e76f451d454006928ffeb49a2.jpg",
    category: "Tops",
    rating: 4.7,
    reviews: 543,
    badge: "Trending",
    description: "Italian blend",
    seller: "Silkwood Studios",
    seller_url: "https://silkwood-studios.example.com",
    seller_image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&auto=format&fit=crop&q=80"
  }
];

function LuxuryShowcase() {
  // --- Logic (Preserved) ---
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const [autoPlay, setAutoPlay] = useState(true);
  const autoplayRef = useRef<NodeJS.Timeout>();

  const moveSlide = useCallback((newDirection: 'left' | 'right') => {
    setDirection(newDirection);
    setCurrentIndex(prev => 
      newDirection === 'right' 
        ? (prev + 1) % PRODUCTS.length 
        : (prev - 1 + PRODUCTS.length) % PRODUCTS.length
    );
  }, []);

  useEffect(() => {
    if (!autoPlay) return;
    autoplayRef.current = setInterval(() => moveSlide('right'), 6000);
    return () => clearInterval(autoplayRef.current);
  }, [autoPlay, moveSlide]);

  const product = PRODUCTS[currentIndex];
  const nextProduct = PRODUCTS[(currentIndex + 1) % PRODUCTS.length];

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
              <motion.img
                key={product.id}
                src={product.image}
                alt={product.name}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="w-full h-full object-cover"
              />
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
        <button
           onClick={() => setIsWishlisted(!isWishlisted)}
           className="absolute top-20 right-6 p-2 bg-white/20 hover:bg-white/40 backdrop-blur-md border border-white/30 rounded-full transition-all text-white z-40"
        >
           <Heart size={16} className={isWishlisted ? "fill-current text-red-500" : "text-white"} />
        </button>

        {/* BOTTOM OVERLAY SHEET (Info) */}
        <div className="absolute bottom-0 inset-x-0 z-50 bg-gradient-to-t from-[#FAFAF9] via-[#FAFAF9]/95 to-transparent pt-8 pb-12 px-6 animate-fade-in-up">
           <div className="max-w-3xl mx-auto space-y-6">
              <div className="flex justify-between items-start">
                 <div>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-stone-500 block mb-1">{product.category}</span>
                    <h1 className="text-3xl sm:text-4xl font-serif text-stone-900 leading-none">{product.name}</h1>
                 </div>
                 <div className="text-right">
                    <span className="text-2xl sm:text-3xl font-serif text-stone-900 block">${product.price}</span>
                    <div className="flex items-center gap-1 justify-end text-stone-600 mt-1">
                       <Star size={12} className="fill-current" />
                       <span className="text-xs font-mono">({product.reviews})</span>
                    </div>
                 </div>
              </div>
            
              <button className="w-full bg-stone-900 text-stone-50 py-4 font-mono text-xs uppercase tracking-widest flex items-center justify-center gap-2">
                 <ShoppingBag size={14} /> Add to Bag
              </button>

              <div className="flex justify-between items-center border-t border-stone-100 pt-4">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-stone-200 rounded-full overflow-hidden border border-stone-200">
                       <img src={product.seller_image} alt={product.seller} className="w-full h-full object-cover" />
                    </div>
                    <div className="overflow-hidden">
                       <p className="font-serif text-sm text-stone-900 leading-none truncate">{product.seller}</p>
                       <p className="text-[10px] font-mono uppercase tracking-widest text-stone-500">Artisan</p>
                    </div>
                 </div>
                 <a href={product.seller_url} target="_blank" className="text-xs font-mono uppercase tracking-widest text-stone-900 border-b border-stone-300">
                    Visit
                 </a>
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
                <motion.img
                  key={product.id}
                  src={product.image}
                  alt={product.name}
                  initial={{ opacity: 0, x: direction === 'right' ? 30 : -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: direction === 'right' ? -30 : 30 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="w-full h-full object-cover"
                />
              </AnimatePresence>

              {/* Navigation */}
              <button onClick={() => moveSlide('left')} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/40 hover:bg-white border border-white/20 rounded-full backdrop-blur-md transition-all text-stone-800">
                 <ChevronLeft size={18} />
              </button>
              <button onClick={() => moveSlide('right')} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/40 hover:bg-white border border-white/20 rounded-full backdrop-blur-md transition-all text-stone-800">
                 <ChevronRight size={18} />
              </button>

              {/* Badge & Wishlist */}
              {product.badge && (
                 <div className="absolute top-4 left-4 bg-stone-900 text-white px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest border border-stone-800">
                    {product.badge}
                 </div>
              )}
              <button
                 onClick={() => setIsWishlisted(!isWishlisted)}
                 className="absolute top-4 right-4 p-2 bg-white/40 hover:bg-white border border-white/20 rounded-full backdrop-blur-md transition-all"
              >
                 <Heart size={14} className={isWishlisted ? "fill-current text-red-500" : "text-stone-800"} />
              </button>

              {/* Next Preview */}
              <div 
                 className="absolute bottom-4 right-4 w-24 h-32 overflow-hidden border border-white/50 shadow-lg cursor-pointer"
                 onClick={() => moveSlide('right')}
              >
                 <img src={nextProduct.image} alt="Next" className="w-full h-full object-cover opacity-80" />
              </div>
            </div>

            {/* Pagination Dots */}
            <div className="flex gap-2 justify-center mt-4">
              {PRODUCTS.map((_, idx) => (
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
                  ${product.price}
                </span>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 justify-end text-stone-900 mb-1">
                  <Star size={16} className="fill-current" />
                  <span className="font-medium">{product.rating}</span>
                </div>
                <span className="text-xs font-mono text-stone-500">({product.reviews})</span>
              </div>
            </div>

            {/* Description */}
            <p className="text-base text-stone-600 font-light leading-relaxed">
              {product.description}
            </p>

            {/* Seller Card */}
            <div className="border border-stone-200 p-6">
              <div className="flex items-center justify-between mb-4">
                 <span className="font-mono text-[10px] uppercase tracking-widest text-stone-400">The Artisan</span>
                 <a 
                    href={product.seller_url} 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-mono uppercase tracking-widest text-stone-900 border-b border-transparent hover:border-stone-900 transition-colors"
                  >
                    Visit
                  </a>
              </div>
              <div className="flex items-center gap-4">
                 <div className="w-14 h-14 bg-stone-100 overflow-hidden border border-stone-200">
                    <img 
                      src={product.seller_image} 
                      alt={product.seller} 
                      className="w-full h-full object-cover" 
                    />
                 </div>
                 <div>
                    <h3 className="font-serif text-xl text-stone-900">{product.seller}</h3>
                    <p className="text-xs font-mono uppercase tracking-widest text-stone-500">Verified Seller</p>
                 </div>
              </div>
            </div>

            {/* CTA Button */}
            <button className="w-full bg-stone-900 text-stone-50 py-5 font-mono text-sm uppercase tracking-widest hover:bg-stone-800 transition-colors flex items-center justify-center gap-3 group">
              <ShoppingBag size={18} />
              Add to Bag
              <ArrowUpRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Footer Stats */}
            <div className="text-center pt-6">
               <p className="font-mono text-[10px] uppercase tracking-widest text-stone-400">
                 {String(currentIndex + 1).padStart(2, '0')} / {String(PRODUCTS.length).padStart(2, '0')}
               </p>
            </div>

         </div>
      </div>
    </div>
  );
}

export default LuxuryShowcase;