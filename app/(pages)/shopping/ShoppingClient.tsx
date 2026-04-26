'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion';
import Image from 'next/image';
import { ProductCard } from '@/components/common/ProductCard';
import { CategoryNavigator } from './components/CategoryNavigator';
import { ShoppingBag, ArrowRight, Plus, Compass } from 'lucide-react';

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

interface Collection {
  id: string;
  name: string;
  slug: string;
  description?: string;
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
  categories: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  collections: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
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
  stockQuantity: number;
  sizes: string[];
  colors: string[];
  createdAt: string | Date;
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
    collections: Collection[];
  };
}

// ── CUSTOM CATEGORY PORTAL COMPONENT ──
function CategoryChapter({ cat, index, variant, isMobile = false }: { cat: any, index: number, variant: 'arch' | 'rect' | 'oval', isMobile?: boolean }) {
  const shapeClass = variant === 'arch' ? 'rounded-t-full' : variant === 'oval' ? 'rounded-full' : 'rounded-[3rem]';
  const paddingClass = isMobile ? 'p-6' : 'p-10';

  return (
    <Link href={`/shopping/categories/${cat.slug}`} className="group block relative">
      <motion.div 
        whileHover={{ y: -10 }}
        className={`relative w-full aspect-[3/4] overflow-hidden ${shapeClass} transition-all duration-1000 shadow-2xl bg-stone-200`}
      >
        <Image 
          src={cat.imageUrl || "/placeholder-category.jpg"} 
          alt={cat.name} 
          fill 
          className="object-cover transition-transform duration-[2s] group-hover:scale-110" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/20 to-transparent opacity-70 group-hover:opacity-80 transition-opacity" />
        
        {/* Luxury Numbering */}
        <div className="absolute top-8 left-10 overflow-hidden">
          <motion.span 
            initial={{ y: 40, opacity: 0 }}
            whileInView={{ y: 0, opacity: 0.2 }}
            viewport={{ once: true }}
            className="block text-7xl font-serif italic text-white"
          >
            {(index + 1).toString().padStart(2, '0')}
          </motion.span>
        </div>

        {/* Product Count Sidebar (Desktop only) */}
        {!isMobile && (
          <div className="absolute top-1/2 -right-8 -translate-y-1/2 rotate-90 origin-center hidden xl:block">
            <span className="text-[9px] font-mono uppercase tracking-[0.5em] text-white/40 whitespace-nowrap">
              Collection No. {index + 1} // {cat._count.products} Pieces
            </span>
          </div>
        )}

        {/* Content Overlay */}
        <div className={`absolute inset-x-0 bottom-0 ${paddingClass} flex flex-col items-start`}>
           <div className="flex items-center gap-3 mb-4 overflow-hidden">
              <motion.div 
                initial={{ x: -20, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                className="w-8 h-[1px] bg-amber-500" 
              />
              <span className="text-amber-500 text-[10px] font-mono uppercase tracking-[0.3em] font-black">
                Essential Chapter
              </span>
           </div>
           
           <h3 className="text-4xl md:text-5xl lg:text-6xl font-serif text-white tracking-tighter leading-[0.9] mb-8">
             {cat.name.split(' ').map((word: string, i: number) => (
               <span key={i} className="block">
                 {i % 2 === 1 ? <span className="italic font-light text-stone-300">{word}</span> : word}
               </span>
             ))}
           </h3>

           <div className="group/btn inline-flex items-center gap-4 text-white/50 text-[10px] font-mono uppercase tracking-[0.4em] hover:text-white transition-colors">
              Explore Now
              <div className="w-8 h-px bg-white/20 group-hover/btn:w-16 group-hover/btn:bg-amber-500 transition-all duration-500" />
           </div>
        </div>
      </motion.div>
      
      {/* Decorative Floating Label */}
      {!isMobile && (
        <motion.div 
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-4 -right-4 bg-white/10 backdrop-blur-md border border-white/20 px-6 py-2 rounded-full hidden lg:block"
        >
          <span className="text-[9px] font-mono uppercase tracking-widest text-white/80">Premium Access Original</span>
        </motion.div>
      )}
    </Link>
  );
}

export default function ShoppingClient({ initialData }: ShoppingClientProps) {
  const { categories, featuredProducts, trendingProducts, collections } = initialData;
  const [activeTab, setActiveTab] = useState<'featured' | 'trending'>('featured');
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });

  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  // Column Speeds
  const leftY = useTransform(smoothProgress, [0, 1], [0, -150]);
  const centerY = useTransform(smoothProgress, [0, 1], [0, 150]);
  const rightY = useTransform(smoothProgress, [0, 1], [0, -80]);

  // Distribution for Triple Column
  const colLeft = categories.filter((_, i) => i % 3 === 0);
  const colCenter = categories.filter((_, i) => i % 3 === 1);
  const colRight = categories.filter((_, i) => i % 3 === 2);

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
                  <p className="text-sm font-serif italic text-stone-500 leading-relaxed">
                    Connecting discerning individuals with the world&apos;s most talented independent artisans and tailors.
                  </p>
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

      {/* ── THE COLLECTIONS GALLERY ── */}
      {collections.length > 0 && (
        <section id="collections" className="py-32 px-6 max-w-[1800px] mx-auto overflow-hidden relative">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12 mb-20 relative z-10">
            <div className="max-w-xl text-stone-900">
              <span className="text-amber-700 text-[10px] font-mono uppercase tracking-[0.4em] mb-4 block">Limited Series</span>
              <h2 className="text-5xl md:text-7xl font-serif leading-none tracking-tighter text-stone-900">Iconic <span className="italic font-light text-stone-400">Collections.</span></h2>
            </div>
            <p className="max-w-xs text-sm font-serif italic text-stone-500 leading-relaxed">
              Discover specially curated artistic directions and seasonal signatures, crafted with an unwavering commitment to refinement.
            </p>
          </div>

          <div className="flex gap-10 overflow-x-auto no-scrollbar pb-12 -mx-6 px-6 lg:mx-0 lg:px-0">
            {collections.map((col, i) => (
              <motion.div
                key={col.id}
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.8 }}
                className="shrink-0 group pointer-events-auto"
              >
                <Link href={`/shopping/collections/${col.slug}`}>
                  <div className="relative w-[300px] md:w-[500px] aspect-[4/5] rounded-[2rem] overflow-hidden shadow-2xl transition-all duration-700 group-hover:scale-[0.98]">
                    <Image 
                      src={col.imageUrl || "/placeholder-collection.jpg"} 
                      alt={col.name}
                      fill
                      className="object-cover transition-transform duration-1500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="absolute inset-x-0 bottom-0 p-10 flex flex-col items-start translate-y-6 group-hover:translate-y-0 transition-transform duration-500">
                      <div className="flex items-center gap-3 mb-4 opacity-0 group-hover:opacity-100 transition-opacity">
                         <div className="w-8 h-px bg-white/40" />
                         <span className="text-white/60 text-[10px] font-mono uppercase tracking-widest">
                           {col._count.products} Product Masterpieces
                         </span>
                      </div>
                      <h3 className="text-3xl md:text-5xl font-serif text-white mb-6 leading-none">
                        {col.name}
                      </h3>
                      <button className="bg-white text-stone-900 text-[9px] font-mono uppercase tracking-widest px-8 py-4 rounded-full hover:bg-stone-900 hover:text-white transition-all shadow-xl">
                        View Collection
                      </button>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}

        {/* ── THE LIQUID PARALLAX GALLERY ── */}
        <section ref={sectionRef} className="py-44 px-6 max-w-[1800px] mx-auto relative overflow-visible">
          <div className="flex flex-col lg:flex-row items-baseline justify-between gap-12 mb-40 relative z-20">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-px bg-stone-900" />
                <span className="text-[10px] font-mono uppercase tracking-[0.5em] text-amber-700 font-black">The Atelier Archives</span>
              </div>
              <h2 className="text-6xl md:text-[8rem] lg:text-[11rem] font-serif leading-[0.75] tracking-tighter text-stone-900">
                Essential <br />
                <span className="italic font-extralight text-stone-300 ml-24 md:ml-40 block">Chapters.</span>
              </h2>
            </div>
            <div className="max-w-xs space-y-8">
               <div className="p-6 border-l border-stone-200">
                  <p className="text-base font-serif italic text-stone-500 leading-relaxed">
                    A fluid exploration of form and texture. Each chapter represents a dedicated study in artisanal craftsmanship.
                  </p>
               </div>
               <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 rounded-full border border-stone-200 flex items-center justify-center text-stone-400 ml-6"
               >
                 <Compass size={24} strokeWidth={1} />
               </motion.div>
            </div>
          </div>

          {/* Desktop Parallax View */}
          <div className="hidden lg:grid grid-cols-3 gap-16 relative perspective-1000">
             {/* Left Column */}
             <motion.div style={{ y: leftY }} className="flex flex-col gap-32 mt-40">
                {colLeft.map((cat, i) => (
                  <CategoryChapter key={cat.id} cat={cat} index={i * 3} variant="arch" />
                ))}
             </motion.div>

             {/* Center Column */}
             <motion.div style={{ y: centerY }} className="flex flex-col gap-32">
                {colCenter.map((cat, i) => (
                  <CategoryChapter key={cat.id} cat={cat} index={i * 3 + 1} variant="rect" />
                ))}
             </motion.div>

             {/* Right Column */}
             <motion.div style={{ y: rightY }} className="flex flex-col gap-32 mt-80">
                {colRight.map((cat, i) => (
                  <CategoryChapter key={cat.id} cat={cat} index={i * 3 + 2} variant="oval" />
                ))}
             </motion.div>

             {/* Huge background text following scroll */}
             <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none -z-10 overflow-hidden">
                <motion.h2 
                  style={{ 
                    x: centerY,
                    opacity: useTransform(smoothProgress, [0, 0.5, 1], [0.03, 0.08, 0.03])
                  }}
                  className="text-[40vw] font-serif font-black text-stone-900 whitespace-nowrap"
                >
                  ARCHIVES
                </motion.h2>
             </div>
          </div>

          {/* Mobile Staggered Grid (Restored as per request) */}
          <div className="grid lg:hidden grid-cols-2 gap-4">
            {categories.map((cat, i) => (
              <div 
                key={cat.id} 
                className={`${i % 3 === 0 ? 'col-span-2 aspect-[16/10]' : 'col-span-1 aspect-[3/4]'}`}
              >
                  <CategoryChapter cat={cat} index={i} variant="rect" isMobile />
              </div>
            ))}
          </div>

          {/* Floating UI Elements */}
          <div className="absolute top-0 right-0 p-20 hidden 2xl:block opacity-20 pointer-events-none">
             <div className="w-[1px] h-[400px] bg-stone-300 relative">
                <motion.div 
                  style={{ top: useTransform(smoothProgress, [0, 1], ["0%", "100%"]) }}
                  className="absolute left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-stone-900"
                />
             </div>
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
                  <ProductCard key={product.id} item={product as unknown as Parameters<typeof ProductCard>[0]['item']} index={index} />
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
