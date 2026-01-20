'use client'
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Crown, Medal, Award } from 'lucide-react';
import Image from 'next/image';

type TopSeller = {
  id: number;
  rank: number;
  name: string;
  profession: string;
  imageUrl: string;
  color: string;
  totalSales: number;
};

// KEPT ORIGINAL DATA
const topSellers: TopSeller[] = [
  {
    id: 1,
    rank: 1,
    name: 'Sarah Chen',
    profession: 'Fashion Designer',
    imageUrl: 'https://randomuser.me/api/portraits/women/32.jpg',
    color: 'from-emerald-400 to-teal-600',
    totalSales: 1247
  },
  {
    id: 2,
    rank: 2,
    name: 'Marcus Rodriguez',
    profession: 'Style Consultant',
    imageUrl: 'https://randomuser.me/api/portraits/men/45.jpg',
    color: 'from-pink-400 to-rose-600',
    totalSales: 892
  },
  {
    id: 3,
    rank: 3,
    name: 'Emma Thompson',
    profession: 'Vintage Specialist',
    imageUrl: 'https://randomuser.me/api/portraits/women/68.jpg',
    color: 'from-purple-400 to-indigo-600',
    totalSales: 756
  },
  {
    id: 4,
    rank: 4,
    name: 'David Kim',
    profession: 'Tailor & Couturier',
    imageUrl: 'https://randomuser.me/api/portraits/men/51.jpg',
    color: 'from-orange-400 to-red-600',
    totalSales: 543
  }
];

function SellerRow({ seller, index }: { seller: TopSeller; index: number }) {
  // Determine rank icon
  const RankIcon = () => {
    if (seller.rank === 1) return <Crown className="w-5 h-5 text-amber-600" />;
    if (seller.rank === 2) return <Medal className="w-5 h-5 text-stone-400" />;
    if (seller.rank === 3) return <Award className="w-5 h-5 text-amber-700" />;
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group relative flex items-center gap-8 py-8 border-b border-stone-100 last:border-0 hover:bg-stone-50 transition-colors duration-500 cursor-pointer"
    >
      {/* Large Background Rank Number (Editorial Watermark) */}
      <div className="absolute -left-6 -top-4 text-[8rem] font-serif font-bold text-stone-100 leading-none opacity-0 group-hover:opacity-100 transition-opacity duration-700 select-none pointer-events-none z-0">
        0{seller.rank}
      </div>

      {/* Rank Column */}
      <div className="w-12 text-center relative z-10">
        <div className="flex flex-col items-center gap-1">
          {RankIcon()}
          <span className="font-mono text-xs font-bold text-stone-400 group-hover:text-stone-900 transition-colors">
            #{seller.rank}
          </span>
        </div>
      </div>

      {/* Profile Image */}
      <div className="relative w-16 h-16 flex-shrink-0 z-10">
        <div className="w-full h-full rounded-full border-2 border-stone-100 group-hover:border-stone-900 transition-colors overflow-hidden">
          <Image
            src={seller.imageUrl}
            alt={seller.name}
            width={64}
            height={64}
            className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
          />
        </div>
      </div>

      {/* Seller Info */}
      <div className="flex-1 min-w-0 z-10">
        <h3 className="text-xl font-serif text-stone-900 group-hover:italic transition-all duration-300">
          {seller.name}
        </h3>
        <p className="text-xs font-mono uppercase tracking-widest text-stone-500 mt-1">
          {seller.profession}
        </p>
      </div>

      {/* Stats Column */}
      <div className="text-right relative z-10 min-w-[120px]">
        <div className="text-2xl font-serif font-medium text-stone-900 group-hover:translate-x-1 transition-transform duration-300">
          {seller.totalSales.toLocaleString()}
        </div>
        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="text-xs font-mono text-stone-500 uppercase tracking-widest">Sales</span>
          <ArrowUpRight size={12} className="text-stone-900" />
        </div>
      </div>
    </motion.div>
  );
}

function TopSellers() {
  return (
    <div className="min-h-screen bg-[#FAFAF9] py-24 px-6 md:px-12">
      <div className="max-w-4xl mx-auto">
        
        {/* Editorial Header */}
        <header className="mb-16 border-b border-stone-200 pb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-stone-400 mb-2 block">
                Seasonal Performance
              </span>
              <h1 className="text-5xl md:text-7xl font-serif font-medium text-stone-900 leading-none">
                Top Sellers
              </h1>
            </div>
            <div className="text-right hidden md:block">
              <p className="font-serif text-stone-500 italic text-lg max-w-xs">
                The leading voices defining this season&apos;s trends.
              </p>
            </div>
          </div>
        </header>

        {/* List Container */}
        <div className="relative">
           {/* Subtle decorative line */}
           <div className="absolute left-[3.5rem] top-0 bottom-0 w-px bg-stone-200 hidden md:block"></div>
           
           <div className="space-y-0">
              {topSellers.map((seller, index) => (
                <SellerRow key={seller.id} seller={seller} index={index} />
              ))}
           </div>
        </div>

        {/* Footer CTA */}
        <div className="mt-16 text-center border-t border-stone-200 pt-12">
          <p className="font-mono text-xs uppercase tracking-widest text-stone-400 mb-6">
            View all rankings
          </p>
          <button className="group px-8 py-3 border border-stone-900 text-stone-900 text-xs font-mono uppercase tracking-widest hover:bg-stone-900 hover:text-white transition-all duration-300">
            See Full Leaderboard
          </button>
        </div>

      </div>
    </div>
  );
}

export default TopSellers;