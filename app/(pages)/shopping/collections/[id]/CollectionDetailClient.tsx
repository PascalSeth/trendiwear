'use client';

import React, { useState } from 'react';
import { ShoppingBag, X, SlidersHorizontal, ArrowRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { ProductCard } from '@/components/common/ProductCard';
import { AtelierBackground } from '@/app/components/creative/AtelierBackground';

interface Collection {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  _count: {
    products: number;
  };
}

interface Product {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  currency: string;
  images: string[];
  videoUrl?: string | null;
  sizes: string[];
  colors: string[];
  material?: string | null;
  viewCount: number;
  soldCount: number;
  stockQuantity: number;
  createdAt: string | Date;
  categoryId: string;
  categories: {
    id: string;
    name: string;
    slug: string;
  }[];
  collections: {
    id: string;
    name: string;
    slug: string;
  }[];
  professional: {
    id: string;
    firstName: string;
    lastName: string;
    professionalProfile?: {
      businessName?: string | null;
      businessImage?: string | null;
      isVerified?: boolean;
      rating?: number | null;
    } | null;
  };
}

interface Filters {
  minPrice?: string;
  maxPrice?: string;
  colors: string[];
  sizes: string[];
  tags: string[];
  sortBy: string;
  sortOrder: string;
}

function FilterSidebar({
  filters,
  setFilters,
  availableColors,
  availableSizes,
  isOpen,
  onClose
}: {
  filters: Filters;
  setFilters: (filters: Filters) => void;
  availableColors: string[];
  availableSizes: string[];
  isOpen: boolean;
  onClose: () => void;
}) {
  const updateFilters = (key: keyof Filters, value: string | string[]) => {
    setFilters({ ...filters, [key]: value });
  };

  const toggleArrayFilter = (key: 'colors' | 'sizes' | 'tags', value: string) => {
    const current = filters[key] as string[];
    const updated = current.includes(value)
      ? current.filter(item => item !== value)
      : [...current, value];
    updateFilters(key, updated);
  };

  const containerVariants = {
    hidden: { x: '100%' },
    visible: { 
      x: 0,
      transition: { type: 'spring', stiffness: 300, damping: 30 }
    },
    exit: { 
      x: '100%',
      transition: { ease: 'easeInOut', duration: 0.4 }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-[9998]" 
            onClick={onClose} 
          />
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed top-0 right-0 h-screen w-full md:w-[450px] bg-white z-[9999] shadow-2xl overflow-hidden border-l border-stone-100"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-8 border-b border-stone-100">
                <div className="space-y-1">
                  <h2 className="text-2xl font-serif text-stone-900">Refine Selection</h2>
                  <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-stone-400">Tailor your viewing experience</p>
                </div>
                <button 
                  onClick={onClose}
                  className="p-3 hover:bg-stone-50 rounded-full transition-colors border border-stone-100 shadow-sm"
                >
                  <X size={20} className="text-stone-900" />
                </button>
              </div>

              {/* Simple Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-8 space-y-12 custom-scrollbar">
                {/* Price Section */}
                <div className="space-y-6">
                  <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-stone-900 flex items-center gap-3">
                    <span className="w-8 h-px bg-stone-200" /> Price Architecture
                  </h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Minimal</label>
                       <div className="relative group">
                         <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 text-xs font-mono">$</span>
                         <input
                          type="number"
                          value={filters.minPrice || ''}
                          onChange={(e) => updateFilters('minPrice', e.target.value)}
                          placeholder="0"
                          className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-8 pr-4 py-4 text-sm outline-none focus:border-stone-900 focus:bg-white transition-all"
                        />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Maximal</label>
                       <div className="relative group">
                         <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 text-xs font-mono">$</span>
                         <input
                          type="number"
                          value={filters.maxPrice || ''}
                          onChange={(e) => updateFilters('maxPrice', e.target.value)}
                          placeholder="∞"
                          className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-8 pr-4 py-4 text-sm outline-none focus:border-stone-900 focus:bg-white transition-all"
                        />
                       </div>
                    </div>
                  </div>
                </div>

                {/* Colors Section */}
                {availableColors.length > 0 && (
                  <div className="space-y-6">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-stone-900 flex items-center gap-3">
                      <span className="w-8 h-px bg-stone-200" /> Color Palette
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {availableColors.map(color => (
                        <button
                          key={color}
                          onClick={() => toggleArrayFilter('colors', color)}
                          className={cn(
                            "flex items-center gap-3 px-4 py-2.5 rounded-full border transition-all duration-300",
                            filters.colors.includes(color)
                              ? "border-stone-900 bg-stone-900 text-white shadow-xl scale-105"
                              : "border-stone-200 bg-white text-stone-600 hover:border-stone-900 hover:text-stone-900"
                          )}
                        >
                          <div 
                            className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-inner translate-y-[1px]" 
                            style={{ backgroundColor: color.toLowerCase() }} 
                          />
                          <span className="text-[10px] font-mono tracking-tight font-bold uppercase">{color}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sizes Section */}
                {availableSizes.length > 0 && (
                  <div className="space-y-6">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-stone-900 flex items-center gap-3">
                      <span className="w-8 h-px bg-stone-200" /> Measurements
                    </h3>
                    <div className="grid grid-cols-4 gap-3">
                      {availableSizes.map(size => (
                        <button
                          key={size}
                          onClick={() => toggleArrayFilter('sizes', size)}
                          className={cn(
                            "h-12 flex items-center justify-center text-[10px] font-mono font-bold rounded-xl border transition-all duration-300",
                            filters.sizes.includes(size)
                              ? "bg-stone-900 text-white border-stone-900 shadow-xl scale-105"
                              : "bg-white text-stone-500 border-stone-200 hover:border-stone-900 hover:text-stone-900"
                          )}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Simple Footer */}
              <div className="p-8 border-t border-stone-100 bg-stone-50/50 backdrop-blur-md">
                <div className="flex flex-col gap-4">
                  <button
                    onClick={onClose}
                    className="w-full py-5 bg-stone-900 text-white rounded-2xl font-black uppercase text-[11px] tracking-[0.3em] hover:bg-stone-800 transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-3"
                  >
                    Set Requirements <ArrowRight size={14} />
                  </button>
                  <button
                    onClick={() => setFilters({
                      minPrice: '', maxPrice: '', colors: [], sizes: [], tags: [], sortBy: 'createdAt', sortOrder: 'desc'
                    })}
                    className="w-full py-3 text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors"
                  >
                    Reset All Parameters
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

interface CollectionDetailClientProps {
  collection: Collection;
  products: Product[];
  availableColors: string[];
  availableSizes: string[];
}

export default function CollectionDetailClient({ 
  collection, 
  products,
  availableColors,
  availableSizes
}: CollectionDetailClientProps) {
  const [filters, setFilters] = useState<Filters>({
    minPrice: '', maxPrice: '', colors: [], sizes: [], tags: [], sortBy: 'createdAt', sortOrder: 'desc'
  });
  const [showFilters, setShowFilters] = useState(false);

  const filteredProducts = products.filter(product => {
    if (filters.minPrice && product.price < parseFloat(filters.minPrice)) return false;
    if (filters.maxPrice && product.price > parseFloat(filters.maxPrice)) return false;
    if (filters.colors.length > 0 && !filters.colors.some(color => product.colors?.includes(color))) return false;
    if (filters.sizes.length > 0 && !filters.sizes.some(size => product.sizes?.includes(size))) return false;
    return true;
  }).sort((a, b) => {
    const { sortBy, sortOrder } = filters;
    let comparison = 0;
    if (sortBy === 'price') comparison = a.price - b.price;
    else comparison = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
    return sortOrder === 'desc' ? -comparison : comparison;
  });

  return (
    <div className="relative min-h-screen bg-[#FAFAF9] selection:bg-stone-900 selection:text-stone-50 overflow-x-hidden font-sans">
      <FilterSidebar
        filters={filters} 
        setFilters={setFilters} 
        availableColors={availableColors}
        availableSizes={availableSizes}
        isOpen={showFilters} 
        onClose={() => setShowFilters(false)}
      />

      {/* ── BACKGROUND ORCHESTRATION ── */}
      <div className="fixed inset-0 z-0">
        <AtelierBackground />
      </div>

      <div className="relative z-10">
        
        {/* ── CINEMATIC EDITORIAL HERO ── */}
        <section className="relative min-h-[90vh] lg:h-screen flex items-center justify-center p-6 lg:p-12 pt-32 lg:pt-40 overflow-hidden">
          <div className="max-w-[1800px] mx-auto w-full grid lg:grid-cols-12 gap-12 lg:gap-20 items-center">
            
            {/* Left Column: Typography & Story */}
            <div className="lg:col-span-6 lg:col-start-1 h-full flex flex-col justify-center order-2 lg:order-1">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-12"
              >
                <div className="space-y-6">
                   <nav className="flex items-center gap-4 text-[10px] font-mono font-bold uppercase tracking-[0.5em] text-amber-700/60 mb-8">
                    <Link href="/shopping" className="hover:text-amber-700 transition-colors">Atelier</Link>
                    <div className="w-8 h-px bg-amber-200/50" />
                    <span className="text-stone-400">Collections</span>
                  </nav>

                  <h1 className="text-[12vw] lg:text-[10rem] font-serif font-medium leading-[0.8] tracking-tighter text-stone-900 -ml-1 lg:-ml-3">
                    {collection.name.split(' ').map((word, i) => (
                      <span key={i} className="block last:italic last:font-light last:text-stone-400">
                        {word}
                      </span>
                    ))}
                  </h1>
                </div>

                <div className="flex flex-col md:flex-row items-start gap-12 border-l border-stone-200 pl-8 lg:pl-12">
                  <p className="max-w-md text-lg lg:text-xl font-serif italic text-stone-500 leading-relaxed">
                    {collection.description || "A curated exploration of artisanal form and seasonal texture, celebrating the unique dialogue between cloth and body."}
                  </p>
                  
                  <div className="flex flex-col items-start gap-2 pt-2">
                    <span className="text-[9px] font-mono font-bold uppercase tracking-[0.4em] text-stone-400">Archive Index /</span>
                    <span className="text-2xl font-serif text-stone-900 italic">{String(products.length).padStart(2, '0')} Pieces</span>
                  </div>
                </div>

                <div className="pt-8">
                   <Link href="#collection-grid">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-stone-900 text-white px-12 py-6 rounded-full text-[10px] font-mono font-bold uppercase tracking-[0.3em] flex items-center gap-4 shadow-2xl shadow-stone-900/20 hover:bg-black transition-all"
                      >
                        Explore Archive <ArrowRight size={14} className="animate-pulse" />
                      </motion.button>
                   </Link>
                </div>
              </motion.div>
            </div>

            {/* Right Column: Immersive Visual */}
            <div className="lg:col-span-6 order-1 lg:order-2">
              <motion.div
                initial={{ opacity: 0, scale: 0.92, rotate: 2 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
                className="relative aspect-[4/5] lg:aspect-[3/4] rounded-[2.5rem] lg:rounded-[4rem] overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.1)] group bg-stone-100"
              >
                <Image 
                  src={collection.imageUrl || "/placeholder-collection.jpg"} 
                  alt={collection.name}
                  fill
                  priority
                  className="object-cover transition-transform duration-[3s] group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-stone-900/10 mix-blend-overlay group-hover:opacity-0 transition-opacity duration-1000" />
                
                {/* Visual Accent: Signature */}
                <div className="absolute top-12 right-12 flex flex-col items-end gap-2 text-white/40 font-serif italic text-2xl group-hover:text-white/80 transition-colors duration-1000">
                  <span className="text-[10px] font-mono uppercase tracking-[0.5em] mb-2 leading-none">Status / Curated</span>
                  Edition.S
                </div>

                {/* Vertical Text Guide */}
                <div className="absolute bottom-12 left-12 flex items-center gap-6">
                  <div className="w-[1px] h-32 bg-white/30 group-hover:h-48 transition-all duration-1000" />
                  <span className="font-mono text-[8px] text-white/50 uppercase tracking-[0.6em] [writing-mode:vertical-lr] rotate-180">
                    Boutique Digital Archive
                  </span>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Background Text Decor */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.02 }}
            transition={{ duration: 2, delay: 1 }}
            className="absolute -bottom-20 left-1/2 -translate-x-1/2 flex items-center justify-center overflow-hidden pointer-events-none select-none z-[-1]"
          >
            <h2 className="text-[30vw] font-serif font-black leading-none uppercase">
              {collection.name.split(' ')[0]}
            </h2>
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div 
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
          >
            <span className="text-[8px] font-mono font-bold uppercase tracking-[0.5em] text-stone-300">Descend</span>
            <div className="w-[1px] h-12 bg-stone-200" />
          </motion.div>
        </section>

        {/* ── THE CATALOGUE EXPERIENCE ── */}
        <section id="collection-grid" className="px-6 lg:px-12 pb-48 pt-12 max-w-[1800px] mx-auto">
          
          {/* Floating Control Bar */}
          <div className="sticky top-6 z-40 mb-20">
             <div className="bg-white/40 backdrop-blur-2xl border border-white/20 rounded-[2.5rem] px-8 py-6 shadow-[0_30px_60px_rgba(0,0,0,0.03)] flex flex-col md:flex-row items-center justify-between gap-6 transition-all hover:bg-white/60">
                <div className="flex items-center gap-8 md:gap-12 pl-2">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-mono font-bold uppercase tracking-[0.4em] text-amber-700/60 leading-none mb-2">Catalogue Index /</span>
                    <span className="text-xl font-serif text-stone-900 flex items-center gap-3">
                      {filteredProducts.length} <span className="text-sm italic text-stone-400">Pieces Revealed</span>
                    </span>
                  </div>
                  
                  <div className="hidden lg:flex items-center gap-4 border-l border-stone-200 pl-12 h-10">
                    <div className="flex -space-x-3">
                      {products.slice(0, 4).map((p, i) => (
                        <div key={p.id} className="w-8 h-8 rounded-full border-2 border-white bg-stone-200 overflow-hidden relative grayscale hover:grayscale-0 transition-all duration-500 shadow-sm" style={{ zIndex: 10 - i }}>
                          <Image src={p.images[0]} alt="Product" fill className="object-cover" />
                        </div>
                      ))}
                    </div>
                    <span className="text-[9px] font-mono text-stone-400 uppercase tracking-widest">+ Live Selection</span>
                  </div>
                </div>

                <div className="flex items-center gap-6 w-full md:w-auto">
                  <div className="flex items-center gap-4 group cursor-pointer bg-stone-900/5 px-6 py-3 rounded-full hover:bg-stone-900/10 transition-colors">
                    <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-stone-500">Order By /</span>
                    <select
                      value={`${filters.sortBy}_${filters.sortOrder}`}
                      onChange={(e) => {
                        const [sortBy, sortOrder] = e.target.value.split('_');
                        setFilters({ ...filters, sortBy, sortOrder });
                      }}
                      className="bg-transparent text-[10px] font-black uppercase tracking-widest border-none focus:ring-0 cursor-pointer text-stone-900 py-0 pr-8"
                    >
                      <option value="createdAt_desc">The Latest</option>
                      <option value="price_asc">Value Ascending</option>
                      <option value="price_desc">Value Descending</option>
                    </select>
                  </div>

                  <button 
                    onClick={() => setShowFilters(true)} 
                    className="flex items-center gap-4 text-stone-900 group shrink-0"
                  >
                    <div className="w-12 h-12 rounded-full bg-stone-900 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl shadow-stone-900/20 active:scale-95">
                      <SlidersHorizontal size={14} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] hidden lg:block border-b border-stone-900/10 group-hover:border-stone-900 transition-colors pb-1">Refine Gallery</span>
                  </button>
                </div>
             </div>
          </div>

          {/* Grid Reveal */}
          <div className="relative">
            {filteredProducts.length > 0 ? (
              <LayoutGroup>
                <motion.div 
                  layout 
                  className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 lg:gap-x-12 gap-y-16 lg:gap-y-24"
                >
                  <AnimatePresence>
                    {filteredProducts.map((product, index) => (
                      <motion.div
                        layout
                        key={product.id}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.8, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <ProductCard item={product as unknown as Parameters<typeof ProductCard>[0]['item']} index={index} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              </LayoutGroup>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-48 text-center"
              >
                <div className="w-32 h-32 rounded-full bg-white flex items-center justify-center text-stone-200 mb-12 border border-stone-100 shadow-xl overflow-hidden relative">
                   <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 border border-dashed border-stone-200 rounded-full"
                   />
                   <ShoppingBag size={48} strokeWidth={1} />
                </div>
                <h3 className="text-4xl font-serif italic text-stone-900 mb-4">The search yielded no results.</h3>
                <p className="text-stone-400 text-sm max-w-sm mx-auto mb-12 leading-relaxed font-serif italic">Consider refining your selection parameters to discover hidden artistic gems in this archive.</p>
                <button 
                  onClick={() => setFilters({...filters, colors: [], sizes: [], minPrice: '', maxPrice: ''})} 
                  className="px-12 py-5 bg-stone-900 text-white text-[10px] font-black uppercase tracking-[0.4em] rounded-full hover:scale-105 transition-all shadow-xl active:scale-95"
                >
                  Reset Archive
                </button>
              </motion.div>
            )}
          </div>
        </section>

        {/* ── BEYOND SECTION: NAVIGATION ── */}
        <section className="py-24 border-t border-stone-200/50 bg-white/30 backdrop-blur-sm">
           <div className="max-w-4xl mx-auto px-6 text-center space-y-8">
              <span className="text-[10px] font-mono font-bold uppercase tracking-[0.5em] text-stone-400">The Journey Continues /</span>
              <h4 className="text-4xl lg:text-6xl font-serif italic text-stone-900">Discover more archival chapters.</h4>
              <div className="pt-8 flex justify-center items-center gap-12">
                 <Link href="/shopping" className="group flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full border border-stone-200 flex items-center justify-center group-hover:bg-stone-900 group-hover:text-white transition-all">
                       <ArrowLeft size={16} />
                    </div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest">Atelier Frontispiece</span>
                 </Link>
                 <div className="w-12 h-px bg-stone-200" />
                 <Link href="/shopping/collections" className="group flex items-center gap-4">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-right">Other Curated Files</span>
                    <div className="w-12 h-12 rounded-full border border-stone-200 flex items-center justify-center group-hover:bg-stone-900 group-hover:text-white transition-all">
                       <ArrowRight size={16} />
                    </div>
                 </Link>
              </div>
           </div>
        </section>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e5e7eb;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #d1d5db;
        }
      `}</style>
    </div>
  );
}
