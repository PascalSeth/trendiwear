'use client';

import React, { useState, useMemo, useRef } from 'react';
import { 
  ShoppingBag, 
  X, 
  SlidersHorizontal, 
  ArrowRight, 
  Search, 
  Check, 
  LayoutGrid, 
  Grid3X3, 
  RefreshCw, 
  ChevronRight, 
  ChevronLeft 
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { ProductCard } from '@/components/common/ProductCard';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  parent?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  children: Array<{
    id: string;
    name: string;
    slug: string;
    imageUrl?: string | null;
    _count: {
      products: number;
    };
  }>;
  _count: {
    products: number;
  };
}

interface OtherCategory {
  id: string;
  name: string;
  slug: string;
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
  viewCount?: number;
  stockQuantity: number;
  createdAt: string | Date;
  effectivePrice?: number;
  isDiscountActive?: boolean;
  discountAmount?: number;
  discountPercentage?: number | null;
  discountEndDate?: string | null;
  isPreorder?: boolean;
  estimatedDelivery?: number;
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
    id?: string;
    firstName: string;
    lastName: string;
    professionalProfile?: {
      businessName?: string | null;
      businessImage?: string | null;
      isVerified?: boolean;
      rating?: number | null;
    } | null;
  };
  _count?: {
    wishlistItems?: number;
  };
}

interface Filters {
  minPrice?: string;
  maxPrice?: string;
  colors: string[];
  sizes: string[];
  quickFilter: 'all' | 'under300' | 'inStock' | 'custom';
  sortBy: 'recommended' | 'price-asc' | 'price-desc' | 'newest';
}

function FilterSidebar({
  filters,
  setFilters,
  availableColors,
  availableSizes,
  isOpen,
  onClose,
  totalResults
}: {
  filters: Filters;
  setFilters: (filters: Filters) => void;
  availableColors: string[];
  availableSizes: string[];
  isOpen: boolean;
  onClose: () => void;
  totalResults: number;
}) {
  const updateFilters = (key: keyof Filters, value: string | string[]) => {
    setFilters({ ...filters, [key]: value });
  };

  const toggleArrayFilter = (key: 'colors' | 'sizes', value: string) => {
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
      transition: { type: 'spring', stiffness: 320, damping: 32 }
    },
    exit: { 
      x: '100%',
      transition: { ease: 'easeInOut', duration: 0.3 }
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
            className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm z-[9998]" 
            onClick={onClose} 
          />
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed top-0 right-0 h-screen w-full sm:w-[420px] bg-white z-[9999] shadow-2xl overflow-hidden border-l border-stone-200"
          >
            <div className="flex flex-col h-full">
              
              <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100 bg-stone-50/50">
                <div>
                  <h2 className="text-lg font-serif font-bold text-stone-900">Filters &amp; Refinements</h2>
                  <p className="text-xs text-stone-500 font-sans">Showing {totalResults} matching pieces</p>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-stone-200/60 rounded-full transition-colors text-stone-700"
                  aria-label="Close filters"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 custom-scrollbar">
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-800">
                    Price Range (GH₵)
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-medium text-stone-400 uppercase">Min Price</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-xs font-mono">GH₵</span>
                        <input
                          type="number"
                          value={filters.minPrice || ''}
                          onChange={(e) => updateFilters('minPrice', e.target.value)}
                          placeholder="0"
                          className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-11 pr-3 py-2.5 text-xs outline-none focus:border-stone-900 focus:bg-white transition-all"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-medium text-stone-400 uppercase">Max Price</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-xs font-mono">GH₵</span>
                        <input
                          type="number"
                          value={filters.maxPrice || ''}
                          onChange={(e) => updateFilters('maxPrice', e.target.value)}
                          placeholder="Max"
                          className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-11 pr-3 py-2.5 text-xs outline-none focus:border-stone-900 focus:bg-white transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {availableColors.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-stone-800">
                      Colors ({filters.colors.length} selected)
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {availableColors.map(color => {
                        const isSelected = filters.colors.includes(color);
                        return (
                          <button
                            key={color}
                            onClick={() => toggleArrayFilter('colors', color)}
                            className={cn(
                              "flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs transition-all",
                              isSelected
                                ? "border-stone-900 bg-stone-900 text-white shadow-sm"
                                : "border-stone-200 bg-white text-stone-700 hover:border-stone-400"
                            )}
                          >
                            <span 
                              className="w-3 h-3 rounded-full border border-black/10 shrink-0" 
                              style={{ backgroundColor: color.toLowerCase() }} 
                            />
                            <span className="capitalize">{color}</span>
                            {isSelected && <Check size={12} className="ml-0.5" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {availableSizes.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-stone-800">
                      Sizes ({filters.sizes.length} selected)
                    </h3>
                    <div className="grid grid-cols-4 gap-2">
                      {availableSizes.map(size => {
                        const isSelected = filters.sizes.includes(size);
                        return (
                          <button
                            key={size}
                            onClick={() => toggleArrayFilter('sizes', size)}
                            className={cn(
                              "h-10 flex items-center justify-center text-xs font-semibold rounded-xl border transition-all",
                              isSelected
                                ? "bg-stone-900 text-white border-stone-900 shadow-sm"
                                : "bg-white text-stone-700 border-stone-200 hover:border-stone-400"
                            )}
                          >
                            {size}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

              </div>

              <div className="p-5 border-t border-stone-200 bg-stone-50/50 space-y-2">
                <button
                  onClick={onClose}
                  className="w-full py-3.5 bg-stone-900 text-white rounded-xl font-semibold text-xs tracking-wide hover:bg-black transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <span>Show {totalResults} items</span>
                  <ArrowRight size={14} />
                </button>
                <button
                  onClick={() => setFilters({
                    minPrice: '',
                    maxPrice: '',
                    colors: [],
                    sizes: [],
                    quickFilter: 'all',
                    sortBy: 'recommended'
                  })}
                  className="w-full py-2 text-xs font-medium text-stone-500 hover:text-stone-900 transition-colors"
                >
                  Reset All Filters
                </button>
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

interface CategoryDetailClientProps {
  category: Category;
  initialProducts: Product[];
  availableColors: string[];
  availableSizes: string[];
  otherCategories?: OtherCategory[];
}

export default function CategoryDetailClient({ 
  category, 
  initialProducts,
  availableColors,
  availableSizes,
  otherCategories = []
}: CategoryDetailClientProps) {
  const [filters, setFilters] = useState<Filters>({
    minPrice: '',
    maxPrice: '',
    colors: [],
    sizes: [],
    quickFilter: 'all',
    sortBy: 'recommended'
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | null>(null);
  const [gridCols, setGridCols] = useState<4 | 5>(5);

  const subcategoryScrollRef = useRef<HTMLDivElement>(null);
  const catalogGridRef = useRef<HTMLElement>(null);

  const scrollToCatalog = () => {
    if (catalogGridRef.current) {
      catalogGridRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleScrollSubcategories = (direction: 'left' | 'right') => {
    if (!subcategoryScrollRef.current) return;
    const offset = direction === 'left' ? -260 : 260;
    subcategoryScrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
  };

  const filteredProducts = useMemo(() => {
    let list = [...initialProducts];

    if (selectedSubcategoryId) {
      list = list.filter(p => p.categories?.some(c => c.id === selectedSubcategoryId));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(p => {
        const nameMatch = p.name.toLowerCase().includes(q);
        const descMatch = p.description?.toLowerCase().includes(q);
        const sellerMatch = 
          p.professional?.firstName.toLowerCase().includes(q) ||
          p.professional?.lastName.toLowerCase().includes(q) ||
          p.professional?.professionalProfile?.businessName?.toLowerCase().includes(q);

        return nameMatch || descMatch || sellerMatch;
      });
    }

    if (filters.quickFilter === 'under300') {
      list = list.filter(p => (p.effectivePrice ?? p.price) <= 300);
    } else if (filters.quickFilter === 'inStock') {
      list = list.filter(p => p.stockQuantity > 0);
    } else if (filters.quickFilter === 'custom') {
      list = list.filter(p => p.isPreorder || (p.sizes && p.sizes.length > 0));
    }

    if (filters.minPrice) {
      const min = parseFloat(filters.minPrice);
      if (!isNaN(min)) {
        list = list.filter(p => (p.effectivePrice ?? p.price) >= min);
      }
    }
    if (filters.maxPrice) {
      const max = parseFloat(filters.maxPrice);
      if (!isNaN(max)) {
        list = list.filter(p => (p.effectivePrice ?? p.price) <= max);
      }
    }

    if (filters.colors.length > 0) {
      list = list.filter(p => filters.colors.some(color => p.colors?.includes(color)));
    }

    if (filters.sizes.length > 0) {
      list = list.filter(p => filters.sizes.some(size => p.sizes?.includes(size)));
    }

    if (filters.sortBy === 'price-asc') {
      list.sort((a, b) => (a.effectivePrice ?? a.price) - (b.effectivePrice ?? b.price));
    } else if (filters.sortBy === 'price-desc') {
      list.sort((a, b) => (b.effectivePrice ?? b.price) - (a.effectivePrice ?? a.price));
    } else if (filters.sortBy === 'newest') {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return list;
  }, [initialProducts, selectedSubcategoryId, searchQuery, filters]);

  const activeSubcategory = useMemo(() => {
    if (!selectedSubcategoryId) return null;
    return category.children.find(c => c.id === selectedSubcategoryId);
  }, [category, selectedSubcategoryId]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.minPrice || filters.maxPrice) count += 1;
    if (filters.colors.length > 0) count += filters.colors.length;
    if (filters.sizes.length > 0) count += filters.sizes.length;
    if (filters.quickFilter !== 'all') count += 1;
    return count;
  }, [filters]);

  return (
    <div className="relative min-h-screen bg-[#FAF9F5] selection:bg-stone-900 selection:text-amber-100 overflow-x-hidden font-sans text-stone-900">
      
      <FilterSidebar
        filters={filters} 
        setFilters={setFilters} 
        availableColors={availableColors}
        availableSizes={availableSizes}
        isOpen={showFilters} 
        onClose={() => setShowFilters(false)}
        totalResults={filteredProducts.length}
      />

      <section className="relative pt-28 md:pt-36 lg:pt-40 pb-12 lg:pb-16 border-b border-stone-200/80">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] pointer-events-none overflow-hidden -z-10">
          <div className="absolute top-[-5%] left-[15%] w-[450px] h-[450px] rounded-full bg-amber-200/20 blur-[110px]" />
          <div className="absolute top-[10%] right-[10%] w-[400px] h-[400px] rounded-full bg-stone-200/40 blur-[120px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-8 items-center">
            
            <div className="lg:col-span-7 space-y-6">
              <nav className="flex items-center gap-2 text-xs text-stone-500 font-sans" aria-label="Breadcrumb">
                <Link href="/shopping" className="hover:text-stone-900 transition-colors">Shop</Link>
                <span>/</span>
                <Link href="/shopping" className="hover:text-stone-900 transition-colors">Categories</Link>
                {category.parent && (
                  <>
                    <span>/</span>
                    <Link href={`/shopping/categories/${category.parent.slug}`} className="hover:text-stone-900 transition-colors">{category.parent.name}</Link>
                  </>
                )}
                <span>/</span>
                <span className="text-stone-900 font-medium">{category.name}</span>
              </nav>

              <div className="space-y-2">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-normal tracking-tight text-stone-900 leading-[1.1]">
                  {activeSubcategory ? activeSubcategory.name : category.name}
                </h1>
                <p className="text-xs text-stone-500 font-sans">
                  {filteredProducts.length} items
                </p>
              </div>

              {category.description && (
                <p className="text-stone-600 font-sans text-sm sm:text-base leading-relaxed max-w-lg">
                  {category.description}
                </p>
              )}

              <div className="pt-1 max-w-lg">
                <div className="relative flex items-center bg-white rounded-2xl shadow-sm border border-stone-200 p-1.5 focus-within:border-stone-900 focus-within:ring-1 focus-within:ring-stone-900 transition-all">
                  <div className="pl-3 text-stone-400"><Search size={18} /></div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`Search in ${activeSubcategory?.name || category.name}...`}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-transparent outline-none text-stone-800 placeholder:text-stone-400 font-sans"
                  />
                  {searchQuery && (
                    <button type="button" onClick={() => setSearchQuery('')} className="p-1.5 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors mr-1">
                      <X size={15} />
                    </button>
                  )}
                  <button type="button" onClick={scrollToCatalog} className="bg-stone-900 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-black transition-all shrink-0">Search</button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-xs sm:max-w-sm">
                <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden shadow-md border border-stone-200 bg-stone-100">
                  <Image
                    src={activeSubcategory?.imageUrl || category.imageUrl || "/placeholder-category.jpg"}
                    alt={activeSubcategory?.name || category.name}
                    fill
                    priority
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {category.children.length > 0 && (
        <section className="bg-white border-b border-stone-200 py-3 sticky top-16 md:top-20 z-20 shadow-xs backdrop-blur-md bg-white/95">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-stone-500 font-medium">Subcategories:</span>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => handleScrollSubcategories('left')} className="w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600 transition-colors" aria-label="Scroll left"><ChevronLeft size={14} /></button>
                <button type="button" onClick={() => handleScrollSubcategories('right')} className="w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600 transition-colors" aria-label="Scroll right"><ChevronRight size={14} /></button>
              </div>
            </div>
            <div ref={subcategoryScrollRef} className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 scroll-smooth">
              <button type="button" onClick={() => setSelectedSubcategoryId(null)} className={cn("px-3.5 py-1.5 rounded-full text-xs font-medium tracking-wide whitespace-nowrap transition-all shrink-0 border", selectedSubcategoryId === null ? "bg-stone-900 text-white border-stone-900 shadow-sm" : "bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100")}>
                All {category.name} ({initialProducts.length})
              </button>
              {category.children.map((child) => {
                const isSelected = selectedSubcategoryId === child.id;
                return (
                  <button key={child.id} type="button" onClick={() => setSelectedSubcategoryId(isSelected ? null : child.id)} className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all shrink-0 border", isSelected ? "bg-stone-900 text-white border-stone-900 shadow-sm" : "bg-white text-stone-700 border-stone-200 hover:border-stone-400")}>
                    {child.imageUrl && (
                      <div className="relative w-4 h-4 rounded-full overflow-hidden shrink-0 border border-stone-200 bg-stone-100">
                        <Image src={child.imageUrl} alt={child.name} fill className="object-cover" />
                      </div>
                    )}
                    <span>{child.name}</span>
                    <span className={cn("text-[10px] font-mono px-1.5 py-0.2 rounded-full", isSelected ? "bg-stone-800 text-stone-200" : "bg-stone-100 text-stone-500")}>
                      {child._count.products}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <section ref={catalogGridRef} id="category-grid" className="py-10 md:py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-4 pb-6 border-b border-stone-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'all', label: 'All' },
                { id: 'under300', label: 'Under GH₵300' },
                { id: 'inStock', label: 'In Stock' },
                { id: 'custom', label: 'Custom Fit' }
              ].map((tab) => (
                <button key={tab.id} type="button" onClick={() => setFilters({ ...filters, quickFilter: tab.id as typeof filters.quickFilter })} className={cn("px-3.5 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all", filters.quickFilter === tab.id ? "bg-stone-900 text-white shadow-sm" : "bg-white text-stone-600 hover:bg-stone-100 border border-stone-200")}>
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3 self-end md:self-auto">
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-stone-200 shadow-sm text-xs">
                <span className="text-stone-400 font-medium">Sort:</span>
                <select value={filters.sortBy} onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as typeof filters.sortBy })} aria-label="Sort products by" className="bg-transparent font-medium text-stone-800 outline-none cursor-pointer">
                  <option value="recommended">Recommended</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="newest">Newest Arrivals</option>
                </select>
              </div>
              <button type="button" onClick={() => setShowFilters(true)} className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-xl border border-stone-200 shadow-sm text-xs font-medium hover:border-stone-900 transition-colors">
                <SlidersHorizontal size={14} />
                <span>Filters</span>
                {activeFilterCount > 0 && <span className="w-5 h-5 rounded-full bg-stone-900 text-white text-[10px] flex items-center justify-center font-bold">{activeFilterCount}</span>}
              </button>
              <div className="hidden lg:flex items-center gap-1 bg-white p-1 rounded-xl border border-stone-200 shadow-sm">
                <button type="button" onClick={() => setGridCols(5)} className={cn("p-1.5 rounded-lg transition-colors", gridCols === 5 ? "bg-stone-900 text-white" : "text-stone-400 hover:text-stone-700")} aria-label="5 columns compact cute grid" title="Cute Compact (5 columns)"><Grid3X3 size={15} /></button>
                <button type="button" onClick={() => setGridCols(4)} className={cn("p-1.5 rounded-lg transition-colors", gridCols === 4 ? "bg-stone-900 text-white" : "text-stone-400 hover:text-stone-700")} aria-label="4 columns" title="Standard (4 columns)"><LayoutGrid size={15} /></button>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-stone-600 pt-1">
            <span>Showing <strong className="text-stone-900">{filteredProducts.length}</strong> items</span>
            {selectedSubcategoryId && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-medium">
                Subcategory: {activeSubcategory?.name}
                <button type="button" onClick={() => setSelectedSubcategoryId(null)} className="hover:text-black ml-1"><X size={12} /></button>
              </span>
            )}
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-stone-200 text-stone-900 font-medium">
                &ldquo;{searchQuery}&rdquo;
                <button type="button" onClick={() => setSearchQuery('')} className="hover:text-black ml-1"><X size={12} /></button>
              </span>
            )}
            {(selectedSubcategoryId || searchQuery || activeFilterCount > 0) && (
              <button type="button" onClick={() => { setSelectedSubcategoryId(null); setSearchQuery(''); setFilters({ minPrice: '', maxPrice: '', colors: [], sizes: [], quickFilter: 'all', sortBy: 'recommended' }); }} className="text-stone-500 hover:text-stone-900 underline font-medium ml-1">Reset all</button>
            )}
          </div>
        </div>
        <div className="pt-6">
          {filteredProducts.length > 0 ? (
            <LayoutGroup>
              <motion.div layout className={cn("grid grid-cols-2 gap-x-2.5 sm:gap-x-3.5 lg:gap-x-4 gap-y-4 sm:gap-y-6 lg:gap-y-7", gridCols === 5 ? "sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6" : "sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5")}>
                <AnimatePresence mode="popLayout">
                  {filteredProducts.map((product, index) => (
                    <motion.div layout key={product.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.4, delay: index * 0.03 }}>
                      <ProductCard item={product as unknown as Parameters<typeof ProductCard>[0]['item']} index={index} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            </LayoutGroup>
          ) : (
            <div className="py-16 text-center space-y-4 bg-white rounded-2xl border border-stone-200 p-8 max-w-md mx-auto my-8">
              <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-600 flex items-center justify-center mx-auto"><ShoppingBag size={22} /></div>
              <div className="space-y-1">
                <h3 className="text-lg font-medium text-stone-900">No products found</h3>
                <p className="text-xs text-stone-500 font-sans">Try adjusting your filters or search query.</p>
              </div>
              <button type="button" onClick={() => { setSelectedSubcategoryId(null); setSearchQuery(''); setFilters({ minPrice: '', maxPrice: '', colors: [], sizes: [], quickFilter: 'all', sortBy: 'recommended' }); }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-stone-900 text-white text-xs font-medium hover:bg-black transition-all">
                <RefreshCw size={12} />
                <span>Reset filters</span>
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-stone-900 text-white p-8 sm:p-10 border border-stone-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-xl space-y-2 text-left">
            <h3 className="text-xl sm:text-2xl font-serif font-normal tracking-tight">Need custom tailoring?</h3>
            <p className="text-stone-300 text-xs sm:text-sm font-sans leading-relaxed">Connect directly with verified tailors in Ghana for custom orders, measurements, and fittings.</p>
          </div>
          <div className="shrink-0">
            <Link href="/tailors-designers"><button type="button" className="bg-amber-500 text-stone-950 px-5 py-2.5 rounded-full text-xs font-semibold hover:bg-amber-400 transition-all flex items-center justify-center gap-1.5"><span>Find a Tailor</span><ArrowRight size={13} /></button></Link>
          </div>
        </div>
      </section>

      {otherCategories.length > 0 && (
        <section className="py-14 border-t border-stone-200 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-2xl font-serif text-stone-900">Other Categories</h4>
              <Link href="/shopping" className="text-xs font-medium text-stone-600 hover:text-black flex items-center gap-1"><span>View All</span><ArrowRight size={13} /></Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 sm:gap-4">
              {otherCategories.filter(c => c.slug !== category.slug).slice(0, 6).map((other) => (
                <Link key={other.id} href={`/shopping/categories/${other.slug}`} className="group relative aspect-[3/4] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all bg-stone-100 block">
                  <Image src={other.imageUrl || "/placeholder-category.jpg"} alt={other.name} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent opacity-70 group-hover:opacity-85 transition-opacity" />
                  <div className="absolute inset-x-0 bottom-0 p-3 text-white">
                    <span className="text-[10px] font-mono text-stone-300 block">{other._count.products} items</span>
                    <h5 className="text-sm font-medium leading-snug">{other.name}</h5>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f5f5f4;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d6d3d1;
          border-radius: 9999px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #a8a29e;
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
