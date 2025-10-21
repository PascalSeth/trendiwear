'use client'
import React, { useState, useEffect } from 'react';
import { Heart, Star, Eye } from 'lucide-react';
import Link from 'next/link';
import { WishlistButton } from '@/components/ui/wishlist-button';
import { AddToCartButton } from '@/components/ui/add-to-cart-button';

type ClothingItem = {
  id: string;
  name: string;
  images: string[];
  price: number;
  currency: string;
  isNew: boolean;
  sellerName: string;
  sellerProfilePicUrl: string;
  category: string;
  rating?: number;
  views?: number;
  likes?: number;
};

function NewArrivals() {
  const [newArrivals, setNewArrivals] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNewArrivals = async () => {
      try {
        const response = await fetch('/api/products?sortBy=createdAt&sortOrder=desc&limit=4');
        if (response.ok) {
          const data = await response.json();
          const transformedProducts = data.products.map((product: {
            id: string;
            name: string;
            images: string[];
            price: number;
            currency: string;
            stockQuantity: number;
            isActive: boolean;
            isInStock: boolean;
            viewCount: number;
            soldCount: number;
            createdAt: string;
            tags?: string[];
            category: { name: string };
            collection?: { name: string };
            professional: {
              firstName: string;
              lastName: string;
              professionalProfile?: {
                businessName: string;
                businessImage: string;
                rating: number;
                totalReviews: number;
              };
            };
            _count: {
              wishlistItems: number;
              cartItems: number;
              orderItems: number;
              reviews: number;
            };
          }) => ({
            id: product.id,
            name: product.name,
            images: product.images,
            price: product.price,
            currency: product.currency || 'GHS',
            isNew: product.tags?.includes('NEW') || false,
            sellerName: product.professional.professionalProfile?.businessName || `${product.professional.firstName} ${product.professional.lastName}`,
            sellerProfilePicUrl: product.professional.professionalProfile?.businessImage || '/placeholder-avatar.jpg',
            category: product.category.name,
            rating: product.professional.professionalProfile?.rating || 4.5,
            views: product.viewCount,
            likes: product._count.wishlistItems
          }));
          setNewArrivals(transformedProducts);
        }
      } catch (error) {
        console.error('Failed to fetch new arrivals:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNewArrivals();
  }, []);

function ProductCard({ item, index }: { item: ClothingItem; index: number }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [currentLikes, setCurrentLikes] = useState(item.likes || 0);

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
          {item.category}
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
              src={item.sellerProfilePicUrl}
              alt={item.sellerName}
              className="w-8 h-8 rounded-full border-2 border-white shadow-md mr-3"
              loading="lazy"
            />
            <div className="flex-1 min-w-0">
              <p className="text-slate-900 text-sm font-semibold truncate">{item.sellerName}</p>
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-500 fill-current" />
                <span className="text-xs text-slate-600">{item.rating}</span>
                <span className="text-xs text-slate-400 ml-1">{item.views} views</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4">
        <Link href={`/shopping/products/${item.id}`}>
          <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight cursor-pointer">
            {item.name}
          </h3>
        </Link>

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
            <span>{item.views}</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 text-yellow-500 fill-current" />
            <span>{item.rating}</span>
          </div>
        </div>
      </div>

      {/* Hover Effect Ring */}
      <div className={`absolute inset-0 rounded-2xl border-2 border-blue-500/30 opacity-0 group-hover:opacity-100 transition-all duration-300 scale-95 group-hover:scale-100`}></div>
    </div>
  );
}

  if (loading) {
    return (
      <div className="bg-white py-16 px-4 lg:px-8">
        <div className="relative z-10 max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-4 animate-fade-in-up">
              New Arrivals
            </h2>
          </div>

          {/* Loading Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="bg-white rounded-2xl overflow-hidden shadow-lg animate-pulse">
                <div className="h-64 lg:h-72 bg-gray-200"></div>
                <div className="p-4">
                  <div className="h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                  <div className="flex justify-between items-center">
                    <div className="h-5 bg-gray-200 rounded w-16"></div>
                    <div className="h-4 bg-gray-200 rounded w-8"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white py-16 px-4 lg:px-8">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 rounded-full bg-gradient-to-r from-pink-400/10 to-purple-500/10 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-24 h-24 rounded-full bg-gradient-to-r from-blue-400/10 to-cyan-500/10 animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-40 left-1/4 w-20 h-20 rounded-full bg-gradient-to-r from-emerald-400/10 to-teal-500/10 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-4 animate-fade-in-up">
            New Arrivals
          </h2>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {newArrivals.map((item, index) => (
            <ProductCard key={item.id} item={item} index={index} />
          ))}
        </div>

        {/* Bottom Section */}
        <div className="text-center mt-12">
          <div className="flex items-center justify-center gap-6 text-sm text-slate-600 animate-fade-in-up" style={{ animationDelay: '800ms' }}>
            <div className="text-center">
              <div className="text-xl font-bold text-slate-900 mb-1">{newArrivals.length}+</div>
              <div>New Items</div>
            </div>
            <div className="w-px h-10 bg-slate-300"></div>
            <div className="text-center">
              <div className="text-xl font-bold text-slate-900 mb-1">5★</div>
              <div>Top Rated</div>
            </div>
            <div className="w-px h-10 bg-slate-300"></div>
            <div className="text-center">
              <div className="text-xl font-bold text-slate-900 mb-1">100%</div>
              <div>Authentic</div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
          opacity: 0;
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}

export default NewArrivals;