'use client'
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { ProductCard } from '@/components/common/ProductCard';

type ClothingItem = {
  id: string;
  slug: string;
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
            slug: string;
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
            slug: product.slug,
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
      <div className="bg-[#FAFAF9] py-10 sm:py-12 lg:py-14 border-t border-stone-200/70 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6 sm:mb-8 border-b border-stone-200/80 pb-4">
            <h2 className="text-2xl sm:text-3xl font-serif font-medium text-stone-900 tracking-tight">
              New Arrivals
            </h2>
          </div>

          {/* Loading Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4.5">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="bg-white rounded-2xl overflow-hidden border border-stone-200/80 shadow-2xs animate-pulse">
                <div className="aspect-[4/5] bg-stone-200"></div>
                <div className="p-3 sm:p-3.5 space-y-2">
                  <div className="h-2.5 bg-stone-200 rounded w-1/3"></div>
                  <div className="h-3.5 bg-stone-200 rounded w-3/4"></div>
                  <div className="flex justify-between items-center pt-2">
                    <div className="h-3.5 bg-stone-200 rounded w-16"></div>
                    <div className="h-2.5 bg-stone-200 rounded w-8"></div>
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
    <div className="relative bg-[#FAFAF9] py-10 sm:py-12 lg:py-14 border-t border-stone-200/70 px-4 sm:px-6 lg:px-8 text-stone-900 font-sans">
      {/* Background Subtle Radial Accent */}
      <div className="absolute inset-0 pointer-events-none opacity-20" 
        style={{ backgroundImage: 'radial-gradient(#d6d3d1 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-6 sm:mb-8 flex justify-between items-end border-b border-stone-200/80 pb-4 gap-3">
          <div>
            <h2 className="text-2xl sm:text-3xl font-serif font-medium text-stone-900 tracking-tight">
              New Arrivals
            </h2>
          </div>
          <Link 
            href="/shopping?tab=new" 
            className="inline-flex items-center gap-1 text-xs font-mono uppercase tracking-wider text-stone-500 hover:text-stone-900 transition-colors"
          >
            <span>View all</span>
            <ArrowUpRight size={13} />
          </Link>
        </header>

        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-3.5 lg:gap-4">
          {newArrivals.map((item, index) => (
            <ProductCard key={item.id} item={item} index={index} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default NewArrivals;