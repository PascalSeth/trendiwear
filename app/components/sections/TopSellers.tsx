"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Crown, Medal, Award } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

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
  const RankIcon = () => {
    if (seller.rank === 1) return <Crown className="w-4 h-4 md:w-5 md:h-5 text-amber-600" />;
    if (seller.rank === 2) return <Medal className="w-4 h-4 md:w-5 md:h-5 text-stone-400" />;
    if (seller.rank === 3) return <Award className="w-4 h-4 md:w-5 md:h-5 text-amber-700" />;
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group relative flex items-center gap-3 md:gap-8 py-6 md:py-8 border-b border-stone-200 last:border-0 hover:bg-stone-50/50 transition-colors duration-500 cursor-pointer overflow-hidden"
    >
      {/* Large Background Rank Number (Editorial Watermark) */}
      <div className="absolute -left-2 md:-left-6 -top-2 md:-top-4 text-[5rem] md:text-[8rem] font-serif font-bold text-stone-100/80 leading-none opacity-40 md:opacity-0 group-hover:opacity-100 transition-opacity duration-700 select-none pointer-events-none z-0">
        0{seller.rank}
      </div>

      {/* Rank Column */}
      <div className="w-8 md:w-12 text-center relative z-10 flex-shrink-0">
        <div className="flex flex-col items-center gap-1">
          {RankIcon()}
          <span className="font-mono text-[10px] md:text-xs font-bold text-stone-400 group-hover:text-stone-900 transition-colors">
            #{seller.rank}
          </span>
        </div>
      </div>

      {/* Profile Image */}
      <Link href={`/tz/${seller.slug}`} className="relative w-12 h-12 md:w-16 md:h-16 flex-shrink-0 z-20">
        <div className="w-full h-full rounded-full border border-stone-200 group-hover:border-stone-900 transition-colors overflow-hidden bg-stone-100">
          <Image
            src={seller.imageUrl}
            alt={seller.name}
            width={64}
            height={64}
            className="w-full h-full object-cover grayscale md:grayscale group-hover:grayscale-0 transition-all duration-500"
          />
        </div>
      </Link>

      {/* Seller Info */}
      <div className="flex-1 min-w-0 z-20">
        <Link href={`/tz/${seller.slug}`}>
          <h3 className="text-base md:text-xl font-serif text-stone-900 group-hover:italic transition-all duration-300 truncate">
            {seller.name}
          </h3>
        </Link>
        <p className="text-[9px] md:text-xs font-mono uppercase tracking-[0.15em] text-stone-500 mt-0.5 truncate">
          {seller.profession}
        </p>
      </div>

      {/* Stats Column */}
      <div className="text-right relative z-10 flex-shrink-0 ml-auto pr-2 md:pr-0">
        <div className="text-lg md:text-2xl font-serif font-medium text-stone-900 group-hover:translate-x-[-4px] md:group-hover:translate-x-1 transition-transform duration-300">
          {seller.totalSales.toLocaleString()}
        </div>
        <div className="flex items-center justify-end gap-1 md:gap-2 md:opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="text-[8px] md:text-xs font-mono text-stone-500 uppercase tracking-widest">Sales</span>
          <ArrowUpRight size={10} className="text-stone-900 hidden md:block" />
        </div>
      </div>
    </motion.div>
  );
}

function TopSellers({ initialSellers }: { initialSellers?: RawProfessionalProfile[] }) {
  const [topSellers, setTopSellers] = useState<TopSeller[]>([]);
  const [loading, setLoading] = useState(true);

  // ... (Logic remains identical to keep functionality)
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
    <div className="min-h-screen bg-[#FAFAF9] py-12 md:py-24 px-4 md:px-12 overflow-x-hidden">
      <div className="max-w-4xl mx-auto">

        {/* Editorial Header */}
        <header className="mb-10 md:mb-16 border-b border-stone-200 pb-6 md:pb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-2 md:gap-4">
            <div>
              <span className="font-mono text-[10px] md:text-xs uppercase tracking-[0.2em] text-stone-400 mb-1 md:mb-2 block">
                Seasonal Performance
              </span>
              <h2 className="text-4xl md:text-7xl font-serif font-medium text-stone-900 leading-tight">
                Top Sellers
              </h2>
            </div>
            <div className="text-left md:text-right">
              <p className="font-serif text-stone-500 italic text-sm md:text-lg max-w-[240px] md:max-w-xs leading-relaxed">
                The leading voices defining this season&apos;s trends.
              </p>
            </div>
          </div>
        </header>

        {/* List Container */}
        <div className="relative">
          {/* Subtle decorative line - Hidden on mobile for cleaner look */}
          <div className="absolute left-[3.5rem] top-0 bottom-0 w-px bg-stone-200 hidden md:block"></div>

          <div className="divide-y divide-stone-100 md:divide-none">
            {loading && (
              <div className="py-8 text-[10px] md:text-sm font-mono text-stone-400 tracking-widest uppercase animate-pulse">
                Loading top sellers...
              </div>
            )}

            {!loading && topSellers.length === 0 && (
              <div className="py-8 text-[10px] md:text-sm font-mono text-stone-400 tracking-widest uppercase">
                No records found.
              </div>
            )}

            {!loading &&
              topSellers.map((seller, index) => (
                <SellerRow key={seller.id} seller={seller} index={index} />
              ))}
          </div>
        </div>

        {/* Footer CTA */}
        <div className="mt-12 md:mt-16 text-center border-t border-stone-200 pt-10 md:pt-12">
          <p className="font-mono text-[10px] md:text-xs uppercase tracking-widest text-stone-400 mb-4 md:mb-6">
            View all rankings
          </p>
          <Link 
            href="/top-sellers"
            className="inline-block w-full md:w-auto px-8 py-4 md:py-3 border border-stone-900 text-stone-900 text-[10px] md:text-xs font-mono uppercase tracking-[0.2em] hover:bg-stone-900 hover:text-white transition-all duration-300 active:scale-[0.98]"
          >
            See Full Leaderboard
          </Link>
        </div>
      </div>
    </div>
  );
}

export default TopSellers;