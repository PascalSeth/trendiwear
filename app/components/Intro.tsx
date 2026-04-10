'use client'
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, Heart, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- API-driven types ---
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
// Define the high-impact "Vibes" we want to prioritize for the Moodboard
const PRIORITY_VIBES = ["Traditional", "Owambe", "Street", "Festival", "Brunch", "Date", "Formal"];

function FashionInspo() {
  const [events, setEvents] = useState<TrendEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch("/api/events");
        if (res.ok) {
          const data = await res.json();
          const eventsArray = Array.isArray(data) ? data : [];
          
          // Smart Curation: Filter for priority vibes and limit to a balanced number (e.g., 7)
          const curatedEvents = eventsArray
            .filter(e => PRIORITY_VIBES.includes(e.name))
            .sort((a, b) => PRIORITY_VIBES.indexOf(a.name) - PRIORITY_VIBES.indexOf(b.name))
            .slice(0, 7);

          setEvents(curatedEvents);
        }
      } catch (error) {
        console.error("Failed to fetch events:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

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
    <div className="min-h-screen bg-[#FAFAF9] py-24 px-6 md:px-12 relative overflow-hidden">
      
      {/* Subtle Pattern Background */}
      <div className="fixed inset-0 pointer-events-none opacity-40" 
        style={{ backgroundImage: 'radial-gradient(#d6d3d1 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
      </div>

      <div className="max-w-[1600px] mx-auto relative z-10">
        {/* Editorial Header */}
        <header className="mb-20 flex flex-col md:flex-row justify-between items-start md:items-end border-b border-stone-200 pb-12">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <span className="font-mono text-xs uppercase tracking-widest text-stone-400">Curated Vibe Collection</span>
              <div className="h-px w-12 bg-stone-400"></div>
            </div>
            <h1 className="text-7xl md:text-9xl font-serif font-medium text-stone-900 leading-[0.85] -tracking-widest">
              Moodboard
            </h1>
          </div>
          <div className="max-w-sm text-right hidden md:block mt-6">
            <p className="font-serif text-lg italic text-stone-600 leading-relaxed">
              Explore the textures, tones, and traditions defining our current high-fashion ecosystem.
            </p>
          </div>
        </header>

        {/* MASONRY WATERFALL CONTAINER */}
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="h-10 w-10 animate-spin text-stone-400" />
          </div>
        ) : events.length === 0 ? (
          <div className="py-32 text-center">
            <p className="text-stone-500 font-serif text-xl italic mb-4">
              Curating your inspiration... Check back momentarily.
            </p>
          </div>
        ) : (
          <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-8 space-y-8 pb-48">
            <AnimatePresence mode="popLayout">
              {events.map((event, index) => (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ 
                    duration: 0.8, 
                    delay: index * 0.1,
                    ease: [0.21, 0.45, 0.32, 0.9]
                  }}
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
                            className="object-cover transition-all duration-[1200ms] grayscale group-hover:grayscale-0 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-stone-50 to-stone-100 flex items-center justify-center p-8">
                            <span className="font-serif text-[10vw] md:text-8xl text-stone-200/50 -rotate-12 mix-blend-multiply whitespace-nowrap">{event.name}</span>
                          </div>
                        )}
                        
                        {/* OVERLAY CONTENT (Sequential Reveal) */}
                        <div className="absolute inset-0 bg-gradient-to-t from-stone-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

                        <div className="absolute inset-0 p-6 flex flex-col justify-between">
                          {/* Top Metadata */}
                          <div className="flex justify-between items-start opacity-0 group-hover:opacity-100 transition-all duration-700 delay-100 transform -translate-y-4 group-hover:translate-y-0">
                              <span className="text-[7px] font-mono text-white tracking-[0.4em] uppercase bg-stone-900/40 px-2 py-1 backdrop-blur-[2px] border border-white/10">
                                {event.seasonality?.[0] || 'Omni-Season'}
                              </span>
                              <span className="text-[7px] font-mono text-white/50 tracking-[0.4em] uppercase mt-1">
                                REF.{String(index + 1).padStart(2, '0')}
                              </span>
                          </div>

                          {/* Bottom Content */}
                          <div className="space-y-4">
                            <h3 className="text-2xl md:text-3xl font-serif text-white font-medium leading-[0.85] italic opacity-0 group-hover:opacity-100 transition-all duration-1000 delay-200 transform translate-y-8 group-hover:translate-y-0">
                              {event.name}
                            </h3>
                            
                            <div className="flex flex-wrap gap-2 opacity-0 group-hover:opacity-100 transition-all duration-1000 delay-300 transform translate-y-4 group-hover:translate-y-0">
                              <span className="text-[7px] font-mono text-white/90 tracking-[0.4em] border-l border-white/30 pl-3 uppercase">
                                {event.dressCodes?.[0] || 'Vibe'}
                              </span>
                            </div>

                            <div className="flex items-center gap-4 pt-2 text-white opacity-0 group-hover:opacity-100 transition-all duration-1000 delay-500 transform translate-y-2 group-hover:translate-y-0">
                              <span className="text-[8px] font-mono uppercase tracking-[0.5em] border-b border-white/30 pb-1.5">
                                Explore
                              </span>
                              <div className="h-8 w-8 border border-white/20 rounded-full flex items-center justify-center group-hover:bg-white group-hover:text-stone-900 transition-all duration-500">
                                <ArrowUpRight size={12} />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                  
                  {/* STATIC MINI LABELS */}
                  <div className="absolute top-0 right-0 p-6 z-20 pointer-events-none transition-all duration-700 group-hover:opacity-0 group-hover:scale-90">
                     <span className="text-[8px] font-mono text-stone-400 tracking-[0.5em] uppercase border-r border-stone-200 pr-4">
                       {String(index + 1).padStart(2, '0')}
                     </span>
                  </div>

                  <div className="absolute bottom-0 left-0 p-8 z-20 pointer-events-none transition-all duration-700 group-hover:opacity-0 group-hover:-translate-x-8">
                     <h4 className="text-[9px] font-mono text-stone-900 tracking-[0.5em] uppercase leading-none">
                       {event.name}
                     </h4>
                     <span className="text-[7px] font-mono text-stone-400 tracking-[0.4em] uppercase mt-2 block">
                       {event._count.outfitInspirations} Looks
                     </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Asymmetric CTA Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center border-t border-stone-200 pt-20">
          {/* Left: Text */}
          <div className="lg:col-span-7 space-y-8">
            <div className="flex items-center gap-4">
               <span className="font-mono text-xs uppercase tracking-widest text-stone-500">Curated Looks</span>
            </div>
            <h2 className="text-5xl md:text-7xl font-serif text-stone-900 leading-tight">
              Find Your <br/>
              <span className="italic text-stone-600">Perfect Occasion</span>
            </h2>
            <p className="text-stone-600 text-lg font-light max-w-lg leading-relaxed">
              Browse curated outfit inspirations for every event. From casual outings to formal occasions, discover looks styled by our professionals.
            </p>
            
            <div className="flex items-center gap-8 pt-4">
              <div>
                <div className="text-4xl font-serif text-stone-900">100%</div>
                <div className="text-xs font-mono uppercase tracking-widest text-stone-500 mt-1">Tailored</div>
              </div>
              <div className="h-12 w-px bg-stone-300"></div>
              <div>
                <div className="text-4xl font-serif text-stone-900">4.9</div>
                <div className="text-xs font-mono uppercase tracking-widest text-stone-500 mt-1">Rating</div>
              </div>
            </div>

            <Link href="/fashion-trends" className="group mt-8 flex items-center gap-4 text-stone-900 hover:text-stone-600 transition-colors">
              <span className="font-mono text-xs uppercase tracking-widest border-b border-stone-900 pb-1 group-hover:border-stone-600">
                Explore All Trends
              </span>
              <ArrowUpRight size={16} className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
            </Link>
          </div>

          {/* Right: Decorative Collage */}
          <div className="lg:col-span-5 relative h-[500px]">
             <div className="absolute inset-0 border border-stone-200"></div>
             {/* Floating Decorative Element */}
             <div className="absolute top-10 left-10 w-2/3 h-2/3 bg-stone-100 overflow-hidden shadow-2xl rotate-3">
                <Image 
                  src="https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1000&auto=format&fit=crop"
                  alt="Texture"
                  fill
                  className="object-cover grayscale hover:grayscale-0 transition-all duration-700"
                />
             </div>
             <div className="absolute bottom-10 right-10 w-1/2 h-1/2 bg-stone-200 overflow-hidden shadow-xl -rotate-6 z-10 border-4 border-white">
                <Image 
                  src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=800&auto=format&fit=crop"
                  alt="Texture"
                  fill
                  className="object-cover"
                />
             </div>
             {/* Badge Overlay */}
             <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
               <div className="bg-white p-6 shadow-lg rotate-12 border border-stone-200">
                 <Heart className="w-6 h-6 text-stone-900 mb-2" />
                 <div className="text-xs font-mono uppercase tracking-widest text-center">Curated</div>
               </div>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// Helper for merging classes (simple version)
function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

export default FashionInspo;