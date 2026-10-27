"use client";
import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowUpRight, Heart, Share2, X, Loader2, ShoppingBag, Sparkles, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import FitCheckModal, { type FitCheckOutfit } from '../components/FitCheckModal';

// --- Types ---
interface TrendEvent {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  seasonality: string[];
  dressCodes: string[];
  searchKeywords?: string[];
  suggestedProducts?: Array<{
    id: string;
    slug: string;
    name: string;
    price: number;
    currency: string;
    images: string[];
    professional: {
      professionalProfile: {
        businessName: string | null;
      } | null;
    } | null;
  }>;
  _count: {
    outfitInspirations: number;
  };
}

interface OutfitInspiration {
  id: string;
  title: string;
  description: string | null;
  outfitImageUrl: string;
  totalPrice: number | null;
  tags: string[];
  likes: number;
  stylist: {
    firstName: string;
    lastName: string;
    professionalProfile?: {
      businessName: string | null;
    } | null;
  };
  products: Array<{
    product: {
      id: string;
      slug: string;
      currency: string;
    };
  }>;
}

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

function HeartDoodle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
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

export default function EventDetailPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const [event, setEvent] = useState<TrendEvent | null>(null);
  const [outfits, setOutfits] = useState<OutfitInspiration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOutfit, setSelectedOutfit] = useState<OutfitInspiration | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [likedOutfits, setLikedOutfits] = useState<Set<string>>(new Set());
  const [fitCheckOutfit, setFitCheckOutfit] = useState<FitCheckOutfit | null>(null);
  const [isFitCheckOpen, setIsFitCheckOpen] = useState(false);

  const handleWearOutfit = (outfit: OutfitInspiration) => {
    const stylistName = outfit.stylist?.firstName?.startsWith('Photo by')
      ? `${outfit.stylist.firstName} ${outfit.stylist.lastName}`
      : outfit.stylist?.professionalProfile?.businessName || outfit.stylist?.firstName || 'Boutique Stylist';

    setFitCheckOutfit({
      id: outfit.id,
      title: outfit.title,
      imageUrl: outfit.outfitImageUrl,
      description: outfit.description || `Curated look styled by ${stylistName}`,
      tags: outfit.tags,
      eventName: event?.name,
      price: outfit.totalPrice,
      currency: outfit.products?.[0]?.product?.currency || 'GHS',
    });
    setIsFitCheckOpen(true);
  };

  const handleWearHeroEvent = () => {
    if (!event) return;
    const heroImg = event.imageUrl || (outfits.length > 0 ? outfits[0].outfitImageUrl : null);
    setFitCheckOutfit({
      id: event.id,
      title: event.name,
      imageUrl: heroImg || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80',
      description: event.description,
      tags: [...(event.dressCodes || []), ...(event.seasonality || [])],
      eventName: event.name,
    });
    setIsFitCheckOpen(true);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventRes, outfitsRes] = await Promise.all([
          fetch(`/api/events/${eventId}`),
          fetch(`/api/outfit-inspirations?eventId=${eventId}&limit=50`),
        ]);

        if (eventRes.ok) {
          const eventData = await eventRes.json();
          setEvent(eventData);
        }

        if (outfitsRes.ok) {
          const outfitsData = await outfitsRes.json();
          setOutfits(outfitsData.outfits || []);
        }
      } catch (error) {
        console.error("Failed to fetch event data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchData();
    }
  }, [eventId]);

  const openOutfitModal = (outfit: OutfitInspiration) => {
    setSelectedOutfit(outfit);
    setIsDialogOpen(true);
    const rawOutfit = outfit as unknown as Record<string, unknown>;
    if (rawOutfit.downloadLocation) {
      fetch('/api/unsplash/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ downloadLocation: rawOutfit.downloadLocation }),
      }).catch((err) => console.warn('Failed to track download:', err));
    }
  };

  const closeOutfitModal = () => {
    setIsDialogOpen(false);
    setTimeout(() => setSelectedOutfit(null), 300);
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLikeOutfit = (id: string) => {
    setLikedOutfits((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F6F2EC] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-[#F6F2EC] flex flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-stone-600 font-['Caveat',cursive] text-2xl font-bold">Vibe non-existent in this realm.</p>
        <Link 
          href="/fashion-trends"
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-stone-900 text-white text-xs font-medium hover:bg-stone-800 transition-all shadow-sm"
        >
          <ArrowLeft size={14} /> Back to Scrapbook
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F2EC] text-stone-900 selection:bg-stone-900 selection:text-white pb-24">
      {/* Authentic Tactile Canvas Paper Background Pattern */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-40 z-0" 
        style={{ backgroundImage: 'radial-gradient(#cfc7bd 1px, transparent 1px)', backgroundSize: '24px 24px' }}
      />

      {/* SPOTLIGHT HERO - MASTER SCRAPBOOK SHEET */}
      <section className="relative z-10 pt-14 sm:pt-16 pb-10 sm:pb-14 px-4 sm:px-6 md:px-8 max-w-6xl mx-auto">
        <Link 
          href="/fashion-trends"
          className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-stone-700 bg-white/95 px-3.5 py-1.5 rounded-full border border-stone-300 shadow-2xs hover:shadow-sm hover:-translate-x-0.5 transition-all mb-6 group"
        >
          <ArrowLeft size={13} className="transition-transform group-hover:-translate-x-0.5" />
          <span>Back to Scrapbook</span>
        </Link>

        {/* Big Double-Layer Torn Paper Master Sheet */}
        <div className="relative filter drop-shadow-[0_16px_32px_rgba(0,0,0,0.08)] drop-shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          {/* Under-layer sheet */}
          <div className="absolute inset-0 bg-[#EFE8DD] translate-x-2 translate-y-2 rotate-[0.5deg] pointer-events-none z-0 torn-card-2" />

          {/* Main Paper Sheet */}
          <div className="relative z-10 bg-[#FDFCF9] p-6 sm:p-8 md:p-10 torn-card-1">
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-center">
              
              {/* Left: Magazine Torn Photo Cutout */}
              <div className="w-full lg:w-5/12 relative aspect-[4/5] sm:aspect-[3/4] max-h-[460px]">
                <div className="relative w-full h-full p-2 bg-white shadow-sm torn-photo overflow-hidden">
                  {event.imageUrl ? (
                    <Image
                      src={event.imageUrl}
                      alt={event.name}
                      fill
                      className="object-cover object-[50%_20%]"
                      priority
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-amber-50 to-stone-200 flex flex-col items-center justify-center p-6 text-center">
                      <Sparkles className="h-8 w-8 text-stone-400 mb-2" />
                      <span className="font-['Caveat',cursive] text-4xl font-bold text-stone-800">{event.name}</span>
                    </div>
                  )}
                </div>

                {/* Tilted Washi Tape on top-left */}
                <div className="absolute -top-3 -left-2 px-3.5 py-1 bg-[#EED571] border border-[#D8BF58] text-stone-900 rotate-[-3deg] shadow-sm z-20 pointer-events-none font-['Permanent_Marker',cursive] text-xs uppercase tracking-wider">
                  {event.name} ✌️
                </div>

                {/* Paperclip on bottom-left */}
                <div className="absolute -bottom-3 -left-2 z-30 pointer-events-none text-stone-600">
                  <PaperClip className="w-5 h-9" />
                  <PencilScribble className="w-8 h-3 text-stone-400 -mt-1 -ml-1" />
                </div>
              </div>

              {/* Right: Scrapbook Typography & Notes */}
              <div className="w-full lg:w-7/12 flex flex-col justify-center">
                <div className="flex items-center justify-end mb-2">
                  <span className="text-xs font-sans text-stone-500 bg-stone-200/60 px-3 py-0.5 rounded-full">
                    Curated Archive
                  </span>
                </div>

                <div className="flex items-center gap-3 mt-1 mb-2">
                  <h1 className="font-['Caveat',cursive] text-5xl sm:text-6xl lg:text-7xl font-bold text-stone-900 leading-none tracking-tight">
                    {event.name}
                  </h1>
                  <StarDoodle className="w-6 h-6 text-stone-800 shrink-0" />
                </div>

                {event.description && (
                  <p className="text-sm sm:text-base text-stone-600 font-light leading-relaxed italic mt-2 mb-6 max-w-xl">
                    &quot;{event.description}&quot;
                  </p>
                )}

                {/* Scrapbook Tags Grid */}
                <div className="py-4 border-y border-stone-200/80 my-4 space-y-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 block mb-1.5">Seasonality</span>
                    <div className="flex flex-wrap gap-1.5">
                      {event.seasonality && event.seasonality.length > 0 ? (
                        event.seasonality.map((s, i) => (
                          <span key={i} className="px-3 py-0.5 rounded-full text-xs font-medium bg-[#EED571]/70 border border-[#D8BF58]/60 text-stone-900 shadow-2xs">
                            {s.replace('_', ' ')}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-stone-400 italic">All Season</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 block mb-1.5">Dress Codes</span>
                    <div className="flex flex-wrap gap-1.5">
                      {event.dressCodes && event.dressCodes.length > 0 ? (
                        event.dressCodes.slice(0, 4).map((code, i) => (
                          <span key={i} className="px-3 py-0.5 rounded-full text-xs font-medium bg-[#BCD4B4]/70 border border-[#A1C097]/60 text-stone-900 shadow-2xs">
                            #{code}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-stone-400 italic">Universal</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Explore button & AI Fit Check CTA */}
                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button 
                    onClick={() => document.getElementById('inspirations')?.scrollIntoView({ behavior: 'smooth' })}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-stone-900 text-white text-[11px] font-medium hover:bg-stone-800 transition-all shadow-2xs"
                  >
                    Explore {outfits.length} Looks
                    <ArrowLeft size={11} className="rotate-[270deg]" />
                  </button>

                  <button
                    onClick={handleWearHeroEvent}
                    className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-amber-100/90 hover:bg-amber-200 text-amber-950 border border-amber-300 text-[11px] font-semibold transition-all shadow-2xs hover:scale-105 active:scale-95 group"
                  >
                    <Sparkles size={11} className="text-amber-700 group-hover:rotate-12 transition-transform" />
                    <span>Wear This Aesthetic ✨</span>
                  </button>

                  <span className="text-[11px] text-stone-500 font-serif italic hidden sm:inline">
                    ~ {outfits.length} looks pinned
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LOOKBOOK CLIPPINGS - TORN POLAROID GALLERY */}
      <section id="inspirations" className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-12 relative z-10">
        <div className="flex items-end justify-between mb-8 border-b border-stone-300/70 pb-4">
          <div>
            <div className="mb-1">
              <span className="text-xs text-stone-500 font-mono uppercase tracking-wider">Pinned Looks</span>
            </div>
            <h2 className="font-['Caveat',cursive] text-4xl sm:text-5xl font-bold text-stone-900 leading-none">
              Lookbook Clippings
            </h2>
          </div>
          <span className="text-xs text-stone-500 font-serif italic">
            Tap any clipping to open detail spread
          </span>
        </div>

        {outfits.length === 0 ? (
          <div className="py-20 text-center max-w-sm mx-auto space-y-2 border border-dashed border-stone-300 rounded-3xl bg-white p-8">
            <p className="font-['Caveat',cursive] text-3xl font-bold text-stone-700">No clippings pinned yet</p>
            <p className="text-xs text-stone-500">Check back soon for new styling inspirations.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {outfits.map((outfit, index) => {
              const tape = TAPE_PRESETS[index % TAPE_PRESETS.length];
              const stylistName = outfit.stylist?.firstName?.startsWith('Photo by')
                ? `${outfit.stylist.firstName} ${outfit.stylist.lastName}`
                : outfit.stylist?.professionalProfile?.businessName || outfit.stylist?.firstName || 'Boutique Stylist';

              return (
                <motion.div
                  key={outfit.id}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: (index % 6) * 0.05 }}
                  className="relative group filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.06)] cursor-pointer"
                  onClick={() => openOutfitModal(outfit)}
                >
                  {/* Under-layer sheet */}
                  <div 
                    className={cn(
                      "absolute inset-0 bg-[#EFE8DD] translate-x-1.5 translate-y-1.5 rotate-[0.6deg] pointer-events-none z-0",
                      index % 2 === 0 ? "torn-card-2" : "torn-card-1"
                    )}
                  />

                  {/* Main Paper Card */}
                  <div 
                    className={cn(
                      "relative z-10 bg-[#FDFCF9] p-4 transition-all duration-300 group-hover:-translate-y-1.5 flex flex-col justify-between h-full",
                      index % 2 === 0 ? "torn-card-1" : "torn-card-2"
                    )}
                  >
                    <div>
                      {/* Photo Cutout Container */}
                      <div className="relative w-full aspect-[4/5] mb-3">
                        {/* Torn photo frame */}
                        <div className="relative w-full h-full p-1 bg-white shadow-xs torn-photo overflow-hidden">
                          <Image
                            src={outfit.outfitImageUrl}
                            alt={outfit.title}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>

                        {/* Washi Tape on top-left of photo (outside torn-photo, z-30 so it floats cleanly on top) */}
                        <div 
                          className={cn(
                            "absolute -top-2.5 -left-1.5 px-3 py-1 shadow-sm border z-30 pointer-events-none font-['Permanent_Marker',cursive] text-[10px] uppercase tracking-wider",
                            tape.bg,
                            tape.border,
                            tape.text,
                            tape.rotate
                          )}
                        >
                          LOOK #{String(index + 1).padStart(2, '0')} {tape.emoji}
                        </div>

                        {/* Heart doodle on top-right (z-30) */}
                        <div className="absolute top-2 right-2 z-30 pointer-events-none">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-sans font-medium bg-white/95 backdrop-blur-md text-stone-800 shadow-2xs flex items-center gap-1 border border-white/50">
                            <HeartDoodle className="w-3 h-3 text-rose-500" />
                            <span>{outfit.likes}</span>
                          </span>
                        </div>
                      </div>

                      {/* Title & Stylist */}
                      <h3 className="font-['Caveat',cursive] text-3xl font-bold text-stone-900 leading-tight group-hover:text-amber-900 transition-colors truncate">
                        {outfit.title}
                      </h3>
                      <p className="text-xs text-stone-500 font-serif italic truncate mt-0.5">
                        ~ {stylistName}
                      </p>
                    </div>

                    {/* Bottom Tags & Arrow */}
                    <div className="pt-3 border-t border-stone-200/60 mt-3 flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {outfit.tags && outfit.tags.length > 0 ? (
                          outfit.tags.slice(0, 2).map((t) => (
                            <span 
                              key={t} 
                              className="text-[10px] font-sans text-stone-600 bg-stone-200/50 px-2 py-0.5 rounded-full"
                            >
                              #{t}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-stone-400 font-sans">#Lookbook</span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleWearOutfit(outfit);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 shadow-2xs transition-all hover:scale-105 active:scale-95 group/fit"
                        >
                          <Sparkles size={10} className="text-amber-700 group-hover/fit:rotate-12 transition-transform" />
                          <span>Wear Fit ✨</span>
                        </button>

                        <div className="h-6 w-6 rounded-full bg-stone-100 group-hover:bg-stone-900 group-hover:text-white text-stone-500 flex items-center justify-center transition-colors shrink-0">
                          <ArrowUpRight size={13} />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {/* SUGGESTED PRODUCTS - SCRAPBOOK SWATCH STRIP */}
      {event.suggestedProducts && event.suggestedProducts.length > 0 && (
        <section className="bg-white/90 border-t border-stone-300/80 py-12 sm:py-16 mt-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <ShoppingBag size={14} className="text-amber-800" />
                  <span className="text-[11px] font-mono text-stone-500 uppercase tracking-wider">Garment Swatches</span>
                </div>
                <h2 className="font-['Caveat',cursive] text-4xl sm:text-5xl font-bold text-stone-900 leading-none">
                  Shop the Aesthetic
                </h2>
                <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-lg">
                  Hand-selected pieces that pair effortlessly with the <span className="font-serif italic text-stone-800">&quot;{event.name}&quot;</span> vibe.
                </p>
              </div>

              <Link 
                href="/shopping" 
                className="inline-flex items-center gap-2 text-xs font-medium text-stone-700 bg-white border border-stone-300 px-4 py-2 rounded-full hover:bg-stone-50 transition-all shrink-0 shadow-2xs"
              >
                <span>View All Products</span>
                <ArrowUpRight size={13} />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
              {event.suggestedProducts.map((product, pIdx) => {
                const tape = TAPE_PRESETS[pIdx % TAPE_PRESETS.length];
                return (
                  <Link 
                    key={product.id}
                    href={`/shopping/products/${product.slug}`}
                    className="group relative rounded-xl p-2.5 bg-[#FDFCF9] hover:bg-white border border-stone-300/80 hover:border-stone-400 hover:shadow-md transition-all flex flex-col filter drop-shadow-2xs"
                  >
                    <div className="aspect-[4/4.8] relative rounded-lg overflow-hidden bg-stone-100 mb-2 torn-photo">
                      <Image
                        src={product.images[0] || '/placeholder-product.jpg'}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                      />

                      {/* Micro tape */}
                      <div className={cn("absolute -top-1.5 -left-1 px-1.5 py-0.2 text-[8px] font-['Permanent_Marker',cursive] border shadow-2xs pointer-events-none", tape.bg, tape.border, tape.rotate)}>
                        {tape.emoji}
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <p className="text-[10px] font-mono text-stone-400 uppercase tracking-wider truncate">
                          {product.professional?.professionalProfile?.businessName || 'Designer'}
                        </p>
                        <h4 className="text-xs font-medium text-stone-900 line-clamp-1 group-hover:text-amber-900 transition-colors mt-0.5">
                          {product.name}
                        </h4>
                      </div>
                      <span className="text-xs font-semibold text-stone-900 mt-1.5 block">
                        {product.currency} {product.price.toFixed(2)}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* OUTFIT DETAIL MODAL - OPENED SCRAPBOOK SPREAD */}
      <AnimatePresence>
        {isDialogOpen && selectedOutfit && (
          <Dialog open={isDialogOpen} onOpenChange={(open) => !open && closeOutfitModal()}>
            <DialogContent className="max-w-2xl sm:max-w-3xl lg:max-w-4xl w-[92vw] max-h-[88vh] p-0 border border-stone-300 bg-[#FDFCF9] rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row gap-0 filter drop-shadow-[0_25px_50px_rgba(0,0,0,0.18)]">
              
              {/* Close Button */}
              <button 
                onClick={closeOutfitModal} 
                className="absolute top-3.5 right-3.5 z-40 h-8 w-8 rounded-full bg-stone-900/70 hover:bg-stone-900 text-white backdrop-blur-md flex items-center justify-center transition-all shadow-md"
                aria-label="Close modal"
              >
                <X size={16} />
              </button>
              
              {/* Left Column: Big Torn Photo with Washi Tape */}
              <div className="w-full md:w-[48%] h-64 sm:h-80 md:h-auto min-h-[280px] md:min-h-[440px] relative bg-stone-100 shrink-0 p-3 flex items-center justify-center">
                <div className="relative w-full h-full p-2 bg-white shadow-sm torn-photo overflow-hidden flex items-center justify-center">
                  {/* Ambient blur backdrop so portrait looks cohesive and elegant */}
                  <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20 blur-md scale-110">
                    <Image src={selectedOutfit.outfitImageUrl} alt="" fill unoptimized className="object-cover" />
                  </div>
                  <Image 
                    src={selectedOutfit.outfitImageUrl} 
                    alt={selectedOutfit.title} 
                    fill 
                    className="object-contain relative z-10" 
                    priority
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>

                {/* Taped label */}
                <div className="absolute top-2 left-2 px-3 py-1 bg-[#EED571] border border-[#D8BF58] text-stone-900 rotate-[-3deg] shadow-xs z-30 pointer-events-none font-['Permanent_Marker',cursive] text-xs uppercase tracking-wider">
                  {event.name} ✦
                </div>
              </div>

              {/* Right Column: Scrapbook Notes & Detail */}
              <div className="w-full md:w-[52%] p-5 sm:p-7 flex flex-col justify-between overflow-y-auto max-h-[85vh] md:max-h-[580px] bg-[#FDFCF9]">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-sans font-medium text-stone-600 bg-stone-200/60 px-3 py-0.5 rounded-full">
                      Lookbook Clipping
                    </span>
                    <span className="text-xs text-stone-500 font-serif italic flex items-center gap-1">
                      <HeartDoodle className="w-3.5 h-3.5 text-rose-500" />
                      <span>{selectedOutfit.likes} marks</span>
                    </span>
                  </div>

                  {/* Title + Star */}
                  <div className="flex items-center gap-2 mb-1">
                    <DialogTitle className="font-['Caveat',cursive] text-4xl sm:text-5xl font-bold text-stone-900 leading-tight tracking-tight">
                      {selectedOutfit.title}
                    </DialogTitle>
                    <StarDoodle className="w-5 h-5 text-stone-800 shrink-0" />
                  </div>

                  <p className="text-xs text-stone-500 font-serif italic mb-4">
                    ~ {selectedOutfit.stylist?.firstName?.startsWith('Photo by')
                      ? `${selectedOutfit.stylist.firstName} ${selectedOutfit.stylist.lastName}`
                      : `Curated by ${selectedOutfit.stylist?.professionalProfile?.businessName || selectedOutfit.stylist?.firstName || 'TrendiZip Stylist'}`}
                  </p>

                  <div className="space-y-4 pt-3 border-t border-stone-200/70">
                    {/* Notes */}
                    <div>
                      <h5 className="text-[10px] font-mono tracking-wider uppercase text-stone-400 mb-1">Styling Ethos</h5>
                      <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-light italic">
                        &quot;{selectedOutfit.description || 'A standout look curated for this mood and dress code.'}&quot;
                      </p>
                    </div>

                    {/* Tags */}
                    {selectedOutfit.tags && selectedOutfit.tags.length > 0 && (
                      <div>
                        <h5 className="text-[10px] font-mono tracking-wider uppercase text-stone-400 mb-1.5">Aesthetic Tags</h5>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedOutfit.tags.map((t) => (
                            <span 
                              key={t} 
                              className="text-[11px] font-sans text-stone-700 bg-stone-200/50 hover:bg-stone-200 px-2.5 py-0.5 rounded-full transition-colors"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Price if available */}
                    {selectedOutfit.totalPrice && (
                      <div className="pt-2">
                        <span className="text-[10px] font-mono text-stone-400 tracking-wider uppercase block">Estimated Look Value</span>
                        <span className="font-['Caveat',cursive] text-3xl font-bold text-stone-900">
                          {selectedOutfit.products?.[0]?.product?.currency || 'GHS'} {selectedOutfit.totalPrice.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-5 mt-4 border-t border-stone-200/70 space-y-2.5">
                  <button
                    onClick={() => {
                      setIsDialogOpen(false);
                      handleWearOutfit(selectedOutfit);
                    }}
                    className="w-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-stone-950 py-2.5 px-3.5 rounded-full text-xs font-semibold tracking-normal transition-all flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md active:scale-98 group"
                  >
                    <Sparkles size={13} className="text-stone-950 group-hover:rotate-12 transition-transform" />
                    <span>Wear This Fit ✨</span>
                  </button>

                  <Link
                    href={`/shopping?search=${encodeURIComponent(event.name)}`}
                    className="w-full bg-stone-900 text-white py-2.5 px-4 rounded-full text-xs font-medium tracking-wide hover:bg-stone-800 transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <span>Shop Matching Aesthetic</span>
                    <ArrowUpRight size={14} />
                  </Link>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleLikeOutfit(selectedOutfit.id)}
                      className="flex-1 border border-stone-300 py-2 rounded-full text-xs font-medium text-stone-700 hover:bg-stone-100 transition-all flex items-center justify-center gap-1.5"
                    >
                      <Heart size={13} className={likedOutfits.has(selectedOutfit.id) ? "fill-rose-500 text-rose-500" : ""} />
                      <span>{likedOutfits.has(selectedOutfit.id) ? "Liked" : "Pin Look"}</span>
                    </button>

                    <button 
                      onClick={handleShare}
                      className="flex-1 border border-stone-300 py-2 rounded-full text-xs font-medium text-stone-700 hover:bg-stone-100 transition-all flex items-center justify-center gap-1.5"
                    >
                      {copied ? <Check size={13} className="text-emerald-600" /> : <Share2 size={13} />}
                      <span>{copied ? "Copied Link!" : "Share"}</span>
                    </button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>

      {/* AI Fit Check Modal */}
      <FitCheckModal
        isOpen={isFitCheckOpen}
        onClose={() => setIsFitCheckOpen(false)}
        outfit={fitCheckOutfit}
      />
    </div>
  );
}
