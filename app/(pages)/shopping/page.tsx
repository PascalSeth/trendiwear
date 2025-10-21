'use client';
import React, { useState, useEffect } from 'react';
import { Heart, Star, Eye, Zap, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { WishlistButton } from '@/components/ui/wishlist-button';
import { AddToCartButton } from '@/components/ui/add-to-cart-button';

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
  category: {
    name: string;
  };
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
}


function ProductCard({ item, index }: { item: Product & { isNew?: boolean; rating?: number; views?: number; likes?: number }; index: number }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [currentLikes, setCurrentLikes] = useState(item.likes || item._count.wishlistItems);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const showOverlayContent = isMobile || isHovered;

  return (
    <div
      className={`group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-500 transform hover:scale-[1.02] animate-fade-in-up`}
      style={{ animationDelay: `${index * 100}ms` }}
      onMouseEnter={() => !isMobile && setIsHovered(true)}
      onMouseLeave={() => !isMobile && setIsHovered(false)}
    >
      {/* Image Container */}
      <div className="relative overflow-hidden">
        {/* Badges */}
        <div className="absolute top-3 left-3 z-20 flex flex-col gap-2">
          {item.isNew && (
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
          // Mobile/Tablet: Vertical buttons in middle right
          <div className={`absolute top-1/2 right-3 transform -translate-y-1/2 z-20 flex flex-col gap-2 transition-all duration-300 ${showOverlayContent ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
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
          // Desktop: Horizontal centered buttons with eye
          <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 flex gap-3 transition-all duration-300 ${showOverlayContent ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
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
          className={`w-full h-64 lg:h-72 object-cover transition-transform duration-500 ${isHovered && !isMobile ? 'scale-105' : 'scale-100'}`}
          loading="lazy"
        />

        {/* Gradient Overlay */}
        <div className={`absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent transition-opacity duration-300 ${showOverlayContent ? 'opacity-100' : 'opacity-0'}`} />

        {/* Seller Info - Always visible on mobile/tablet, hover on desktop */}
        <div className={`absolute bottom-3 left-3 right-3 transition-all duration-300 ${showOverlayContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="flex items-center bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-lg">
            <img
              src={item.professional.professionalProfile?.businessImage || '/placeholder-avatar.jpg'}
              alt={item.professional.professionalProfile?.businessName || `${item.professional.firstName} ${item.professional.lastName}`}
              className="w-8 h-8 rounded-full border-2 border-white shadow-md mr-3"
              loading="lazy"
            />
            <div className="flex-1 min-w-0">
              <p className="text-slate-900 text-sm font-semibold truncate">{item.professional.professionalProfile?.businessName || `${item.professional.firstName} ${item.professional.lastName}`}</p>
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
        <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight cursor-pointer">
          {item.name}
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
      <div className={`absolute inset-0 rounded-2xl border-2 border-blue-500/30 opacity-0 group-hover:opacity-100 transition-all duration-300 scale-95 group-hover:scale-100`}></div>
    </div>
  );
}


const Page = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch parent categories only
        const categoriesResponse = await fetch('/api/categories/parents');
        if (!categoriesResponse.ok) throw new Error('Failed to fetch categories');
        const categoriesData = await categoriesResponse.json();
        setCategories(categoriesData);

        // Fetch featured products (recently added)
        const featuredResponse = await fetch('/api/products?limit=4&sortBy=createdAt&sortOrder=desc');
        if (!featuredResponse.ok) throw new Error('Failed to fetch featured products');
        const featuredData = await featuredResponse.json();
        const transformedFeatured = featuredData.products.map((product: Product) => ({
          ...product,
          isNew: product.tags?.includes('NEW') || false,
          rating: product.professional.professionalProfile?.rating || 4.5,
          views: product.viewCount,
          likes: product._count.wishlistItems
        }));
        setFeaturedProducts(transformedFeatured);

        // Fetch trending products (most viewed)
        const trendingResponse = await fetch('/api/products?limit=4&sortBy=viewCount&sortOrder=desc');
        if (!trendingResponse.ok) throw new Error('Failed to fetch trending products');
        const trendingData = await trendingResponse.json();
        const transformedTrending = trendingData.products.map((product: Product) => ({
          ...product,
          isNew: product.tags?.includes('NEW') || false,
          rating: product.professional.professionalProfile?.rating || 4.5,
          views: product.viewCount,
          likes: product._count.wishlistItems
        }));
        setTrendingProducts(transformedTrending);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-gray-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Page</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <img src="/navlogo.png" alt="Trendizip" className="w-16 h-16" />
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Discover Curated Fashion
            </h1>

            {/* Subtitle */}
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Professional designers and tailors showcasing their finest collections
            </p>

            {/* CTA Button */}
            <button className="bg-gray-900 text-white px-8 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors">
              Shop Collection
            </button>

            {/* Social Proof */}
            <div className="mt-12 flex items-center justify-center gap-8 text-sm text-gray-600">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {featuredProducts.length > 0 ? `${featuredProducts.reduce((sum, p) => sum + p._count.reviews, 0)}+` : '50K+'}
                </div>
                <div>Happy Customers</div>
              </div>
              <div className="w-px h-12 bg-gray-300"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {featuredProducts.length + trendingProducts.length > 0 ? `${featuredProducts.length + trendingProducts.length}K+` : '10K+'}
                </div>
                <div>Premium Items</div>
              </div>
              <div className="w-px h-12 bg-gray-300"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {featuredProducts.length > 0
                    ? `${(featuredProducts.reduce((sum, p) => sum + (p.professional.professionalProfile?.rating || 4.5), 0) / featuredProducts.length).toFixed(1)}★`
                    : '4.9★'
                  }
                </div>
                <div>Average Rating</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-8 lg:px-12 py-16">
        {/* Categories Section */}
        <section className="mb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Shop by Category
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Discover your perfect style across our curated collections
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/shopping/categories/${category.id}`}
                  className="group cursor-pointer flex flex-col items-center"
                >
                  <div className="relative overflow-hidden rounded-full bg-gray-100 hover:bg-gray-200 transition-colors shadow-lg">
                    <div className="aspect-square w-32 h-32 md:w-40 md:h-40">
                      <img
                        src={category.imageUrl || "/placeholder-category.jpg"}
                        alt={category.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 rounded-full" />
                  </div>
                  <div className="mt-4 text-center">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {category.name}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section className="mb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 mb-8">
              <Zap className="w-6 h-6 text-gray-600" />
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                Curated by Professionals
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product, index) => (
                <ProductCard key={product.id} item={product} index={index} />
              ))}
            </div>
          </div>
        </section>

        {/* Trending Products */}
        <section className="mb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 mb-8">
              <TrendingUp className="w-6 h-6 text-gray-600" />
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                Popular Items
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {trendingProducts.map((product, index) => (
                <ProductCard key={product.id} item={product} index={index} />
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
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