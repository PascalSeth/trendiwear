"use client";
import React, { useEffect, useState } from 'react';
import { ArrowUpRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

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

// Helper for merging classes
function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

function ModernFashionTrends() {
  const [events, setEvents] = useState<TrendEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch("/api/events");
        if (res.ok) {
          const data = await res.json();
          const eventsArray = Array.isArray(data) ? data : [];
          setEvents(eventsArray);
        }
      } catch (error) {
        console.error("Failed to fetch events:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Helper to assign random "scatter" styles based on index
  const getScatterClass = (index: number) => {
    switch (index % 8) {
      case 0: return 'md:col-span-2 md:row-span-2'; // Hero Item
      case 1: return 'md:col-span-1 md:row-span-1 translate-y-12 -rotate-1'; // Shifted Down
      case 2: return 'md:col-span-1 md:row-span-2 -translate-y-6 rotate-1'; // Tall, shifted up
      case 3: return 'md:col-span-2 md:row-span-1 translate-y-4'; // Wide
      case 4: return 'md:col-span-1 md:row-span-1 translate-y-16 rotate-1'; // Shifted down
      case 5: return 'md:col-span-1 md:row-span-1'; // Normal
      case 6: return 'md:col-span-1 md:row-span-2'; // Tall
      case 7: return 'md:col-span-1 md:row-span-1 -translate-y-8'; // Shifted Up
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
              <span className="font-mono text-xs uppercase tracking-widest text-stone-400">Lookbook 2026</span>
              <div className="h-px w-12 bg-stone-400"></div>
            </div>
            <h1 className="text-6xl md:text-8xl font-serif font-medium text-stone-900 leading-[0.9]">
              Trends
            </h1>
          </div>
          <div className="max-w-sm text-right hidden md:block mt-6">
            <p className="font-serif text-lg italic text-stone-600 leading-relaxed">
              A curated collection of events and occasions defining the current season.
            </p>
          </div>
        </header>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="h-10 w-10 animate-spin text-stone-400" />
          </div>
        ) : events.length === 0 ? (
          <div className="py-32 text-center">
            <p className="text-stone-500 font-serif text-xl italic mb-4">
              No events yet. Check back soon for curated looks.
            </p>
          </div>
        ) : (
          /* SCATTERED LAYOUT GRID */
          <div className="grid grid-cols-1 md:grid-cols-4 auto-rows-[280px] gap-6 pb-32">
            {events.map((event, index) => (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                key={event.id}
                className={cn(
                  "group relative cursor-pointer",
                  getScatterClass(index)
                )}
              >
                <Link href={`/fashion-trends/${event.id}`} className="block absolute inset-0">
                  {/* The "Polaroid" / "Cutout" Container */}
                  <div className="absolute inset-0 bg-white border border-stone-200 shadow-xl transition-transform duration-500 group-hover:-translate-y-2 group-hover:shadow-2xl">
                    <div className="relative w-full h-full overflow-hidden bg-stone-100">
                      {event.imageUrl ? (
                        <Image
                          src={event.imageUrl}
                          alt={event.name}
                          fill
                          className="object-cover transition-all duration-700 grayscale group-hover:grayscale-0 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-stone-200 to-stone-300 flex items-center justify-center">
                          <span className="font-serif text-8xl text-stone-400/50">{event.name.charAt(0)}</span>
                        </div>
                      )}
                      
                      {/* Dark Overlay on Hover for Text Readability */}
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 mix-blend-multiply" />

                      {/* Content Overlay */}
                      <div className="absolute inset-0 p-6 flex flex-col justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="flex justify-between items-start">
                          <span className="bg-white/90 backdrop-blur px-2 py-1 text-[10px] font-mono uppercase tracking-widest text-stone-900">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <span className="bg-white/90 backdrop-blur px-2 py-1 text-[10px] font-mono uppercase tracking-widest text-stone-900">
                            {event._count.outfitInspirations} {event._count.outfitInspirations === 1 ? 'Look' : 'Looks'}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-2xl md:text-3xl font-serif text-white font-medium leading-none drop-shadow-sm">
                            {event.name}
                          </h3>
                          {event.description && (
                            <p className="text-white/90 text-sm mt-2 font-light line-clamp-2">
                              {event.description}
                            </p>
                          )}
                          {event.seasonality && event.seasonality.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-3">
                              {event.seasonality.slice(0, 2).map((season) => (
                                <span 
                                  key={season} 
                                  className="px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-[9px] uppercase tracking-wider text-white"
                                >
                                  {season.replace('_', ' ')}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
                
                {/* Static Content (Visible when not hovered) - Floating outside the "card" */}
                <div className="absolute -bottom-6 left-6 z-20 pointer-events-none transition-opacity duration-300 group-hover:opacity-0">
                  <span className="bg-stone-900 text-white px-4 py-2 text-xs font-mono uppercase tracking-widest flex items-center gap-2">
                    {event.name.split(' ')[0]}
                    <ArrowUpRight size={12} />
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Bottom CTA Section */}
        <div className="border-t border-stone-200 pt-16 text-center">
          <p className="font-serif text-lg italic text-stone-500 mb-6">
            Can&apos;t find what you&apos;re looking for?
          </p>
          <Link 
            href="/professionals"
            className="group inline-flex items-center gap-4 text-stone-900 hover:text-stone-600 transition-colors"
          >
            <span className="font-mono text-xs uppercase tracking-widest border-b border-stone-900 pb-1 group-hover:border-stone-600">
              Browse All Professionals
            </span>
            <ArrowUpRight size={16} className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ModernFashionTrends;
