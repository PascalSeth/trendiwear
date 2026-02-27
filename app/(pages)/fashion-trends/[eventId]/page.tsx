"use client";
import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowUpRight, Heart, Share2, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

// --- Types ---
interface TrendEvent {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  seasonality: string[];
  dressCodes: string[];
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center gap-6">
        <p className="text-neutral-500 font-serif text-lg">Event not found.</p>
        <Link 
          href="/fashion-trends"
          className="inline-flex items-center gap-2 px-6 py-3 border border-neutral-900 text-neutral-900 font-mono text-xs uppercase tracking-widest hover:bg-neutral-900 hover:text-white transition-colors"
        >
          <ArrowLeft size={14} /> Back to Trends
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-neutral-900 font-sans selection:bg-black selection:text-white">
      {/* Subtle Background Grain */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>

      {/* Hero Section */}
      <div className="relative h-[50vh] md:h-[60vh] overflow-hidden">
        {event.imageUrl ? (
          <Image
            src={event.imageUrl}
            alt={event.name}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-400 to-neutral-600" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

        {/* Back Button */}
        <Link 
          href="/fashion-trends"
          className="absolute top-6 left-6 z-20 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-white text-sm hover:bg-white/20 transition-colors"
        >
          <ArrowLeft size={16} /> Back
        </Link>

        {/* Event Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16 z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Season Tags */}
            {event.seasonality && event.seasonality.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {event.seasonality.map((season) => (
                  <span 
                    key={season} 
                    className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs uppercase tracking-wider text-white"
                  >
                    {season.replace('_', ' ')}
                  </span>
                ))}
              </div>
            )}

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-medium text-white mb-4 leading-tight">
              {event.name}
            </h1>

            {event.description && (
              <p className="text-white/80 text-lg md:text-xl max-w-2xl font-light italic font-serif">
                {event.description}
              </p>
            )}

            <div className="flex items-center gap-6 mt-6 text-white/60 font-mono text-xs uppercase tracking-widest">
              <span>{outfits.length} {outfits.length === 1 ? 'Look' : 'Looks'}</span>
              {event.dressCodes && event.dressCodes.length > 0 && (
                <>
                  <span>•</span>
                  <span>{event.dressCodes.slice(0, 3).join(' / ')}</span>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Outfits Grid - Pinterest Masonry Style */}
      <div className="relative z-10 max-w-[1600px] mx-auto px-4 md:px-8 py-16">
        <div className="flex items-center gap-3 mb-12">
          <span className="w-3 h-3 rounded-full bg-neutral-900"></span>
          <h2 className="font-mono text-xs uppercase tracking-[0.3em] text-neutral-500">
            Curated Looks
          </h2>
        </div>

        {outfits.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-neutral-500 font-serif text-lg italic mb-4">
              No looks added for this event yet.
            </p>
            <p className="text-neutral-400 text-sm">
              Check back soon for styled inspirations.
            </p>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
            {outfits.map((outfit, index) => {
              // Vary card heights for Pinterest effect
              const heights = ['aspect-[3/4]', 'aspect-[4/5]', 'aspect-[2/3]', 'aspect-[5/6]'];
              const heightClass = heights[index % heights.length];

              return (
                <motion.div
                  key={outfit.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  className="break-inside-avoid mb-6"
                >
                  <div 
                    onClick={() => openOutfitModal(outfit)}
                    className={`group relative ${heightClass} overflow-hidden rounded-2xl bg-neutral-200 cursor-pointer shadow-sm hover:shadow-xl transition-shadow duration-500`}
                  >
                    {/* Outfit Image */}
                    <Image
                      src={outfit.outfitImageUrl}
                      alt={outfit.title}
                      fill
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    {/* Index Watermark */}
                    <div className="absolute top-4 left-4 z-10">
                      <span className="font-serif text-5xl text-white/10 group-hover:text-white/30 transition-colors duration-500">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                    </div>

                    {/* Like Badge */}
                    <div className="absolute top-4 right-4 z-10 flex items-center gap-1 px-2 py-1 rounded-full bg-white/10 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <Heart size={12} className="text-white" />
                      <span className="text-white text-[10px]">{outfit.likes}</span>
                    </div>

                    {/* Content Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 z-10 translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                      <h3 className="font-serif text-lg font-medium text-white mb-1 line-clamp-1">
                        {outfit.title}
                      </h3>
                      <p className="text-white/70 text-xs">
                        By {outfit.stylist.professionalProfile?.businessName || `${outfit.stylist.firstName} ${outfit.stylist.lastName}`}
                      </p>
                      {outfit.totalPrice && (
                        <p className="text-white/60 text-xs mt-1 font-mono">
                          GHS {outfit.totalPrice.toFixed(2)}
                        </p>
                      )}
                    </div>

                    {/* Quick Action */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                        <ArrowUpRight size={20} className="text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Tags under card */}
                  {outfit.tags && outfit.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {outfit.tags.slice(0, 3).map((tag) => (
                        <span 
                          key={tag} 
                          className="text-[10px] text-neutral-400 uppercase tracking-wider"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Outfit Detail Modal */}
      <AnimatePresence>
        {isDialogOpen && selectedOutfit && (
          <Dialog open={isDialogOpen} onOpenChange={(open) => !open && closeOutfitModal()}>
            <DialogContent className="max-w-5xl w-[95vw] h-[90vh] p-0 overflow-hidden bg-white border-none shadow-2xl rounded-xl flex flex-col md:flex-row">
              {/* Close Button */}
              <button 
                onClick={closeOutfitModal}
                className="absolute top-4 right-4 z-50 p-2 bg-white rounded-full hover:bg-neutral-100 transition-colors shadow-md"
              >
                <X size={20} />
              </button>

              {/* Image Side */}
              <div className="w-full md:w-3/5 h-1/2 md:h-full relative bg-neutral-100">
                <Image
                  src={selectedOutfit.outfitImageUrl}
                  alt={selectedOutfit.title}
                  fill
                  className="object-cover"
                />
              </div>

              {/* Content Side */}
              <div className="w-full md:w-2/5 h-1/2 md:h-full p-6 md:p-10 flex flex-col justify-center overflow-y-auto">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="flex items-center gap-3 mb-6">
                    <span className="w-2 h-2 rounded-full bg-neutral-900"></span>
                    <span className="font-mono text-xs uppercase tracking-widest text-neutral-500">
                      {event.name}
                    </span>
                  </div>

                  <DialogTitle className="text-3xl md:text-4xl font-serif font-medium text-neutral-900 mb-4 leading-tight">
                    {selectedOutfit.title}
                  </DialogTitle>
                  
                  <p className="text-neutral-500 text-sm mb-2">
                    Styled by{' '}
                    <span className="text-neutral-700 font-medium">
                      {selectedOutfit.stylist.professionalProfile?.businessName || `${selectedOutfit.stylist.firstName} ${selectedOutfit.stylist.lastName}`}
                    </span>
                  </p>

                  <DialogDescription className="text-neutral-600 text-base leading-relaxed mb-8 font-light">
                    {selectedOutfit.description || "A carefully curated look styled for this occasion by one of our professionals."}
                  </DialogDescription>

                  {/* Tags */}
                  {selectedOutfit.tags && selectedOutfit.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-8">
                      {selectedOutfit.tags.map((tag) => (
                        <span 
                          key={tag} 
                          className="px-3 py-1 rounded-full bg-neutral-100 text-xs text-neutral-600"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Price */}
                  {selectedOutfit.totalPrice && (
                    <div className="mb-8 pb-6 border-b border-neutral-100">
                      <p className="text-xs text-neutral-400 uppercase tracking-wider mb-1">Total Look Price</p>
                      <p className="text-2xl font-serif font-medium">GHS {selectedOutfit.totalPrice.toFixed(2)}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-col gap-3 mt-auto">
                    <button className="w-full bg-neutral-900 text-white py-4 font-medium hover:bg-neutral-800 transition-colors flex justify-between px-6 items-center group/btn rounded-lg">
                      <span className="uppercase tracking-widest text-xs">Shop This Look</span>
                      <ArrowUpRight size={16} className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                    </button>
                    
                    <div className="flex gap-3">
                      <button className="flex-1 flex items-center justify-center gap-2 py-3 border border-neutral-200 hover:border-neutral-900 transition-colors text-sm rounded-lg">
                        <Heart size={16} /> Save
                      </button>
                      <button className="flex-1 flex items-center justify-center gap-2 py-3 border border-neutral-200 hover:border-neutral-900 transition-colors text-sm rounded-lg">
                        <Share2 size={16} /> Share
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  );
}
