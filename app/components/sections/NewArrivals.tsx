'use client'
import React, { useState, useEffect } from 'react';
import { Star, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import Image from 'next/image';
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

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className={`group relative w-full cursor-pointer bg-white rounded-2xl overflow-hidden shadow-lg transition-all duration-500 ${!isMobile && 'hover:shadow-xl hover:scale-[1.02]'}`}
      onMouseEnter={() => !isMobile && setIsHovered(true)}
      onMouseLeave={() => !isMobile && setIsHovered(false)}
    >
      {/* Image Container - Full Bleed */}
      <div className="relative aspect-[3/4] overflow-hidden bg-stone-100 rounded-t-2xl">

        {/* Image with Parallax-like Scale */}
        <motion.img
          src={item.images[0] || "/placeholder-product.jpg"}
          alt={item.name}
          className="w-full h-full object-cover"
          animate={{ scale: !isMobile && isHovered ? 1.05 : 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        />

        {/* Overlay Gradient */}
        <div className={cn(
          "absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-500",
          (isMobile || isHovered) && "opacity-100"
        )} />

        {/* Seller Info Overlay - Top Left */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
          <Image
            src={item.sellerProfilePicUrl}
            alt={item.sellerName}
            width={24}
            height={24}
            className="rounded-full border border-white/50"
          />
          <div className="text-white text-xs font-medium drop-shadow-lg">
            {item.sellerName}
          </div>
        </div>

        {/* Top Badges - Minimalist */}
        <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
           {item.isNew && (
             <span className="bg-white/90 backdrop-blur text-black text-[10px] font-bold tracking-widest px-2 py-1 uppercase">
               New Arrival
             </span>
           )}
        </div>

        {/* Floating Actions (Replaces the old centered buttons) */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: isMobile || isHovered ? 0 : 20, opacity: isMobile || isHovered ? 1 : 0 }}
          transition={{ duration: 0.4 }}
          className="absolute bottom-6 left-6 right-6 flex justify-between items-end z-20"
        >
          <div className="flex flex-col gap-2">
             <Link href={`/shopping/products/${item.id}`}>
                <button className="bg-white text-black px-6 py-3 rounded-full font-medium text-sm hover:bg-stone-200 transition-colors flex items-center gap-2">
                  View Details <ArrowUpRight size={16} />
                </button>
             </Link>
          </div>

          <div className="flex flex-col gap-3">
             <div className="bg-white/20 backdrop-blur-md p-3 rounded-full text-white hover:bg-white hover:text-black transition-all">
                <WishlistButton productId={item.id} variant="default" size="sm" />
             </div>
             <div className="bg-white/20 backdrop-blur-md p-3 rounded-full text-white hover:bg-white hover:text-black transition-all">
                <AddToCartButton productId={item.id} variant="default" size="sm" />
             </div>
          </div>
        </motion.div>

      </div>

      {/* Product Info - Editorial Layout */}
      <div className={`mt-6 flex justify-between items-start border-b border-stone-200 pb-4 px-6 ${!isMobile && 'group-hover:border-black'} transition-colors`}>
        <div>
          <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">{item.category}</p>
          <h3 className={`text-xl font-serif font-medium text-stone-900 leading-tight ${!isMobile && 'group-hover:italic'} transition-all`}>
            {item.name}
          </h3>
        </div>
        <div className="text-right">
          <p className="text-lg font-medium text-stone-900">{item.currency} {item.price.toFixed(2)}</p>
          <div className="flex items-center justify-end gap-1 mt-1 text-xs text-stone-400">
             <Star size={10} className="fill-current text-stone-400" />
             {item.rating}
          </div>
        </div>
      </div>

      {/* Hover Effect Ring */}
      <div className={`absolute inset-0 rounded-2xl border-2 border-blue-500/30 opacity-0 ${!isMobile && 'group-hover:opacity-100'} transition-all duration-300 scale-95 ${!isMobile && 'group-hover:scale-100'}`}></div>
    </motion.div>
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