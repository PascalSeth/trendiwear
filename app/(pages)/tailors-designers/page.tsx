'use client'
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Mail, ArrowUpRight, Heart, Filter } from 'lucide-react';
import Image from 'next/image';

// --- Types ---
interface Professional {
  id: string;
  businessName: string;
  businessImage?: string;
  experience: number;
  bio?: string;
  location?: string;
  rating?: number;
  totalReviews?: number;
  user: {
    firstName: string;
    lastName: string;
    profileImage?: string;
    email: string;
    _count: {
      products: number;
      professionalServices: number;
    };
  };
  specialization?: {
    name: string;
  };
}

function Page() {
  // --- State (Preserved) ---
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [likedCards, setLikedCards] = useState<Set<string>>(new Set());
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [loading, setLoading] = useState(true);

  // --- Fetching Logic (Preserved) ---
  useEffect(() => {
    const fetchProfessionals = async () => {
      try {
        const response = await fetch('/api/professional-profiles?public=true');
        if (response.ok) {
          const data = await response.json();
          setProfessionals(data);
        }
      } catch (error) {
        console.error('Failed to fetch professionals:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfessionals();
  }, []);

  const toggleLike = (id: string) => {
    const newLiked = new Set(likedCards);
    if (newLiked.has(id)) {
      newLiked.delete(id);
    } else {
      newLiked.add(id);
    }
    setLikedCards(newLiked);
  };

  // Get unique specializations for filter categories
  const categories = ['All', ...Array.from(new Set(professionals.map(p => p.specialization?.name || 'General').filter(Boolean)))];

  // Filter professionals based on active filter
  const filteredProfessionals = activeFilter === 'All'
    ? professionals
    : professionals.filter(p => p.specialization?.name === activeFilter);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center font-mono text-xs uppercase tracking-widest">
        Loading Directory...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-stone-900 font-sans selection:bg-black selection:text-white">
      
      {/* Marquee Decoration */}
      <div className="w-full overflow-hidden border-b border-stone-200 bg-stone-100 py-3">
        <div className="whitespace-nowrap animate-marquee font-mono text-[10px] uppercase tracking-[0.3em] text-stone-400">
          Fashion Directory • Artisans • Designers • Tailors • Stylists • Curators • Fashion Directory • Artisans • Designers • Tailors • Stylists • Curators •
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 py-16 md:px-12">
        
        {/* Header Section - Asymmetric */}
        <header className="mb-20 flex flex-col md:flex-row justify-between items-start md:items-end gap-8 border-b border-stone-200 pb-12">
          <div className="max-w-2xl">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-stone-500 mb-4">The Index</p>
            <h1 className="text-6xl md:text-8xl font-serif font-medium leading-[0.9] text-stone-900 mb-6">
              The <br /> Atelier
            </h1>
            <p className="text-stone-500 font-light text-lg max-w-md leading-relaxed">
              Curated professionals shaping the future of fashion.
            </p>
          </div>
          
          {/* Minimalist Filters */}
          <div className="flex flex-col items-start md:items-end gap-2">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-stone-400 mb-4">
              <Filter size={12} /> Filter By
            </div>
            <div className="flex flex-wrap justify-end gap-6 md:gap-10">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveFilter(category)}
                  className={`relative text-sm font-medium pb-1 transition-colors duration-300 ${
                    activeFilter === category ? 'text-black' : 'text-stone-400 hover:text-stone-800'
                  }`}
                >
                  {category}
                  <span className={`absolute bottom-0 left-0 w-full h-[1px] bg-black transition-all duration-300 ${activeFilter === category ? 'scale-x-100' : 'scale-x-0'}`}></span>
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Grid Layout */}
        <motion.div 
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-16"
        >
          <AnimatePresence>
            {filteredProfessionals.map((professional) => (
              <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4 }}
                key={professional.id}
                className="group"
              >
                {/* Card Container - Borderless Image Focus */}
                <div className="relative mb-6 overflow-hidden bg-stone-200 aspect-[3/4]">
                  {/* Main Image */}
                  <Image
                    src={professional.businessImage || 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800&q=80'}
                    alt={professional.businessName}
                    fill
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105 grayscale group-hover:grayscale-0"
                  />
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <button className="bg-white text-black px-6 py-3 font-mono text-xs uppercase tracking-widest flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                      View Profile <ArrowUpRight size={14} />
                    </button>
                  </div>

                  {/* Top Right Actions */}
                  <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform -translate-x-2 group-hover:translate-x-0">
                    <button 
                      onClick={() => toggleLike(professional.id)}
                      className="p-2 bg-white rounded-full hover:bg-stone-100 transition-colors"
                    >
                      <Heart 
                        size={16} 
                        className={likedCards.has(professional.id) ? "fill-black text-black" : "text-black"} 
                      />
                    </button>
                  </div>

                  {/* Specialization Tag (Bottom Left) */}
                  <div className="absolute bottom-4 left-4">
                    <span className="bg-white/90 backdrop-blur px-3 py-1 text-[10px] uppercase tracking-widest font-bold text-stone-900">
                      {professional.specialization?.name || 'General'}
                    </span>
                  </div>
                </div>

                {/* Avatar Overlap */}
                <div className="relative -mt-10 mb-4 pl-2 z-10">
                  <Image
                    src={professional.user.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80'}
                    alt={professional.user.firstName}
                    width={64}
                    height={64}
                    className="rounded-full border-4 border-[#FAFAF9] object-cover bg-stone-100"
                  />
                </div>

                {/* Text Info */}
                <div className="pl-2">
                  <h3 className="text-xl font-serif font-medium text-stone-900 mb-1 group-hover:underline decoration-1 underline-offset-4">
                    {professional.businessName}
                  </h3>
                  
                  <div className="flex flex-col gap-2 mb-4">
                    <p className="text-xs font-mono uppercase tracking-widest text-stone-500">
                      {professional.location || 'Remote'}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-stone-600">
                       <span className="flex items-center gap-1">
                         <Star size={12} className="fill-yellow-400 text-yellow-400" />
                         {professional.rating?.toFixed(1) || '4.8'}
                       </span>
                       <span>•</span>
                       <span>{professional.experience} Years Exp.</span>
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="flex items-center justify-between pt-4 border-t border-stone-200">
                    <div className="text-[10px] font-mono uppercase tracking-widest text-stone-400">
                      {professional.user._count.products} Products
                    </div>
                    <button className="text-stone-900 hover:text-stone-600 transition-colors">
                      <Mail size={16} />
                    </button>
                  </div>
                </div>

              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Empty State */}
        {filteredProfessionals.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="py-20 text-center"
          >
            <p className="font-serif text-2xl italic text-stone-400">No artisans found in this category.</p>
          </motion.div>
        )}

      </div>

      {/* Footer Marquee */}
      <div className="w-full overflow-hidden border-t border-stone-200 bg-stone-100 py-3 mt-20">
        <div className="whitespace-nowrap animate-marquee font-mono text-[10px] uppercase tracking-[0.3em] text-stone-400" style={{ animationDirection: 'reverse' }}>
          Fashion Directory • Artisans • Designers • Tailors • Stylists • Curators • Fashion Directory • Artisans • Designers • Tailors • Stylists • Curators •
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

export default Page;