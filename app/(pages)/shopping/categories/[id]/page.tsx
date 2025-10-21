'use client';
import React, { useState, useEffect } from 'react';
import { Heart, Star, Eye, ShoppingBag, Filter, SlidersHorizontal, X } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { WishlistButton } from '@/components/ui/wishlist-button';
import { AddToCartButton } from '@/components/ui/add-to-cart-button';

interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string;
  parent?: {
    id: string;
    name: string;
    slug: string;
  };
  children: Array<{
    id: string;
    name: string;
    slug: string;
    imageUrl?: string;
    _count: {
      products: number;
    };
  }>;
  collections: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
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
  createdAt?: string;
  categoryId: string;
  category: {
    name: string;
    slug: string;
  };
  collection?: {
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
      totalReviews?: number;
    };
  };
  _count: {
    wishlistItems: number;
    cartItems: number;
    orderItems: number;
    reviews: number;
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

function ProductCard({ item }: { item: Product }) {
  const [isMobile, setIsMobile] = useState(false);
  const [currentLikes, setCurrentLikes] = useState(item._count.wishlistItems);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);


  return (
    <div
      className="group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-500 transform hover:scale-[1.02] animate-fade-in-up"
    >
      {/* Image Container */}
      <div className="relative overflow-hidden">
        {/* Badges */}
        <div className="absolute top-3 left-3 z-20 flex flex-col gap-2">
          {item.tags?.includes('NEW') && (
            <span className="bg-gradient-to-r from-emerald-400 to-teal-500 text-white px-2 py-1 text-xs font-bold rounded-full flex items-center gap-1 animate-pulse">
              NEW
            </span>
          )}
        </div>

        {/* Category Badge */}
        <span className="absolute top-3 right-3 z-20 bg-slate-800/80 backdrop-blur-sm text-white px-2 py-1 text-xs rounded-full font-medium">
          {item.category.name}
        </span>

        {/* Action Buttons - Desktop: centered with eye, Mobile: top-right vertical */}
        {isMobile ? (
          <div className="absolute top-1/2 right-3 transform -translate-y-1/2 z-20 flex flex-col gap-2 transition-all duration-300 opacity-100 scale-100">
            <WishlistButton
              productId={item.id}
              variant="overlay"
              size="sm"
              showCount={true}
              count={currentLikes}
              onWishlistChange={(isInWishlist) => {
                setCurrentLikes(prev => isInWishlist ? prev + 1 : Math.max(0, prev - 1));
              }}
            />
            <AddToCartButton
              productId={item.id}
              variant="overlay"
              size="sm"
            />
          </div>
        ) : (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 flex gap-3 transition-all duration-300 opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100">
            <Link href={`/shopping/products/${item.id}`}>
              <button className="bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg hover:bg-white hover:scale-110 transition-all duration-200">
                <Eye className="w-5 h-5 text-slate-700" />
              </button>
            </Link>
            <WishlistButton
              productId={item.id}
              variant="overlay"
              size="md"
              showCount={true}
              count={currentLikes}
              onWishlistChange={(isInWishlist) => {
                setCurrentLikes(prev => isInWishlist ? prev + 1 : Math.max(0, prev - 1));
              }}
            />
            <AddToCartButton
              productId={item.id}
              variant="overlay"
              size="md"
            />
          </div>
        )}

        <img
          src={item.images[0] || "/placeholder-product.jpg"}
          alt={item.name}
          className="w-full h-64 lg:h-72 object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent transition-opacity duration-300 opacity-0 group-hover:opacity-100" />

        {/* Seller Info - Always visible on mobile/tablet, hover on desktop */}
        <div className="absolute bottom-3 left-3 right-3 transition-all duration-300 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0">
          <div className="flex items-center bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-lg">
            <img
              src={item.professional.professionalProfile?.businessImage || '/placeholder-avatar.jpg'}
              alt={item.professional.professionalProfile?.businessName || `${item.professional.firstName} ${item.professional.lastName}`}
              className="w-8 h-8 rounded-full border-2 border-white shadow-md mr-3"
              loading="lazy"
            />
            <div className="flex-1 min-w-0">
              <p className="text-slate-900 text-sm font-semibold truncate">
                {item.professional.professionalProfile?.businessName || `${item.professional.firstName} ${item.professional.lastName}`}
              </p>
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-500 fill-current" />
                <span className="text-xs text-slate-600">{item.professional.professionalProfile?.rating?.toFixed(1) || '4.5'}</span>
                <span className="text-xs text-slate-400 ml-1">{item.viewCount} views</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight">
          <Link href={`/shopping/products/${item.id}`}>
            {item.name}
          </Link>
        </h3>

        <div className="flex items-center justify-between mb-3">
          <div className="flex flex-col">
            <span className="text-xl font-bold text-slate-900">{item.currency} {item.price.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-1 text-slate-600">
            <Heart className="w-4 h-4" />
            <span className="text-sm">{currentLikes}</span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            <span>{item.viewCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 text-yellow-500 fill-current" />
            <span>{item.professional.professionalProfile?.rating?.toFixed(1) || '4.5'}</span>
          </div>
        </div>
      </div>

      {/* Hover Effect Ring */}
      <div className="absolute inset-0 rounded-2xl border-2 border-blue-500/30 opacity-0 group-hover:opacity-100 transition-all duration-300 scale-95 group-hover:scale-100"></div>
    </div>
  );
}

function FilterSidebar({
  filters,
  setFilters,
  availableColors,
  availableSizes,
  availableTags,
  isOpen,
  onClose
}: {
  filters: Filters;
  setFilters: (filters: Filters) => void;
  availableColors: string[];
  availableSizes: string[];
  availableTags: string[];
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


  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}

      {/* Sidebar */}
      <div className={`fixed lg:static inset-y-0 left-0 z-50 w-80 bg-white shadow-xl lg:shadow-none transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 lg:hidden">
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Price Range */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Price Range</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Min Price</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={filters.minPrice || ''}
                    onChange={(e) => updateFilters('minPrice', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Max Price</label>
                  <input
                    type="number"
                    placeholder="1000"
                    value={filters.maxPrice || ''}
                    onChange={(e) => updateFilters('maxPrice', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Colors */}
            {availableColors.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Colors</h4>
                <div className="flex flex-wrap gap-3">
                  {availableColors.map(color => (
                    <button
                      key={color}
                      onClick={() => toggleArrayFilter('colors', color)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        filters.colors.includes(color)
                          ? 'border-blue-500 ring-2 ring-blue-200'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      style={{ backgroundColor: color.toLowerCase() }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Sizes */}
            {availableSizes.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Sizes</h4>
                <div className="flex flex-wrap gap-2">
                  {availableSizes.map(size => (
                    <button
                      key={size}
                      onClick={() => toggleArrayFilter('sizes', size)}
                      className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                        filters.sizes.includes(size)
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {availableTags.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleArrayFilter('tags', tag)}
                      className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                        filters.tags.includes(tag)
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sort */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Sort By</h4>
              <select
                value={`${filters.sortBy}_${filters.sortOrder}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split('_');
                  setFilters({ ...filters, sortBy, sortOrder });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="createdAt_desc">Newest First</option>
                <option value="createdAt_asc">Oldest First</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="viewCount_desc">Most Popular</option>
              </select>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={() => setFilters({
                minPrice: '',
                maxPrice: '',
                colors: [],
                sizes: [],
                tags: [],
                sortBy: 'createdAt',
                sortOrder: 'desc'
              })}
              className="w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              Clear All Filters
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

const Page = () => {
  const params = useParams();
  const categoryId = params.id as string;

  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    minPrice: '',
    maxPrice: '',
    colors: [],
    sizes: [],
    tags: [],
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [availableColors, setAvailableColors] = useState<string[]>([]);
  const [availableSizes, setAvailableSizes] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategoryData = async () => {
      try {
        setLoading(true);

        // Fetch category with children and products
        const response = await fetch(`/api/categories/${categoryId}?includeProducts=true&limit=20&page=1`);
        if (!response.ok) throw new Error('Failed to fetch category data');

        const data = await response.json();
        setCategory(data.category);
        setProducts(data.products);

        // Extract available filters from products
        const colors = new Set<string>();
        const sizes = new Set<string>();
        const tags = new Set<string>();

        data.products.forEach((product: Product) => {
          product.colors?.forEach(color => colors.add(color));
          product.sizes?.forEach(size => sizes.add(size));
          product.tags?.forEach(tag => tags.add(tag));
        });

        setAvailableColors(Array.from(colors).sort());
        setAvailableSizes(Array.from(sizes).sort());
        setAvailableTags(Array.from(tags).sort());

      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (categoryId) {
      fetchCategoryData();
    }
  }, [categoryId]);

  // Apply filters to products
  const filteredProducts = products.filter(product => {
    // Filter by selected subcategory if one is selected
    if (selectedSubcategoryId && product.categoryId !== selectedSubcategoryId) return false;

    if (filters.minPrice && product.price < parseFloat(filters.minPrice)) return false;
    if (filters.maxPrice && product.price > parseFloat(filters.maxPrice)) return false;
    if (filters.colors.length > 0 && !filters.colors.some(color => product.colors?.includes(color))) return false;
    if (filters.sizes.length > 0 && !filters.sizes.some(size => product.sizes?.includes(size))) return false;
    if (filters.tags.length > 0 && !filters.tags.some(tag => product.tags?.includes(tag))) return false;
    return true;
  }).sort((a, b) => {
    const { sortBy, sortOrder } = filters;
    let comparison = 0;

    switch (sortBy) {
      case 'price':
        comparison = a.price - b.price;
        break;
      case 'viewCount':
        comparison = a.viewCount - b.viewCount;
        break;
      case 'createdAt':
      default:
        comparison = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        break;
    }

    return sortOrder === 'desc' ? -comparison : comparison;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-gray-600"></div>
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Category</h1>
          <p className="text-gray-600 mb-4">{error || 'Category not found'}</p>
          <Link href="/shopping" className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800">
            Back to Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="bg-gray-50 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center space-x-2 text-sm text-gray-600">
            <Link href="/shopping" className="hover:text-gray-900">Shopping</Link>
            <span>/</span>
            {category.parent && (
              <>
                <Link href={`/shopping/categories/${category.parent.id}`} className="hover:text-gray-900">
                  {category.parent.name}
                </Link>
                <span>/</span>
              </>
            )}
            <span className="text-gray-900 font-medium">{category.name}</span>
          </nav>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{category.name}</h1>
              <div className="flex items-center gap-4 mb-4">
                {/* <p className="text-gray-600">
                  {category._count.products} products
                </p> */}
                {category.children.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">•</span>
                    <div className="flex flex-wrap gap-2">
                      {category.children.map((child) => (
                        <button
                          key={child.id}
                          onClick={() => setSelectedSubcategoryId(selectedSubcategoryId === child.id ? null : child.id)}
                          className={`flex items-center gap-2 px-3 py-2 text-sm rounded-full border transition-all ${
                            selectedSubcategoryId === child.id
                              ? 'bg-blue-500 text-white border-blue-500 shadow-md'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:shadow-sm'
                          }`}
                        >
                          <img
                            src={child.imageUrl || '/placeholder-category.jpg'}
                            alt={child.name}
                            className="w-5 h-5 rounded-full object-cover"
                          />
                          <span>{child.name}</span>
                          <span className="text-xs opacity-75">({child._count.products})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => setShowFilters(true)}
              className="lg:hidden flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg hover:bg-gray-200"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
            </button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Filters Sidebar */}
        <FilterSidebar
          filters={filters}
          setFilters={setFilters}
          availableColors={availableColors}
          availableSizes={availableSizes}
          availableTags={availableTags}
          isOpen={showFilters}
          onClose={() => setShowFilters(false)}
        />

        {/* Main Content */}
        <div className="flex-1">
          {/* Products */}
          <section className="py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Products ({filteredProducts.length})
                  {selectedSubcategoryId && (
                    <span className="text-sm text-gray-600 ml-2">
                      in {category.children.find(c => c.id === selectedSubcategoryId)?.name}
                    </span>
                  )}
                </h2>
                <button
                  onClick={() => setShowFilters(true)}
                  className="hidden lg:flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg hover:bg-gray-200"
                >
                  <Filter className="w-4 h-4" />
                  Filters
                </button>
              </div>

              {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredProducts.map((product) => (
                    <ProductCard key={product.id} item={product} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                  <p className="text-gray-600 mb-4">Try adjusting your filters or browse other categories.</p>
                  <button
                    onClick={() => setFilters({
                      minPrice: '',
                      maxPrice: '',
                      colors: [],
                      sizes: [],
                      tags: [],
                      sortBy: 'createdAt',
                      sortOrder: 'desc'
                    })}
                    className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
                  >
                    Clear Filters
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <img src="/navlogo.png" alt="Trendizip" className="w-8 h-8" />
              <h3 className="text-xl font-bold">Trendizip</h3>
            </div>
            <p className="text-gray-400 mb-6">Connecting professional designers with fashion enthusiasts</p>
            <div className="text-sm text-gray-500">
              &copy; 2024 Trendizip. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Page;