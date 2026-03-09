'use client';

import React, { useState, useEffect } from 'react';
import { Star, ArrowUpRight, Clock, BadgeCheck } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { cn } from '@/lib/utils'; // Assuming you have a utility for merging classes, otherwise use clsx/tailwind-merge
import { WishlistButton } from '@/components/ui/wishlist-button';
import { AddToCartButton } from '@/components/ui/add-to-cart-button';

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

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  images: string[];
  videoUrl?: string;
  category: {
    name: string;
  };
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
  _count: {
    wishlistItems: number;
    reviews: number;
  };
  viewCount: number;
  isNew?: boolean;
  // Discount fields from API
  effectivePrice?: number;
  isDiscountActive?: boolean;
  discountAmount?: number;
  discountPercentage?: number | null;
  isOnSale?: boolean;
  discountEndDate?: string | null;
}

// Countdown hook for discount timer
function useCountdown(endDate: string | null | undefined) {
  const [timeLeft, setTimeLeft] = useState('');
  
  useEffect(() => {
    if (!endDate) return;
    
    const calculateTimeLeft = () => {
      const end = new Date(endDate).getTime();
      const now = Date.now();
      const diff = end - now;
      
      if (diff <= 0) return '';
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (days > 0) return `${days}d ${hours}h`;
      if (hours > 0) return `${hours}h ${minutes}m`;
      return `${minutes}m`;
    };
    
    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 60000);
    return () => clearInterval(timer);
  }, [endDate]);
  
  return timeLeft;
}

// --- Components ---


// 2. Marquee Component for visual flow
const InfiniteScrollText = ({ text }: { text: string }) => {
  return (
    <div className="w-full overflow-hidden whitespace-nowrap py-12 bg-stone-100 border-y border-stone-200">
      <motion.div 
        animate={{ x: [0, -1000] }} 
        transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
        className="inline-block font-serif text-4xl md:text-6xl text-stone-300 italic font-bold"
      >
        {text} • {text} • {text} • {text} • {text} • {text} • {text} • {text}
      </motion.div>
    </div>
  );
};

// 3. Redesigned Product Card
const ProductCard = ({ item, index }: { item: Product, index: number }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const timeLeft = useCountdown(item.discountEndDate);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Cycle through images on hover
  useEffect(() => {
    if (!isHovered || item.images.length <= 1 || isMobile) return;
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % item.images.length);
    }, 1500);
    return () => clearInterval(interval);
  }, [isHovered, item.images.length, isMobile]);

  // Reset image index when not hovered
  useEffect(() => {
    if (!isHovered) setCurrentImageIndex(0);
  }, [isHovered]);

  const sellerName = item.professional.professionalProfile?.businessName || `${item.professional.firstName} ${item.professional.lastName}`;
  const sellerProfilePicUrl = item.professional.professionalProfile?.businessImage || '/placeholder-avatar.jpg';
  const isVerified = item.professional.professionalProfile?.isVerified || false;
  const isTrendiZip = sellerName === 'TrendiZip';

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="group relative w-full cursor-pointer"
      onMouseEnter={() => !isMobile && setIsHovered(true)}
      onMouseLeave={() => !isMobile && setIsHovered(false)}
    >
      {/* Image Container - Full Bleed */}
      <div className="relative aspect-[3/4] overflow-hidden bg-stone-100 rounded-sm">
        
        {/* Images with crossfade */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentImageIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            <motion.img
              src={item.images[currentImageIndex] || "/placeholder-product.jpg"}
              alt={item.name}
              className="w-full h-full object-cover"
              animate={{ scale: isHovered ? 1.05 : 1 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            />
          </motion.div>
        </AnimatePresence>

        {/* Image Indicators */}
        {item.images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 z-10">
            {item.images.slice(0, 4).map((_, idx) => (
              <div
                key={idx}
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-all duration-300",
                  idx === currentImageIndex ? "bg-white w-4" : "bg-white/50"
                )}
              />
            ))}
          </div>
        )}

        {/* Overlay Gradient */}
        <div className={cn(
          "absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-500",
          isHovered && "opacity-100"
        )} />
        <div className={cn(
          "absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-500",
          isHovered && "opacity-100"
        )} />

        {/* Floating Actions (Replaces the old centered buttons) */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: isHovered ? 0 : 20, opacity: isHovered ? 1 : 0 }}
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

        {/* Seller Info Overlay - Top Left */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
          <div className="relative">
            <img
              src={sellerProfilePicUrl}
              alt={sellerName}
              className="w-6 h-6 rounded-full border border-white/50"
            />
            {(isTrendiZip || isVerified) && (
              <div className={`absolute -bottom-0.5 -right-0.5 rounded-full ${isTrendiZip ? 'bg-blue-500' : 'bg-emerald-500'}`}>
                <BadgeCheck size={10} className="text-white" />
              </div>
            )}
          </div>
          <div className="text-white text-xs font-medium drop-shadow-lg">
            {sellerName}
          </div>
        </div>

        {/* Top Badges - Discount */}
        {item.isDiscountActive && (
          <div className="absolute top-4 right-4 z-20">
            <div className="bg-black/80 backdrop-blur-sm text-white text-[10px] font-medium px-2 py-1 rounded">
              {item.discountPercentage ? (
                <span>{Math.round(item.discountPercentage)}% OFF</span>
              ) : item.discountAmount ? (
                <span>{item.currency} {item.discountAmount.toFixed(0)} OFF</span>
              ) : null}
              {timeLeft && (
                <span className="ml-1.5 text-white/70 inline-flex items-center gap-0.5">
                  <Clock size={8} />{timeLeft}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Product Info - Editorial Layout */}
      <div className="mt-6 flex justify-between items-start border-b border-stone-200 pb-4 group-hover:border-black transition-colors">
        <div>
          <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">{item.category.name}</p>
          <h3 className="text-xl font-serif font-medium text-stone-900 leading-tight group-hover:italic transition-all">
            {item.name}
          </h3>
        </div>
        <div className="text-right">
          {item.isDiscountActive ? (
            <>
              <p className="text-sm text-stone-400 line-through">{item.currency} {item.price.toFixed(2)}</p>
              <p className="text-lg font-medium text-red-600">{item.currency} {(item.effectivePrice || item.price).toFixed(2)}</p>
            </>
          ) : (
            <p className="text-lg font-medium text-stone-900">{item.currency} {item.price.toFixed(2)}</p>
          )}
          <div className="flex items-center justify-end gap-1 mt-1 text-xs text-stone-400">
             <Star size={10} className="fill-current text-stone-400" />
             {item.professional.professionalProfile?.rating ? item.professional.professionalProfile.rating.toFixed(1) : 'New'}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// 4. Category Item - Compact Block Style
const CategoryBlock = ({ category }: { category: Category }) => (
  <Link href={`/shopping/categories/${category.id}`} className="group relative block w-full overflow-hidden h-48 lg:h-64">
    <Image
      src={category.imageUrl || "/placeholder-category.jpg"}
      alt={category.name}
      fill
      className="object-cover transition-transform duration-700 group-hover:scale-105 grayscale group-hover:grayscale-0"
    />
    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors" />
    <div className="absolute inset-0 flex flex-col justify-end items-start text-white p-6">
      <h3 className="text-xl lg:text-2xl font-serif font-bold italic mb-2 translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
        {category.name}
      </h3>
      <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 text-xs uppercase tracking-[0.2em]">
        Explore
      </span>
    </div>
  </Link>
);

// --- Main Page Component ---
const Page = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Preserving Logic
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const [catRes, featRes, trendRes] = await Promise.all([
          fetch('/api/categories/parents'),
          fetch('/api/products?limit=4&sortBy=createdAt&sortOrder=desc'),
          fetch('/api/products?limit=4&sortBy=viewCount&sortOrder=desc')
        ]);

        if (!catRes.ok || !featRes.ok || !trendRes.ok) throw new Error('Failed to fetch data');

        const categoriesData = await catRes.json();
        const featuredData = await featRes.json();
        const trendingData = await trendRes.json();

        // Preserve Transformation Logic
        const transformProduct = (product: Product) => ({
          ...product,
          isNew: product.isNew || false,
        });

        setCategories(categoriesData);
        setFeaturedProducts(featuredData.products.map(transformProduct));
        setTrendingProducts(trendingData.products.map(transformProduct));

      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="h-screen bg-stone-50 flex items-center justify-center font-serif italic text-2xl animate-pulse">Loading Curated Pieces...</div>;
  if (error) return <div className="h-screen flex items-center justify-center text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-stone-900 selection:bg-black selection:text-white">
      {/* HERO SECTION */}
      <header className="relative pt-10 pb-20 lg:pt-15 lg:pb-32 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="flex-1 max-w-4xl"
          >
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-serif font-medium leading-[0.9] tracking-tighter mb-8">
              Refined <br />
              <span className="italic font-light text-stone-500">Aesthetics.</span>
            </h1>
            <p className="text-lg md:text-xl text-stone-600 max-w-md font-light leading-relaxed mb-10">
              Professional designers and tailors showcasing their finest collections for the modern individual.
            </p>

            <div className="flex flex-wrap gap-6">
              <button className="bg-black text-white px-8 py-4 rounded-full text-sm font-medium tracking-wide hover:bg-stone-800 transition-colors">
                Shop Collection
              </button>
              <div className="flex items-center gap-6 text-xs font-medium uppercase tracking-widest text-stone-500">
                <span>{featuredProducts.length + trendingProducts.length}+ Items</span>
                <span className="w-1 h-1 bg-stone-400 rounded-full"></span>
                <span>Exclusive Designers</span>
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="flex-1 relative"
          >
            <Image
              src="/woman.png"
              alt="Woman holding shopping bags"
              width={600}
              height={800}
              className="w-full h-auto object-cover rounded-lg"
            />
          </motion.div>
        </div>
      </header>

      <InfiniteScrollText text="DISCOVER • CRAFT • WEAR • CURATE • STYLE • DISCOVER •" />

      {/* CATEGORIES - Compact Grid */}
      <section className="py-24 px-4 md:px-8 bg-white">
        <div className="max-w-[1600px] mx-auto mb-16 px-4">
          <div>
            <span className="text-orange-600 text-xs font-bold uppercase tracking-widest mb-2 block">Directory</span>
            <h2 className="text-4xl md:text-5xl font-serif">Shop by Category</h2>
          </div>
        </div>

        <div className="max-w-[1600px] mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-4">
          {categories.map((category) => (
            <CategoryBlock key={category.id} category={category} />
          ))}
        </div>
      </section>

      {/* FEATURED PRODUCTS - Editorial Grid */}
      <section className="py-24 px-4 md:px-8">
        <div className="max-w-[1600px] mx-auto mb-16 px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
             <div>
               <span className="text-stone-400 text-xs font-bold uppercase tracking-widest mb-2 block">Selection</span>
               <h2 className="text-4xl md:text-6xl font-serif">Curated by Professionals</h2>
             </div>
             <p className="max-w-sm text-stone-500 leading-relaxed">
               Handpicked items representing the pinnacle of craftsmanship and contemporary design.
             </p>
          </div>
        </div>

        <div className="max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16 px-4">
          {featuredProducts.map((product, index) => (
            <ProductCard key={product.id} item={product} index={index} />
          ))}
        </div>
      </section>

      {/* TRENDING PRODUCTS - Dark Mode Block for Contrast */}
      <section className="py-24 bg-stone-900 text-white">
        <div className="max-w-[1600px] mx-auto mb-16 px-4">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-[1px] bg-white/20"></div>
            <span className="text-orange-500 text-xs font-bold uppercase tracking-widest">Trending Now</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-serif">Most Popular</h2>
        </div>

        <div className="max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16 px-4">
          {trendingProducts.map((product, index) => (
             // Note: We pass a light theme override or let the card adapt. 
             // For this design, let's reuse the card but ensure text contrasts if we were changing backgrounds.
             // Since ProductCard is white/light, we wrap it or adjust styles. 
             // To keep it simple and robust, we will render the standard card but the section background is dark.
             // Ideally, we pass a 'theme' prop, but let's stick to the structure.
            <div key={product.id} className="text-stone-900">
               <ProductCard item={product} index={index} />
            </div>
          ))}
        </div>
      </section>

  
       
    </div>
  );
};

export default Page;