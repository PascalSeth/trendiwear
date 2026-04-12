"use client";
import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowUpRight, Heart, Share2, X, Loader2, ShoppingBag, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {  Dialog,  DialogContent,  DialogTitle } from '@/components/ui/dialog';

import { cn } from '@/lib/utils';

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

export default function EventDetailPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const [event, setEvent] = useState<TrendEvent | null>(null);
  const [outfits, setOutfits] = useState<OutfitInspiration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOutfit, setSelectedOutfit] = useState<OutfitInspiration | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
  };

  const closeOutfitModal = () => {
    setIsDialogOpen(false);
    setTimeout(() => setSelectedOutfit(null), 300);
  };

  const getHeightClass = (index: number) => {
    const remainder = index % 4;
    switch (remainder) {
      case 0: return 'aspect-[3/4]';
      case 1: return 'aspect-[1/1]';
      case 2: return 'aspect-[2/3]';
      default: return 'aspect-[4/5]';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-stone-300" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] flex flex-col items-center justify-center gap-6">
        <p className="text-stone-400 font-serif text-lg italic">Vibe non-existent in this realm.</p>
        <Link 
          href="/fashion-trends"
          className="inline-flex items-center gap-2 px-8 py-3 border border-stone-900 text-stone-900 font-mono text-[10px] uppercase tracking-[0.5em] hover:bg-stone-900 hover:text-white transition-all"
        >
          <ArrowLeft size={14} /> Back to Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-stone-900 selection:bg-stone-900 selection:text-white pb-32">
      {/* Background Polish */}
      <div className="fixed inset-0 pointer-events-none opacity-40 z-0" 
        style={{ backgroundImage: 'radial-gradient(#d6d3d1 1px, transparent 1px)', backgroundSize: '32px 32px' }}>
      </div>

      {/* LUXURY SPLIT-SCREEN SPOTLIGHT HERO */}
      <section className="relative z-10 pt-12 lg:pt-24 px-6 md:px-12 max-w-[1600px] mx-auto min-h-[70vh] flex flex-col lg:flex-row gap-16 lg:gap-24">
        
        {/* Left: Interactive Editorial Frame */}
        <div className="w-full lg:w-1/2 relative group">
          <Link 
            href="/fashion-trends"
            className="absolute -top-12 left-0 z-20 flex items-center gap-4 text-stone-400 hover:text-stone-900 transition-colors group/back"
          >
            <div className="h-px w-8 bg-stone-300 group-hover/back:w-12 transition-all" />
            <span className="text-[10px] font-mono uppercase tracking-[0.5em]">Back to Directory</span>
          </Link>

          <div className="aspect-[4/5] relative bg-white p-4 md:p-6 border border-stone-100 shadow-[0_20px_60px_rgb(0,0,0,0.05)] overflow-hidden">
            <div className="relative w-full h-full overflow-hidden">
              {event.imageUrl ? (
                <Image
                  src={event.imageUrl}
                  alt={event.name}
                  fill
                  className="object-cover transition-all duration-2000 group-hover:scale-105 object-[50%_20%]"
                  priority
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-stone-50 to-stone-200" />
              )}
              {/* Vibe Watermark */}
              <div className="absolute top-8 left-8 mix-blend-overlay opacity-30 pointer-events-none">
                <span className="text-7xl font-serif text-white rotate-90 origin-top-left block whitespace-nowrap">{event.name}</span>
              </div>
            </div>
            {/* Aesthetic Indicator */}
            <div className="absolute -bottom-4 -right-4 h-16 w-16 bg-stone-900 flex items-center justify-center text-white rotate-12">
               <span className="text-[10px] font-mono tracking-widest uppercase -rotate-12">Luxury</span>
            </div>
          </div>
        </div>

        {/* Right: Masthead & Tech Data */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center gap-3 mb-8">
              <span className="h-2 w-2 bg-stone-900 rounded-full" />
              <span className="text-[10px] font-mono uppercase tracking-[0.6em] text-stone-400">Concept Analysis</span>
            </div>

            <h1 className="text-6xl md:text-8xl lg:text-9xl font-serif font-medium text-stone-900 mb-8 leading-[0.85] -tracking-widest">
              {event.name}
            </h1>

            <div className="space-y-12">
              {event.description && (
                <p className="text-xl md:text-2xl font-serif font-light text-stone-600 leading-relaxed italic max-w-xl">
                  &quot;{event.description}&quot;
                </p>
              )}

              {/* Vibe Statistics Grid */}
              <div className="grid grid-cols-2 gap-12 pt-12 border-t border-stone-200">
                <div>
                  <h4 className="text-[10px] font-mono uppercase tracking-[0.4em] text-stone-400 mb-4">Availability</h4>
                  {event.seasonality.map((s, i) => (
                    <span key={i} className="text-sm font-serif italic text-stone-900 block border-l-2 border-stone-100 pl-4 mb-2">
                       {s.replace('_', ' ')} Focus
                    </span>
                  ))}
                </div>
                <div>
                  <h4 className="text-[10px] font-mono uppercase tracking-[0.4em] text-stone-400 mb-4">Dress Codes</h4>
                  <div className="flex flex-col gap-2">
                    {event.dressCodes.slice(0, 3).map((code, i) => (
                      <span key={i} className="text-[10px] font-mono uppercase tracking-widest text-stone-600">
                        • {code}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="pt-8">
                 <div className="flex items-center gap-4 text-stone-400 mb-4">
                   <div className="h-px w-12 bg-stone-200" />
                   <span className="text-[9px] font-mono uppercase tracking-[0.3em]">Total Intelligence: {outfits.length} Concepts Revealed</span>
                 </div>
                 <button 
                  onClick={() => document.getElementById('inspirations')?.scrollIntoView({ behavior: 'smooth' })}
                  className="group flex items-center gap-6 text-[10px] font-mono uppercase tracking-[0.6em] text-stone-900"
                 >
                   Explore the Vibe <div className="h-10 w-10 border border-stone-200 rounded-full flex items-center justify-center group-hover:bg-stone-900 group-hover:text-white transition-all transform group-hover:rotate-90"><ArrowLeft size={14} className="rotate-[270deg]" /></div>
                 </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CURATED LOOKS - MASONRY FALL */}
      <div id="inspirations" className="max-w-[1600px] mx-auto px-6 md:px-12 py-32 relative z-10">
        <div className="flex items-center justify-between mb-24 border-b border-stone-200 pb-12">
          <div>
            <h2 className="text-4xl md:text-5xl font-serif text-stone-900 italic mb-2 leading-none">Curated Inspirations</h2>
            <p className="text-[10px] font-mono text-stone-400 uppercase tracking-[0.4em]">Expert Styling & Concept Maps</p>
          </div>
          <Sparkles className="text-stone-300" size={32} strokeWidth={1} />
        </div>

        {outfits.length === 0 ? (
          <div className="py-32 text-center opacity-40">
            <p className="text-stone-300 font-serif text-3xl italic">
              No concepts have been revealed for this vibe yet.
            </p>
          </div>
        ) : (
          <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-12 space-y-12">
            {outfits.map((outfit, index) => (
              <motion.div
                key={outfit.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className={cn(
                  "group relative cursor-pointer break-inside-avoid mb-12",
                  getHeightClass(index)
                )}
                onClick={() => openOutfitModal(outfit)}
              >
                {/* EDITORIAL PASS-PARTOUT FRAME */}
                <div className="absolute inset-0 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.02)] transition-all duration-1000 group-hover:shadow-[0_20px_50px_rgb(0,0,0,0.08)] overflow-hidden border border-stone-100">
                  <div className="absolute inset-[15px] bg-stone-50 overflow-hidden">
                    <Image
                      src={outfit.outfitImageUrl}
                      alt={outfit.title}
                      fill
                      className="object-cover transition-all duration-1200 group-hover:scale-105"
                    />
                    
                    {/* SILK GLASS OVERLAY */}
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-900/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                    <div className="absolute inset-0 p-8 flex flex-col justify-between">
                      {/* Top Info - Step 1 */}
                      <div className="flex justify-between items-start opacity-0 group-hover:opacity-100 transition-all duration-700 transform -translate-y-4 group-hover:translate-y-0">
                        <span className="text-[7px] font-mono text-white tracking-[0.4em] uppercase bg-stone-900/40 px-3 py-1.5 backdrop-blur-[2px] border border-white/10">
                          {outfit.likes} Marks
                        </span>
                        <div className="h-8 w-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20">
                           <Heart size={10} className="text-white" />
                        </div>
                      </div>

                      {/* Bottom Info - Staggered */}
                      <div className="space-y-4">
                        <h3 className="text-3xl font-serif text-white italic opacity-0 group-hover:opacity-100 transition-all duration-1000 delay-100 transform translate-y-8 group-hover:translate-y-0">
                          {outfit.title}
                        </h3>
                        <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-all duration-1000 delay-200 transform translate-y-4 group-hover:translate-y-0">
                           <div className="h-px w-8 bg-white/30" />
                           <span className="text-[8px] font-mono text-white/70 uppercase tracking-[0.3em]">
                             By {outfit.stylist.professionalProfile?.businessName || outfit.stylist.firstName}
                           </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* STATIC LABELS */}
                <div className="absolute top-0 left-0 p-6 z-20 transition-all duration-500 group-hover:opacity-0">
                   <span className="text-[10px] font-mono text-stone-300 tracking-[0.5em]">{String(index + 1).padStart(2, '0')}/VOL</span>
                </div>
                <div className="absolute bottom-0 right-0 p-8 z-20 text-right transition-all duration-500 group-hover:opacity-0 group-hover:translate-x-4">
                   <h4 className="text-[9px] font-mono text-stone-900 tracking-[0.5em] uppercase mb-1">{outfit.title}</h4>
                   <span className="text-[7px] font-mono text-stone-400 tracking-[0.3em] uppercase">Style ID: {outfit.id.slice(-8)}</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* SUGGESTED PRODUCTS - BOUTIQUE STRIP */}
      {event.suggestedProducts && event.suggestedProducts.length > 0 && (
        <section className="bg-white border-y border-stone-200 py-32">
          <div className="max-w-[1600px] mx-auto px-6 md:px-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-24 gap-12">
              <div className="max-w-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <ShoppingBag size={16} className="text-stone-400" />
                  <span className="text-[10px] font-mono text-stone-400 uppercase tracking-[0.5em]">Commercial Bridge</span>
                </div>
                <h2 className="text-5xl md:text-7xl font-serif text-stone-900 italic font-medium leading-none mb-8">
                  The Marketplace <br/>
                  <span className="not-italic text-stone-300">Curation.</span>
                </h2>
                <p className="text-stone-500 font-light max-w-lg leading-relaxed">Specific garments and accessories automatically analyzed and matched for the <span className="text-stone-900 italic font-serif">&quot;{event.name}&quot;</span> vibe.</p>
              </div>
              <Link href="/shopping" className="flex items-center gap-4 group">
                 <span className="text-[10px] font-mono uppercase tracking-[0.4em]">View Complete Archive</span>
                 <div className="h-12 w-12 border border-stone-200 rounded-full flex items-center justify-center group-hover:bg-stone-900 group-hover:text-white transition-all"><ArrowUpRight size={16} /></div>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-x-12 gap-y-24">
              {event.suggestedProducts.map((product) => (
                <Link 
                  key={product.id}
                  href={`/shopping/products/${product.slug}`}
                  className="group"
                >
                  <div className="aspect-[3/4] relative bg-stone-50 p-2 md:p-3 border border-stone-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] transition-all duration-700 group-hover:shadow-[0_15px_40px_rgb(0,0,0,0.06)] group-hover:-translate-y-2 overflow-hidden mb-6">
                    <div className="relative h-full w-full overflow-hidden">
                      <Image
                        src={product.images[0] || '/placeholder-product.jpg'}
                        alt={product.name}
                        fill
                        className="object-cover transition-all duration-1000 group-hover:scale-110"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[8px] font-mono text-stone-400 uppercase tracking-[0.4em]">{product.professional?.professionalProfile?.businessName || 'Atelier'}</p>
                    <h4 className="text-[11px] font-serif text-stone-900 italic font-medium group-hover:text-stone-500 transition-colors uppercase tracking-widest">{product.name}</h4>
                    <span className="text-[10px] font-mono text-stone-900 mt-2 block">{product.currency} {product.price.toFixed(2)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* OUTFIT DETAIL DIALOG - SILK GLASS EXPERIENCE */}
      <AnimatePresence>
        {isDialogOpen && selectedOutfit && (
          <Dialog open={isDialogOpen} onOpenChange={(open) => !open && closeOutfitModal()}>
            <DialogContent className="max-w-[1400px] w-[98vw] h-[95vh] lg:h-[90vh] p-0 border-none bg-white rounded-none flex flex-col md:flex-row shadow-[0_50px_100px_rgb(0,0,0,0.2)]">
              <button onClick={closeOutfitModal} className="absolute top-6 right-6 z-50 mix-blend-difference text-white hover:scale-125 transition-transform"><X size={24} /></button>
              
              <div className="w-full md:w-3/5 h-[50vh] md:h-full relative bg-stone-100 overflow-hidden">
                 <Image src={selectedOutfit.outfitImageUrl} alt={selectedOutfit.title} fill className="object-cover" />
                 <div className="absolute top-12 left-12 z-10 text-white/20">
                    <span className="text-9xl font-serif italic -rotate-90 origin-top-left block">{event.name}</span>
                 </div>
              </div>

              <div className="w-full md:w-2/5 h-[50vh] md:h-full p-12 md:p-24 flex flex-col overflow-y-auto bg-white">
                <div className="mb-12">
                   <div className="flex items-center gap-3 mb-6">
                     <div className="h-px w-12 bg-stone-900" />
                     <span className="text-[10px] font-mono uppercase tracking-[0.5em] text-stone-400">Concept Map</span>
                   </div>
                   <DialogTitle className="text-5xl md:text-6xl font-serif italic font-medium text-stone-900 leading-[0.85] mb-8">
                     {selectedOutfit.title}
                   </DialogTitle>
                </div>

                <div className="flex-grow space-y-12">
                   <div className="space-y-6">
                      <h5 className="text-[10px] font-mono tracking-[0.4em] uppercase text-stone-400 border-b border-stone-100 pb-2">Styling Ethos</h5>
                      <p className="text-xl font-serif text-stone-600 leading-relaxed italic">
                        &quot;{selectedOutfit.description || 'A highly curated silhouette designed for prestige and presence.'}&quot;
                      </p>
                      <p className="text-[10px] font-mono text-stone-900 uppercase tracking-[0.3em]">Presented by: {selectedOutfit.stylist.professionalProfile?.businessName || 'Elite Stylist'}</p>
                   </div>

                   {selectedOutfit.tags && selectedOutfit.tags.length > 0 && (
                     <div className="space-y-6">
                        <h5 className="text-[10px] font-mono tracking-[0.4em] uppercase text-stone-400 border-b border-stone-100 pb-2">Vibe Markers</h5>
                        <div className="flex flex-wrap gap-4">
                           {selectedOutfit.tags.map(t => (
                             <span key={t} className="text-[9px] font-mono text-stone-400 border border-stone-100 px-4 py-2 hover:bg-stone-50 transition-colors uppercase tracking-widest">{t}</span>
                           ))}
                        </div>
                     </div>
                   )}

                   {selectedOutfit.totalPrice && (
                     <div className="pt-12 border-t border-stone-100">
                        <p className="text-[10px] font-mono text-stone-400 tracking-[0.4em] uppercase mb-4">Market Valuation</p>
                        <p className="text-5xl font-serif italic">{selectedOutfit.products?.[0]?.product?.currency || 'GHS'} {selectedOutfit.totalPrice.toFixed(2)}</p>
                     </div>
                   )}
                </div>

                <div className="mt-12 space-y-4">
                   <button className="w-full bg-stone-900 text-white py-6 text-[11px] font-mono uppercase tracking-[0.8em] hover:bg-stone-800 transition-all flex items-center justify-center gap-4">
                     Acquire the Look <ArrowUpRight size={16} />
                   </button>
                   <div className="flex gap-4">
                      <button className="flex-1 border border-stone-200 py-4 text-[10px] font-mono uppercase tracking-[0.5em] hover:bg-stone-50 transition-all flex items-center justify-center gap-2 italic"><Heart size={14} /> Mark</button>
                      <button className="flex-1 border border-stone-200 py-4 text-[10px] font-mono uppercase tracking-[0.5em] hover:bg-stone-50 transition-all flex items-center justify-center gap-2 italic"><Share2 size={14} /> Share</button>
                   </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  );
}
