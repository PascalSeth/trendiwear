'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { ProductCard } from '@/components/common/ProductCard';
import { CategoryNavigator } from './components/CategoryNavigator';
import { ShoppingBag, ArrowRight, Star, Plus } from 'lucide-react';

// --- Types ---
interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string;
  _count: {
    products: number;
  };
}

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  images: string[];
  videoUrl?: string;
  category: {
    name: string;
    slug: string;
  };
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
  _count: {
    wishlistItems: number;
    reviews: number;
  };
}

interface ShoppingClientProps {
  initialData: {
    categories: Category[];
    featuredProducts: Product[];
    trendingProducts: Product[];
  };
}

export default function ShoppingClient({ initialData }: ShoppingClientProps) {
  const { categories, featuredProducts, trendingProducts } = initialData;
  const [activeTab, setActiveTab] = useState<'featured' | 'trending'>('featured');

  return (
    <div className="min-h-screen bg-[#FAFAF9] relative overflow-hidden selection:bg-stone-900 selection:text-stone-50">
      
      {/* ── Full-Page Animated Background ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Floating circles */}
        <motion.div
           animate={{ y: [0, -40, 0], x: [0, 20, 0] }}
           transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
           className="absolute -top-20 -right-20 w-[500px] h-[500px] rounded-full border border-amber-200/20"
        />
        <motion.div
           animate={{ y: [0, 30, 0], x: [0, -15, 0] }}
           transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
           className="absolute top-[30%] -left-20 w-[300px] h-[300px] rounded-full border border-stone-200/30"
        />
        {/* Floating dots */}
        <motion.div
           animate={{ y: [0, -20, 0] }}
           transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
           className="absolute top-[15%] left-[20%] w-2 h-2 rounded-full bg-amber-300/20"
        />
        <motion.div
           animate={{ y: [0, 40, 0] }}
           transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
           className="absolute top-[45%] right-[15%] w-3 h-3 rounded-full bg-stone-300/40"
        />
        {/* Animated wave paths (squiggles) */}
        <svg className="absolute top-0 left-0 w-full h-[3000px] pointer-events-none opacity-[0.12]" viewBox="0 0 1440 3000" preserveAspectRatio="none">
           <motion.path
             d="M0 100 Q360 0, 720 100 T1440 100 T2160 100 T2880 100 T3600 100"
             stroke="rgb(180 170 160)"
             strokeWidth="1.5"
             fill="none"
             initial={{ pathLength: 0 }}
             animate={{ pathLength: 1 }}
             transition={{ duration: 5, ease: 'easeInOut' }}
           />
           <motion.path
             d="M1440 500 Q1080 400, 720 500 T0 500"
             stroke="rgb(180 83 9)"
             strokeWidth="1"
             fill="none"
             initial={{ pathLength: 0 }}
             animate={{ pathLength: 1 }}
             transition={{ duration: 6, ease: 'easeInOut', delay: 1 }}
           />
           <motion.path
             d="M0 1500 Q720 1400, 1440 1500 T2880 1500"
             stroke="rgb(160 150 140)"
             strokeWidth="0.8"
             fill="none"
             initial={{ pathLength: 0 }}
             animate={{ pathLength: 1 }}
             transition={{ duration: 8, ease: 'easeInOut', delay: 2 }}
           />
        </svg>
      </div>

      <div className="relative z-10 overflow-x-hidden">
      
      {/* ── CINEMATIC HERO ── */}
      <section className="relative h-[90vh] lg:h-screen flex items-center justify-center pt-20 overflow-hidden">
        {/* Background Text Decor */}
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none select-none">
          <motion.h1 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 0.03, scale: 1 }}
            transition={{ duration: 2 }}
            className="text-[40vw] font-serif font-black leading-none"
          >
            ATELIER
          </motion.h1>
        </div>

        <div className="max-w-[1800px] mx-auto px-6 w-full grid lg:grid-cols-12 gap-12 items-center relative z-10">
          <div className="lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="inline-block text-[10px] font-mono uppercase tracking-[0.5em] text-amber-700 mb-6 px-4 py-1.5 border border-amber-200/50 rounded-full bg-amber-50/50 backdrop-blur-sm">
                The Shopping Experience
              </span>
              <h1 className="text-7xl md:text-9xl lg:text-[10rem] font-serif font-medium leading-[0.85] tracking-tighter mb-10">
                Curated <br />
                <span className="italic font-light text-stone-400">Aesthetics.</span>
              </h1>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8 pl-2">
                <Link href="#collections">
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-stone-900 text-white px-10 py-5 rounded-full text-[10px] font-mono uppercase tracking-widest hover:shadow-2xl hover:shadow-stone-900/20 transition-all flex items-center gap-3"
                  >
                    Enter Atelier <ArrowRight size={14} />
                  </motion.button>
                </Link>
                <div className="max-w-xs">
                  <p className="text-sm font-serif italic text-stone-500 leading-relaxed">
                    Connecting discerning individuals with the world's most talented independent artisans and tailors.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="lg:col-span-5 relative hidden lg:block">
            <motion.div
              initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
              animate={{ opacity: 1, scale: 1, rotate: -2 }}
              transition={{ duration: 1.2, delay: 0.3 }}
              className="relative aspect-[4/5] w-full max-w-md mx-auto group"
            >
              {/* Decorative Frame */}
              <div className="absolute inset-0 border border-stone-200 rounded-2xl -translate-x-4 translate-y-4 group-hover:-translate-x-2 group-hover:translate-y-2 transition-transform duration-700" />
              
              <div className="relative h-full rounded-2xl overflow-hidden shadow-2xl">
                <Image 
                  src="/woman.png" 
                  alt="Editorial" 
                  fill 
                  className="object-cover group-hover:scale-110 transition-transform duration-1000"
                  priority
                />
                <div className="absolute inset-0 bg-stone-900/10 mix-blend-overlay" />
              </div>

              {/* Float Cards */}
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-10 -right-10 bg-white p-4 rounded-xl shadow-xl border border-stone-100 z-20 hidden xl:block"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600">
                    <ShoppingBag size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-mono uppercase text-stone-400">Verified</p>
                    <p className="text-xs font-serif font-bold italic">Boutique Service</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-[9px] font-mono uppercase tracking-widest text-stone-400">Scroll</span>
          <div className="w-[1px] h-12 bg-stone-200" />
        </motion.div>
      </section>

      {/* ── VISUAL NAVIGATION ── */}
      <section className="bg-white/50 border-y border-stone-100 sticky top-0 md:relative z-40 backdrop-blur-sm">
        <CategoryNavigator categories={categories} />
      </section>

      {/* ── THE DIRECTORY (CARDS) ── */}
      <section id="collections" className="py-24 px-6 max-w-[1800px] mx-auto overflow-hidden relative">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12 mb-20 relative z-10">
          <div className="max-w-xl text-stone-900">
            <span className="text-amber-700 text-[10px] font-mono uppercase tracking-[0.4em] mb-4 block">The Directory</span>
            <h2 className="text-5xl md:text-7xl font-serif leading-none tracking-tighter text-stone-900">Essential <span className="italic font-light text-stone-400">Chapters.</span></h2>
          </div>
          <p className="max-w-xs text-sm font-serif italic text-stone-500 leading-relaxed">
            Every category represents a unique story of craft, tradition, and personal style. Discover what resonates with your essence in the search for refined elegance.
          </p>
        </div>

        {/* Editorial Grid for Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`group relative overflow-hidden rounded-3xl ${
                i === 0 ? 'md:row-span-2 aspect-[4/5] md:aspect-auto' : 'aspect-[4/5]'
              }`}
            >
              <Image 
                src={cat.imageUrl || "/placeholder-category.jpg"} 
                alt={cat.name}
                fill
                className="object-cover grayscale-0 group-hover:scale-110 group-hover:grayscale-[0.5] transition-all duration-1000"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-900/80 via-transparent to-transparent" />
              
              <div className="absolute inset-x-0 bottom-0 p-8 flex flex-col items-start translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                <span className="text-white/60 text-[10px] font-mono uppercase tracking-widest mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {cat._count.products}+ Collections
                </span>
                <h3 className="text-2xl md:text-4xl font-serif text-white mb-6 leading-none">
                  {cat.name}
                </h3>
                <Link href={`/shopping/categories/${cat.id}`}>
                  <button className="bg-white/20 backdrop-blur-md text-white border border-white/30 text-[9px] font-mono uppercase tracking-widest px-6 py-3 rounded-full hover:bg-white hover:text-stone-900 transition-all">
                    Explore Chapter
                  </button>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── SHOPPING SPOTLIGHT ── */}
      <section className="py-32 relative overflow-hidden">
        <div className="max-w-[1800px] mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12 mb-24 border-b border-stone-200 pb-12">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-[1px] bg-amber-700" />
                <span className="text-amber-700 text-[10px] font-mono uppercase tracking-widest">Atelier Favorites</span>
              </div>
              <h2 className="text-5xl md:text-8xl font-serif leading-none tracking-tighter italic text-stone-900">Just Landed.</h2>
            </div>

            <div className="flex gap-4">
               <button 
                onClick={() => setActiveTab('featured')}
                className={`text-[10px] font-mono uppercase tracking-widest px-10 py-4 rounded-full transition-all border ${
                  activeTab === 'featured' ? 'bg-stone-900 text-white shadow-xl px-12' : 'text-stone-400 border-stone-200 hover:border-stone-400'
                }`}
               >
                 New Arrivals
               </button>
               <button 
                onClick={() => setActiveTab('trending')}
                className={`text-[10px] font-mono uppercase tracking-widest px-10 py-4 rounded-full transition-all border ${
                  activeTab === 'trending' ? 'bg-stone-900 text-white shadow-xl px-12' : 'text-stone-400 border-stone-200 hover:border-stone-400'
                }`}
               >
                 Trending Now
               </button>
            </div>
          </div>

          <motion.div 
            layout
            className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-x-4 md:gap-x-8 gap-y-12 md:gap-y-20 relative z-10"
          >
            <AnimatePresence mode="popLayout">
              {(activeTab === 'featured' ? featuredProducts : trendingProducts).map((product, index) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  className="bg-white/80 backdrop-blur-xl p-2 rounded-2xl border border-stone-200/50 hover:border-amber-200/50 transition-all group shadow-2xl shadow-stone-200/40"
                >
                  <ProductCard item={product as any} index={index} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Additional Squiggle for this section */}
          <div className="absolute bottom-0 right-0 w-full h-1/2 pointer-events-none opacity-20">
             <svg className="w-full h-full" viewBox="0 0 1000 500" preserveAspectRatio="none">
                <motion.path 
                  d="M0 250 Q250 100, 500 250 T1000 250" 
                  stroke="rgb(251 191 36)" 
                  strokeWidth="0.5" 
                  fill="none"
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  transition={{ duration: 3 }}
                />
             </svg>
          </div>
        </div>
      </section>

      {/* ── CALL TO ACTION ── */}
      <section className="py-40 px-6 relative overflow-hidden">
        <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] text-stone-100 pointer-events-none" viewBox="0 0 1000 1000">
           <path d="M0 500 C150 200, 350 200, 500 500 T1000 500" stroke="currentColor" fill="none" strokeWidth="0.5" />
           <path d="M0 600 C150 300, 350 300, 500 600 T1000 600" stroke="currentColor" fill="none" strokeWidth="0.5" opacity="0.5" />
        </svg>

        <div className="max-w-4xl mx-auto text-center space-y-12 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-6 py-2 rounded-full border border-stone-200 bg-white shadow-sm"
          >
            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
            <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-stone-500">Artisan Direct</span>
          </motion.div>

          <h3 className="text-4xl md:text-7xl font-serif leading-tight">
            Tailoring is an <span className="italic">intimate</span> conversation between cloth and body.
          </h3>
          
          <div className="flex flex-col sm:flex-row justify-center items-center gap-8 pt-8">
            <Link href="/register-as-professional">
              <button className="bg-stone-900 text-white px-12 py-5 rounded-full text-[10px] font-mono uppercase tracking-widest hover:bg-black transition-all">
                Join as Professional
              </button>
            </Link>
            <div className="flex -space-x-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-12 h-12 rounded-full border-4 border-[#FAFAF9] bg-stone-200 overflow-hidden relative">
                   <Image src={`/tz/p${i}.jpg`} alt="User" fill className="object-cover" />
                </div>
              ))}
              <div className="w-12 h-12 rounded-full border-4 border-[#FAFAF9] bg-amber-100 flex items-center justify-center text-amber-700 text-xs">
                 <Plus size={16} />
              </div>
            </div>
          </div>
        </div>
      </section>

      </div>{/* end z-10 content wrapper */}

      {/* GLOBAL SCROLLBAR STYLES */}
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
