'use client'
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Heart, Filter, Briefcase, Package, BadgeCheck } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

// --- Types ---
interface Professional {
  id: string;
  businessName: string;
  businessImage?: string | null;
  experience: number;
  bio?: string | null;
  location?: string | null;
  rating?: number | null;
  totalReviews?: number | null;
  slug?: string | null;
  isVerified?: boolean;
  user: {
    firstName: string;
    lastName: string;
    profileImage?: string | null;
    email: string;
    _count?: {
      products: number;
      professionalServices: number;
    };
  };
  specialization?: {
    name: string;
  } | null;
}

interface TailorsClientProps {
  initialProfessionals: Professional[];
}

function ProfessionalCard({ professional, liked, onToggleLike }: {
  professional: Professional;
  liked: boolean;
  onToggleLike: (id: string) => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group relative flex flex-col bg-white border border-stone-100 hover:shadow-lg transition-all duration-300 rounded-xl overflow-hidden"
    >
      {/* Visual Square (1:1) */}
      <div className="relative w-full aspect-square overflow-hidden bg-stone-50">
        {professional.businessImage ? (
          <Image
            src={professional.businessImage}
            alt={professional.businessName}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-stone-100 flex items-center justify-center">
            <span className="text-4xl font-bold text-stone-200">
              {professional.businessName.charAt(0)}
            </span>
          </div>
        )}
        
        {/* Like Button */}
        <button
          onClick={() => onToggleLike(professional.id)}
          className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white hover:scale-110 active:scale-95 transition-all shadow-sm z-10"
        >
          <Heart
            size={14}
            className={liked ? 'fill-rose-500 text-rose-500' : 'text-stone-400'}
          />
        </button>

        {/* Category Label */}
        <div className="absolute top-3 left-3 z-10">
          <span className="inline-block bg-black/70 backdrop-blur-sm text-white text-[8px] font-bold uppercase tracking-widest px-2 py-1 rounded-md">
            {professional.specialization?.name || 'Pro'}
          </span>
        </div>

        {/* Compact Profile Signature */}
        <div className="absolute bottom-3 right-3 z-20">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-lg">
            {professional.user.profileImage ? (
              <Image
                src={professional.user.profileImage}
                alt={professional.user.firstName}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-stone-900 flex items-center justify-center text-white text-xs font-bold">
                {professional.user.firstName.charAt(0)}
              </div>
            )}
          </div>
          {professional.isVerified && (
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-blue-500 rounded-full border border-white flex items-center justify-center">
              <BadgeCheck className="w-2 h-2 text-white" />
            </div>
          )}
        </div>
      </div>

      {/* Simplified Info Block */}
      <div className="p-4 flex flex-col flex-1 space-y-3">
        <div>
          <h3 className="text-sm font-bold text-stone-900 truncate">
            {professional.businessName}
          </h3>
          <p className="text-[10px] text-stone-400 font-medium truncate mt-0.5">
            {professional.location || 'Online'}
          </p>
        </div>

        <div className="flex items-center justify-between text-[10px] font-bold text-stone-500">
          <div className="flex items-center gap-1">
             <Star size={10} className="fill-amber-400 text-amber-400" />
             <span>{professional.rating || '4.8'}</span>
             <span className="text-stone-300 ml-0.5 font-medium">({professional.totalReviews || 0})</span>
          </div>
          <div className="flex items-center gap-1">
             <Briefcase size={10} className="text-stone-300" />
             <span>{professional.experience} yrs exp.</span>
          </div>
        </div>

        {professional.bio && (
          <p className="text-[11px] text-stone-400 line-clamp-1 italic font-medium">
            {professional.bio}
          </p>
        )}

        <div className="pt-1 flex items-center justify-between">
           <div className="flex items-center gap-1 text-[9px] font-bold text-stone-300 uppercase">
             <Package size={10} />
             <span>{professional.user._count?.products || 0} Products</span>
           </div>

           <Link 
            href={`/tz/${professional.slug || encodeURIComponent(professional.businessName.toLowerCase().replace(/\s+/g, '-'))}`}
            className="text-[10px] font-black text-stone-900 hover:text-blue-600 transition-colors uppercase tracking-widest"
          >
            View Profile →
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

export default function TailorsClient({ initialProfessionals }: TailorsClientProps) {
  const [likedCards, setLikedCards] = useState<Set<string>>(new Set());
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const professionals = initialProfessionals;

  const toggleLike = (id: string) => {
    setLikedCards(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const categories = ['All', ...Array.from(new Set(
    professionals.map(p => p.specialization?.name || 'General').filter(Boolean)
  ))];

  const filteredProfessionals = activeFilter === 'All'
    ? professionals
    : professionals.filter(p => (p.specialization?.name ?? 'General') === activeFilter);

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-stone-900 font-sans selection:bg-black selection:text-white relative overflow-hidden">
      
      {/* Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-gradient-to-br from-stone-200/40 via-amber-100/20 to-transparent rounded-full blur-3xl opacity-50" />
        <div className="absolute top-1/3 -left-40 w-[500px] h-[500px] bg-gradient-to-tr from-stone-300/30 via-rose-100/10 to-transparent rounded-full blur-3xl opacity-50" />
        <div 
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `linear-gradient(to right, #1c1917 1px, transparent 1px), linear-gradient(to bottom, #1c1917 1px, transparent 1px)`,
            backgroundSize: '80px 80px'
          }}
        />
      </div>

      {/* Top Marquee */}
      <div className="relative w-full overflow-hidden border-b border-stone-200 bg-stone-50/80 backdrop-blur-sm py-2.5 pt-24 lg:pt-32">
        <div className="whitespace-nowrap animate-marquee font-mono text-[9px] uppercase tracking-[0.3em] text-stone-400">
          Fashion Directory • Artisans • Designers • Tailors • Stylists • Curators •&nbsp;
          Fashion Directory • Artisans • Designers • Tailors • Stylists • Curators •&nbsp;
        </div>
      </div>

      <div className="relative max-w-[1600px] mx-auto px-6 py-16 md:px-12">
        {/* Header */}
        <header className="relative mb-16 flex flex-col md:flex-row justify-between items-start md:items-end gap-8 border-b border-stone-200 pb-12">
          <div className="max-w-2xl">
            <motion.p initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-400 mb-4">The Index</motion.p>
            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-6xl md:text-8xl font-serif font-medium leading-[0.88] text-stone-900 mb-5">The<br />Atelier</motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-stone-400 font-light text-lg max-w-md font-serif italic">Curated professionals shaping the future of fashion.</motion.p>
          </div>

          {/* Filters */}
          <div className="flex flex-col items-start md:items-end gap-2">
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-stone-400 mb-3">
              <Filter size={11} /> Filter By
            </div>
            <div className="flex flex-wrap justify-end gap-6 md:gap-8">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setActiveFilter(category)}
                  className={`relative text-sm font-medium pb-1 transition-colors duration-200 ${
                    activeFilter === category ? 'text-stone-900' : 'text-stone-400 hover:text-stone-700'
                  }`}
                >
                  {category}
                  <span className={`absolute bottom-0 left-0 w-full h-px bg-stone-900 transition-transform duration-300 origin-left ${
                    activeFilter === category ? 'scale-x-100' : 'scale-x-0'
                  }`} />
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Results count */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
          <p className="font-mono text-[11px] uppercase tracking-widest text-stone-400">
            {filteredProfessionals.length} professional{filteredProfessionals.length !== 1 ? 's' : ''} listed
          </p>
          <div className="h-px flex-1 mx-6 bg-gradient-to-r from-stone-200 via-stone-300 to-transparent" />
        </motion.div>

        {/* Grid */}
        <motion.div layout className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
          <AnimatePresence>
            {filteredProfessionals.map(professional => (
              <ProfessionalCard
                key={professional.id}
                professional={professional}
                liked={likedCards.has(professional.id)}
                onToggleLike={toggleLike}
              />
            ))}
          </AnimatePresence>
        </motion.div>

        {filteredProfessionals.length === 0 && (
          <div className="py-24 text-center">
            <p className="font-serif text-2xl italic text-stone-300">No artisans found in this category.</p>
          </div>
        )}
      </div>

      {/* Bottom decorative section */}
      <div className="relative bg-stone-900 text-white py-24 overflow-hidden mt-24">
        <div className="relative max-w-[1600px] mx-auto px-6 md:px-12 text-center space-y-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-stone-500">Join the Community</p>
          <h2 className="font-serif text-4xl md:text-6xl italic">Become a Listed Professional.</h2>
          <p className="text-stone-400 font-serif italic max-w-md mx-auto text-lg leading-relaxed">
            Showcase your craft to thousands of fashion enthusiasts and grow your business.
          </p>
          <Link href="/register-as-professional" className="inline-block px-12 py-4 bg-white text-stone-900 font-mono text-xs uppercase tracking-widest hover:bg-stone-100 transition-colors duration-200">
            Apply Now
          </Link>
        </div>
      </div>

      <style jsx global>{`
        @keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee { animation: marquee 20s linear infinite; }
      `}</style>
    </div>
  );
}
