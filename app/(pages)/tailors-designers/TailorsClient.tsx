'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, Search, X, SlidersHorizontal,
  ArrowRight, Check, ChevronDown, RefreshCw, MapPin, Star
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// --- Types ---
interface Professional {
  id: string;
  businessName: string;
  businessImage?: string | null;
  coverImage?: string | null;
  experience: number;
  bio?: string | null;
  location?: string | null;
  rating?: number | null;
  totalReviews?: number | null;
  completedOrders?: number;
  slug?: string | null;
  isVerified?: boolean;
  galleryImages?: string[];
  portfolioCollections?: {
    id: string;
    name: string;
    coverImage?: string | null;
    images: string[];
  }[];
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

type SortOption = 'default' | 'rating-desc' | 'experience-desc' | 'orders-desc' | 'price-asc' | 'price-desc';

const POPULAR_QUICK_LINKS = [
  'Tailors', 'Fashion Designers', 'Bridal', 'Menswear', 'Womenswear', 'Alterations'
];

const ARTISAN_GRADIENTS = [
  'from-stone-900 via-amber-950 to-stone-900',
  'from-neutral-900 via-rose-950 to-zinc-900',
  'from-slate-900 via-emerald-950 to-neutral-950',
  'from-zinc-900 via-indigo-950 to-stone-900',
  'from-stone-900 via-amber-900/60 to-zinc-900',
  'from-neutral-900 via-teal-950 to-slate-900',
];

function getArtisanGradient(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  return ARTISAN_GRADIENTS[Math.abs(hash) % ARTISAN_GRADIENTS.length];
}

// --- 1. Tailor & Designer Card ---
function CreativeDesignerCard({ professional, index }: { professional: Professional; index: number }) {
  const [liked, setLiked] = useState(false);

  const minPrice = professional.user.professionalServices?.length
    ? Math.min(...professional.user.professionalServices.map(s => s.price))
    : null;

  const profileUrl = `/tz/${professional.slug || encodeURIComponent(professional.businessName.toLowerCase().replace(/\s+/g, '-'))}`;

  // Priority for cover image: professional.coverImage -> portfolio collection cover -> portfolio image -> gallery image
  const coverImage = professional.coverImage ||
    professional.portfolioCollections?.[0]?.coverImage ||
    professional.portfolioCollections?.[0]?.images?.[0] ||
    professional.galleryImages?.[0] || null;

  // Priority for avatar: user.profileImage -> professional.businessImage
  const avatarImage = professional.user.profileImage || professional.businessImage || null;

  const rawSpec = professional.specialization?.name?.trim();
  const specializationName = (!rawSpec || rawSpec.toLowerCase() === 'seller' || rawSpec.toLowerCase() === 'general')
    ? 'Fashion Designer'
    : rawSpec;

  const locationCity = professional.location?.split(',')?.[0]?.trim() || 'Ghana';

  return (
    <motion.article
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.02, 0.15) }}
      className="group flex flex-col bg-white rounded-2xl border border-gray-200/80 overflow-hidden hover:shadow-xl hover:shadow-gray-200/50 hover:border-gray-300 transition-all duration-300"
    >
      {/* 1. Compact Cover Banner */}
      <div className="relative h-28 sm:h-32 w-full overflow-hidden bg-gray-100">
        <Link href={profileUrl} className="block relative w-full h-full">
          {coverImage ? (
            <Image
              src={coverImage}
              alt={professional.businessName}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />
          ) : (
            <div className={cn("w-full h-full bg-gradient-to-br flex items-center justify-center relative overflow-hidden", getArtisanGradient(professional.id))}>
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px]" />
              <span className="text-white/30 text-2xl font-serif tracking-widest uppercase">
                {professional.businessName.substring(0, 2)}
              </span>
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
        </Link>

        {/* Floating Specialization Pill & Like button */}
        <div className="absolute top-2 inset-x-2 flex items-center justify-between pointer-events-none z-10">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-md text-white text-[10px] font-medium border border-white/15 pointer-events-auto">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="truncate max-w-[95px]">{specializationName}</span>
          </span>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setLiked(!liked);
            }}
            className="p-1.5 rounded-full bg-black/40 backdrop-blur-md hover:bg-white text-white hover:text-rose-500 transition-all border border-white/15 pointer-events-auto"
            aria-label="Save designer"
          >
            <Heart size={13} className={cn(liked && "fill-rose-500 text-rose-500")} />
          </button>
        </div>
      </div>

      {/* 2. Compact Body with Overlapping Avatar */}
      <Link href={profileUrl} className="flex flex-col flex-1 p-3.5 pt-0">
        
        {/* Avatar & Rating Row */}
        <div className="flex items-end justify-between -mt-7 mb-2 relative z-10">
          <div className="relative block shrink-0">
            <div className="w-14 h-14 rounded-xl overflow-hidden bg-white p-1 shadow-md border border-gray-100 group-hover:scale-105 transition-transform duration-300">
              <div className="w-full h-full rounded-lg overflow-hidden bg-gray-100 relative">
                {avatarImage ? (
                  <Image
                    src={avatarImage}
                    alt={professional.businessName}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-amber-50 flex items-center justify-center text-amber-800 font-bold text-sm font-serif">
                    {professional.businessName.substring(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
            </div>

            {/* Verified Badge */}
            {professional.isVerified && (
              <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-0.5 rounded-full border-2 border-white shadow-sm" title="Verified">
                <Check size={9} className="stroke-[3]" />
              </div>
            )}
          </div>

          {/* Rating Pill */}
          {professional.rating ? (
            <div className="flex items-center gap-1 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-full text-[11px] font-semibold text-amber-900">
              <Star size={11} className="fill-amber-400 text-amber-400" />
              <span>{Number(professional.rating).toFixed(1)}</span>
            </div>
          ) : professional.completedOrders ? (
            <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              {professional.completedOrders} orders
            </span>
          ) : null}
        </div>

        {/* Business Name */}
        <h3 className="font-bold text-gray-900 text-sm truncate group-hover:text-amber-700 transition-colors mb-0.5">
          {professional.businessName}
        </h3>

        {/* Location & Specialty */}
        <p className="text-[11px] text-gray-500 truncate flex items-center gap-1 mb-3">
          <MapPin size={11} className="text-gray-400 shrink-0" />
          <span className="truncate">{locationCity}</span>
          {professional.experience > 0 && (
            <>
              <span className="text-gray-300">•</span>
              <span className="shrink-0">{professional.experience}y exp</span>
            </>
          )}
        </p>

        {/* Footer: Starting Price & Quick View */}
        <div className="mt-auto pt-2.5 border-t border-gray-100 flex items-center justify-between text-xs">
          <span className="font-semibold text-gray-900">
            {minPrice ? `From GHS ${minPrice}` : 'Custom fit'}
          </span>
          <span className="text-[11px] font-medium text-gray-400 group-hover:text-gray-900 flex items-center gap-0.5 transition-colors">
            <span>Explore</span>
            <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>

      </Link>
    </motion.article>
  );
}

// --- 2. Main Component ---
export default function TailorsClient({ initialProfessionals }: TailorsClientProps) {
  // Logic & State (Unchanged)
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSpecialization, setActiveSpecialization] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [minExperience, setMinExperience] = useState(0);
  const [isVerifiedOnly, setIsVerifiedOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [isShuffling, setIsShuffling] = useState(false);

  const discoverySectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setProfessionals([...initialProfessionals].sort(() => Math.random() - 0.5));
  }, [initialProfessionals]);

  const handleShuffle = () => {
    setIsShuffling(true);
    setProfessionals(prev => [...prev].sort(() => Math.random() - 0.5));
    setTimeout(() => setIsShuffling(false), 500);
  };

  const specializations = useMemo(() => {
    const raw = initialProfessionals.map(p => p.specialization?.name?.trim()).filter(Boolean) as string[];
    return ['All', ...Array.from(new Set(raw))];
  }, [initialProfessionals]);

  const filtered = useMemo(() => {
    const list = professionals.filter(p => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        p.businessName.toLowerCase().includes(q) ||
        p.user.firstName.toLowerCase().includes(q) ||
        p.user.lastName.toLowerCase().includes(q) ||
        (p.location || '').toLowerCase().includes(q) ||
        (p.specialization?.name || '').toLowerCase().includes(q);

      const matchesSpec = activeSpecialization === 'All' ||
        (p.specialization?.name ?? 'General').toLowerCase() === activeSpecialization.toLowerCase();

      const matchesRating = (p.rating || 0) >= minRating;
      const matchesExp = p.experience >= minExperience;
      const matchesVerified = !isVerifiedOnly || p.isVerified;

      const minServicePrice = p.user.professionalServices?.length
        ? Math.min(...p.user.professionalServices.map(s => s.price))
        : null;
      const matchesPrice = !maxPrice || (minServicePrice !== null && minServicePrice <= maxPrice);

      return matchesSearch && matchesSpec && matchesRating && matchesExp && matchesVerified && matchesPrice;
    });

    if (sortBy === 'rating-desc') return [...list].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    if (sortBy === 'experience-desc') return [...list].sort((a, b) => b.experience - a.experience);
    if (sortBy === 'orders-desc') return [...list].sort((a, b) => (b.completedOrders || 0) - (a.completedOrders || 0));
    if (sortBy === 'price-asc') return [...list].sort((a, b) => {
      const minA = a.user.professionalServices?.length ? Math.min(...a.user.professionalServices.map(s => s.price)) : Infinity;
      const minB = b.user.professionalServices?.length ? Math.min(...b.user.professionalServices.map(s => s.price)) : Infinity;
      return minA - minB;
    });
    if (sortBy === 'price-desc') return [...list].sort((a, b) => {
      const minA = a.user.professionalServices?.length ? Math.min(...a.user.professionalServices.map(s => s.price)) : 0;
      const minB = b.user.professionalServices?.length ? Math.min(...b.user.professionalServices.map(s => s.price)) : 0;
      return minB - minA;
    });

    return list;
  }, [professionals, searchQuery, activeSpecialization, minRating, minExperience, isVerifiedOnly, maxPrice, sortBy]);

  const activeFilterCount = [minRating > 0, minExperience > 0, isVerifiedOnly, maxPrice !== null].filter(Boolean).length;

  const clearFilters = () => {
    setSearchQuery('');
    setActiveSpecialization('All');
    setMinRating(0);
    setMinExperience(0);
    setIsVerifiedOnly(false);
    setMaxPrice(null);
    setSortBy('default');
  };

  const handleHeroQuickLink = (linkText: string) => {
    const foundSpec = specializations.find(s => s.toLowerCase() === linkText.toLowerCase());
    if (foundSpec) {
      setActiveSpecialization(foundSpec);
      setSearchQuery('');
    } else {
      setSearchQuery(linkText);
      setActiveSpecialization('All');
    }
    discoverySectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden">

      {/* ── 1. MODERN COMPACT HERO ── */}
      <section className="bg-white border-b border-gray-200 pt-24 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 mb-3">
            Find the perfect creative for your style.
          </h1>
          <p className="text-sm sm:text-base text-gray-500 mb-8 max-w-xl">
            Browse verified tailors, designers, and creative studios. Book directly and elevate your wardrobe.
          </p>

          <div className="w-full max-w-2xl relative">
            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-full focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all shadow-sm overflow-hidden p-1.5">
              <div className="pl-4 pr-2 text-gray-400">
                <Search size={18} />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by name, style, or location..."
                className="w-full bg-transparent border-none focus:outline-none text-sm text-gray-900 placeholder-gray-400 py-2"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="p-2 text-gray-400 hover:text-gray-700 transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
              <span className="text-xs text-gray-400 font-medium mr-1">Trending:</span>
              {POPULAR_QUICK_LINKS.map((link) => (
                <button
                  key={link}
                  type="button"
                  onClick={() => handleHeroQuickLink(link)}
                  className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-colors font-medium"
                >
                  {link}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. DENSE MARKETPLACE DISCOVERY ── */}
      <section ref={discoverySectionRef} className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Nav & Controls Row */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">

          {/* Category Tabs (Pill Style) */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full md:w-auto pb-2 md:pb-0">
            {specializations.map((spec) => {
              const isActive = activeSpecialization.toLowerCase() === spec.toLowerCase();
              return (
                <button
                  key={spec}
                  type="button"
                  onClick={() => setActiveSpecialization(spec)}
                  className={cn(
                    "whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors border",
                    isActive
                      ? "bg-gray-900 text-white border-gray-900 shadow-sm"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  )}
                >
                  {spec}
                </button>
              );
            })}
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end shrink-0">
            <span className="text-xs text-gray-500 font-medium md:mr-2">
              {filtered.length} Results
            </span>

            <div className="flex items-center gap-2">
              {/* Filter Button */}
              <button
                type="button"
                onClick={() => setShowFilters(true)}
                className={cn(
                  "inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors",
                  showFilters || activeFilterCount > 0
                    ? "bg-gray-100 text-gray-900 border-gray-300"
                    : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                )}
              >
                <SlidersHorizontal size={14} />
                <span className="hidden sm:inline">Filters</span>
                {activeFilterCount > 0 && (
                  <span className="w-5 h-5 rounded-md bg-gray-900 text-white text-[10px] flex items-center justify-center ml-1">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {/* Sort Dropdown */}
              <div className="relative inline-flex items-center bg-white border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors cursor-pointer">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="bg-transparent text-sm font-medium text-gray-700 focus:outline-none cursor-pointer pr-4 appearance-none z-10 w-full"
                >
                  <option value="default">Recommended</option>
                  <option value="rating-desc">Top Rated</option>
                  <option value="experience-desc">Most Experience</option>
                  <option value="orders-desc">Most Orders</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 text-gray-400 pointer-events-none" />
              </div>

              <button
                type="button"
                onClick={handleShuffle}
                className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition-colors"
                title="Shuffle results"
              >
                <RefreshCw size={14} className={cn("transition-transform duration-500", isShuffling && "rotate-180")} />
              </button>
            </div>
          </div>
        </div>

        {/* ── 3. FEATURED TAILORS & DESIGNERS ── */}
        <main>
          {filtered.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3.5 sm:gap-4.5">
              <AnimatePresence mode="popLayout">
                {filtered.map((professional, index) => (
                  <CreativeDesignerCard
                    key={professional.id}
                    professional={professional}
                    index={index}
                  />
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white border border-gray-200 rounded-2xl border-dashed mt-8">
              <div className="bg-gray-100 p-4 rounded-full text-gray-400 mb-4">
                <Search size={24} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">No professionals found</h3>
              <p className="text-sm text-gray-500 max-w-sm mb-6">
                We couldn't find any designers matching your current filters. Try tweaking your search or resetting filters.
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="px-5 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                Clear all filters
              </button>
            </div>
          )}
        </main>

        {/* ── 4. SLIM REGISTRATION BANNER ── */}
        <section className="mt-16 mb-8">
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-gray-900/10">
            <div className="text-left text-white max-w-2xl">
              <h2 className="text-xl sm:text-2xl font-bold mb-2">Are you a fashion professional?</h2>
              <p className="text-sm text-gray-300">
                Join our marketplace, manage bookings, showcase your portfolio, and reach new clients looking for your exact style.
              </p>
            </div>
            <Link
              href="/register-as-professional"
              className="shrink-0 whitespace-nowrap inline-flex items-center gap-2 bg-white text-gray-900 px-6 py-3 rounded-xl text-sm font-semibold hover:bg-gray-100 hover:scale-105 transition-all duration-200"
            >
              List your studio
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>

      </section>

      {/* ── 5. CLEAN MARKETPLACE FILTER DRAWER ── */}
      <AnimatePresence>
        {showFilters && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFilters(false)}
              className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50"
            />

            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-white z-50 shadow-2xl flex flex-col"
            >
              <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-white">
                <h3 className="font-semibold text-lg text-gray-900">Filters</h3>
                <button
                  onClick={() => setShowFilters(false)}
                  className="p-2 bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-900 rounded-full transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">

                {/* Rating */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-900">Minimum Rating</h4>
                  <div className="flex flex-wrap gap-2">
                    {[0, 3, 4, 4.5].map((r) => (
                      <button
                        key={r}
                        onClick={() => setMinRating(r)}
                        className={cn(
                          "px-4 py-2 rounded-lg text-sm font-medium border transition-colors flex items-center gap-1",
                          minRating === r
                            ? "bg-gray-900 text-white border-gray-900"
                            : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                        )}
                      >
                        {r === 0 ? 'Any' : <>{r} <Star size={12} className={minRating === r ? "fill-white text-white" : "fill-amber-400 text-amber-400"} /></>}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Experience */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-900">Years of Experience</h4>
                  <div className="flex flex-wrap gap-2">
                    {[0, 2, 5, 10].map((e) => (
                      <button
                        key={e}
                        onClick={() => setMinExperience(e)}
                        className={cn(
                          "px-4 py-2 rounded-lg text-sm font-medium border transition-colors",
                          minExperience === e
                            ? "bg-gray-900 text-white border-gray-900"
                            : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                        )}
                      >
                        {e === 0 ? 'Any' : `${e}+ Years`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-900">Starting Price Limit</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Any', val: null },
                      { label: '< GHS 300', val: 300 },
                      { label: '< GHS 500', val: 500 },
                      { label: '< GHS 1000', val: 1000 },
                    ].map((p) => (
                      <button
                        key={p.label}
                        onClick={() => setMaxPrice(p.val)}
                        className={cn(
                          "px-3 py-2 rounded-lg text-sm font-medium border transition-colors text-center",
                          maxPrice === p.val
                            ? "bg-gray-900 text-white border-gray-900"
                            : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                        )}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Verification */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">Verified Only</h4>
                    <p className="text-xs text-gray-500 mt-0.5">Show ID-verified creators</p>
                  </div>
                  <button
                    onClick={() => setIsVerifiedOnly(!isVerifiedOnly)}
                    className={cn(
                      "w-12 h-6 rounded-full transition-colors relative p-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900",
                      isVerifiedOnly ? "bg-green-500" : "bg-gray-300"
                    )}
                  >
                    <div className={cn(
                      "w-4 h-4 rounded-full bg-white transition-transform shadow-sm",
                      isVerifiedOnly ? "translate-x-6" : "translate-x-0"
                    )} />
                  </button>
                </div>
              </div>

              <div className="p-5 border-t border-gray-100 bg-white grid grid-cols-2 gap-3">
                <button
                  onClick={clearFilters}
                  className="px-4 py-3 rounded-xl text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Reset
                </button>
                <button
                  onClick={() => setShowFilters(false)}
                  className="px-4 py-3 rounded-xl text-sm font-semibold text-white bg-gray-900 hover:bg-gray-800 transition-colors shadow-sm"
                >
                  Show Results
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
