'use client';
import React, { useState } from 'react';
import { ArrowUpRight, X, Heart, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import Image from 'next/image';

// --- Data (Kept exactly as is) ---
interface Trend {
  name: string;
  description: string;
  image: string;
  color: string;
}

const trends: Trend[] = [
  { name: 'Vintage Casual', description: 'Retro tees, high-waisted jeans, and vintage sneakers.', image: 'https://images.unsplash.com/photo-1673417785716-1fa1f932066d?w=800&auto=format&fit=crop&q=80', color: 'bg-amber-500' },
  { name: 'Athleisure', description: 'Stylish joggers, crop tops, and sporty accessories.', image: 'https://images.unsplash.com/photo-1470468969717-61d5d54fd036?w=800&auto=format&fit=crop&q=80', color: 'bg-emerald-500' },
  { name: 'Bohemian', description: 'Flowy fabrics, earthy tones, maxi dresses, and layered jewelry.', image: 'https://images.unsplash.com/photo-1496440737103-cd596325d314?w=800&auto=format&fit=crop&q=80', color: 'bg-purple-500' },
  { name: 'Minimalist', description: 'Clean lines, neutral colors, tailored trousers, and basic tees.', image: 'https://images.unsplash.com/photo-1725958019641-4c03ceb5d2db?w=800&auto=format&fit=crop&q=80', color: 'bg-gray-500' },
  { name: 'Streetwear', description: 'Graphic tees, hoodies, baggy pants, and statement sneakers.', image: 'https://images.unsplash.com/photo-1520014321782-49b0fe958b59?w=800&auto=format&fit=crop&q=80', color: 'bg-red-500' },
  { name: 'Grunge', description: 'Distressed jeans, flannel shirts, and combat boots.', image: 'https://images.unsplash.com/photo-1576193929684-06c6c6a8b582?w=800&auto=format&fit=crop&q=80', color: 'bg-slate-700' },
  { name: 'Preppy', description: 'Polo shirts, khakis, blazers, and loafers with vibrant colors.', image: 'https://images.unsplash.com/photo-1619042821874-587aa4335f39?w=800&auto=format&fit=crop&q=80', color: 'bg-blue-500' },
  { name: 'Romantic', description: 'Soft fabrics, lace, puffed sleeves, and pastel colors.', image: 'https://images.unsplash.com/photo-1683717810905-7a56f467e3cf?w=800&auto=format&fit=crop&q=80', color: 'bg-pink-400' },
];

// --- Components ---

const Marquee = () => (
  <div className="w-full overflow-hidden border-b border-neutral-200 bg-white py-4">
    <div className="whitespace-nowrap animate-marquee font-mono text-xs uppercase tracking-widest text-neutral-500">
      Fashion Trends 2024 — Editorial Collection — Sustainable Style — New Arrivals — The Vanguard —
      Fashion Trends 2024 — Editorial Collection — Sustainable Style — New Arrivals — The Vanguard —
    </div>
  </div>
);

function ModernFashionTrends() {
  const [selectedTrend, setSelectedTrend] = useState<Trend | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Logic preserved
  const openTrendDetails = (trend: Trend) => {
    setSelectedTrend(trend);
    setIsDialogOpen(true);
  };

  const closeTrendDetails = () => {
    setIsDialogOpen(false);
    setTimeout(() => setSelectedTrend(null), 300); // Delay for animation
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-neutral-900 font-sans selection:bg-black selection:text-white">
      
      {/* Subtle Animated Background Grain */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>

      {/* Header */}
      <header className="relative z-10 px-6 py-12 md:py-24 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-neutral-900 pb-8"
        >
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] mb-4 text-neutral-500">The Index</p>
            <h1 className="text-[12vw] md:text-[8rem] font-serif font-medium leading-[0.85] tracking-tighter text-neutral-900">
              Trends
            </h1>
          </div>
          <div className="hidden md:block max-w-xs text-right mt-8">
            <p className="text-lg font-light leading-relaxed text-neutral-600 italic font-serif">
              Defining the visual language of the current season.
            </p>
          </div>
        </motion.div>
      </header>

      <Marquee />

      {/* Main Grid - Masonry Style */}
      <div className="relative z-10 max-w-[1600px] mx-auto px-4 md:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-24">
          {trends.map((trend, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: index * 0.05 }}
              className="group cursor-pointer flex flex-col"
            >
              <Dialog open={isDialogOpen && selectedTrend?.name === trend.name} onOpenChange={(open) => !open && closeTrendDetails()}>
                <DialogTrigger asChild>
                  <div onClick={() => openTrendDetails(trend)} className="relative overflow-hidden aspect-[3/4] mb-6 bg-neutral-200">
                    {/* The Image */}
                    <motion.img 
                      src={trend.image} 
                      alt={trend.name}
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 grayscale-[0.2] group-hover:grayscale-0"
                    />
                    
                    {/* Index Number - Editorial Style */}
                    <div className="absolute top-4 left-4 z-10">
                      <span className="font-serif text-6xl md:text-8xl text-white/20 group-hover:text-white/40 transition-colors duration-500 mix-blend-overlay">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                    </div>

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                      <div className="bg-white/10 backdrop-blur-md border border-white/20 px-6 py-3 rounded-full transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                        <span className="text-white font-mono text-xs uppercase tracking-widest flex items-center gap-2">
                          Explore <ArrowUpRight size={14} />
                        </span>
                      </div>
                    </div>
                  </div>
                </DialogTrigger>

                {/* Custom Styled Modal */}
                {selectedTrend && selectedTrend.name === trend.name && (
                  <DialogContent className="max-w-6xl w-[95vw] h-[90vh] p-0 overflow-hidden bg-white border-none shadow-2xl rounded-none flex flex-col md:flex-row z-[100]">
                    {/* Close Button */}
                    <button 
                      onClick={closeTrendDetails}
                      className="absolute top-6 right-6 z-50 p-3 bg-white rounded-full hover:bg-neutral-100 transition-colors border border-neutral-200"
                    >
                      <X size={20} />
                    </button>

                    {/* Image Side */}
                    <div className="w-full md:w-2/3 h-1/2 md:h-full relative bg-neutral-100">
                      <Image
                        src={selectedTrend.image}
                        alt={selectedTrend.name}
                        fill
                        className="object-cover"
                      />
                      {/* Color Accent */}
                      <div className={`absolute bottom-0 left-0 w-32 h-2 ${selectedTrend.color}`}></div>
                    </div>

                    {/* Content Side */}
                    <div className="w-full md:w-1/3 h-1/2 md:h-full p-8 md:p-16 flex flex-col justify-center bg-white">
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <div className="flex items-center gap-4 mb-8">
                          <span className={`w-2 h-2 rounded-full ${selectedTrend.color}`}></span>
                          <span className="font-mono text-xs uppercase tracking-widest text-neutral-500">
                            Style Category
                          </span>
                        </div>

                        <DialogTitle className="text-4xl md:text-5xl font-serif font-medium text-neutral-900 mb-6 leading-tight">
                          {selectedTrend.name}
                        </DialogTitle>
                        
                        <DialogDescription className="text-neutral-600 text-lg font-light leading-relaxed mb-10 font-serif italic">
                          &apos;{selectedTrend.description}&apos;
                        </DialogDescription>

                        <div className="flex flex-col gap-4 mt-auto">
                          <button className="w-full bg-neutral-900 text-white py-4 font-medium hover:bg-neutral-800 transition-colors flex justify-between px-6 items-center group/btn">
                            <span className="uppercase tracking-widest text-xs">Shop Collection</span>
                            <ArrowUpRight size={16} className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                          </button>
                          
                          <div className="flex gap-4 pt-4 border-t border-neutral-100">
                            <button className="flex-1 flex items-center justify-center gap-2 py-3 border border-neutral-200 hover:border-neutral-900 transition-colors text-sm uppercase tracking-wide">
                              <Heart size={16} /> Save
                            </button>
                            <button className="flex-1 flex items-center justify-center gap-2 py-3 border border-neutral-200 hover:border-neutral-900 transition-colors text-sm uppercase tracking-wide">
                              <Share2 size={16} /> Share
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </DialogContent>
                )}
              </Dialog>

              {/* Typography Info */}
              <div className="flex flex-col">
                <h3 className="text-2xl font-serif font-medium mb-2 group-hover:underline decoration-1 underline-offset-4 decoration-neutral-300 transition-all">
                  {trend.name}
                </h3>
                <div className="flex items-center gap-4 text-xs font-mono text-neutral-400 uppercase tracking-widest">
                  <span>Vol. {2024 + index}</span>
                  <span>•</span>
                  <span className="group-hover:text-neutral-900 transition-colors">View Details</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <style jsx global>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
      `}</style>
    </div>
  );
}

export default ModernFashionTrends;