'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Star, Store, X, SlidersHorizontal,
  Grid3X3, LayoutGrid, ChevronDown, Search, ShoppingBag,
  Clock, Flame, Percent, ArrowRight, Check
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ProductCard } from '@/components/common/ProductCard';

// --- INTERFACES ---
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
  sizes: string[];
  colors: string[];
  material?: string;
  careInstructions?: string;
  estimatedDelivery?: number;
  isCustomizable: boolean;
  tags: string[];
  viewCount: number;
  soldCount: number;
  stockQuantity: number;
  isPreorder?: boolean;
  categories: {
    name: string;
    slug: string;
  }[];
  collection?: {
    name: string;
  };
  professional: {
    firstName: string;
    lastName: string;
    professionalProfile?: {
      businessName?: string;
      businessImage?: string;
      rating?: number;
      totalReviews?: number;
      isVerified?: boolean;
    };
  };
  _count: {
    wishlistItems: number;
    cartItems: number;
    orderItems: number;
    reviews: number;
  };
  isNew?: boolean;
  rating?: number;
  views?: number;
  likes?: number;
  effectivePrice?: number;
  isDiscountActive?: boolean;
  discountAmount?: number;
  discountPercentage?: number;
  discountEndDate?: string;
}

interface ProfessionalProfile {
  id: string;
  businessName: string;
  businessImage?: string;
  coverImage?: string;
  bio?: string;
  rating?: number;
  totalReviews?: number;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    profileImage?: string;
  };
  specialization: {
    name: string;
  };
}

interface FilterState {
  priceRange: [number, number];
  colors: string[];
  sizes: string[];
  onSale: boolean;
  inStock: boolean;
  rating: number | null;
}

// Default category image fallback
const DEFAULT_CATEGORY_IMAGE = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=400&fit=crop';

const ALL_COLORS = [
  { name: 'Black', value: '#000000' },
  { name: 'White', value: '#FFFFFF' },
  { name: 'Navy', value: '#1e3a5f' },
  { name: 'Red', value: '#dc2626' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Brown', value: '#92400e' },
  { name: 'Gray', value: '#6b7280' },
];

const ALL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size'];

// --- COMPONENTS ---



// Category Card Component - Compact Pill Design
function CategoryCard({ 
  category, 
  isActive, 
  onClick,
  index 
}: { 
  category: Category; 
  isActive: boolean; 
  onClick: () => void;
  index: number;
}) {
  const imageUrl = category.imageUrl || DEFAULT_CATEGORY_IMAGE;
  
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      onClick={onClick}
      className={cn(
        "group flex items-center gap-3 px-2 py-2 pr-5 rounded-full transition-all duration-300 flex-shrink-0",
        isActive 
          ? "bg-stone-900 shadow-lg" 
          : "bg-stone-100 hover:bg-stone-200"
      )}
    >
      {/* Circular Image */}
      <div className="relative w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden flex-shrink-0">
        <Image
          src={imageUrl}
          alt={category.name}
          fill
          className="object-cover"
        />
      </div>
      {/* Category Info */}
      <div className="text-left">
        <h3 className={cn(
          "font-bold text-[10px] uppercase tracking-widest whitespace-nowrap transition-colors duration-300",
          isActive ? "text-white" : "text-stone-900"
        )}>
          {category.name}
        </h3>
        <p className={cn(
          "font-mono text-[9px] uppercase tracking-widest whitespace-nowrap",
          isActive ? "text-white/60" : "text-stone-400"
        )}>
          {category._count.products} Arch.
        </p>
      </div>
      {/* Active indicator */}
      {isActive && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="ml-1 w-5 h-5 rounded-full bg-white flex items-center justify-center"
        >
          <Check size={12} className="text-stone-900" />
        </motion.div>
      )}
    </motion.button>
  );
}

// Price Range Slider Component
function PriceRangeSlider({ 
  min, 
  max, 
  value, 
  onChange,
  currency 
}: { 
  min: number; 
  max: number; 
  value: [number, number]; 
  onChange: (value: [number, number]) => void;
  currency: string;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm">
        <span className="text-stone-600">{currency} {value[0]}</span>
        <span className="text-stone-600">{currency} {value[1]}</span>
      </div>
      <div className="relative h-2 bg-stone-200 rounded-full">
        <div 
          className="absolute h-full bg-stone-900 rounded-full"
          style={{
            left: `${((value[0] - min) / (max - min)) * 100}%`,
            right: `${100 - ((value[1] - min) / (max - min)) * 100}%`
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={value[0]}
          onChange={(e) => onChange([Math.min(Number(e.target.value), value[1] - 10), value[1]])}
          className="absolute w-full h-full opacity-0 cursor-pointer"
        />
        <input
          type="range"
          min={min}
          max={max}
          value={value[1]}
          onChange={(e) => onChange([value[0], Math.max(Number(e.target.value), value[0] + 10)])}
          className="absolute w-full h-full opacity-0 cursor-pointer"
        />
      </div>
    </div>
  );
}

// Advanced Filter Panel
function FilterPanel({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  priceRange,
  currency,
  availableColors,
  availableSizes
}: {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  priceRange: [number, number];
  currency: string;
  availableColors: string[];
  availableSizes: string[];
}) {
  const [localFilters, setLocalFilters] = useState(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleApply = () => {
    onFiltersChange(localFilters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters: FilterState = {
      priceRange: priceRange,
      colors: [],
      sizes: [],
      onSale: false,
      inStock: false,
      rating: null
    };
    setLocalFilters(resetFilters);
    onFiltersChange(resetFilters);
  };

  const activeFiltersCount = [
    localFilters.colors.length > 0,
    localFilters.sizes.length > 0,
    localFilters.onSale,
    localFilters.inStock,
    localFilters.rating !== null,
    localFilters.priceRange[0] !== priceRange[0] || localFilters.priceRange[1] !== priceRange[1]
  ].filter(Boolean).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />
          
          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white z-10 px-6 py-5 border-b border-stone-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-stone-900">Filters</h2>
                {activeFiltersCount > 0 && (
                  <p className="text-sm text-stone-500 mt-0.5">{activeFiltersCount} active</p>
                )}
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center hover:bg-stone-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-8">
              
              {/* Price Range */}
              <div>
                <h3 className="text-sm font-semibold text-stone-900 uppercase tracking-wider mb-4">Price Range</h3>
                <PriceRangeSlider
                  min={priceRange[0]}
                  max={priceRange[1]}
                  value={localFilters.priceRange}
                  onChange={(value) => setLocalFilters({ ...localFilters, priceRange: value })}
                  currency={currency}
                />
              </div>

              {/* Colors */}
              {availableColors.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-stone-900 uppercase tracking-wider mb-4">Colors</h3>
                  <div className="flex flex-wrap gap-3">
                    {ALL_COLORS.filter(c => availableColors.some(ac => ac.toLowerCase().includes(c.name.toLowerCase()))).map((color) => (
                      <button
                        key={color.name}
                        onClick={() => {
                          const newColors = localFilters.colors.includes(color.name)
                            ? localFilters.colors.filter(c => c !== color.name)
                            : [...localFilters.colors, color.name];
                          setLocalFilters({ ...localFilters, colors: newColors });
                        }}
                        className={cn(
                          "w-10 h-10 rounded-full border-2 transition-all duration-200 flex items-center justify-center",
                          localFilters.colors.includes(color.name)
                            ? "border-stone-900 scale-110"
                            : "border-transparent hover:scale-105"
                        )}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      >
                        {localFilters.colors.includes(color.name) && (
                          <Check size={16} className={color.value === '#FFFFFF' ? 'text-stone-900' : 'text-white'} />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Sizes */}
              {availableSizes.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-stone-900 uppercase tracking-wider mb-4">Sizes</h3>
                  <div className="flex flex-wrap gap-2">
                    {ALL_SIZES.filter(s => availableSizes.includes(s)).map((size) => (
                      <button
                        key={size}
                        onClick={() => {
                          const newSizes = localFilters.sizes.includes(size)
                            ? localFilters.sizes.filter(s => s !== size)
                            : [...localFilters.sizes, size];
                          setLocalFilters({ ...localFilters, sizes: newSizes });
                        }}
                        className={cn(
                          "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                          localFilters.sizes.includes(size)
                            ? "bg-stone-900 text-white"
                            : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                        )}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Filters */}
              <div>
                <h3 className="text-sm font-semibold text-stone-900 uppercase tracking-wider mb-4">Quick Filters</h3>
                <div className="space-y-3">
                  <label className="flex items-center justify-between p-4 bg-stone-50 rounded-xl cursor-pointer hover:bg-stone-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <Percent size={18} className="text-red-500" />
                      <span className="text-sm font-medium">On Sale</span>
                    </div>
                    <div className={cn(
                      "w-12 h-6 rounded-full transition-colors duration-200 relative",
                      localFilters.onSale ? "bg-stone-900" : "bg-stone-300"
                    )}>
                      <div className={cn(
                        "absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200",
                        localFilters.onSale ? "translate-x-7" : "translate-x-1"
                      )} />
                    </div>
                    <input
                      type="checkbox"
                      checked={localFilters.onSale}
                      onChange={(e) => setLocalFilters({ ...localFilters, onSale: e.target.checked })}
                      className="sr-only"
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 bg-stone-50 rounded-xl cursor-pointer hover:bg-stone-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <ShoppingBag size={18} className="text-green-500" />
                      <span className="text-sm font-medium">In Stock</span>
                    </div>
                    <div className={cn(
                      "w-12 h-6 rounded-full transition-colors duration-200 relative",
                      localFilters.inStock ? "bg-stone-900" : "bg-stone-300"
                    )}>
                      <div className={cn(
                        "absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200",
                        localFilters.inStock ? "translate-x-7" : "translate-x-1"
                      )} />
                    </div>
                    <input
                      type="checkbox"
                      checked={localFilters.inStock}
                      onChange={(e) => setLocalFilters({ ...localFilters, inStock: e.target.checked })}
                      className="sr-only"
                    />
                  </label>
                </div>
              </div>

              {/* Rating Filter */}
              <div>
                <h3 className="text-sm font-semibold text-stone-900 uppercase tracking-wider mb-4">Minimum Rating</h3>
                <div className="flex gap-2">
                  {[null, 4, 3, 2].map((rating) => (
                    <button
                      key={rating ?? 'all'}
                      onClick={() => setLocalFilters({ ...localFilters, rating })}
                      className={cn(
                        "flex-1 py-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-1",
                        localFilters.rating === rating
                          ? "bg-stone-900 text-white"
                          : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                      )}
                    >
                      {rating ? (
                        <>
                          <Star size={14} className="fill-current" />
                          {rating}+
                        </>
                      ) : (
                        'All'
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="sticky bottom-0 bg-white border-t border-stone-100 p-6 flex gap-3">
              <button
                onClick={handleReset}
                className="flex-1 py-4 rounded-xl border border-stone-200 text-stone-700 font-semibold hover:bg-stone-50 transition-colors"
              >
                Reset All
              </button>
              <button
                onClick={handleApply}
                className="flex-1 py-4 rounded-xl bg-stone-900 text-white font-semibold hover:bg-stone-800 transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}


// Quick Filter Chip
function FilterChip({ 
  label, 
  isActive, 
  onClick, 
  icon: Icon 
}: { 
  label: string; 
  isActive: boolean; 
  onClick: () => void;
  icon?: React.ElementType;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-5 py-2.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest transition-all duration-300 flex-shrink-0",
        isActive
          ? "bg-stone-900 text-white shadow-xl shadow-stone-200 border-stone-900"
          : "bg-white border border-stone-200 text-stone-500 hover:border-stone-400 hover:text-stone-900"
      )}
    >
      {Icon && <Icon size={12} />}
      {label}
    </button>
  );
}

// Sort Dropdown
function SortDropdown({ 
  value, 
  onChange 
}: { 
  value: string; 
  onChange: (value: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  
  const options = [
    { value: 'featured', label: 'Featured' },
    { value: 'newest', label: 'Newest First' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'rating', label: 'Top Rated' },
    { value: 'popular', label: 'Most Popular' },
  ];

  const currentOption = options.find(o => o.value === value);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-3 px-6 py-4 bg-stone-100 rounded-2xl text-[10px] font-mono font-bold uppercase tracking-widest text-stone-900 hover:bg-stone-200 transition-all border border-stone-200/50"
      >
        <div className="flex items-center gap-3">
          <Clock size={14} className="text-stone-400" />
          <span>{currentOption?.label}</span>
        </div>
        <ChevronDown size={14} className={cn("transition-transform duration-500", isOpen && "rotate-180")} />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute right-0 mt-2 w-48 bg-white border border-stone-200 rounded-xl shadow-xl z-50 overflow-hidden"
            >
              {options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full px-4 py-3 text-left text-sm hover:bg-stone-50 transition-colors flex items-center justify-between",
                    value === option.value && "bg-stone-50 font-medium"
                  )}
                >
                  {option.label}
                  {value === option.value && <Check size={14} className="text-stone-900" />}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Main Page Component
const ShopPage = ({ params }: { params: Promise<{ slug: string }> }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [profile, setProfile] = useState<ProfessionalProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Loader states
  const [loaderImage, setLoaderImage] = useState<string | null>(null);
  const [loaderName, setLoaderName] = useState<string>('');
  const [showContent, setShowContent] = useState(false);
  
  // UI State
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState('featured');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'large'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [quickFilter, setQuickFilter] = useState<'all' | 'new' | 'sale' | 'trending'>('all');
  
  // Filters
  const [filters, setFilters] = useState<FilterState>({
    priceRange: [0, 1000],
    colors: [],
    sizes: [],
    onSale: false,
    inStock: false,
    rating: null
  });

  const { slug } = React.use(params);

  // Fetch data - first get profile image for loader, then full data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setShowContent(false);
        
        // Quick fetch for profile image to show in loader
        const profileResponse = await fetch(`/api/professional-profiles/slug/${slug}`);
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          const businessImg = profileData.businessImage || profileData.user?.profileImage;
          const businessName = profileData.businessName || `${profileData.user?.firstName || ''} ${profileData.user?.lastName || ''}`;
          setLoaderImage(businessImg);
          setLoaderName(businessName.trim());
        }
        
        // Full shop data fetch
        const response = await fetch(`/api/professional-profiles/slug/${slug}/shop`);
        if (!response.ok) throw new Error('Failed to fetch shop data');
        const data = await response.json();

        setProfile({
          ...data.profile,
          coverImage: data.profile.coverImage || data.profile.businessImage
        });

        const transformedProducts = data.products.map((product: Product) => ({
          ...product,
          isNew: product.tags?.includes('NEW') || false,
          rating: product.professional.professionalProfile?.rating || 0,
          views: product.viewCount,
          likes: product._count.wishlistItems
        }));
        setProducts(transformedProducts);

        // Calculate actual price range
        const prices = transformedProducts.map((p: Product) => p.effectivePrice || p.price);
        const minPrice = Math.floor(Math.min(...prices, 0));
        const maxPrice = Math.ceil(Math.max(...prices, 1000));
        setFilters(prev => ({ ...prev, priceRange: [minPrice, maxPrice] }));

        const uniqueCategories: Category[] = data.categories.map((cat: { id: string; name: string; slug: string; imageUrl: string | null; productCount: number }) => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          imageUrl: cat.imageUrl || undefined,
          _count: { products: cat.productCount }
        }));

        setCategories(uniqueCategories);
        
        // Small delay for smooth transition
        await new Promise(resolve => setTimeout(resolve, 500));
        setLoading(false);
        
        // Trigger content reveal animation
        setTimeout(() => setShowContent(true), 100);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setLoading(false);
      }
    };

    if (slug) fetchData();
  }, [slug]);

  // Get available colors and sizes from products
  const availableColors = useMemo(() => {
    const colors = new Set<string>();
    products.forEach(p => p.colors?.forEach(c => colors.add(c)));
    return Array.from(colors);
  }, [products]);

  const availableSizes = useMemo(() => {
    const sizes = new Set<string>();
    products.forEach(p => p.sizes?.forEach(s => sizes.add(s)));
    return Array.from(sizes);
  }, [products]);

  const priceRange = useMemo((): [number, number] => {
    if (products.length === 0) return [0, 1000];
    const prices = products.map(p => p.effectivePrice || p.price);
    return [Math.floor(Math.min(...prices)), Math.ceil(Math.max(...prices))];
  }, [products]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Category filter
    if (activeCategory) {
      result = result.filter(p => p.categories.some(c => c.name.toLowerCase().replace(/\s+/g, '-') === activeCategory));
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.categories.some(c => c.name.toLowerCase().includes(query))
      );
    }

    // Quick filters
    if (quickFilter === 'new') {
      result = result.filter(p => p.isNew);
    } else if (quickFilter === 'sale') {
      result = result.filter(p => p.isDiscountActive);
    } else if (quickFilter === 'trending') {
      result = result.filter(p => (p.viewCount || 0) > 50 || (p.soldCount || 0) > 10);
    }

    // Advanced filters
    if (filters.onSale) {
      result = result.filter(p => p.isDiscountActive);
    }

    if (filters.colors.length > 0) {
      result = result.filter(p => 
        p.colors?.some(c => filters.colors.some(fc => c.toLowerCase().includes(fc.toLowerCase())))
      );
    }

    if (filters.sizes.length > 0) {
      result = result.filter(p => 
        p.sizes?.some(s => filters.sizes.includes(s))
      );
    }

    if (filters.rating !== null) {
      result = result.filter(p => {
        const rating = p.rating ?? p.professional.professionalProfile?.rating ?? 0;
        return rating >= filters.rating!;
      });
    }

    // Price range
    result = result.filter(p => {
      const price = p.effectivePrice || p.price;
      return price >= filters.priceRange[0] && price <= filters.priceRange[1];
    });

    // Sorting
    switch (sortOption) {
      case 'price-low':
        result.sort((a, b) => (a.effectivePrice || a.price) - (b.effectivePrice || b.price));
        break;
      case 'price-high':
        result.sort((a, b) => (b.effectivePrice || b.price) - (a.effectivePrice || a.price));
        break;
      case 'newest':
        result.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
        break;
      case 'rating':
        result.sort((a, b) => {
          const ratingA = a.rating ?? a.professional.professionalProfile?.rating ?? 0;
          const ratingB = b.rating ?? b.professional.professionalProfile?.rating ?? 0;
          return ratingB - ratingA;
        });
        break;
      case 'popular':
        result.sort((a, b) => (b.viewCount + b.soldCount) - (a.viewCount + a.soldCount));
        break;
    }

    return result;
  }, [products, activeCategory, searchQuery, quickFilter, filters, sortOption]);

  // Loading state - Beautiful animated loader with business image
  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center overflow-hidden">
        <motion.div 
          className="flex flex-col items-center gap-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Main Image Container with Animations */}
          <div className="relative">
            {/* Outer pulsing rings */}
            <motion.div
              className="absolute inset-0 -m-8 rounded-full border-2 border-stone-200"
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute inset-0 -m-4 rounded-full border-2 border-stone-300"
              animate={{ scale: [1, 1.15, 1], opacity: [0.7, 0.2, 0.7] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
            />
            
            {/* Rotating border */}
            <motion.div
              className="absolute inset-0 -m-1 rounded-full"
              style={{
                background: 'conic-gradient(from 0deg, transparent, #1c1917, transparent)',
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
            
            {/* Image container */}
            <motion.div
              className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-white shadow-2xl"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              {loaderImage ? (
                <Image
                  src={loaderImage}
                  alt={loaderName || 'Shop'}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-stone-200 to-stone-300 flex items-center justify-center">
                  <Store className="w-12 h-12 text-stone-500" />
                </div>
              )}
              
              {/* Shimmer overlay */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }}
              />
            </motion.div>
          </div>

          {/* Brand name and loading text */}
          <div className="text-center">
            {loaderName && (
              <motion.h2
                className="text-2xl md:text-3xl font-bold text-stone-900 mb-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {loaderName}
              </motion.h2>
            )}
            <motion.div 
              className="flex items-center gap-2 justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <span className="text-stone-500 text-sm">Loading shop</span>
              <motion.span
                className="flex gap-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="w-1.5 h-1.5 bg-stone-400 rounded-full"
                    animate={{ y: [0, -6, 0], opacity: [0.5, 1, 0.5] }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      delay: i * 0.15,
                    }}
                  />
                ))}
              </motion.span>
            </motion.div>
          </div>
          
          {/* Progress bar */}
          <motion.div 
            className="w-48 h-1 bg-stone-200 rounded-full overflow-hidden"
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 192 }}
            transition={{ delay: 0.6 }}
          >
            <motion.div
              className="h-full bg-stone-900 rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 2, ease: "easeInOut" }}
            />
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // Error state
  if (error || !profile) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Store className="w-10 h-10 text-stone-400" />
          </div>
          <h1 className="text-2xl font-semibold text-stone-900 mb-3">Shop Not Found</h1>
          <p className="text-stone-500 mb-8">{error || 'We couldn\'t find this seller\'s shop.'}</p>
          <Link href="/">
            <button className="bg-stone-900 text-white px-8 py-4 rounded-xl font-semibold hover:bg-stone-800 transition-colors">
              Back to Home
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const displayName = profile.businessName || `${profile.user.firstName} ${profile.user.lastName}`;
  const currency = products[0]?.currency || 'GHS';

  return (
    <AnimatePresence>
      <motion.div 
        className="min-h-screen bg-stone-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: showContent ? 1 : 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Hero Section with zoom reveal animation */}
        <motion.header 
          className="relative h-[50vh] min-h-[400px] max-h-[600px] overflow-hidden"
          initial={{ scale: 2, opacity: 0 }}
          animate={{ 
            scale: showContent ? 1 : 2, 
            opacity: showContent ? 1 : 0 
          }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Background Image */}
          <div className="absolute inset-0">
            <Image
              src={profile.coverImage || profile.businessImage || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&h=1080&fit=crop'}
              alt={displayName}
              fill
              priority
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-stone-50" />
          </div>

          {/* Hero Content */}
          <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-16">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : 30 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex items-end gap-6"
            >
              {/* Profile Image */}
              <motion.div 
                className="relative w-24 h-24 md:w-32 md:h-32 rounded-2xl overflow-hidden border-4 border-white shadow-2xl flex-shrink-0"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: showContent ? 1 : 0.8, opacity: showContent ? 1 : 0 }}
                transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
              >
                <Image
                  src={profile.businessImage || profile.user.profileImage || '/placeholder-avatar.jpg'}
                  alt={displayName}
                  fill
                  className="object-cover"
                />
              </motion.div>

              {/* Info */}
            <div className="pb-2">
              <h1 className="text-3xl md:text-5xl font-bold text-white drop-shadow-lg">{displayName}</h1>
              <div className="flex items-center gap-4 mt-3">
                {profile.rating && (
                  <div className="flex items-center gap-1.5 text-white/90">
                    <Star size={16} className="fill-amber-400 text-amber-400" />
                    <span className="font-medium">{profile.rating.toFixed(1)}</span>
                    {profile.totalReviews && (
                      <span className="text-white/60">({profile.totalReviews} reviews)</span>
                    )}
                  </div>
                )}
                <span className="text-white/60">•</span>
                <span className="text-white/80">{products.length} Products</span>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        
        {/* Categories - Mobile Fade Container */}
        {categories.length > 0 && (
          <section className="mb-8 relative group">
            {/* Soft Fades for scroll signaling */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-stone-50 to-transparent z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-stone-50 to-transparent z-10 pointer-events-none" />
            
            <div className="flex items-center gap-3 overflow-x-auto pb-4 no-scrollbar scroll-smooth px-1">
              {/* All button */}
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => setActiveCategory(null)}
                className={cn(
                  "flex items-center gap-2 px-6 py-3.5 rounded-full transition-all duration-500 flex-shrink-0 font-mono text-[10px] uppercase tracking-widest",
                  !activeCategory 
                    ? "bg-stone-900 text-white shadow-xl shadow-stone-200" 
                    : "bg-white border border-stone-200 text-stone-600 hover:border-stone-400"
                )}
              >
                <Grid3X3 size={14} />
                All
              </motion.button>
              
              {categories.map((category, index) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  isActive={activeCategory === category.slug}
                  onClick={() => setActiveCategory(activeCategory === category.slug ? null : category.slug)}
                  index={index}
                />
              ))}
            </div>
          </section>
        )}

        {/* Toolbar - Redesigned for Mobile Professionalism */}
        <div className="bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.03)] border border-stone-100 p-4 md:p-6 mb-10">
          <div className="flex flex-col gap-6">
            
            {/* Top Row: Search (Full width on mobile) */}
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              <div className="relative flex-1 group">
                <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-stone-900 transition-colors" />
                <input
                  type="text"
                  placeholder="Search archival products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 bg-stone-50 border border-transparent rounded-2xl text-sm font-serif focus:bg-white focus:border-stone-200 focus:ring-0 transition-all placeholder:text-stone-400"
                />
              </div>

              {/* Desktop Only Actions Box */}
              <div className="hidden lg:flex items-center gap-3">
                <div className="flex items-center bg-stone-100 rounded-xl p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={cn(
                      "p-2.5 rounded-lg transition-all",
                      viewMode === 'grid' ? "bg-white shadow-sm ring-1 ring-stone-900/5" : "text-stone-400 hover:text-stone-600"
                    )}
                  >
                    <Grid3X3 size={18} />
                  </button>
                  <button
                    onClick={() => setViewMode('large')}
                    className={cn(
                      "p-2.5 rounded-lg transition-all",
                      viewMode === 'large' ? "bg-white shadow-sm ring-1 ring-stone-900/5" : "text-stone-400 hover:text-stone-600"
                    )}
                  >
                    <LayoutGrid size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Row: Controls Grid (Mobile Balanced) */}
            <div className="grid grid-cols-2 lg:flex lg:items-center gap-3">
              {/* Filter Button */}
              <button
                onClick={() => setShowFilters(true)}
                className="flex items-center justify-center gap-3 px-6 py-4 bg-stone-100 rounded-2xl text-[10px] font-mono font-bold uppercase tracking-widest text-stone-900 hover:bg-stone-200 transition-all border border-stone-200/50 group"
              >
                <SlidersHorizontal size={14} className="group-hover:rotate-180 transition-transform duration-500" />
                Filter
                {(filters.colors.length > 0 || filters.sizes.length > 0 || filters.onSale || filters.rating !== null) && (
                  <span className="w-5 h-5 rounded-full bg-stone-900 text-white text-[9px] flex items-center justify-center animate-in zoom-in">
                    {[filters.colors.length > 0, filters.sizes.length > 0, filters.onSale, filters.rating !== null].filter(Boolean).length}
                  </span>
                )}
              </button>

              {/* Sort Dropdown - Full width in its grid cell */}
              <div className="w-full flex">
                <SortDropdown value={sortOption} onChange={setSortOption} />
              </div>

              {/* Quick Filter Chips - Pushed to own row on mobile via flex-wrap or separate div */}
              <div className="col-span-2 lg:flex-1 relative group mt-2 lg:mt-0">
                <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none lg:hidden" />
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                  <FilterChip
                    label="All"
                    isActive={quickFilter === 'all'}
                    onClick={() => setQuickFilter('all')}
                  />
                  <FilterChip
                    label="New"
                    isActive={quickFilter === 'new'}
                    onClick={() => setQuickFilter('new')}
                    icon={Clock}
                  />
                  <FilterChip
                    label="Sale"
                    isActive={quickFilter === 'sale'}
                    onClick={() => setQuickFilter('sale')}
                    icon={Percent}
                  />
                  <FilterChip
                    label="Popular"
                    isActive={quickFilter === 'trending'}
                    onClick={() => setQuickFilter('trending')}
                    icon={Flame}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-stone-500">
            Showing <span className="font-medium text-stone-900">{filteredProducts.length}</span> products
            {activeCategory && (
              <> in <span className="font-medium text-stone-900">{categories.find(c => c.slug === activeCategory)?.name}</span></>
            )}
          </p>
        </div>

        {/* Product Grid */}
        {filteredProducts.length > 0 ? (
          <div className={cn(
            "grid gap-4 sm:gap-6 mb-16",
            viewMode === 'grid'
              ? "grid-cols-2 md:grid-cols-4 lg:grid-cols-5"
              : "grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          )}>
            {filteredProducts.map((product, index) => (
              <ProductCard key={product.id} item={product} index={index} />
            ))}
          </div>
        ) : (
          <div className="py-24 text-center">
            <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-stone-400" />
            </div>
            <h3 className="text-xl font-semibold text-stone-900 mb-2">No products found</h3>
            <p className="text-stone-500 mb-8 max-w-md mx-auto">
              Try adjusting your filters or search query to find what you&apos;re looking for.
            </p>
            <button 
              onClick={() => {
                setActiveCategory(null);
                setSearchQuery('');
                setQuickFilter('all');
                setFilters({
                  priceRange: priceRange,
                  colors: [],
                  sizes: [],
                  onSale: false,
                  inStock: false,
                  rating: null
                });
              }}
              className="bg-stone-900 text-white px-8 py-4 rounded-xl font-semibold hover:bg-stone-800 transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        )}

        {/* Back to Profile */}
        <div className="text-center pb-16">
          <Link 
            href={`/tz/${slug}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors"
          >
            <ArrowRight size={16} className="rotate-180" />
            Back to {displayName}&apos;s Profile
          </Link>
        </div>
      </div>

      {/* Filter Panel */}
      <FilterPanel
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onFiltersChange={setFilters}
        priceRange={priceRange}
        currency={currency}
        availableColors={availableColors}
        availableSizes={availableSizes}
      />

      {/* Custom Scrollbar Hide */}
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </motion.div>
    </AnimatePresence>
  );
};

export default ShopPage;
