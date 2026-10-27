"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Crown, Medal, Award } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

// ... (Types and Interfaces remain identical to keep logic consistent)
type TopSeller = {
  id: string;
  rank: number;
  name: string;
  profession: string;
  imageUrl: string;
  color: string;
  totalSales: number;
  slug: string;
};

interface RawProfessionalProfile {
  id: string;
  businessName?: string | null;
  businessImage?: string | null;
  actualSales?: number | null;
  completedOrders?: number | null;
  rating?: number | null;
  slug?: string | null;
  specialization?: { name: string; } | null;
  user?: { firstName: string; lastName: string; profileImage?: string | null; } | null;
}

function SellerRow({ seller, index }: { seller: TopSeller; index: number }) {
  const RankBadge = () => {
    if (seller.rank === 1) {
      return (
        <span className="w-6 h-6 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 shrink-0 shadow-2xs">
          <Crown size={12} />
        </span>
      );
    }
    if (seller.rank === 2) {
      return (
        <span className="w-6 h-6 rounded-full bg-stone-200 border border-stone-300 flex items-center justify-center text-stone-700 shrink-0">
          <Medal size={12} />
        </span>
      );
    }
    if (seller.rank === 3) {
      return (
        <span className="w-6 h-6 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
          <Award size={12} />
        </span>
      );
    }
    return (
      <span className="w-6 h-6 rounded-full bg-stone-100 flex items-center justify-center text-[11px] font-mono font-semibold text-stone-500 shrink-0">
        {seller.rank}
      </span>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
      className="group flex items-center gap-3 sm:gap-5 py-3 sm:py-3.5 px-3 sm:px-4 rounded-xl hover:bg-white hover:shadow-xs transition-all duration-200 border-b border-stone-100 last:border-0"
    >
      {/* Rank Column */}
      <div className="w-6 flex items-center justify-center shrink-0">
        <RankBadge />
      </div>

      {/* Profile Image */}
      <Link href={`/tz/${seller.slug}`} className="relative w-10 h-10 sm:w-11 sm:h-11 shrink-0">
        <div className="w-full h-full rounded-full border border-stone-200 group-hover:border-stone-900 transition-colors overflow-hidden bg-stone-100 shadow-2xs">
          <Image
            src={seller.imageUrl}
            alt={seller.name}
            width={48}
            height={48}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      </Link>

      {/* Seller Info */}
      <div className="flex-1 min-w-0">
        <Link href={`/tz/${seller.slug}`} className="block">
          <h3 className="text-xs sm:text-sm font-semibold text-stone-900 group-hover:text-stone-700 truncate transition-colors">
            {seller.name}
          </h3>
        </Link>
        <p className="text-[11px] text-stone-500 font-sans truncate mt-0.5">
          {seller.profession}
        </p>
      </div>

      {/* Sales Column */}
      <div className="text-right shrink-0 flex items-center gap-2">
        <div>
          <div className="text-xs sm:text-sm font-semibold text-stone-900 font-mono">
            {seller.totalSales.toLocaleString()}
          </div>
          <span className="text-[10px] text-stone-400 font-sans block leading-tight">
            {seller.totalSales === 1 ? 'sale' : 'sales'}
          </span>
        </div>
        <Link
          href={`/tz/${seller.slug}`}
          className="p-1 rounded-full text-stone-300 group-hover:text-stone-900 group-hover:bg-stone-100 transition-all ml-1"
          aria-label={`View ${seller.name}'s profile`}
        >
          <ArrowUpRight size={14} />
        </Link>
      </div>
    </motion.div>
  );
}

function TopSellers({ initialSellers }: { initialSellers?: RawProfessionalProfile[] }) {
  const [topSellers, setTopSellers] = useState<TopSeller[]>([]);
  const [loading, setLoading] = useState(true);

  const transformSellers = useCallback((data: RawProfessionalProfile[]) => {
    const gradients = ['from-emerald-400 to-teal-600', 'from-pink-400 to-rose-600', 'from-purple-400 to-indigo-600', 'from-orange-400 to-red-600'];
    const sorted = data.slice().sort((a, b) => {
      const aSales = a.actualSales ?? a.completedOrders ?? 0;
      const bSales = b.actualSales ?? b.completedOrders ?? 0;
      if (bSales !== aSales) return bSales - aSales;
      return (b.rating ?? 0) - (a.rating ?? 0);
    }).slice(0, 4);

    return sorted.map((prof, index) => ({
      id: prof.id,
      rank: index + 1,
      name: prof.businessName || `${prof.user?.firstName} ${prof.user?.lastName}`,
      profession: prof.specialization?.name || 'Fashion Professional',
      imageUrl: prof.businessImage || prof.user?.profileImage || 'https://images.pexels.com/photos/3760854/pexels-photo-3760854.jpeg',
      color: gradients[index % gradients.length],
      totalSales: prof.actualSales ?? prof.completedOrders ?? 0,
      slug: prof.slug || prof.id,
    }));
  }, []);

  useEffect(() => {
    if (initialSellers && initialSellers.length > 0) {
      setTopSellers(transformSellers(initialSellers));
      setLoading(false);
      return;
    }
    const fetchTopSellers = async () => {
      try {
        const response = await fetch('/api/professional-profiles?public=true');
        if (response.ok) {
          const data = await response.json();
          setTopSellers(transformSellers(data));
        }
      } catch (error) { console.error(error); } finally { setLoading(false); }
    };
    fetchTopSellers();
  }, [initialSellers, transformSellers]);

  return (
    <div className="bg-[#FAFAF9] py-12 lg:py-16 px-4 sm:px-6 lg:px-8 border-t border-stone-200/70">
      <div className="max-w-3xl mx-auto">

        {/* Clean Editorial Header */}
        <header className="mb-6 sm:mb-8 pb-4 border-b border-stone-200/80 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <span className="font-mono text-[10px] sm:text-xs uppercase tracking-[0.2em] text-stone-400 mb-1 block">
              Leaderboard
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif text-stone-900 tracking-tight">
              Top Sellers
            </h2>
          </div>
          <Link
            href="/top-sellers"
            className="inline-flex items-center gap-1 text-xs font-medium text-stone-600 hover:text-stone-900 transition-colors"
          >
            <span>Full Leaderboard</span>
            <ArrowUpRight size={13} />
          </Link>
        </header>

        {/* List Container */}
        <div className="bg-white/60 sm:bg-white rounded-2xl border border-stone-200/80 p-1 sm:p-2 shadow-xs">
          {loading && (
            <div className="divide-y divide-stone-100">
              {[...Array(4)].map((_, idx) => (
                <div key={idx} className="flex items-center gap-3 sm:gap-5 py-3 sm:py-3.5 px-3 sm:px-4">
                  {/* Rank circle skeleton */}
                  <Skeleton className="w-6 h-6 rounded-full bg-stone-200/80 shrink-0" />
                  {/* Avatar skeleton */}
                  <Skeleton className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-stone-200/80 shrink-0" />
                  {/* Name and profession skeletons */}
                  <div className="flex-1 space-y-1.5 min-w-0">
                    <Skeleton className="h-4 w-32 bg-stone-200/80 rounded" />
                    <Skeleton className="h-3 w-20 bg-stone-200/50 rounded" />
                  </div>
                  {/* Sales column skeleton */}
                  <div className="space-y-1 text-right">
                    <Skeleton className="h-4 w-12 bg-stone-200/70 rounded ml-auto" />
                    <Skeleton className="h-2.5 w-8 bg-stone-200/40 rounded ml-auto" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && topSellers.length === 0 && (
            <div className="py-8 text-center text-xs font-sans text-stone-400">
              No top sellers recorded yet.
            </div>
          )}

          {!loading &&
            topSellers.map((seller, index) => (
              <SellerRow key={seller.id} seller={seller} index={index} />
            ))}
        </div>

        {/* Footer CTA */}
        <div className="mt-6 text-center">
          <Link 
            href="/top-sellers"
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full border border-stone-300 hover:border-stone-900 bg-white hover:bg-stone-900 text-stone-800 hover:text-white text-xs font-semibold transition-all duration-200 shadow-2xs"
          >
            <span>See All Rankings</span>
            <ArrowUpRight size={12} />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default TopSellers;