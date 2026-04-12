'use client'
import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Star, Heart, BadgeCheck, Search, MapPin, 
  ChevronRight, RefreshCcw, SlidersHorizontal, X,
  Clock, Scissors, ArrowRight, Briefcase
} from 'lucide-react';
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
    professionalServices?: { price: number }[];
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

// --- Seller Card ---
function SellerCard({ professional, index }: { professional: Professional; index: number }) {
  const [liked, setLiked] = useState(false);

  const minPrice = professional.user.professionalServices?.length 
    ? Math.min(...professional.user.professionalServices.map(s => s.price)) 
    : null;

  const profileUrl = `/tz/${professional.slug || encodeURIComponent(professional.businessName.toLowerCase().replace(/\s+/g, '-'))}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.03, 0.3) }}
      className="group relative"
    >
      <Link href={profileUrl} className="block">
        {/* Image Container — fixed aspect ratio, same for everyone */}
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-stone-100">
          {professional.businessImage ? (
            <Image
              src={professional.businessImage}
              alt={professional.businessName}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-all duration-700 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-stone-100 to-stone-200 flex items-center justify-center">
              <span className="text-7xl font-serif text-stone-300/60 italic select-none">
                {professional.businessName.charAt(0)}
              </span>
            </div>
          )}

          {/* Top row: badges */}
          <div className="absolute top-3 left-3 right-3 flex items-start justify-between z-10">
            <div className="flex items-center gap-1.5">
              {professional.isVerified && (
                <span className="inline-flex items-center gap-1 bg-white/85 backdrop-blur-lg text-stone-900 px-2 py-0.5 rounded-full text-[9px] font-semibold tracking-wide shadow-sm">
                  <BadgeCheck size={11} className="text-blue-600" />
                  Verified
                </span>
              )}
            </div>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setLiked(!liked); }}
              className={`p-2 rounded-full backdrop-blur-lg shadow-sm transition-all duration-200 ${
                liked 
                  ? 'bg-rose-500 text-white' 
                  : 'bg-white/70 text-stone-500 hover:bg-white hover:text-rose-500'
              }`}
            >
              <Heart size={14} className={liked ? 'fill-white' : ''} />
            </button>
          </div>

          {/* Bottom gradient for text readability */}
          <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />

          {/* Bottom overlay info (always visible) */}
          <div className="absolute inset-x-0 bottom-0 p-4 z-10">
            <div className="flex items-end justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-medium text-white/70 uppercase tracking-widest mb-0.5 truncate">
                  {professional.specialization?.name || 'Seller'}
                </p>
                <h3 className="text-white font-semibold text-[15px] leading-snug truncate">
                  {professional.businessName}
                </h3>
              </div>
              <div className="shrink-0 flex items-center gap-1 bg-white/20 backdrop-blur-md rounded-full px-2 py-1">
                <Star size={10} className="fill-amber-400 text-amber-400" />
                <span className="text-white text-[11px] font-semibold">{professional.rating || '4.8'}</span>
              </div>
            </div>
          </div>
        </div>
      </Link>

      {/* Below-image info — clean, compact, always visible */}
      <div className="mt-3 px-1 space-y-1.5">
        <div className="flex items-center gap-1.5 text-stone-400">
          <MapPin size={11} className="shrink-0" />
          <span className="text-[11px] font-medium truncate">{professional.location || 'Online'}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-[11px] text-stone-400">
            <span className="flex items-center gap-1">
              <Clock size={10} />
              {professional.experience}y exp
            </span>
            {minPrice && (
              <>
                <span className="text-stone-200">•</span>
                <span className="font-semibold text-stone-600">From GHS {minPrice}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// --- Main Component ---
export default function TailorsClient({ initialProfessionals }: TailorsClientProps) {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSpecialization, setActiveSpecialization] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [minExperience, setMinExperience] = useState(0);
  const [isVerifiedOnly, setIsVerifiedOnly] = useState(false);

  // Fair shuffle on mount
  useEffect(() => {
    setProfessionals([...initialProfessionals].sort(() => Math.random() - 0.5));
  }, [initialProfessionals]);

  const shuffleGallery = () => {
    setProfessionals(prev => [...prev].sort(() => Math.random() - 0.5));
  };

  const specializations = useMemo(() => {
    return ['All', ...Array.from(new Set(
      initialProfessionals.map(p => p.specialization?.name || 'General').filter(Boolean)
    ))];
  }, [initialProfessionals]);

  const filtered = useMemo(() => {
    return professionals.filter(p => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || 
        p.businessName.toLowerCase().includes(q) ||
        p.user.firstName.toLowerCase().includes(q) ||
        p.user.lastName.toLowerCase().includes(q) ||
        (p.location || '').toLowerCase().includes(q);
      const matchesSpec = activeSpecialization === 'All' || (p.specialization?.name ?? 'General') === activeSpecialization;
      const matchesRating = (p.rating || 0) >= minRating;
      const matchesExp = p.experience >= minExperience;
      const matchesVerified = !isVerifiedOnly || p.isVerified;
      return matchesSearch && matchesSpec && matchesRating && matchesExp && matchesVerified;
    });
  }, [professionals, searchQuery, activeSpecialization, minRating, minExperience, isVerifiedOnly]);

  const activeFilterCount = [
    minRating > 0,
    minExperience > 0,
    isVerifiedOnly,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSearchQuery('');
    setActiveSpecialization('All');
    setMinRating(0);
    setMinExperience(0);
    setIsVerifiedOnly(false);
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">

      {/* ── Full-Page Animated Background ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Large floating circle — top right */}
        <motion.div
          animate={{ y: [0, -30, 0], x: [0, 15, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-20 -right-20 w-[400px] h-[400px] rounded-full border border-amber-100/40"
        />
        {/* Small floating circle — mid-left */}
        <motion.div
          animate={{ y: [0, 20, 0], x: [0, -10, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute top-[40%] -left-10 w-[200px] h-[200px] rounded-full border border-stone-200/30"
        />
        {/* Floating dot — center left */}
        <motion.div
          animate={{ y: [0, -40, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute top-[25%] left-[15%] w-2 h-2 rounded-full bg-amber-200/40"
        />
        {/* Floating dot — right of grid */}
        <motion.div
          animate={{ y: [0, 30, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
          className="absolute top-[55%] right-[10%] w-3 h-3 rounded-full bg-stone-200/50"
        />
        {/* Floating dot — bottom area */}
        <motion.div
          animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
          className="absolute top-[70%] left-[30%] w-1.5 h-1.5 rounded-full bg-amber-300/30"
        />
        {/* Floating cross/plus — top left */}
        <motion.div
          animate={{ rotate: [0, 90, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
          className="absolute top-[18%] right-[25%] text-stone-200/30 text-2xl font-light select-none"
        >
          +
        </motion.div>
        {/* Flowing wave SVG across the whole page */}
        <svg className="absolute top-[30%] left-0 w-full h-[300px] pointer-events-none" viewBox="0 0 1400 300" fill="none" preserveAspectRatio="none">
          <motion.path
            d="M0 150 Q350 80, 700 150 T1400 150"
            stroke="rgb(245 232 210)"
            strokeWidth="1"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.5 }}
            transition={{ duration: 3, ease: 'easeOut' }}
          />
          <motion.path
            d="M0 200 Q350 130, 700 200 T1400 200"
            stroke="rgb(231 222 210)"
            strokeWidth="0.8"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.35 }}
            transition={{ duration: 3.5, ease: 'easeOut', delay: 0.5 }}
          />
        </svg>
        {/* Another wave — lower */}
        <svg className="absolute top-[65%] left-0 w-full h-[200px] pointer-events-none" viewBox="0 0 1400 200" fill="none" preserveAspectRatio="none">
          <motion.path
            d="M0 100 Q250 40, 500 100 T1000 80 T1400 100"
            stroke="rgb(245 232 210)"
            strokeWidth="0.8"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.3 }}
            transition={{ duration: 4, ease: 'easeOut', delay: 1 }}
          />
        </svg>
      </div>

      {/* All content sits above the background */}
      <div className="relative z-10">

      {/* ── Hero Section ── */}
      <section className="relative bg-gradient-to-b from-amber-50/40 via-stone-50 to-white overflow-hidden">
        {/* Decorative squiggle lines */}
        <svg className="absolute top-0 right-0 w-[600px] h-[500px] text-amber-200/30 pointer-events-none" viewBox="0 0 600 500" fill="none">
          <path d="M200 0 C200 100, 400 100, 400 200 S200 300, 200 400 S400 500, 400 500" stroke="currentColor" strokeWidth="1.5" />
          <path d="M300 0 C300 80, 500 120, 500 200 S300 280, 300 400 S500 480, 500 500" stroke="currentColor" strokeWidth="1" />
          <path d="M100 0 C100 120, 350 80, 350 200 S100 320, 100 400" stroke="currentColor" strokeWidth="0.8" />
        </svg>
        <svg className="absolute bottom-0 left-0 w-[400px] h-[300px] text-stone-200/40 pointer-events-none" viewBox="0 0 400 300" fill="none">
          <path d="M0 150 Q100 50, 200 150 T400 150" stroke="currentColor" strokeWidth="1.5" />
          <path d="M0 200 Q100 100, 200 200 T400 200" stroke="currentColor" strokeWidth="1" />
          <circle cx="350" cy="80" r="60" stroke="currentColor" strokeWidth="0.8" />
        </svg>

        <div className="relative max-w-[1600px] mx-auto px-6 py-20 md:py-28">
          <div className="max-w-2xl space-y-6">
            <div className="flex items-center gap-3">
              <Scissors size={16} className="text-stone-400" />
              <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-[0.3em]">Tailors & Designers</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-semibold text-stone-900 leading-[1.1] tracking-tight">
              Find your perfect <br />
              <span className="text-amber-700/70 italic font-serif">seller</span>
            </h1>
            <p className="text-stone-500 text-base md:text-lg leading-relaxed max-w-lg">
              Browse our curated directory of verified tailors, designers, and fashion professionals. Every visit shows a fresh mix — everyone gets a fair spotlight.
            </p>

            {/* Stats strip */}
            <div className="flex items-center gap-8 pt-4">
              <div>
                <p className="text-2xl font-semibold text-stone-900">{initialProfessionals.length}</p>
                <p className="text-[10px] text-stone-400 uppercase tracking-widest font-medium">Professionals</p>
              </div>
              <div className="h-8 w-px bg-stone-200" />
              <div>
                <p className="text-2xl font-semibold text-stone-900">{specializations.length - 1}</p>
                <p className="text-[10px] text-stone-400 uppercase tracking-widest font-medium">Specializations</p>
              </div>
              <div className="h-8 w-px bg-stone-200" />
              <div>
                <p className="text-2xl font-semibold text-stone-900">24/7</p>
                <p className="text-[10px] text-stone-400 uppercase tracking-widest font-medium">Availability</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Search & Filter Bar (Normal flow, not sticky) ── */}
      <section className="border-b border-stone-100 bg-white">
        <div className="max-w-[1600px] mx-auto px-6">
          
          {/* Row 1: Search + Actions */}
          <div className="flex items-center gap-4 py-5">
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-300" size={16} />
              <input
                type="text"
                placeholder="Search name, craft, or city..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-stone-50 rounded-xl border border-stone-100 py-3 pl-10 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-stone-200 focus:border-transparent placeholder:text-stone-300"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-300 hover:text-stone-600 transition-colors">
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-semibold transition-all ${
                  showFilters || activeFilterCount > 0
                    ? 'bg-stone-900 text-white'
                    : 'bg-stone-50 text-stone-600 border border-stone-100 hover:bg-stone-100'
                }`}
              >
                <SlidersHorizontal size={14} />
                Filters
                {activeFilterCount > 0 && (
                  <span className="bg-white text-stone-900 text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{activeFilterCount}</span>
                )}
              </button>
              <button
                onClick={shuffleGallery}
                className="flex items-center gap-2 px-5 py-3 bg-stone-50 rounded-xl text-xs font-semibold text-stone-600 border border-stone-100 hover:bg-stone-100 transition-all"
                title="Shuffle order for fair discovery"
              >
                <RefreshCcw size={14} />
                <span className="hidden sm:inline">Shuffle</span>
              </button>
            </div>
          </div>

          {/* Row 2: Category pills */}
          <div className="flex items-center gap-2 pb-4 overflow-x-auto no-scrollbar">
            {specializations.map(spec => (
              <button
                key={spec}
                onClick={() => setActiveSpecialization(spec)}
                className={`text-[11px] font-semibold px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                  activeSpecialization === spec
                    ? 'bg-stone-900 text-white shadow-md'
                    : 'bg-stone-50 text-stone-500 hover:bg-stone-100 border border-stone-100'
                }`}
              >
                {spec}
              </button>
            ))}
          </div>
        </div>

        {/* Filter Drawer */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden border-t border-stone-100 bg-stone-50/50"
            >
              <div className="max-w-[1600px] mx-auto px-6 py-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                  
                  {/* Rating */}
                  <div className="space-y-2.5">
                    <label className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest">Min Rating</label>
                    <div className="flex gap-2">
                      {[0, 3, 4, 4.5].map(r => (
                        <button
                          key={r}
                          onClick={() => setMinRating(r)}
                          className={`flex-1 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                            minRating === r ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-500 border-stone-200 hover:border-stone-300'
                          }`}
                        >
                          {r === 0 ? 'Any' : `${r}+`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Experience */}
                  <div className="space-y-2.5">
                    <label className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest">Min Experience</label>
                    <div className="flex gap-2">
                      {[0, 2, 5, 10].map(e => (
                        <button
                          key={e}
                          onClick={() => setMinExperience(e)}
                          className={`flex-1 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                            minExperience === e ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-500 border-stone-200 hover:border-stone-300'
                          }`}
                        >
                          {e === 0 ? 'Any' : `${e}y+`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Verified */}
                  <div className="space-y-2.5">
                    <label className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest">Status</label>
                    <button
                      onClick={() => setIsVerifiedOnly(!isVerifiedOnly)}
                      className={`w-full py-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                        isVerifiedOnly ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-stone-500 border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <BadgeCheck size={14} />
                      Verified Only
                    </button>
                  </div>
                </div>

                {activeFilterCount > 0 && (
                  <button onClick={clearFilters} className="mt-4 text-[11px] font-semibold text-stone-400 underline underline-offset-4 hover:text-stone-700 transition-colors">
                    Clear all filters
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ── Results Count ── */}
      <div className="max-w-[1600px] mx-auto px-6 py-6 flex items-center justify-between">
        <p className="text-sm text-stone-400">
          Showing <span className="font-semibold text-stone-900">{filtered.length}</span> sellers
        </p>
      </div>

      {/* ── Grid ── */}
      <main className="max-w-[1600px] mx-auto px-6 pb-24">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-5 gap-y-10">
          <AnimatePresence mode="popLayout">
            {filtered.map((p, i) => (
              <SellerCard key={p.id} professional={p} index={i} />
            ))}
          </AnimatePresence>
        </div>

        {/* Empty State */}
        {filtered.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-32 flex flex-col items-center text-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-stone-50 flex items-center justify-center">
              <Search size={28} className="text-stone-200" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-stone-900 mb-1">No sellers found</h3>
              <p className="text-stone-400 text-sm max-w-xs mx-auto">Try adjusting your filters or search to discover more talent.</p>
            </div>
            <button onClick={clearFilters} className="px-6 py-3 bg-stone-900 text-white text-xs font-semibold rounded-xl hover:bg-stone-700 transition-colors">
              Reset All
            </button>
          </motion.div>
        )}
      </main>

      {/* ── Join as Professional CTA ── */}
      <section className="relative bg-gradient-to-b from-white via-amber-50/30 to-stone-50 overflow-hidden mt-12">
        {/* Decorative squiggle lines */}
        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" viewBox="0 0 1200 600" fill="none" preserveAspectRatio="none">
          <path d="M0 100 Q300 20, 600 100 T1200 100" stroke="rgb(214 204 189)" strokeWidth="1" opacity="0.4" />
          <path d="M0 200 Q300 120, 600 200 T1200 200" stroke="rgb(214 204 189)" strokeWidth="0.8" opacity="0.3" />
          <path d="M0 400 Q250 320, 500 400 T1000 350" stroke="rgb(214 204 189)" strokeWidth="1" opacity="0.35" />
          <circle cx="1050" cy="120" r="80" stroke="rgb(214 204 189)" strokeWidth="0.8" opacity="0.2" />
          <circle cx="100" cy="450" r="50" stroke="rgb(214 204 189)" strokeWidth="0.8" opacity="0.2" />
          <path d="M800 0 C820 150, 900 200, 880 350 S820 500, 850 600" stroke="rgb(214 204 189)" strokeWidth="0.8" opacity="0.25" />
        </svg>
        
        <div className="relative max-w-[1600px] mx-auto px-6">
          <div className="py-24 md:py-32 flex flex-col lg:flex-row items-center justify-between gap-16">
            
            {/* Left Content */}
            <div className="max-w-xl space-y-8 text-center lg:text-left">
              <div className="space-y-5">
                <div className="inline-flex items-center gap-2 bg-amber-100/50 border border-amber-200/50 px-4 py-2 rounded-full">
                  <Briefcase size={14} className="text-amber-600" />
                  <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-[0.2em]">For Professionals</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-semibold text-stone-900 leading-[1.1] tracking-tight">
                  Showcase your craft <br />
                  <span className="text-amber-700/70 italic font-serif">to the world</span>
                </h2>
                <p className="text-stone-500 text-base md:text-lg leading-relaxed">
                  Join our growing community of verified tailors and designers. Get discovered by clients who value quality craftsmanship and unique style.
                </p>
              </div>

              {/* Benefits */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                {[
                  { title: 'Free profile listing', desc: 'Create your professional portfolio at no cost' },
                  { title: 'Client inquiries', desc: 'Receive direct messages from interested clients' },
                  { title: 'Verified badge', desc: 'Build trust with a verified professional status' },
                  { title: 'Fair exposure', desc: 'Our shuffle system gives everyone equal visibility' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-3 p-4 rounded-2xl bg-white/80 border border-stone-100 shadow-sm">
                    <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                      <ChevronRight size={12} className="text-amber-600" />
                    </div>
                    <div>
                      <p className="text-stone-900 text-sm font-semibold">{item.title}</p>
                      <p className="text-stone-400 text-xs mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                <Link 
                  href="/register-as-professional"
                  className="inline-flex items-center gap-3 bg-stone-900 text-white px-8 py-4 rounded-xl font-semibold text-sm hover:bg-stone-800 transition-all group shadow-lg"
                >
                  Join as a Professional 
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </Link>
                <span className="text-stone-400 text-xs">Free to join • No hidden fees</span>
              </div>
            </div>

            {/* Right Visual — Stacked Cards */}
            <div className="hidden lg:block relative w-[400px] h-[500px]">
              {/* Decorative stacked cards */}
              <div className="absolute top-8 left-8 w-72 h-96 rounded-3xl bg-stone-100/60 border border-stone-200/50 -rotate-6" />
              <div className="absolute top-4 left-4 w-72 h-96 rounded-3xl bg-amber-50/60 border border-amber-200/40 -rotate-3" />
              <div className="absolute top-0 left-0 w-72 h-96 rounded-3xl bg-white border border-stone-200/60 shadow-xl overflow-hidden flex flex-col items-center justify-center p-8 text-center space-y-6">
                <div className="w-20 h-20 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center">
                  <Scissors size={28} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-stone-900 font-semibold text-lg">Your Profile</p>
                  <p className="text-stone-400 text-xs mt-1">Could be featured here</p>
                </div>
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} size={14} className="fill-amber-300 text-amber-300" />
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      </div>{/* end z-10 content wrapper */}

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
