'use client';

import React, { useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  X, 
  ArrowRight, 
  ShieldCheck, 
  Scissors, 
  Truck, 
  CreditCard, 
  ChevronRight, 
  ChevronLeft,
  LayoutGrid, 
  Grid3X3, 
  ShoppingBag, 
  RefreshCw
} from 'lucide-react';
import { ProductCard } from '@/components/common/ProductCard';
import { CategoryNavigator } from './components/CategoryNavigator';
import { cn } from '@/lib/utils';

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
    reviews?: number;
  };
  effectivePrice?: number;
  isDiscountActive?: boolean;
  discountAmount?: number;
  discountPercentage?: number | null;
  discountEndDate?: string | null;
  isPreorder?: boolean;
  estimatedDelivery?: number;
}

interface ShoppingClientProps {
  initialData: {
    categories: Category[];
    featuredProducts: Product[];
    trendingProducts: Product[];
    collections: Collection[];
  };
}

const POPULAR_SEARCH_TAGS = [
  'Dresses',
  'Kente',
  'Kaftans',
  'Shirts',
  'Suits',
  'Accessories'
];

export default function ShoppingClient({ initialData }: ShoppingClientProps) {
  const { categories, featuredProducts, trendingProducts, collections } = initialData;

  // --- Combined product universe ---
  const allInitialProducts = useMemo(() => {
    const map = new Map<string, Product>();
    featuredProducts.forEach((p) => map.set(p.id, p));
    trendingProducts.forEach((p) => map.set(p.id, p));
    return Array.from(map.values());
  }, [featuredProducts, trendingProducts]);

  // --- Client State ---
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'featured' | 'trending' | 'under300' | 'custom'>('all');
  const [sortBy, setSortBy] = useState<'recommended' | 'price-asc' | 'price-desc' | 'newest'>('recommended');
  const [gridCols, setGridCols] = useState<4 | 5>(5);

  const catalogRef = useRef<HTMLElement>(null);
  const collectionScrollRef = useRef<HTMLDivElement>(null);

  // Scroll to catalog helper
  const scrollToCatalog = () => {
    if (catalogRef.current) {
      catalogRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Quick tag selection
  const handleTagClick = (tag: string) => {
    setSearchQuery(tag);
    setSelectedCategory(null);
    scrollToCatalog();
  };

  // Scroll collections horizontal
  const handleScrollCollections = (direction: 'left' | 'right') => {
    if (!collectionScrollRef.current) return;
    const offset = direction === 'left' ? -380 : 380;
    collectionScrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
  };

  // --- Filtering & Sorting ---
  const filteredProducts = useMemo(() => {
    let list: Product[] = [];

    // 1. Filter by Tab
    if (activeTab === 'featured') {
      list = [...featuredProducts];
    } else if (activeTab === 'trending') {
      list = [...trendingProducts];
    } else if (activeTab === 'under300') {
      list = allInitialProducts.filter((p) => (p.effectivePrice ?? p.price) <= 300);
    } else if (activeTab === 'custom') {
      list = allInitialProducts.filter((p) => p.isPreorder || (p.sizes && p.sizes.length > 0));
    } else {
      list = [...allInitialProducts];
    }

    // 2. Filter by Category Slug
    if (selectedCategory) {
      list = list.filter((p) =>
        p.categories?.some((c) => c.slug === selectedCategory)
      );
    }

    // 3. Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((p) => {
        const nameMatch = p.name.toLowerCase().includes(q);
        const descMatch = p.description?.toLowerCase().includes(q);
        const catMatch = p.categories?.some((c) => c.name.toLowerCase().includes(q));
        const sellerMatch =
          p.professional?.firstName.toLowerCase().includes(q) ||
          p.professional?.lastName.toLowerCase().includes(q) ||
          p.professional?.professionalProfile?.businessName?.toLowerCase().includes(q);

        return nameMatch || descMatch || catMatch || sellerMatch;
      });
    }

    // 4. Sort
    if (sortBy === 'price-asc') {
      list.sort((a, b) => (a.effectivePrice ?? a.price) - (b.effectivePrice ?? b.price));
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => (b.effectivePrice ?? b.price) - (a.effectivePrice ?? a.price));
    } else if (sortBy === 'newest') {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return list;
  }, [allInitialProducts, featuredProducts, trendingProducts, activeTab, selectedCategory, searchQuery, sortBy]);

  // Active category display name
  const activeCategoryObj = useMemo(() => {
    if (!selectedCategory) return null;
    return categories.find((c) => c.slug === selectedCategory);
  }, [categories, selectedCategory]);

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-stone-900 selection:bg-stone-900 selection:text-amber-100 overflow-x-hidden">
      
      {/* ── 1. HERO SECTION ── */}
      <section className="relative pt-20 sm:pt-22 lg:pt-24 pb-8 sm:pb-10 lg:pb-12 border-b border-stone-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Column: Heading & Search */}
            <div className="lg:col-span-7 space-y-4 sm:space-y-5 text-left">
              <div className="space-y-2">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-normal tracking-tight text-stone-900 leading-[1.15]">
                  Shop African Fashion &amp; Tailoring
                </h1>
                <p className="text-xs sm:text-sm text-stone-600 max-w-lg font-sans leading-relaxed">
                  Ready-to-wear clothing and custom tailoring from designers across Ghana.
                </p>
              </div>

              {/* Instant Search Bar */}
              <div className="space-y-2.5 pt-0.5">
                <div className="relative max-w-lg flex items-center bg-white rounded-2xl shadow-xs border border-stone-200 p-1.5 focus-within:border-stone-900 focus-within:ring-1 focus-within:ring-stone-900 transition-all">
                  <div className="pl-3.5 text-stone-400">
                    <Search size={16} />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') scrollToCatalog();
                    }}
                    placeholder="Search by item, category, or designer..."
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-transparent outline-none text-stone-800 placeholder:text-stone-400 font-sans"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="p-1 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors mr-1"
                      aria-label="Clear search"
                    >
                      <X size={14} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={scrollToCatalog}
                    className="bg-stone-900 text-white px-4.5 py-2 rounded-xl text-xs font-semibold hover:bg-black transition-all shrink-0"
                  >
                    Search
                  </button>
                </div>

                {/* Popular Tags */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-stone-400 font-medium text-[11px] mr-1">Popular:</span>
                  {POPULAR_SEARCH_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleTagClick(tag)}
                      className="px-2.5 py-0.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors text-[11px] font-medium"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Clean Editorial Photo */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-sm lg:max-w-md w-full">
                <div className="relative h-[250px] sm:h-[280px] lg:h-[320px] w-full rounded-2xl overflow-hidden shadow-sm border border-stone-200 bg-stone-100">
                  <Image
                    src="/woman.png"
                    alt="African Fashion"
                    fill
                    className="object-cover object-[center_12%]"
                    priority
                  />
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── 2. VALUE PROPOSITIONS BAR ── */}
      <section className="bg-white border-b border-stone-200/80 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center text-stone-700 shrink-0 mt-0.5">
                <Scissors size={16} />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-semibold text-stone-900">Custom Tailoring</h4>
                <p className="text-[11px] sm:text-xs text-stone-500 leading-snug mt-0.5">
                  Made to measure with your sizes or fabric.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center text-stone-700 shrink-0 mt-0.5">
                <ShieldCheck size={16} />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-semibold text-stone-900">Verified Designers</h4>
                <p className="text-[11px] sm:text-xs text-stone-500 leading-snug mt-0.5">
                  Authentic Ghanaian fashion brands and tailors.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center text-stone-700 shrink-0 mt-0.5">
                <Truck size={16} />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-semibold text-stone-900">Nationwide Delivery</h4>
                <p className="text-[11px] sm:text-xs text-stone-500 leading-snug mt-0.5">
                  Delivery available across all regions in Ghana.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center text-stone-700 shrink-0 mt-0.5">
                <CreditCard size={16} />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-semibold text-stone-900">Mobile Money &amp; Cards</h4>
                <p className="text-[11px] sm:text-xs text-stone-500 leading-snug mt-0.5">
                  Pay with MTN MoMo, Telecel Cash, or debit cards.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── 3. STICKY CATEGORY NAVIGATOR STRIP ── */}
      <section className="bg-stone-50/90 border-b border-stone-200/80 sticky top-16 md:top-20 z-30 backdrop-blur-md shadow-sm">
        <div className="max-w-7xl mx-auto">
          <CategoryNavigator
            categories={categories}
            activeCategory={selectedCategory}
            onSelectCategory={(slug) => {
              setSelectedCategory(slug);
              scrollToCatalog();
            }}
          />
        </div>
      </section>

      {/* ── 4. CATEGORIES ── */}
      {categories.length > 0 && (
        <section className="py-12 md:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 mb-6">
            <h2 className="text-2xl sm:text-3xl font-serif text-stone-900 tracking-tight">
              Categories
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {categories.slice(0, 6).map((cat) => (
              <Link
                key={cat.id}
                href={`/shopping/categories/${cat.slug}`}
                className="group relative aspect-[3/4] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 bg-stone-100 block"
              >
                <Image
                  src={cat.imageUrl || "/placeholder-category.jpg"}
                  alt={cat.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-950/20 to-transparent opacity-70 group-hover:opacity-85 transition-opacity" />
                
                <div className="absolute inset-x-0 bottom-0 p-3.5 flex flex-col justify-end text-white">
                  <span className="text-[10px] font-mono text-stone-300 mb-0.5">
                    {cat._count.products} items
                  </span>
                  <h3 className="text-sm sm:text-base font-medium leading-tight">
                    {cat.name}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── 5. COLLECTIONS ── */}
      {collections.length > 0 && (
        <section className="py-12 bg-stone-100/60 border-y border-stone-200/80 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl sm:text-3xl font-serif text-stone-900 tracking-tight">
                Collections
              </h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleScrollCollections('left')}
                  className="w-8 h-8 rounded-full bg-white shadow-sm border border-stone-200 flex items-center justify-center text-stone-700 hover:bg-stone-900 hover:text-white transition-colors"
                  aria-label="Previous collection"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => handleScrollCollections('right')}
                  className="w-8 h-8 rounded-full bg-white shadow-sm border border-stone-200 flex items-center justify-center text-stone-700 hover:bg-stone-900 hover:text-white transition-colors"
                  aria-label="Next collection"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            <div
              ref={collectionScrollRef}
              className="flex gap-4 sm:gap-6 overflow-x-auto no-scrollbar pb-2 scroll-smooth"
            >
              {collections.map((col) => (
                <div
                  key={col.id}
                  className="shrink-0 w-[260px] sm:w-[320px] group cursor-pointer"
                >
                  <Link href={`/shopping/collections/${col.slug}`}>
                    <div className="relative aspect-[4/5] rounded-2xl overflow-hidden shadow-sm border border-stone-200/60 transition-transform duration-300 group-hover:-translate-y-0.5">
                      <Image
                        src={col.imageUrl || "/placeholder-collection.jpg"}
                        alt={col.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-950/20 to-transparent opacity-75 group-hover:opacity-85 transition-opacity" />

                      <div className="absolute inset-x-0 bottom-0 p-5 flex flex-col items-start text-white">
                        <span className="text-[10px] font-mono text-stone-300 mb-1">
                          {col._count.products} items
                        </span>
                        <h3 className="text-xl font-serif font-medium leading-snug">
                          {col.name}
                        </h3>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 6. PRODUCTS CATALOG ── */}
      <section ref={catalogRef} id="catalog" className="py-12 md:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Catalog Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-stone-200">
          <div>
            <h2 className="text-2xl sm:text-4xl font-serif text-stone-900 tracking-tight">
              {activeCategoryObj ? activeCategoryObj.name : 'All Products'}
            </h2>
          </div>

          {/* Tab Filters */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'All' },
              { id: 'featured', label: 'New In' },
              { id: 'trending', label: 'Trending' },
              { id: 'under300', label: 'Under GH₵300' },
              { id: 'custom', label: 'Custom Fit' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={cn(
                  "px-3.5 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all",
                  activeTab === tab.id
                    ? "bg-stone-900 text-white shadow-sm"
                    : "bg-white text-stone-600 hover:bg-stone-100 border border-stone-200"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Secondary Filter & Sort Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4">
          
          {/* Active search or category status */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-stone-600">
            <span>Showing <strong className="text-stone-900">{filteredProducts.length}</strong> items</span>

            {selectedCategory && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-medium">
                Category: {activeCategoryObj?.name || selectedCategory}
                <button
                  type="button"
                  onClick={() => setSelectedCategory(null)}
                  className="hover:text-amber-950 ml-1"
                >
                  <X size={12} />
                </button>
              </span>
            )}

            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-stone-200 text-stone-900 font-medium">
                &ldquo;{searchQuery}&rdquo;
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="hover:text-black ml-1"
                >
                  <X size={12} />
                </button>
              </span>
            )}

            {(selectedCategory || searchQuery || activeTab !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory(null);
                  setSearchQuery('');
                  setActiveTab('all');
                }}
                className="text-stone-500 hover:text-stone-900 underline font-medium ml-1"
              >
                Reset all
              </button>
            )}
          </div>

          {/* Controls: Sorting & Grid Toggle */}
          <div className="flex items-center gap-3 self-end sm:self-auto">
            {/* Sort select */}
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-stone-200 shadow-sm text-xs">
              <span className="text-stone-400 font-medium">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                aria-label="Sort products by"
                className="bg-transparent font-medium text-stone-800 outline-none cursor-pointer"
              >
                <option value="recommended">Recommended</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="newest">Newest Arrivals</option>
              </select>
            </div>

            {/* Desktop Grid Switcher */}
            <div className="hidden lg:flex items-center gap-1 bg-white p-1 rounded-xl border border-stone-200 shadow-sm">
              <button
                type="button"
                onClick={() => setGridCols(5)}
                className={cn(
                  "p-1.5 rounded-lg transition-colors",
                  gridCols === 5 ? "bg-stone-900 text-white" : "text-stone-400 hover:text-stone-700"
                )}
                aria-label="5 columns compact cute grid"
                title="Cute Compact (5 columns)"
              >
                <Grid3X3 size={15} />
              </button>
              <button
                type="button"
                onClick={() => setGridCols(4)}
                className={cn(
                  "p-1.5 rounded-lg transition-colors",
                  gridCols === 4 ? "bg-stone-900 text-white" : "text-stone-400 hover:text-stone-700"
                )}
                aria-label="4 columns grid"
                title="Standard (4 columns)"
              >
                <LayoutGrid size={15} />
              </button>
            </div>

          </div>
        </div>

        {/* Product Grid */}
        {filteredProducts.length > 0 ? (
          <motion.div
            layout
            className={cn(
              "grid grid-cols-2 gap-x-2.5 sm:gap-x-3.5 lg:gap-x-4 gap-y-4 sm:gap-y-6 lg:gap-y-7 pt-3",
              gridCols === 5
                ? "sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
                : "sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5"
            )}
          >
            <AnimatePresence mode="popLayout">
              {filteredProducts.map((product, index) => (
                <ProductCard
                  key={product.id}
                  item={product as unknown as Parameters<typeof ProductCard>[0]['item']}
                  index={index}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          /* Empty State */
          <div className="py-16 text-center space-y-4 bg-white rounded-2xl border border-stone-200 p-8 max-w-md mx-auto my-8">
            <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-600 flex items-center justify-center mx-auto">
              <ShoppingBag size={22} />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-medium text-stone-900">No products found</h3>
              <p className="text-xs text-stone-500 font-sans">
                Try clearing your search or changing the filters.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory(null);
                setActiveTab('all');
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-stone-900 text-white text-xs font-medium hover:bg-black transition-all"
            >
              <RefreshCw size={12} />
              <span>Clear filters</span>
            </button>
          </div>
        )}

      </section>

      {/* ── 7. BESPOKE TAILORING BANNER ── */}
      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-stone-900 text-white p-8 sm:p-10 border border-stone-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-xl space-y-2">
            <h3 className="text-xl sm:text-2xl font-serif font-normal tracking-tight">
              Have your own fabric?
            </h3>
            <p className="text-stone-300 text-xs sm:text-sm font-sans leading-relaxed">
              Connect directly with verified tailors in Ghana for custom dressmaking, bridal wear, and tailored shirts with your fabric.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link href="/tailors-designers">
              <button
                type="button"
                className="bg-amber-500 text-stone-950 px-5 py-2.5 rounded-full text-xs font-semibold hover:bg-amber-400 transition-all flex items-center gap-1.5"
              >
                <span>Find a Tailor</span>
                <ArrowRight size={13} />
              </button>
            </Link>
            <Link href="/fashion-trends">
              <button
                type="button"
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2.5 rounded-full text-xs font-medium transition-all"
              >
                View Styles
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── 8. JOIN AS DESIGNER CALLOUT ── */}
      <section className="py-16 border-t border-stone-200 bg-white">
        <div className="max-w-xl mx-auto px-4 text-center space-y-3">
          <h3 className="text-2xl sm:text-3xl font-serif text-stone-900 tracking-tight">
            Sell on TrendiZip
          </h3>
          <p className="text-stone-600 text-xs sm:text-sm font-sans leading-relaxed">
            List your ready-to-wear clothing or offer custom tailoring services to customers in Ghana and abroad.
          </p>
          <div className="pt-2">
            <Link href="/register-as-professional">
              <button
                type="button"
                className="bg-stone-900 text-white px-6 py-3 rounded-full text-xs font-semibold hover:bg-black transition-all"
              >
                Register as a Professional
              </button>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}

