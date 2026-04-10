'use client'
import React, { useState, useEffect } from 'react';
import { ProductCard } from '@/components/common/ProductCard';

type ClothingItem = {
  id: string;
  name: string;
  images: string[];
  price: number;
  currency: string;
  isNew: boolean;
  sellerName: string;
  sellerProfilePicUrl: string;
  isVerified: boolean;
  isTrendiZip: boolean;
  category: string;
  rating?: number;
  views?: number;
  likes?: number;
  // Discount fields
  effectivePrice?: number;
  isDiscountActive?: boolean;
  discountAmount?: number;
  discountPercentage?: number;
  discountEndDate?: string;
  stockQuantity: number;
  isPreorder: boolean;
  estimatedDelivery?: number;
  createdAt: string;
  professional: {
    firstName: string;
    lastName: string;
    professionalProfile?: {
      businessName: string;
      businessImage: string;
      rating: number;
      totalReviews: number;
      isVerified?: boolean;
    };
  };
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
            avgRating?: number;
            categories: { name: string }[];
            collection?: { name: string };
            professional: {
              firstName: string;
              lastName: string;
              professionalProfile?: {
                businessName: string;
                businessImage: string;
                rating: number;
                totalReviews: number;
                isVerified?: boolean;
              };
            };
            _count: {
              wishlistItems: number;
              cartItems: number;
              orderItems: number;
              reviews: number;
            };
            // Discount fields from API
            effectivePrice?: number;
            isDiscountActive?: boolean;
            discountAmount?: number;
            discountPercentage?: number;
            discountEndDate?: string;
            isPreorder?: boolean;
            estimatedDelivery?: number;
            sizes?: string[];
            colors?: string[];
          }) => {
            const sellerName = product.professional.professionalProfile?.businessName || `${product.professional.firstName} ${product.professional.lastName}`;
            return {
            id: product.id,
            name: product.name,
            images: product.images,
            price: product.price,
            currency: product.currency || 'GHS',
            isNew: false, // Card will calculate based on createdAt
            createdAt: product.createdAt,
            sellerName,
            sellerProfilePicUrl: product.professional.professionalProfile?.businessImage || '/placeholder-avatar.jpg',
            isVerified: product.professional.professionalProfile?.isVerified || false,
            isTrendiZip: sellerName === 'TrendiZip',
            category: product.categories?.[0]?.name || "Fashion",
            rating: product.avgRating || 0,
            views: product.viewCount,
            likes: product._count.wishlistItems,
            // Discount fields
            effectivePrice: product.effectivePrice,
            isDiscountActive: product.isDiscountActive,
            discountAmount: product.discountAmount,
            discountPercentage: product.discountPercentage,
            discountEndDate: product.discountEndDate,
            stockQuantity: product.stockQuantity,
            isPreorder: product.isPreorder || false,
            estimatedDelivery: product.estimatedDelivery,
            professional: product.professional,
            sizes: product.sizes || [],
            colors: product.colors || [],
          }});
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="bg-white rounded-2xl overflow-hidden shadow-lg animate-pulse">
                <div className="aspect-square bg-gray-200"></div>
                <div className="p-4 sm:p-6">
                  <div className="h-3 sm:h-4 bg-gray-200 rounded mb-2 w-1/3"></div>
                  <div className="h-4 sm:h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                  <div className="flex justify-between items-center">
                    <div className="h-4 sm:h-5 bg-gray-200 rounded w-16"></div>
                    <div className="h-3 sm:h-4 bg-gray-200 rounded w-8"></div>
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
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

      <style>{`
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