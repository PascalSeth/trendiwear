"use client";
import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';
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

export default function TrendsClient({ initialEvents }: TrendsClientProps) {
  const events = initialEvents;

  const getScatterClass = (index: number) => {
    switch (index % 8) {
      case 0: return 'md:col-span-2 md:row-span-2';
      case 1: return 'md:col-span-1 md:row-span-1 translate-y-12 -rotate-1';
      case 2: return 'md:col-span-1 md:row-span-2 -translate-y-6 rotate-1';
      case 3: return 'md:col-span-2 md:row-span-1 translate-y-4';
      case 4: return 'md:col-span-1 md:row-span-1 translate-y-16 rotate-1';
      case 5: return 'md:col-span-1 md:row-span-1';
      case 6: return 'md:col-span-1 md:row-span-2';
      case 7: return 'md:col-span-1 md:row-span-1 -translate-y-8';
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
        <header className="mb-20 flex flex-col md:flex-row justify-between items-start md:items-end border-b border-stone-200 pb-12 pt-24 lg:pt-32">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <span className="font-mono text-[10px] uppercase tracking-widest text-stone-400">Lookbook 2026</span>
              <div className="h-px w-12 bg-stone-300"></div>
            </div>
            <h1 className="text-6xl md:text-8xl font-serif font-medium text-stone-900 leading-[0.9]">
              Trends.
            </h1>
          </div>
          <div className="max-w-sm text-right hidden md:block mt-6">
            <p className="font-serif text-lg italic text-stone-600 leading-relaxed">
              A curated collection of events and occasions defining the current season.
            </p>
          </div>
        </header>

        {events.length === 0 ? (
          <div className="py-32 text-center">
            <p className="text-stone-500 font-serif text-3xl italic mb-4">
              Curating the season... Check back soon.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 auto-rows-[320px] gap-8 pb-32">
            {events.map((event, index) => (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                key={event.id}
                className={cn(
                  "group relative cursor-pointer",
                  getScatterClass(index)
                )}
              >
                <Link href={`/fashion-trends/${event.id}`} className="block absolute inset-0">
                  <div className="absolute inset-0 bg-white border border-stone-200 shadow-xl transition-all duration-700 group-hover:-translate-y-4 group-hover:shadow-3xl overflow-hidden rounded-sm">
                    <div className="relative w-full h-full bg-stone-100">
                      {event.imageUrl ? (
                        <Image
                          src={event.imageUrl}
                          alt={event.name}
                          fill
                          className="object-cover transition-all duration-1000 grayscale group-hover:grayscale-0 group-hover:scale-110"
                          priority={index < 2}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-stone-200 to-stone-300 flex items-center justify-center">
                          <span className="font-serif text-9xl text-stone-400/30">{event.name.charAt(0)}</span>
                        </div>
                      )}
                      
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                      <div className="absolute inset-0 p-8 flex flex-col justify-between opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0">
                        <div className="flex justify-between items-start">
                          <span className="bg-white px-3 py-1 text-[10px] font-mono uppercase tracking-[0.3em] text-stone-900">
                            Idx {String(index + 1).padStart(2, '0')}
                          </span>
                        </div>
                        <div className="space-y-4">
                           <div className="flex items-center gap-2">
                              <div className="h-[1px] w-8 bg-white/50" />
                              <span className="text-[10px] font-mono uppercase tracking-widest text-white/70">
                                {event._count.outfitInspirations} Inspirations
                              </span>
                           </div>
                          <h3 className="text-3xl md:text-4xl font-serif text-white font-medium leading-[0.9] italic">
                            {event.name}
                          </h3>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
                
                <div className="absolute -bottom-8 left-8 z-20 pointer-events-none transition-all duration-500 group-hover:opacity-0 group-hover:translate-y-4">
                  <span className="bg-stone-900 text-white px-6 py-3 text-xs font-mono uppercase tracking-[0.2em] flex items-center gap-3 shadow-lg">
                    {event.name}
                    <ArrowUpRight size={14} className="text-red-900" />
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <div className="border-t border-stone-200 pt-24 text-center pb-24">
          <p className="font-serif text-2xl italic text-stone-400 mb-8 max-w-lg mx-auto">
             Looking for something specific? Join our bespoke directory.
          </p>
          <Link 
            href="/tailors-designers"
            className="group inline-flex items-center gap-6 text-stone-900"
          >
            <span className="font-mono text-xs uppercase tracking-[0.3em] border-b border-stone-900 pb-2 group-hover:border-stone-400 transition-all">
              Discover Artisans
            </span>
            <div className="p-3 bg-stone-900 rounded-full text-white group-hover:bg-red-900 transition-colors">
               <ArrowUpRight size={18} />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
