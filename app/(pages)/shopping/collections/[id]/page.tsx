'use client';
import React, { useState, useEffect } from 'react';
import { ShoppingBag, X, SlidersHorizontal } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { ProductCard } from '@/components/common/ProductCard';

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
  sizes: string[];
  colors: string[];
  material?: string;
  viewCount: number;
  soldCount: number;
  stockQuantity: number;
  createdAt: string;
  categoryId: string;
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
      isVerified?: boolean;
    };
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
    hidden: { x: '-100%' },
    visible: { 
      x: 0,
      transition: { type: 'spring', stiffness: 300, damping: 30 }
    },
    exit: { 
      x: '-100%',
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
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998]" 
            onClick={onClose} 
          />
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed top-0 left-0 h-screen w-full md:w-[400px] bg-white z-[9999] shadow-2xl overflow-hidden"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-stone-100">
                <h2 className="text-xl font-bold text-stone-900">Filters</h2>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-stone-50 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Simple Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-10 custom-scrollbar">
                {/* Price Section */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-stone-400">Price Range</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-bold text-stone-500 uppercase">Min Price</label>
                       <div className="relative">
                         <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">$</span>
                         <input
                          type="number"
                          value={filters.minPrice || ''}
                          onChange={(e) => updateFilters('minPrice', e.target.value)}
                          placeholder="0"
                          className="w-full bg-stone-50 border border-stone-200 rounded-lg pl-7 pr-3 py-2.5 text-sm outline-none focus:border-stone-900 transition-colors"
                        />
                       </div>
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-bold text-stone-500 uppercase">Max Price</label>
                       <div className="relative">
                         <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">$</span>
                         <input
                          type="number"
                          value={filters.maxPrice || ''}
                          onChange={(e) => updateFilters('maxPrice', e.target.value)}
                          placeholder="Any"
                          className="w-full bg-stone-50 border border-stone-200 rounded-lg pl-7 pr-3 py-2.5 text-sm outline-none focus:border-stone-900 transition-colors"
                        />
                       </div>
                    </div>
                  </div>
                </div>

                {/* Colors Section */}
                {availableColors.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-stone-400">Available Colors</h3>
                    <div className="flex flex-wrap gap-3">
                      {availableColors.map(color => (
                        <button
                          key={color}
                          onClick={() => toggleArrayFilter('colors', color)}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-full border transition-all",
                            filters.colors.includes(color)
                              ? "border-stone-900 bg-stone-900 text-white"
                              : "border-stone-200 bg-white text-stone-600 hover:border-stone-400"
                          )}
                        >
                          <div 
                            className="w-3 h-3 rounded-full border border-black/10 shadow-sm" 
                            style={{ backgroundColor: color.toLowerCase() }} 
                          />
                          <span className="text-[10px] font-bold uppercase tracking-tight">{color}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sizes Section */}
                {availableSizes.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-stone-400">Select Sizes</h3>
                    <div className="grid grid-cols-4 gap-2">
                      {availableSizes.map(size => (
                        <button
                          key={size}
                          onClick={() => toggleArrayFilter('sizes', size)}
                          className={cn(
                            "h-10 flex items-center justify-center text-[10px] font-bold rounded-md border transition-all",
                            filters.sizes.includes(size)
                              ? "bg-stone-900 text-white border-stone-900 shadow-md"
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
              <div className="p-6 border-t border-stone-100 bg-stone-50/50">
                <div className="flex gap-3">
                  <button
                    onClick={() => setFilters({
                      minPrice: '', maxPrice: '', colors: [], sizes: [], tags: [], sortBy: 'createdAt', sortOrder: 'desc'
                    })}
                    className="flex-1 py-3 text-[11px] font-bold uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors"
                  >
                    Clear All
                  </button>
                  <button
                    onClick={onClose}
                    className="flex-[2] py-3 bg-stone-900 text-white rounded-lg font-bold uppercase text-[11px] tracking-widest hover:bg-stone-800 transition-all shadow-lg active:scale-[0.98]"
                  >
                    Apply Filters
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

const CollectionPage = () => {
  const params = useParams();
  const collectionId = params.id as string;

  const [collection, setCollection] = useState<Collection | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    minPrice: '', maxPrice: '', colors: [], sizes: [], tags: [], sortBy: 'createdAt', sortOrder: 'desc'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [availableColors, setAvailableColors] = useState<string[]>([]);
  const [availableSizes, setAvailableSizes] = useState<string[]>([]);

  useEffect(() => {
    const fetchCollectionData = async () => {
      try {
        setLoading(true);
        // Assuming there's an API for fetching collection data
        const response = await fetch(`/api/collections/${collectionId}`);
        if (!response.ok) throw new Error('Failed to fetch collection data');
        const data = await response.json();
        
        setCollection(data.collection);
        setProducts(data.products || []);

        const colors = new Set<string>();
        const sizes = new Set<string>();
        (data.products || []).forEach((product: Product) => {
          product.colors?.forEach(color => colors.add(color));
          product.sizes?.forEach(size => sizes.add(size));
        });
        setAvailableColors(Array.from(colors).sort());
        setAvailableSizes(Array.from(sizes).sort());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    if (collectionId) fetchCollectionData();
  }, [collectionId]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-stone-200 border-t-stone-900"></div>
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <h1 className="text-4xl font-serif italic text-stone-900 mb-4">Collection Archived</h1>
          <p className="text-stone-500 mb-8">{error || 'This curated collection could not be located.'}</p>
          <Link href="/shopping" className="block w-full py-4 bg-stone-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest">
            Back to Atelier
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-white selection:bg-stone-900 selection:text-white overflow-hidden font-sans">
      <FilterSidebar
        filters={filters} setFilters={setFilters} availableColors={availableColors}
        availableSizes={availableSizes}
        isOpen={showFilters} onClose={() => setShowFilters(false)}
      />

      {/* Immersive Background Layers */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 opacity-[0.02] mix-blend-multiply bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        <motion.div
          animate={{ x: [0, 40, 0], y: [0, 20, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-0 left-0 w-[40%] h-[40%] bg-stone-100/50 blur-[100px] rounded-full"
        />
      </div>

      <div className="relative z-10 w-full">
        {/* Compact Split Hero */}
        <section className="relative px-6 lg:px-12 pt-20 pb-12 w-full">
          <div className="max-w-screen-2xl mx-auto w-full text-center">
               <nav className="flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-stone-300 mb-8">
                <Link href="/shopping" className="hover:text-stone-900 transition-colors">Shopping</Link>
                <div className="w-4 h-px bg-stone-200" />
                <span className="text-stone-900">{collection.name}</span>
              </nav>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="max-w-4xl mx-auto"
              >
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-700 mb-4 block">Seasonal Edit</span>
                <h1 className="text-6xl md:text-8xl lg:text-[7rem] font-serif font-medium leading-[0.9] -tracking-wider text-stone-900 mb-8">
                   {collection.name}
                </h1>
                <p className="text-lg font-serif italic text-stone-500 leading-relaxed max-w-2xl mx-auto">
                    {collection.description || "A curated selection of artisanal pieces celebrating form, texture, and refined aesthetics."}
                </p>
                <div className="flex items-center justify-center gap-6 mt-10">
                   <div className="w-12 h-px bg-stone-200" />
                   <span className="text-xs font-serif font-medium italic text-stone-400">
                      Exploring {products.length} Signature Pieces
                   </span>
                   <div className="w-12 h-px bg-stone-200" />
                </div>
              </motion.div>
          </div>
        </section>

        <div className="flex flex-col min-h-screen px-4 lg:px-12 pb-32">
          {/* Catalog Content (Full Width) */}
          <div className="w-full">
            <div className="sticky top-2 z-40 bg-white/60 backdrop-blur-3xl border border-white/20 rounded-2xl md:rounded-[2.5rem] px-5 py-4 md:px-10 md:py-8 mb-12 md:mb-16 shadow-[0_30px_60px_rgba(0,0,0,0.03)] group transition-all duration-500 max-w-screen-2xl mx-auto">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 md:gap-10">
                  <div className="space-y-0.5 md:space-y-1">
                    <span className="hidden md:block text-[8px] font-black uppercase tracking-[0.4em] text-stone-300">Curated Edit /</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-stone-900 whitespace-nowrap">
                      {filteredProducts.length} Items found
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 md:gap-8 min-w-0">
                  <select
                    value={`${filters.sortBy}_${filters.sortOrder}`}
                    onChange={(e) => {
                      const [sortBy, sortOrder] = e.target.value.split('_');
                      setFilters({ ...filters, sortBy, sortOrder });
                    }}
                    className="bg-transparent text-[9px] md:text-[10px] font-black uppercase tracking-widest border-none focus:ring-0 cursor-pointer text-stone-900 hover:text-stone-400 transition-colors py-0 pr-6"
                  >
                    <option value="createdAt_desc">Latest</option>
                    <option value="price_asc">Price ↑</option>
                    <option value="price_desc">Price ↓</option>
                  </select>

                  <div className="hidden sm:block w-px h-8 bg-stone-100" />

                  <button 
                    onClick={() => setShowFilters(true)} 
                    className="flex items-center gap-2 md:gap-4 text-stone-900 group/btn shrink-0"
                  >
                    <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-stone-900 text-white flex items-center justify-center group-hover/btn:scale-110 transition-transform shadow-xl">
                      <SlidersHorizontal size={13} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] hidden lg:block">Sort & Filter</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Grid Reveal */}
            <section className="max-w-screen-2xl mx-auto">
              {filteredProducts.length > 0 ? (
                <LayoutGroup>
                  <motion.div layout className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-12">
                    {filteredProducts.map((product, index) => (
                      <ProductCard key={product.id} item={product as any} index={index} />
                    ))}
                  </motion.div>
                </LayoutGroup>
              ) : (
                <div className="flex flex-col items-center justify-center py-40 text-center">
                  <div className="w-24 h-24 rounded-full bg-stone-50 flex items-center justify-center text-stone-200 mb-8 border border-stone-100">
                    <ShoppingBag size={40} strokeWidth={1} />
                  </div>
                  <h3 className="text-3xl font-serif italic text-stone-900 mb-2">No Match In This Collection</h3>
                  <p className="text-stone-400 text-sm max-w-xs mx-auto mb-10 leading-relaxed">Consider refining your selection criteria to discover more available pieces.</p>
                  <button onClick={() => setFilters({...filters, colors: [], sizes: []})} className="px-10 py-5 bg-stone-900 text-white text-[10px] font-black uppercase tracking-widest rounded-3xl hover:scale-105 transition-all">
                    Reset Selection
                  </button>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollectionPage;
