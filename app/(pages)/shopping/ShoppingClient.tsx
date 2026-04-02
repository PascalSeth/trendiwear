'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { ProductCard } from '@/components/common/ProductCard';


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
    slug: string;
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
  isPreorder?: boolean;
  estimatedDelivery?: number;
  stockQuantity: number;
  effectivePrice?: number;
  isDiscountActive?: boolean;
  discountAmount?: number;
  discountPercentage?: number | null;
  isOnSale?: boolean;
  discountEndDate?: string | null;
}

interface ShoppingClientProps {
  initialData: {
    categories: Category[];
    featuredProducts: Product[];
    trendingProducts: Product[];
  };
}

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

export default function ShoppingClient({ initialData }: ShoppingClientProps) {
  const { categories, featuredProducts, trendingProducts } = initialData;

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-stone-900 selection:bg-black selection:text-white pt-24 lg:pt-32">
      {/* HERO SECTION */}
      <header className="relative py-20 lg:py-32 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="flex-1 max-w-4xl"
          >
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-serif font-medium leading-[0.9] tracking-tighter mb-8 text-red-950">
              Refined <br />
              <span className="italic font-light text-stone-500">Aesthetics.</span>
            </h1>
            <p className="text-lg md:text-xl text-stone-600 max-w-md font-serif italic leading-relaxed mb-10">
              Professional designers and tailors showcasing their finest collections for the modern individual.
            </p>

            <div className="flex flex-wrap gap-6">
              <button className="bg-stone-900 text-white px-8 py-4 rounded-full text-xs font-mono uppercase tracking-widest hover:bg-stone-800 transition-colors">
                Shop Collection
              </button>
              <div className="flex items-center gap-6 text-[10px] font-mono uppercase tracking-widest text-stone-400">
                <span>{featuredProducts.length + trendingProducts.length}+ Items</span>
                <span className="w-1 h-1 bg-stone-300 rounded-full"></span>
                <span>Exclusive Designers</span>
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="flex-1 relative hidden lg:block"
          >
            <div className="aspect-[4/5] relative rounded-2xl overflow-hidden">
              <Image
                src="/woman.png"
                alt="Editorial Fashion"
                fill
                className="object-cover"
                priority
              />
            </div>
          </motion.div>
        </div>
      </header>

      <InfiniteScrollText text="DISCOVER • CRAFT • WEAR • CURATE • STYLE • DISCOVER" />

      {/* CATEGORIES */}
      <section className="py-24 px-6">
        <div className="max-w-[1600px] mx-auto mb-16 px-4">
          <div>
            <span className="text-red-900 text-[10px] font-mono uppercase tracking-[0.3em] mb-4 block">The Directory</span>
            <h2 className="text-4xl md:text-6xl font-serif font-medium leading-none">Shop by Category.</h2>
          </div>
        </div>

        <div className="max-w-[1600px] mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 px-4">
          {categories.map((category) => (
            <CategoryBlock key={category.id} category={category} />
          ))}
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-[1600px] mx-auto mb-16 px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-stone-100 pb-10">
            <div>
              <span className="text-red-900 text-[10px] font-mono uppercase tracking-widest mb-4 block">New arrivals</span>
              <h2 className="text-4xl md:text-7xl font-serif leading-none italic">Just Landed.</h2>
            </div>
            <p className="max-w-xs font-serif text-stone-500 italic text-lg leading-relaxed">
              Handpicked items representing the pinnacle of craftsmanship and contemporary design.
            </p>
          </div>
        </div>

        <div className="max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-20 px-4">
          {featuredProducts.map((product, index) => (
            <ProductCard key={product.id} item={product} index={index} />
          ))}
        </div>
      </section>

      {/* TRENDING PRODUCTS */}
      <section className="py-24 bg-stone-900 text-stone-50 overflow-hidden">
        <div className="max-w-[1600px] mx-auto mb-16 px-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-8 h-[1px] bg-red-900"></div>
            <span className="text-red-900 text-[10px] font-mono uppercase tracking-widest">Global Favorites</span>
          </div>
          <h2 className="text-4xl md:text-7xl font-serif leading-none">Trending Now.</h2>
        </div>

        <div className="max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-20 px-4">
          {trendingProducts.map((product, index) => (
            <div key={product.id} className="text-stone-900 bg-white p-4 rounded-xl shadow-2xl shadow-black/20 transform hover:-translate-y-2 transition-transform duration-500">
              <ProductCard item={product} index={index} />
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER CTA */}
      <section className="py-32 px-6">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          <h3 className="text-3xl md:text-5xl font-serif italic">Fine tailoring delivered <br /> to your doorstep.</h3>
          <div className="flex justify-center gap-4">
            <button className="bg-stone-900 text-white px-10 py-4 rounded-full text-xs font-mono uppercase tracking-widest hover:bg-black transition-all">Start Shopping</button>
          </div>
        </div>
      </section>
    </div>
  );
}
