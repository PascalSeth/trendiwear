"use client";
import React, { useState, useMemo } from 'react';
import { ArrowUpRight, Search, Filter, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

// --- Types ---
interface TrendEvent {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  seasonality: string[];
  dressCodes: string[];
  searchKeywords: string[];
  _count: {
    outfitInspirations: number;
  };
}

interface TrendsClientProps {
  initialEvents: TrendEvent[];
}

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

// --- Smart Category Mapping ---
const CATEGORIES = [
  { id: 'all', label: 'All Vibes', matches: [] },
  { id: 'traditional', label: 'Traditional & Ceremony', matches: ['Traditional', 'Wedding', 'Funeral', 'Owambe', 'Church', 'Modest'] },
  { id: 'social', label: 'Social & Nightlife', matches: ['Social', 'Festival', 'Brunch', 'Nightlife', 'Creative', 'Owambe'] },
  { id: 'street', label: 'Street & Youth', matches: ['Street', 'Y2K', 'Festival', 'Campus', 'Sports'] },
  { id: 'professional', label: 'Work & Academics', matches: ['Professional', 'Corporate', 'Academic'] },
  { id: 'lifestyle', label: 'Lifestyle & Wellness', matches: ['Casual', 'Active', 'Wellness', 'Resort', 'Beach', 'Travel', 'Lounge'] },
];

export default function TrendsClient({ initialEvents }: TrendsClientProps) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // --- Filtering & Smart Sorting ---
  const filteredEvents = useMemo(() => {
    let result = [...initialEvents];

    // 1. Search Filter (Names + Keywords)
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(e =>
        e.name.toLowerCase().includes(q) ||
        e.searchKeywords.some(k => k.toLowerCase().includes(q)) ||
        e.description?.toLowerCase().includes(q)
      );
    }

    // 2. Category Filter
    if (activeCategory !== 'all') {
      const cat = CATEGORIES.find(c => c.id === activeCategory);
      if (cat) {
        result = result.filter(e => cat.matches.includes(e.name));
      }
    }

    // 3. Smart Sort: Popularity (Inspirations) first, then Alphabetical
    return result.sort((a, b) => {
      if (b._count.outfitInspirations !== a._count.outfitInspirations) {
        return b._count.outfitInspirations - a._count.outfitInspirations;
      }
      return a.name.localeCompare(b.name);
    });
  }, [initialEvents, activeCategory, searchQuery]);

  const getHeightClass = (index: number) => {
    // Artistic vertical rhythm: varying aspect ratios for the masonry look
    const remainder = index % 5;
    switch (remainder) {
      case 0: return 'aspect-[3/4]'; // Tall
      case 1: return 'aspect-[1/1]'; // Square
      case 2: return 'aspect-[4/5]'; // Standard Portrait
      case 3: return 'aspect-[3/2]'; // Landscape
      case 4: return 'aspect-[2/3]'; // Extra Tall
      default: return 'aspect-[3/4]';
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9] relative overflow-hidden">
      
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none opacity-40" 
        style={{ backgroundImage: 'radial-gradient(#d6d3d1 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
      </div>

      <div className="max-w-[1600px] mx-auto relative z-10 px-6 md:px-12 py-24">
        {/* Header */}
        <header className="mb-16 pt-28 lg:pt-40">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-stone-200 pb-12 gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-6">
                <span className="font-mono text-[10px] uppercase tracking-[0.5em] text-stone-400">Intelligence / Trends 2026</span>
                <div className="h-px w-24 bg-stone-300"></div>
              </div>
              <h1 className="text-7xl md:text-9xl font-serif font-medium text-stone-900 leading-[0.85] -tracking-widest">
                Discover.
              </h1>
            </div>
            
            {/* SEARCH COMPONENT */}
            <div className="relative w-full md:w-96 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 group-focus-within:text-stone-900 transition-colors" />
              <input 
                type="text"
                placeholder="Search vibes (e.g. Rich Auntie, Hypebeast)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-stone-200 py-4 pl-12 pr-12 text-sm font-light focus:outline-none focus:border-stone-900 transition-all placeholder:text-stone-300 shadow-sm rounded-none"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-900"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* CATEGORY BAR */}
          <div className="flex items-center gap-2 mt-8 overflow-x-auto pb-4 no-scrollbar">
            <div className="flex items-center gap-2 pr-6 border-r border-stone-200 mr-4">
              <Filter size={14} className="text-stone-400" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-stone-500 whitespace-nowrap">Filter By Vibe:</span>
            </div>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "px-6 py-2 text-[10px] font-mono uppercase tracking-widest whitespace-nowrap transition-all border",
                  activeCategory === cat.id
                    ? "bg-stone-900 text-white border-stone-900 shadow-md" 
                    : "bg-white text-stone-500 border-stone-200 hover:border-stone-400"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </header>

        {/* RESULTS COUNT & STATUS */}
        <div className="mb-12 flex justify-between items-center text-[10px] font-mono uppercase tracking-widest text-stone-400 border-b border-stone-100 pb-4">
          <span>{filteredEvents.length} Events Found</span>
          {searchQuery && <span>Searching for: &quot;{searchQuery}&quot;</span>}
        </div>

        {/* MASONRY WATERFALL CONTAINER */}
        <div className="min-h-[500px]">
          {filteredEvents.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-32 text-center"
            >
              <p className="text-stone-300 font-serif text-3xl italic">
                The oracle is quiet. No matches found for your search.
              </p>
              <button 
                onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
                className="mt-8 text-stone-900 border-b border-stone-900 pb-1 text-xs font-mono uppercase tracking-widest hover:text-stone-500 hover:border-stone-500 transition-all"
              >
                Clear all filters
              </button>
            </motion.div>
          ) : (
            <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-8 space-y-8">
              <AnimatePresence mode="popLayout">
                {filteredEvents.map((event, index) => (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                    key={event.id}
                    className={cn(
                      "group relative cursor-pointer break-inside-avoid mb-8",
                      getHeightClass(index)
                    )}
                  >
                    <Link href={`/fashion-trends/${event.id}`} className="block absolute inset-0">
                      {/* LUXURY EDITORIAL FRAME (PASS-PARTOUT) */}
                      <div className="absolute inset-0 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.02)] transition-all duration-1000 group-hover:shadow-[0_20px_50px_rgb(0,0,0,0.08)] overflow-hidden border border-stone-100">
                        {/* THE INNER FLOATING IMAGE */}
                        <div className="absolute inset-[10px] md:inset-[15px] bg-stone-50 overflow-hidden">
                          {event.imageUrl ? (
                            <Image
                              src={event.imageUrl}
                              alt={event.name}
                              fill
                              className="object-cover transition-all duration-1200 grayscale group-hover:grayscale-0 group-hover:scale-105 object-[50%_20%]"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-stone-50 to-stone-100 flex items-center justify-center p-8">
                              <span className="font-serif text-[10vw] md:text-8xl text-stone-200/50 -rotate-12 mix-blend-multiply whitespace-nowrap">{event.name}</span>
                            </div>
                          )}
                          
                          {/* OVERLAY CONTENT (Silk Glass & Sequential Reveal) */}
                          <div className="absolute inset-0 bg-gradient-to-t from-stone-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

                          <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-between">
                            {/* Top Metadata - Sequential Step 1 */}
                            <div className="flex justify-between items-start opacity-0 group-hover:opacity-100 transition-all duration-700 delay-100 transform -translate-y-4 group-hover:translate-y-0">
                                <span className="text-[7px] font-mono text-white tracking-[0.4em] uppercase bg-stone-900/40 px-2 py-1 md:px-3 md:py-1.5 backdrop-blur-[2px] border border-white/10">
                                  {event.seasonality[0] || 'Omni-Season'}
                                </span>
                                <span className="text-[7px] font-mono text-white/50 tracking-[0.4em] uppercase mt-1">
                                  VOL.{String(index + 1).padStart(2, '0')}
                                </span>
                            </div>

                            {/* Bottom Content - Sequential Steps (Staggered) */}
                            <div className="space-y-4 md:space-y-6">
                              {/* Name - Sequential Step 2 */}
                              <h3 className="text-2xl md:text-4xl lg:text-3xl xl:text-4xl font-serif text-white font-medium leading-[0.85] italic opacity-0 group-hover:opacity-100 transition-all duration-1000 delay-200 transform translate-y-8 group-hover:translate-y-0">
                                {event.name}
                              </h3>
                              
                              {/* Dress Codes - Sequential Step 3 */}
                              <div className="flex flex-wrap gap-2 opacity-0 group-hover:opacity-100 transition-all duration-1000 delay-300 transform translate-y-4 group-hover:translate-y-0">
                                {event.dressCodes.slice(0, 1).map((code, i) => (
                                  <span key={i} className="text-[7px] font-mono text-white/90 tracking-[0.4em] border-l border-white/30 pl-3 md:pl-4 uppercase">
                                    {code}
                                  </span>
                                ))}
                              </div>

                              {/* Link - Sequential Step 4 */}
                              <div className="flex items-center gap-4 md:gap-6 pt-2 md:pt-4 text-white opacity-0 group-hover:opacity-100 transition-all duration-1000 delay-500 transform translate-y-2 group-hover:translate-y-0">
                                <span className="text-[8px] font-mono uppercase tracking-[0.5em] border-b border-white/30 pb-1.5 hover:border-white transition-colors">
                                  Explore
                                </span>
                                <div className="h-8 w-8 md:h-10 md:w-10 border border-white/20 rounded-full flex items-center justify-center group-hover:bg-white group-hover:text-stone-900 transition-all duration-500">
                                  <ArrowUpRight size={12} />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                    
                    {/* STATIC MINI LABELS (Hidden Hover) */}
                    <div className="absolute top-0 right-0 p-4 md:p-6 z-20 pointer-events-none transition-all duration-700 group-hover:opacity-0 group-hover:scale-90">
                       <span className="text-[8px] md:text-[9px] font-mono text-stone-400 tracking-[0.5em] uppercase border-r border-stone-200 pr-2 md:pr-4">
                         {String(index + 1).padStart(2, '0')}
                       </span>
                    </div>

                    <div className="absolute bottom-0 left-0 p-6 md:p-8 z-20 pointer-events-none transition-all duration-700 group-hover:opacity-0 group-hover:-translate-x-8">
                       <h4 className="text-[9px] md:text-[10px] font-mono text-stone-900 tracking-[0.5em] uppercase leading-none">
                         {event.name}
                       </h4>
                       <span className="text-[7px] font-mono text-stone-400 tracking-[0.4em] uppercase mt-1 md:mt-2 block">
                         {event._count.outfitInspirations} Concepts
                       </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* CTA */}
        <footer className="border-t border-stone-200 mt-32 pt-24 pb-32 flex flex-col items-center">
          <div className="h-24 w-px bg-stone-200 mb-12" />
          <h2 className="text-4xl md:text-6xl font-serif text-stone-900 italic mb-12 text-center">
            The world is your <br />
            <span className="font-medium not-italic">Runway.</span>
          </h2>
          <Link
            href="/tailors-designers"
            className="group inline-flex items-center gap-6"
          >
            <span className="font-mono text-xs uppercase tracking-[0.4em] text-stone-900">
              Style My Vibe
            </span>
            <div className="h-14 w-14 border border-stone-900 flex items-center justify-center transition-all group-hover:bg-stone-900 group-hover:text-white rounded-full">
              <ArrowUpRight size={20} />
            </div>
          </Link>
        </footer>
      </div>
    </div>
  );
}
