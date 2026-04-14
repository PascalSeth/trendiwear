'use client';

import React, { useState, useEffect, useCallback } from "react";
import { Search, X, TrendingUp, ArrowRight, History, ShoppingBag, Sparkles, Command } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import useSWR from "swr";

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchCollection {
  id: string;
  name: string;
  imageUrl?: string | null;
}

interface SearchProduct {
  id: string;
  name: string;
  slug: string;
  image: string;
  category: string;
  price: string;
}

interface SearchCategory {
  id: string;
  name: string;
}


const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const router = useRouter();

  // Debounce query
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Fetch results
  const { data, isLoading } = useSWR(
    isOpen ? `/api/search?q=${encodeURIComponent(debouncedQuery)}` : null,
    fetcher
  );

  const searchResults = data || { products: [], categories: [], collections: [], trendingTags: [] };

  // Load recent searches
  useEffect(() => {
    const saved = localStorage.getItem("recent_searches");
    if (saved) setRecentSearches(JSON.parse(saved).slice(0, 5));
  }, [isOpen]);



  const handleSearch = useCallback((searchTerm: string) => {
    if (searchTerm.trim()) {
      const term = searchTerm.trim();
      const updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem("recent_searches", JSON.stringify(updated));
      router.push(`/shopping?q=${encodeURIComponent(term)}`);
      onClose();
      setQuery("");
    }
  }, [router, onClose, recentSearches]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[850px] p-0 overflow-hidden bg-white/95 backdrop-blur-3xl border-none shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] rounded-[32px] top-[10%] translate-y-0">
        <DialogTitle className="sr-only">Search our collection</DialogTitle>

        <div className="flex flex-col h-full max-h-[85vh]">
          {/* Header/Input */}
          <div className="relative flex items-center px-8 py-7 border-b border-stone-100">
            <Search className="w-6 h-6 text-stone-400 mr-4" strokeWidth={1.5} />
            <form
              className="flex-1"
              onSubmit={(e) => { e.preventDefault(); handleSearch(query); }}
            >
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by brand, product or style..."
                className="w-full bg-transparent text-2xl font-light text-stone-900 placeholder-stone-300 focus:outline-none"
              />
            </form>
            <div className="flex items-center gap-3">
              {query && (
                <button onClick={() => setQuery("")} className="p-2 hover:bg-stone-100 rounded-full transition-colors">
                  <X className="w-5 h-5 text-stone-400" />
                </button>
              )}
              <kbd className="hidden md:flex items-center gap-1 px-2 py-1 bg-stone-50 border border-stone-200 rounded text-[10px] font-medium text-stone-400">
                <Command size={10} /> K
              </kbd>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
            <AnimatePresence mode="wait">
              {!query ? (
                /* DISCOVERY STATE */
                <motion.div
                  key="discovery"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid grid-cols-1 md:grid-cols-12 gap-12"
                >
                  <div className="md:col-span-4 space-y-8">
                    {recentSearches.length > 0 && (
                      <section>
                        <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-stone-400 mb-4 flex items-center gap-2">
                          <History size={14} /> Recent Searches
                        </h3>
                        <div className="space-y-1">
                          {recentSearches.map((s) => (
                            <button
                              key={s}
                              onClick={() => handleSearch(s)}
                              className="w-full text-left py-2 text-[15px] text-stone-600 hover:text-stone-900 flex items-center group"
                            >
                              <span className="flex-1 truncate">{s}</span>
                              <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                          ))}
                        </div>
                      </section>
                    )}

                    <section>
                      <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-stone-400 mb-4 flex items-center gap-2">
                        <TrendingUp size={14} /> Trending Now
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {(searchResults.trendingTags.length > 0 ? searchResults.trendingTags : ["Minimalist Look", "Streetwear 2024", "Wedding Guest", "Linen Sets", "Eco-Friendly"]).map((tag: string) => (
                          <button
                            key={tag}
                            onClick={() => handleSearch(tag)}
                            className="px-4 py-2 rounded-full border border-stone-200 text-[13px] text-stone-600 hover:border-stone-900 hover:text-stone-900 transition-all"
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </section>
                  </div>

                  <div className="md:col-span-8">
                    <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-stone-400 mb-6 flex items-center gap-2">
                      <Sparkles size={14} /> Featured Collections
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      {searchResults.collections.map((item: SearchCollection) => (
                        <Link
                          key={item.id}
                          href={`/shopping?collectionId=${item.id}`}
                          onClick={onClose}
                          className="relative aspect-[4/3] rounded-2xl overflow-hidden group bg-stone-100"
                        >
                          {item.imageUrl && (
                            <Image 
                              src={item.imageUrl} 
                              alt={item.name} 
                              fill 
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          )}
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors z-10" />
                          <div className="absolute bottom-4 left-4 z-20">
                            <p className="text-white font-medium text-lg">{item.name}</p>
                            <p className="text-white/80 text-xs">Explore Curated Pieces</p>
                          </div>
                        </Link>
                      ))}
                      {searchResults.collections.length === 0 && (
                        <div className="col-span-2 py-12 text-center text-stone-400 text-sm">
                          No collections found
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ) : (
                /* RESULTS STATE */
                <motion.div
                  key="results"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-8"
                >
                  <section>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-stone-400">Products</h3>
                      <button className="text-[11px] font-bold uppercase tracking-widest text-stone-900 hover:underline">View All</button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      {searchResults.products.map((product: SearchProduct) => (
                        <Link
                          key={product.id}
                          href={`/shopping/products/${product.slug}`}
                          onClick={onClose}
                          className="group cursor-pointer block"
                        >
                          <div className="relative aspect-[3/4] mb-3 rounded-xl overflow-hidden bg-stone-50">
                            <Image
                              src={product.image}
                              alt={product.name}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          </div>
                          <p className="text-sm font-medium text-stone-900 truncate">{product.name}</p>
                          <p className="text-xs text-stone-400">{product.category} • {product.price}</p>
                        </Link>
                      ))}
                      {isLoading && (
                        Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className="animate-pulse">
                            <div className="aspect-[3/4] bg-stone-100 rounded-xl mb-3" />
                            <div className="h-4 bg-stone-100 rounded w-3/4 mb-2" />
                            <div className="h-3 bg-stone-100 rounded w-1/2" />
                          </div>
                        ))
                      )}
                      {!isLoading && searchResults.products.length === 0 && (
                        <div className="col-span-full py-12 text-center">
                          <p className="text-stone-400 text-sm">No products found for &quot;{query}&quot;</p>
                        </div>
                      )}
                    </div>
                  </section>

                  {searchResults.categories.length > 0 && (
                    <section className="pt-4 border-t border-stone-100">
                      <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-stone-400 mb-4">Categories</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {searchResults.categories.map((cat: SearchCategory) => (
                          <Link
                            key={cat.id}
                            href={`/shopping?categoryId=${cat.id}`}
                            onClick={onClose}
                            className="px-4 py-3 rounded-xl bg-stone-50 hover:bg-stone-100 transition-colors text-sm font-medium text-stone-900"
                          >
                            {cat.name}
                          </Link>
                        ))}
                      </div>
                    </section>
                  )}

                  <section className="pt-4 border-t border-stone-100">
                    <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-stone-400 mb-4">Quick Actions</h3>
                    <div className="flex flex-col gap-1">
                      <button className="flex items-center gap-3 p-3 -mx-3 rounded-xl hover:bg-stone-50 transition-colors group text-left">
                        <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center group-hover:bg-stone-200">
                          <ShoppingBag size={18} className="text-stone-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-stone-900">Search for &quot;{query}&quot; in Shop</p>
                          <p className="text-xs text-stone-400">Look across all curated categories</p>
                        </div>
                      </button>
                    </div>
                  </section>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer Footer */}
          <div className="px-8 py-4 bg-stone-50/50 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
            <div className="flex gap-6">
              <span className="flex items-center gap-2">
                <kbd className="px-1.5 py-0.5 bg-white border border-stone-200 rounded text-[10px] shadow-sm font-sans font-bold text-stone-500">ESC</kbd>
                to close
              </span>
              <span className="flex items-center gap-2">
                <kbd className="px-1.5 py-0.5 bg-white border border-stone-200 rounded text-[10px] shadow-sm font-sans font-bold text-stone-500">↵</kbd>
                to search
              </span>
            </div>
            <div className="hidden sm:block">
              Need help? <Link href="/contact" className="underline hover:text-stone-900">Contact Concierge</Link>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}