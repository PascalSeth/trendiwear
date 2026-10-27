"use client";
import React, { useState, useMemo } from 'react';
import { Search, X, ArrowRight, Sparkles, Compass } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import FitCheckModal, { type FitCheckOutfit } from './components/FitCheckModal';

// --- Types ---
interface TrendEvent {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  seasonality: string[];
  dressCodes: string[];
  searchKeywords: string[];
  outfitInspirations?: Array<{
    outfitImageUrl: string;
  }>;
  _count: {
    outfitInspirations: number;
  };
}

interface TrendsClientProps {
  initialEvents: TrendEvent[];
}

// Category mappings
const CATEGORIES = [
  { id: 'all', label: 'All Moods', matches: [] },
  { id: 'traditional', label: 'Ceremony & Traditional', matches: ['Traditional', 'Wedding', 'Funeral', 'Owambe', 'Church', 'Modest'] },
  { id: 'social', label: 'Social & Parties', matches: ['Social', 'Festival', 'Brunch', 'Nightlife', 'Creative', 'Owambe'] },
  { id: 'street', label: 'Streetwear & Kinetic', matches: ['Street', 'Y2K', 'Festival', 'Campus', 'Sports'] },
  { id: 'professional', label: 'Corporate & Executive', matches: ['Professional', 'Corporate', 'Academic'] },
  { id: 'lifestyle', label: 'Resort & Vacation', matches: ['Casual', 'Active', 'Wellness', 'Resort', 'Beach', 'Travel', 'Lounge'] },
];

const TAPE_PRESETS = [
  { bg: 'bg-[#EED571]', border: 'border-[#D8BF58]', text: 'text-stone-900', rotate: 'rotate-[-3deg]', emoji: '✌️' },
  { bg: 'bg-[#F2BAC9]', border: 'border-[#DF9AAE]', text: 'text-stone-900', rotate: 'rotate-[4deg]', emoji: '★' },
  { bg: 'bg-[#BCD4B4]', border: 'border-[#A1C097]', text: 'text-stone-900', rotate: 'rotate-[-2deg]', emoji: '〰' },
  { bg: 'bg-[#D4A373]', border: 'border-[#BC8B5D]', text: 'text-stone-900', rotate: 'rotate-[-4deg]', emoji: '⚡' },
  { bg: 'bg-[#A8D0E6]', border: 'border-[#8BBED8]', text: 'text-stone-900', rotate: 'rotate-[3deg]', emoji: '✦' },
  { bg: 'bg-[#F5C2B2]', border: 'border-[#E4A493]', text: 'text-stone-900', rotate: 'rotate-[-2deg]', emoji: '♥' },
];

// --- Hand-drawn Doodle SVGs ---
function PaperClip({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 48" fill="none" className={className} stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 4v32a6 6 0 0 0 12 0V14a4 4 0 0 0-8 0v22a2 2 0 0 0 4 0V16" transform="translate(-4, 2)" />
    </svg>
  );
}

function StarDoodle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 2v20M2 12h20M5 5l14 14M19 5L5 19" />
    </svg>
  );
}

function CrownDoodle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M2 18L5 4L12 12L16 2L20 12L27 4L30 18H2Z" />
      <circle cx="5" cy="4" r="1.5" fill="currentColor" />
      <circle cx="16" cy="2" r="1.5" fill="currentColor" />
      <circle cx="27" cy="4" r="1.5" fill="currentColor" />
    </svg>
  );
}

function PencilScribble({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className={className}>
      <path d="M2 7c5-4 10 3 15 0s10-4 17 0" />
    </svg>
  );
}

export default function TrendsClient({ initialEvents }: TrendsClientProps) {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [fitCheckOutfit, setFitCheckOutfit] = useState<FitCheckOutfit | null>(null);
  const [isFitCheckOpen, setIsFitCheckOpen] = useState(false);

  const handleOpenFitCheck = (e: React.MouseEvent, event: TrendEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const cardImg = getCardImage(event);
    setFitCheckOutfit({
      id: event.id,
      title: event.name,
      imageUrl: cardImg || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80',
      description: event.description,
      tags: getDisplayTags(event),
      eventName: event.name,
    });
    setIsFitCheckOpen(true);
  };

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: initialEvents.length };
    CATEGORIES.forEach(cat => {
      if (cat.id !== 'all') {
        counts[cat.id] = initialEvents.filter(e => cat.matches.includes(e.name)).length;
      }
    });
    return counts;
  }, [initialEvents]);

  // Filtering & Sorting
  const filteredEvents = useMemo(() => {
    let result = [...initialEvents];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(e =>
        e.name.toLowerCase().includes(q) ||
        (e.searchKeywords && e.searchKeywords.some(k => k.toLowerCase().includes(q))) ||
        (e.description && e.description.toLowerCase().includes(q)) ||
        (e.dressCodes && e.dressCodes.some(d => d.toLowerCase().includes(q)))
      );
    }

    if (activeCategory !== 'all') {
      const cat = CATEGORIES.find(c => c.id === activeCategory);
      if (cat) {
        result = result.filter(e => cat.matches.includes(e.name));
      }
    }

    return result.sort((a, b) => {
      if (b._count.outfitInspirations !== a._count.outfitInspirations) {
        return b._count.outfitInspirations - a._count.outfitInspirations;
      }
      return a.name.localeCompare(b.name);
    });
  }, [initialEvents, activeCategory, searchQuery]);

  const getCardImage = (event: TrendEvent) => {
    if (event.imageUrl) return event.imageUrl;
    if (event.outfitInspirations && event.outfitInspirations.length > 0 && event.outfitInspirations[0].outfitImageUrl) {
      return event.outfitInspirations[0].outfitImageUrl;
    }
    const lower = event.name.toLowerCase();
    if (lower.includes('street') || lower.includes('y2k') || lower.includes('drip') || lower.includes('kinetic')) {
      return 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80';
    }
    if (lower.includes('wedding') || lower.includes('ceremony') || lower.includes('traditional') || lower.includes('owambe')) {
      return 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80';
    }
    if (lower.includes('corporate') || lower.includes('exec') || lower.includes('work') || lower.includes('blazer')) {
      return 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80';
    }
    if (lower.includes('beach') || lower.includes('resort') || lower.includes('summer') || lower.includes('vacation')) {
      return 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=800&q=80';
    }
    if (lower.includes('active') || lower.includes('sport') || lower.includes('gym')) {
      return 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80';
    }
    return 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80';
  };

  const getDisplayTags = (event: TrendEvent) => {
    const tags: string[] = [];
    if (event.searchKeywords && event.searchKeywords.length > 0) {
      tags.push(...event.searchKeywords);
    }
    if (event.dressCodes && event.dressCodes.length > 0) {
      tags.push(...event.dressCodes);
    }
    if (event.seasonality && event.seasonality.length > 0) {
      tags.push(...event.seasonality.map(s => s.replace('_', ' ')));
    }
    const cleanTags = Array.from(new Set(tags.filter(Boolean)))
      .map(t => t.replace(/^#/, ''))
      .slice(0, 4);

    if (cleanTags.length === 0) {
      return ['Beach', 'Resort', 'Breezy', 'Sunlit'];
    }
    return cleanTags;
  };

  return (
    <div className="min-h-screen bg-[#F6F2EC] text-stone-900 selection:bg-stone-900 selection:text-white pb-24">
      {/* Authentic Tactile Canvas Paper Background Pattern */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-40 z-0" 
        style={{ backgroundImage: 'radial-gradient(#cfc7bd 1px, transparent 1px)', backgroundSize: '24px 24px' }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20">

        {/* ========================================================= */}
        {/* EDITORIAL SCRAPBOOK HEADER */}
        {/* ========================================================= */}
        <header className="mb-10 sm:mb-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-stone-300/70 pb-6 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest bg-stone-900 text-stone-100 shadow-xs">
                  The Style Scrapbook
                </span>
                <span className="text-xs text-stone-500 font-serif italic">
                  Occasion Inspiration & Lookbooks
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-normal text-stone-900 tracking-tight flex flex-wrap items-baseline gap-2">
                <span>Occasion</span>
                <span className="font-['Caveat',cursive] text-4xl sm:text-5xl lg:text-6xl text-amber-900 font-bold">Scrapbook</span>
                <span className="text-[11px] font-mono uppercase tracking-wider text-stone-400 font-normal">Vol. 2026</span>
              </h1>

              <p className="text-xs sm:text-sm text-stone-600 max-w-xl font-light leading-relaxed">
                A scattered collection of African celebration looks, weekend rendezvous, and street style aesthetics curated into a tactile digital moodboard.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-80 shrink-0">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search occasions, moods..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/95 border border-stone-300 rounded-full py-2.5 pl-9 pr-9 text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900 transition-all placeholder:text-stone-400 shadow-xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-900 rounded-full"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Sticky Tab Category Filter Bar */}
          <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-2 no-scrollbar">
            {CATEGORIES.map((cat) => {
              const count = categoryCounts[cat.id] ?? 0;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-full text-xs transition-all duration-200 border flex items-center gap-1.5 whitespace-nowrap",
                    isActive
                      ? "bg-stone-900 text-white border-stone-900 font-medium shadow-xs -translate-y-0.5"
                      : "bg-white/90 text-stone-600 border-stone-300/80 hover:border-stone-400 hover:text-stone-900 font-normal shadow-2xs"
                  )}
                >
                  <span>{cat.label}</span>
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded-full font-mono",
                    isActive ? "bg-white/20 text-white" : "bg-stone-100 text-stone-500"
                  )}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* AI FIT CHECK STUDIO PROMO BANNER */}
          <div className="mt-5 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#FDFCF9] via-amber-50/80 to-[#FDFCF9] border border-amber-200/90 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden">
            <div className="flex items-center gap-3.5 relative z-10">
              <div className="h-10 w-10 rounded-2xl bg-amber-500/10 text-amber-900 border border-amber-300 flex items-center justify-center shrink-0 shadow-2xs">
                <Sparkles className="h-5 w-5 text-amber-700 animate-pulse" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-['Caveat',cursive] text-2xl font-bold text-stone-900 leading-none">
                    AI Virtual Try-On Studio
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-mono uppercase tracking-wider bg-stone-900 text-white">
                    Wear Any Fit ✨
                  </span>
                </div>
                <p className="text-xs text-stone-600">
                  Upload your photo to generate an instant photorealistic fit check of yourself wearing any lookbook aesthetic with 100% face, skin & pose lock.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                const firstEvent = filteredEvents[0] || initialEvents[0];
                if (firstEvent) {
                  const cardImg = getCardImage(firstEvent);
                  setFitCheckOutfit({
                    id: firstEvent.id,
                    title: firstEvent.name,
                    imageUrl: cardImg || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80',
                    description: firstEvent.description,
                    tags: getDisplayTags(firstEvent),
                    eventName: firstEvent.name,
                  });
                  setIsFitCheckOpen(true);
                }
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold transition-all shadow-xs shrink-0 group relative z-10"
            >
              <Sparkles size={13} className="text-amber-300 group-hover:rotate-12 transition-transform" />
              <span>Open AI Fit Check</span>
            </button>
          </div>
        </header>

        {/* Results Count Bar */}
        <div className="mb-8 flex justify-between items-center text-xs text-stone-500 border-b border-stone-300/60 pb-2.5">
          <span className="flex items-center gap-1.5 font-medium">
            <Compass size={13} className="text-stone-400" />
            <span>Pinned {filteredEvents.length} {filteredEvents.length === 1 ? 'moodboard' : 'moodboards'}</span>
          </span>
          {searchQuery && (
            <div className="flex items-center gap-2 text-xs">
              <span>Results for &quot;{searchQuery}&quot;</span>
              <button
                onClick={() => setSearchQuery('')}
                className="text-stone-900 underline hover:text-stone-600 font-medium"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* SCATTERED TORN SCRAPBOOK 2-COLUMN GRID */}
        {/* ========================================================= */}
        <div className="min-h-[400px]">
          {filteredEvents.length === 0 ? (
            <div className="py-20 text-center max-w-sm mx-auto space-y-3 border border-dashed border-stone-300 rounded-3xl bg-white p-8">
              <Compass className="h-8 w-8 text-stone-400 mx-auto" />
              <p className="text-stone-900 font-serif text-lg font-medium">No moodboards found</p>
              <p className="text-stone-500 text-xs">No occasion styles match &quot;{searchQuery}&quot;. Try a broader search or reset filters.</p>
              <button
                onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
                className="mt-2 text-xs font-medium text-stone-900 underline hover:text-stone-600"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
              <AnimatePresence mode="popLayout">
                {filteredEvents.map((event, index) => {
                  const cardImg = getCardImage(event);
                  const tape = TAPE_PRESETS[index % TAPE_PRESETS.length];
                  const displayTags = getDisplayTags(event);

                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.35, delay: Math.min(index * 0.03, 0.25) }}
                      key={event.id}
                      className="relative group filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.07)] drop-shadow-[0_2px_6px_rgba(0,0,0,0.04)]"
                    >
                      {/* Under-layer peeking paper with ragged edge */}
                      <div 
                        className={cn(
                          "absolute inset-0 bg-[#EFE8DD] translate-x-1.5 translate-y-1.5 rotate-[0.6deg] pointer-events-none z-0",
                          index % 2 === 0 ? "torn-card-2" : "torn-card-1"
                        )} 
                      />

                      {/* Main Paper Sheet Card */}
                      <div
                        onClick={() => router.push(`/fashion-trends/${event.id}`)}
                        className={cn(
                          "relative z-10 block bg-[#FDFCF9] p-4 sm:p-5 md:p-6 transition-all duration-300 group-hover:-translate-y-1 cursor-pointer",
                          index % 2 === 0 ? "torn-card-1" : "torn-card-2"
                        )}
                      >
                        <div className="flex flex-col sm:flex-row gap-5 sm:gap-6 items-stretch">
                          
                          {/* Left: Torn Photo with Tape */}
                          <div className="w-full sm:w-[46%] md:w-[48%] relative shrink-0 aspect-[4/5] sm:aspect-[3/4]">
                            {/* Torn photo frame */}
                            <div className="relative w-full h-full p-1.5 bg-white shadow-sm torn-photo overflow-hidden">
                              {cardImg ? (
                                <Image
                                  src={cardImg}
                                  alt={event.name}
                                  fill
                                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-amber-50 to-stone-200 flex flex-col items-center justify-center p-4 text-center">
                                  <Sparkles className="h-6 w-6 text-stone-400 mb-1" />
                                  <span className="font-['Caveat',cursive] text-3xl font-bold text-stone-800">{event.name}</span>
                                </div>
                              )}
                            </div>

                            {/* Washi Tape on top-left of photo */}
                            <div 
                              className={cn(
                                "absolute -top-2.5 -left-1.5 px-3 py-1 shadow-sm border z-20 pointer-events-none font-['Permanent_Marker',cursive] text-[11px] uppercase tracking-wider",
                                tape.bg,
                                tape.border,
                                tape.text,
                                tape.rotate
                              )}
                            >
                              {event.name} {tape.emoji}
                            </div>

                            {/* Extra Black tape on top-right (e.g. Street style) */}
                            {index % 4 === 3 && (
                              <div className="absolute -top-2 -right-2 w-8 h-4 bg-stone-900 border border-stone-800 rotate-[35deg] shadow-xs z-20 pointer-events-none" />
                            )}

                            {/* Paperclip on bottom-left with scribble (e.g. Old School style) */}
                            {index % 4 === 2 && (
                              <div className="absolute -bottom-3 -left-2 z-30 pointer-events-none text-stone-600">
                                <PaperClip className="w-5 h-9" />
                                <PencilScribble className="w-8 h-3 text-stone-400 -mt-1 -ml-1" />
                              </div>
                            )}
                          </div>

                          {/* Right: Scrapbook Typography & Notes */}
                          <div className="flex-1 flex flex-col justify-between py-1">
                            <div>
                              {/* Top Pill */}
                              <div className="flex items-center justify-end mb-2">
                                <span className="text-[11px] font-sans font-medium text-stone-600 bg-stone-200/60 px-3 py-0.5 rounded-full">
                                  Curated
                                </span>
                              </div>

                              {/* Title + Star Doodle */}
                              <div className="flex items-center gap-2">
                                <h3 className="font-['Caveat',cursive] text-3xl sm:text-4xl font-bold text-stone-900 leading-none tracking-tight group-hover:text-amber-900 transition-colors">
                                  {event.name}
                                </h3>
                                {index % 4 === 1 && (
                                  <StarDoodle className="w-4 h-4 text-stone-800 shrink-0" />
                                )}
                              </div>

                              {/* Description */}
                              <p className="text-xs text-stone-600 font-light leading-relaxed mt-2 max-w-sm line-clamp-2">
                                {event.description || "Vibrant looks, curated accessories, and unreal occasion energy."}
                              </p>

                              {/* Wear This Fit button and Arrow */}
                              <div className="mt-3 flex items-center justify-between gap-2">
                                <button
                                  type="button"
                                  onClick={(e) => handleOpenFitCheck(e, event)}
                                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100/90 hover:bg-amber-200 text-amber-900 border border-amber-300 transition-all shadow-2xs hover:scale-105 active:scale-95 group/fit"
                                >
                                  <Sparkles size={10} className="text-amber-700 group-hover/fit:rotate-12 transition-transform" />
                                  <span>Wear This Fit ✨</span>
                                </button>

                                <div className="inline-flex items-center gap-1 text-stone-900 text-[11px] font-medium group-hover:translate-x-1 transition-transform">
                                  <span>Lookbook</span>
                                  <ArrowRight size={13} />
                                </div>
                              </div>
                            </div>

                            {/* Bottom Hashtags & Crown Doodle */}
                            <div className="pt-4 flex items-end justify-between">
                              <div className="flex flex-wrap gap-1.5">
                                {displayTags.map((tag, tIdx) => (
                                  <span
                                    key={tIdx}
                                    className="text-[11px] font-sans text-stone-700 bg-stone-200/50 hover:bg-stone-200 px-2.5 py-0.5 rounded-full transition-colors"
                                  >
                                    #{tag}
                                  </span>
                                ))}
                              </div>

                              {index % 4 === 3 && (
                                <CrownDoodle className="w-6 h-5 text-stone-900 shrink-0 ml-2" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Studio Bespoke Tailoring Banner */}
        <div className="mt-16 p-6 sm:p-8 rounded-3xl bg-white/90 border border-stone-300 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 relative overflow-hidden">
          <div className="space-y-1 max-w-xl relative z-10">
            <div className="text-xs text-amber-800 font-serif italic mb-1">
              <span>Tailoring Studio Connection</span>
            </div>
            <h2 className="text-lg sm:text-xl font-serif font-medium text-stone-900">Custom Tailoring & Bespoke Design</h2>
            <p className="text-xs text-stone-500 leading-relaxed">
              Found a scrapbook look you want to bring to life? Connect directly with verified custom tailors and fashion designers across Ghana.
            </p>
          </div>
          <Link
            href="/tailors-designers"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-stone-900 text-white text-xs font-medium hover:bg-stone-800 transition-all shadow-xs shrink-0 relative z-10"
          >
            <span>Browse Designers</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      {/* AI Fit Check Virtual Try-On Modal */}
      <FitCheckModal
        isOpen={isFitCheckOpen}
        onClose={() => setIsFitCheckOpen(false)}
        outfit={fitCheckOutfit}
      />
    </div>
  );
}
