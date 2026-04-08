'use client';

import React, { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import Image from 'next/image';

interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string;
  _count: {
    products: number;
  };
}

interface CategoryNavigatorProps {
  categories: Category[];
}

export const CategoryNavigator = ({ categories }: CategoryNavigatorProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const [isFixed, setIsFixed] = useState(false);

  // Monitor scroll for sticking the navigator
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 600) {
        setIsFixed(true);
      } else {
        setIsFixed(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="relative h-32 lg:h-40 my-12">
      <motion.div
        className={`w-full z-40 py-6 transition-all duration-500 ${
          isFixed 
            ? 'fixed top-20 left-0 bg-white/80 backdrop-blur-md border-b border-stone-100 shadow-sm' 
            : 'relative'
        }`}
      >
        <div className="max-w-[1600px] mx-auto px-6 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-8 min-w-max pb-4">
            {categories.map((cat, i) => (
              <Link 
                key={cat.id} 
                href={`/shopping/categories/${cat.id}`}
                className="group flex items-center gap-4 hover:opacity-100 transition-opacity"
              >
                <div className="relative w-12 h-12 lg:w-16 lg:h-16 rounded-full overflow-hidden border border-stone-100 group-hover:border-stone-900 transition-colors duration-500">
                  <Image 
                    src={cat.imageUrl || "/placeholder-category.jpg"} 
                    alt={cat.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400 group-hover:text-amber-700 transition-colors">
                    {cat._count.products} Items
                  </span>
                  <span className="text-sm lg:text-base font-serif font-medium text-stone-900 group-hover:italic">
                    {cat.name}
                  </span>
                </div>
                {i < categories.length - 1 && (
                  <div className="h-4 w-[1px] bg-stone-100 ml-4 hidden lg:block" />
                )}
              </Link>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
