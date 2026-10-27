'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  activeCategory?: string | null;
  onSelectCategory?: (slug: string | null) => void;
}

export const CategoryNavigator: React.FC<CategoryNavigatorProps> = ({
  categories,
  activeCategory = null,
  onSelectCategory,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [categories]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = direction === 'left' ? -320 : 320;
    scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    setTimeout(checkScroll, 350);
  };

  return (
    <div className="relative w-full py-2">
      {/* Scroll controls (desktop only) */}
      {canScrollLeft && (
        <button
          onClick={() => handleScroll('left')}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/95 shadow-md border border-stone-200/80 flex items-center justify-center text-stone-700 hover:bg-stone-900 hover:text-white transition-all hidden md:flex"
          aria-label="Scroll left"
        >
          <ChevronLeft size={18} />
        </button>
      )}

      {canScrollRight && (
        <button
          onClick={() => handleScroll('right')}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/95 shadow-md border border-stone-200/80 flex items-center justify-center text-stone-700 hover:bg-stone-900 hover:text-white transition-all hidden md:flex"
          aria-label="Scroll right"
        >
          <ChevronRight size={18} />
        </button>
      )}

      {/* Categories track */}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex items-center gap-3 overflow-x-auto no-scrollbar px-4 sm:px-8 py-1 scroll-smooth"
      >
        {/* All Categories Pill */}
        <button
          type="button"
          onClick={() => onSelectCategory ? onSelectCategory(null) : null}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium tracking-wide whitespace-nowrap transition-all duration-200 shrink-0 shadow-sm",
            activeCategory === null
              ? "bg-stone-900 text-white shadow-stone-900/20"
              : "bg-white text-stone-700 hover:bg-stone-100 border border-stone-200/70"
          )}
        >
          <span>All Categories</span>
        </button>

        {categories.map((cat) => {
          const isSelected = activeCategory === cat.slug;

          const innerBadge = (
            <div
              className={cn(
                "group flex items-center gap-3 px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-300 shrink-0 shadow-sm border",
                isSelected
                  ? "bg-stone-900 text-white border-stone-900 shadow-stone-900/15"
                  : "bg-white text-stone-800 hover:bg-stone-50 border-stone-200/80 hover:border-stone-300"
              )}
            >
              <div className="relative w-7 h-7 rounded-full overflow-hidden border border-stone-200/80 shrink-0 bg-stone-100">
                <Image
                  src={cat.imageUrl || "/placeholder-category.jpg"}
                  alt={cat.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <span className="font-medium tracking-tight">{cat.name}</span>
              <span
                className={cn(
                  "text-[10px] font-mono px-2 py-0.5 rounded-full",
                  isSelected
                    ? "bg-stone-800 text-amber-300"
                    : "bg-stone-100 text-stone-500 group-hover:bg-stone-200"
                )}
              >
                {cat._count.products}
              </span>
            </div>
          );

          if (onSelectCategory) {
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(isSelected ? null : cat.slug)}
                className="shrink-0 text-left"
              >
                {innerBadge}
              </button>
            );
          }

          return (
            <Link
              key={cat.id}
              href={`/shopping/categories/${cat.slug}`}
              className="shrink-0"
            >
              {innerBadge}
            </Link>
          );
        })}
      </div>
    </div>
  );
};
