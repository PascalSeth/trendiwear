'use client'
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, Heart, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

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

  // Optimized Artistic Scatter for 7 Curated Items
  const getScatterClass = (index: number) => {
    switch (index) {
      case 0: return 'md:col-span-2 md:row-span-2 z-10'; // Hero (Traditional)
      case 1: return 'md:col-span-1 md:row-span-2 translate-y-20 -rotate-2'; // Tall Offset (Owambe)
      case 2: return 'md:col-span-1 md:row-span-1 -translate-x-4 rotate-3'; // Top Right (Street)
      case 3: return 'md:col-span-1 md:row-span-1 translate-x-8 translate-y-12'; // Mid Right
      case 4: return 'md:col-span-1 md:row-span-1 -translate-y-12 rotate-1'; // Bottom Floating
      case 5: return 'md:col-span-2 md:row-span-1 translate-y-32 -translate-x-20 z-20'; // Bottom Wide Overlay
      case 6: return 'md:col-span-1 md:row-span-2 -translate-y-40 translate-x-24 rotate-3'; // Far Right Tall
      default: return '';
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
            <h1 className="text-6xl md:text-8xl font-serif font-medium text-stone-900 leading-[0.9]">
              Moodboard
            </h1>
          </div>
          <div className="max-w-sm text-right hidden md:block mt-6">
            <p className="font-serif text-lg italic text-stone-600 leading-relaxed">
              Explore the textures, tones, and traditions defining our current high-fashion ecosystem.
            </p>
          </div>
        </header>

        {/* SCATTERED LAYOUT GRID */}
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
          <div className="grid grid-cols-1 md:grid-cols-4 auto-rows-[220px] gap-8 pb-48">
            {events.map((event, index) => (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ 
                  duration: 0.8, 
                  delay: index * 0.15,
                  ease: [0.21, 0.45, 0.32, 0.9]
                }}
                key={event.id}
                className={cn(
                  "group relative cursor-pointer",
                  getScatterClass(index)
                )}
              >
                <Link href={`/fashion-trends/${event.id}`} className="block absolute inset-0">
                  {/* The "Polaroid" / "Cutout" Container */}
                  <div className="absolute inset-0 bg-white border border-stone-200 p-2 shadow-sm transition-all duration-500 group-hover:-translate-y-4 group-hover:rotate-1 group-hover:shadow-2xl z-10">
                    <div className="relative w-full h-full overflow-hidden bg-stone-100">
                      {event.imageUrl ? (
                        <Image
                          src={event.imageUrl}
                          alt={event.name}
                          fill
                          className="object-cover transition-all duration-1000 grayscale group-hover:grayscale-0 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-stone-50 to-stone-200 flex items-center justify-center border-b-[40px] border-white">
                          <span className="font-serif text-[12vw] md:text-8xl text-stone-300 font-light mix-blend-multiply opacity-50 tracking-tighter">
                            {event.name}
                          </span>
                        </div>
                      )}
                      
                      {/* Dark Overlay on Hover for Text Readability */}
                      <div className="absolute inset-0 bg-stone-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 mix-blend-multiply" />

                      {/* Content Overlay */}
                      <div className="absolute inset-0 p-6 flex flex-col justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <div className="flex justify-between items-start">
                          <span className="bg-white/90 backdrop-blur px-3 py-1 text-[10px] font-mono uppercase tracking-[0.2em] text-stone-900">
                            Ref.{String(index + 1).padStart(2, '0')}
                          </span>
                          <span className="bg-white/90 backdrop-blur px-3 py-1 text-[10px] font-mono uppercase tracking-[0.2em] text-stone-900">
                            {event._count.outfitInspirations} Looks
                          </span>
                        </div>
                        <div>
                          <h3 className="text-3xl font-serif text-white font-medium leading-none mb-2">
                            {event.name}
                          </h3>
                          {event.description && (
                            <p className="text-white/80 text-xs font-light line-clamp-2 max-w-[80%] uppercase tracking-widest font-mono">
                              {event.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
                
                {/* Static Content (Visible when not hovered) - Floating outside the "card" */}
                <div className="absolute top-4 -left-4 z-20 pointer-events-none transition-all duration-500 group-hover:opacity-0 group-hover:-translate-x-4">
                  <span className="bg-stone-900 text-white px-4 py-2 text-[10px] font-mono uppercase tracking-[0.3em] shadow-lg">
                    {event.name}
                  </span>
                </div>
              </motion.div>
            ))}
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