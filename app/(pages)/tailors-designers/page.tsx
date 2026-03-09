'use client'
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Mail, ArrowUpRight, Heart, Filter, MapPin, Briefcase, Package, BadgeCheck } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

// --- Types (Preserved) ---
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

function ProfessionalCard({ professional, liked, onToggleLike }: {
  professional: Professional;
  liked: boolean;
  onToggleLike: (id: string) => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.35 }}
      className="group relative flex flex-col bg-white border border-stone-100 hover:border-stone-300 hover:shadow-xl transition-all duration-400 rounded-sm overflow-hidden"
    >
      {/* Top strip: image banner */}
      <div className="relative w-full aspect-[16/9] overflow-hidden bg-stone-100">
        {professional.businessImage ? (
          <Image
            src={professional.businessImage}
            alt={professional.businessName}
            fill
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-stone-100 to-stone-200 flex items-center justify-center">
            <span className="text-5xl font-serif text-stone-300 select-none">
              {professional.businessName.charAt(0)}
            </span>
          </div>
        )}

        {/* Gradient fade into card body */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent" />

        {/* Like button */}
        <button
          onClick={() => onToggleLike(professional.id)}
          className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur rounded-full hover:scale-110 active:scale-95 transition-transform duration-150 shadow-sm"
        >
          <Heart
            size={15}
            className={liked ? 'fill-rose-500 text-rose-500' : 'text-stone-400'}
          />
        </button>

        {/* Specialization badge */}
        <div className="absolute top-3 left-3">
          <span className="inline-block bg-stone-900 text-white text-[9px] uppercase tracking-[0.18em] font-semibold px-2.5 py-1 rounded-sm">
            {professional.specialization?.name || 'General'}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 px-5 pb-5 pt-4">

        {/* Name + Avatar row */}
        <div className="flex items-center gap-3 mb-3">
          <div className="relative shrink-0">
            {professional.user.profileImage ? (
              <Image
                src={professional.user.profileImage}
                alt={professional.user.firstName}
                width={44}
                height={44}
                className="rounded-full object-cover border-2 border-stone-100 shadow-sm"
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-stone-200 border-2 border-stone-100 flex items-center justify-center text-base font-serif text-stone-500">
                {professional.user.firstName.charAt(0)}
              </div>
            )}
            {/* Verified badge */}
            {professional.isVerified && (
              <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                <BadgeCheck className="w-3 h-3 text-white" />
              </span>
            )}
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-stone-900 leading-tight truncate font-serif">
              {professional.businessName}
            </h3>
            <p className="text-[11px] text-stone-400 font-mono uppercase tracking-widest truncate">
              {professional.user.firstName} {professional.user.lastName}
            </p>
          </div>
        </div>

        {/* Meta row */}
        <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mb-4 text-[11px] text-stone-500">
          {professional.location && (
            <span className="flex items-center gap-1">
              <MapPin size={11} className="text-stone-400" />
              {professional.location}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Briefcase size={11} className="text-stone-400" />
            {professional.experience} yrs exp.
          </span>
          <span className="flex items-center gap-1">
            <Star size={11} className="fill-amber-400 text-amber-400" />
            {professional.rating && professional.rating > 0 ? professional.rating.toFixed(1) : 'New'}
            <span className="text-stone-300 ml-0.5">
              ({professional.totalReviews || 0})
            </span>
          </span>
        </div>

        {/* Bio snippet */}
        {professional.bio && (
          <p className="text-[12px] text-stone-500 leading-relaxed line-clamp-2 mb-4 font-light">
            {professional.bio}
          </p>
        )}

        {/* Divider */}
        <div className="mt-auto border-t border-stone-100 pt-4 flex items-center justify-between">
          <div className="flex items-center gap-1 text-[11px] text-stone-400 font-mono">
            <Package size={11} />
            <span>{professional.user._count?.products || 0} products</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              title="Send email"
              className="p-2 rounded-full border border-stone-200 text-stone-500 hover:border-stone-400 hover:text-stone-800 transition-colors duration-200"
            >
              <Mail size={14} />
            </button>
            <Link 
              href={`/tz/${professional.slug || encodeURIComponent(professional.businessName.toLowerCase().replace(/\s+/g, '-'))}`}
              className="flex items-center gap-1.5 bg-stone-900 hover:bg-stone-700 text-white text-[10px] uppercase tracking-widest font-semibold px-3.5 py-2 rounded-sm transition-colors duration-200"
            >
              View <ArrowUpRight size={12} />
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function Page() {
  // --- State (Preserved) ---
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [likedCards, setLikedCards] = useState<Set<string>>(new Set());
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Fetching Logic (Preserved) ---
  useEffect(() => {
    const fetchProfessionals = async () => {
      try {
        setError(null);
        const response = await fetch('/api/professional-profiles?public=true');
        if (!response.ok) throw new Error('Failed to fetch professionals');
        const data = await response.json();
        setProfessionals(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to fetch professionals:', err);
        setError('Failed to load professionals. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfessionals();
  }, []);

  const toggleLike = (id: string) => {
    setLikedCards(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const categories = ['All', ...Array.from(new Set(
    professionals.map(p => p.specialization?.name || 'General').filter(Boolean)
  ))];

  const filteredProfessionals = activeFilter === 'All'
    ? professionals
    : professionals.filter(p => (p.specialization?.name ?? 'General') === activeFilter);

  // --- Loading / Error states (Preserved) ---
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center font-mono text-xs uppercase tracking-widest text-stone-400">
        Loading Directory…
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] flex flex-col items-center justify-center gap-4">
        <p className="font-mono text-sm text-red-600">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-stone-900 text-white text-xs font-mono uppercase tracking-widest hover:bg-stone-800 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-stone-900 font-sans selection:bg-black selection:text-white relative overflow-hidden">

      {/* Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Large gradient orbs */}
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-gradient-to-br from-stone-200/40 via-amber-100/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-40 w-[500px] h-[500px] bg-gradient-to-tr from-stone-300/30 via-rose-100/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-gradient-to-t from-stone-200/30 to-transparent rounded-full blur-3xl" />
        
        {/* Grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `linear-gradient(to right, #1c1917 1px, transparent 1px), linear-gradient(to bottom, #1c1917 1px, transparent 1px)`,
            backgroundSize: '80px 80px'
          }}
        />
        
        {/* Diagonal lines decoration */}
        <svg className="absolute top-20 right-20 w-64 h-64 text-stone-200 opacity-30" viewBox="0 0 100 100">
          <line x1="0" y1="100" x2="100" y2="0" stroke="currentColor" strokeWidth="0.5" />
          <line x1="20" y1="100" x2="100" y2="20" stroke="currentColor" strokeWidth="0.5" />
          <line x1="40" y1="100" x2="100" y2="40" stroke="currentColor" strokeWidth="0.5" />
        </svg>
        
        {/* Floating shapes */}
        <motion.div 
          animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 right-1/3 w-20 h-20 border border-stone-200/50 rounded-full"
        />
        <motion.div 
          animate={{ y: [0, 15, 0], rotate: [0, -3, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-2/3 left-20 w-32 h-32 border border-stone-200/40"
        />
        <motion.div 
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-1/4 right-20 w-16 h-16 bg-stone-100/50 rotate-45"
        />
        
        {/* Dotted pattern */}
        <div className="absolute top-40 left-1/4 grid grid-cols-5 gap-3 opacity-20">
          {[...Array(25)].map((_, i) => (
            <div key={i} className="w-1 h-1 bg-stone-400 rounded-full" />
          ))}
        </div>
        <div className="absolute bottom-60 right-1/3 grid grid-cols-4 gap-2 opacity-15">
          {[...Array(16)].map((_, i) => (
            <div key={i} className="w-1.5 h-1.5 bg-stone-300 rounded-full" />
          ))}
        </div>
        
        {/* Decorative typography */}
        <div className="absolute top-1/2 -left-20 -rotate-90 font-serif text-[200px] font-bold text-stone-100/30 select-none whitespace-nowrap">
          ATELIER
        </div>
        <div className="absolute bottom-20 -right-10 font-mono text-[120px] font-bold text-stone-100/20 select-none">
          &
        </div>
      </div>

      {/* Top Marquee */}
      <div className="relative w-full overflow-hidden border-b border-stone-200 bg-stone-50/80 backdrop-blur-sm py-2.5">
        <div className="whitespace-nowrap animate-marquee font-mono text-[9px] uppercase tracking-[0.3em] text-stone-400">
          Fashion Directory • Artisans • Designers • Tailors • Stylists • Curators •&nbsp;
          Fashion Directory • Artisans • Designers • Tailors • Stylists • Curators •&nbsp;
        </div>
      </div>

      <div className="relative max-w-[1600px] mx-auto px-6 py-16 md:px-12">

        {/* Header */}
        <header className="relative mb-16 flex flex-col md:flex-row justify-between items-start md:items-end gap-8 border-b border-stone-200 pb-12">
          {/* Decorative corner element */}
          <div className="absolute -top-4 -left-4 w-24 h-24 border-l-2 border-t-2 border-stone-200/60" />
          
          <div className="max-w-2xl">
            <motion.p 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-400 mb-4"
            >
              The Index
            </motion.p>
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-6xl md:text-8xl font-serif font-medium leading-[0.88] text-stone-900 mb-5"
            >
              The<br />Atelier
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-stone-400 font-light text-lg max-w-md leading-relaxed"
            >
              Curated professionals shaping the future of fashion.
            </motion.p>
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
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex items-center justify-between mb-8"
        >
          <p className="font-mono text-[11px] uppercase tracking-widest text-stone-400">
            {filteredProfessionals.length} professional{filteredProfessionals.length !== 1 ? 's' : ''} listed
          </p>
          <div className="h-px flex-1 mx-6 bg-gradient-to-r from-stone-200 via-stone-300 to-transparent" />
        </motion.div>

        {/* Grid */}
        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
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

        {/* Empty state */}
        {filteredProfessionals.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-24 text-center"
          >
            <p className="font-serif text-2xl italic text-stone-300">No artisans found in this category.</p>
          </motion.div>
        )}
      </div>

      {/* Footer Marquee */}
      <div className="relative w-full overflow-hidden border-t border-stone-200 bg-stone-50/80 backdrop-blur-sm py-2.5 mt-20">
        {/* Gradient fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-stone-50 to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-stone-50 to-transparent z-10" />
        <div
          className="whitespace-nowrap animate-marquee font-mono text-[9px] uppercase tracking-[0.3em] text-stone-400"
          style={{ animationDirection: 'reverse' }}
        >
          Fashion Directory • Artisans • Designers • Tailors • Stylists • Curators •&nbsp;
          Fashion Directory • Artisans • Designers • Tailors • Stylists • Curators •&nbsp;
        </div>
      </div>

      {/* Bottom decorative section */}
      <div className="relative bg-stone-900 text-white py-16 overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
              backgroundSize: '32px 32px'
            }}
          />
        </div>
        
        <div className="relative max-w-[1600px] mx-auto px-6 md:px-12 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-stone-500 mb-4">Join the Community</p>
          <h2 className="font-serif text-3xl md:text-4xl font-medium mb-6">Become a Listed Professional</h2>
          <p className="text-stone-400 font-light max-w-md mx-auto mb-8">
            Showcase your craft to thousands of fashion enthusiasts and grow your business.
          </p>
          <Link 
            href="/register-as-professional" 
            className="inline-block px-8 py-3 bg-white text-stone-900 font-mono text-xs uppercase tracking-widest hover:bg-stone-100 transition-colors duration-200"
          >
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

export default Page;