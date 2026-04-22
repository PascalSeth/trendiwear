import React from 'react';
import { prisma } from '@/lib/prisma';
import Image from 'next/image';
import Link from 'next/link';
import { Crown, Medal, Award, TrendingUp, Star, ArrowUpRight, Trophy } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Hall of Fame | Top Sellers Rankings",
  description: "Discover the most successful and highly-rated fashion professionals on TrendiZip. Our seasonal leaderboard celebrates the top designers and tailors.",
};

interface TopSeller {
  id: string;
  userId: string;
  businessName: string;
  businessImage: string | null;
  rating: number;
  totalReviews: number;
  completedOrders: number;
  slug: string;
  user: {
    firstName: string;
    lastName: string;
    profileImage: string | null;
    _count: {
      products: number;
    };
  };
  specialization: {
    name: string;
  } | null;
  actualSales: number;
}

async function getTopSellers(): Promise<TopSeller[]> {
  const profiles = await prisma.professionalProfile.findMany({
    where: {},
    select: {
      id: true,
      userId: true,
      businessName: true,
      businessImage: true,
      rating: true,
      totalReviews: true,
      completedOrders: true,
      slug: true,
      user: {
        select: {
          firstName: true,
          lastName: true,
          profileImage: true,
          _count: {
            select: {
              products: true,
            },
          },
        },
      },
      specialization: {
        select: {
          name: true,
        },
      },
    },
    orderBy: { completedOrders: "desc" },
    take: 50,
  });

  const sellerUserIds = profiles.map((s) => s.userId);
  const salesCounts = await prisma.orderItem.groupBy({
    by: ['professionalId'],
    _sum: { quantity: true },
    _count: { id: true },
    where: {
      professionalId: { in: sellerUserIds },
      order: { status: { notIn: ['CANCELLED', 'REFUNDED'] } },
    },
  });

  const salesMap = new Map(salesCounts.map(s => [s.professionalId, s._sum.quantity || s._count.id || 0]));
  
  return (profiles as unknown as TopSeller[]).map((s) => ({
    ...s,
    actualSales: salesMap.get(s.userId) || 0,
  })).sort((a, b) => b.actualSales - a.actualSales);
}

export default async function TopSellersPage() {
  const allSellers = await getTopSellers();
  const podiumSellers = allSellers.slice(0, 3);
  const listSellers = allSellers.slice(3);

  // Reorder podium to: [2nd, 1st, 3rd] for visual layout
  const visualPodium = [
    podiumSellers[1], // 2nd
    podiumSellers[0], // 1st
    podiumSellers[2], // 3rd
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-stone-900 pb-24">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-amber-100/50 rounded-full blur-[120px]" />
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[50%] bg-purple-100/40 rounded-full blur-[100px]" />
        <div className="absolute -bottom-[10%] left-[20%] w-[50%] h-[40%] bg-indigo-100/30 rounded-full blur-[120px]" />
      </div>

      <main className="relative z-10 pt-32 md:pt-44 px-4 md:px-8 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-16 md:mb-32">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-stone-200 bg-white/50 backdrop-blur-sm text-[10px] md:text-xs font-mono uppercase tracking-[0.2em] text-stone-500 mb-6 shadow-sm">
            <Trophy className="w-3 h-3 text-amber-500" />
            Seasonal Hall of Fame
          </div>
          <h1 className="text-5xl md:text-8xl font-serif font-black tracking-tighter text-stone-950 mb-6 md:mb-8 leading-[0.9]">
            THE <span className="text-stone-400 italic">ELITE</span> <br /> 
            TOP SELLERS
          </h1>
          <p className="max-w-2xl mx-auto text-sm md:text-lg text-stone-500 font-serif leading-relaxed italic">
            Celebrating the master craftsmen, visionaries, and trendsetters who have redefined African fashion this season with unprecedented artistry and impact.
          </p>
        </div>

        {/* The Podium Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 items-end gap-0 md:gap-4 mb-24 md:mb-40 min-h-[500px]">
          {visualPodium.map((seller) => {
            const isFirst = seller.id === podiumSellers[0].id;
            const isSecond = seller.id === podiumSellers[1]?.id;
            const isThird = seller.id === podiumSellers[2]?.id;

            let rankColor = "text-stone-400";
            let Icon = Medal;
            let bgColor = "from-stone-50 to-white";
            let borderColor = "border-stone-200";
            let awardLabel = "Finalist";

            if (isFirst) {
              rankColor = "text-amber-500";
              Icon = Crown;
              bgColor = "from-amber-50 to-white";
              borderColor = "border-amber-200 shadow-amber-100/50";
              awardLabel = "Sovereign Master";
            } else if (isSecond) {
              rankColor = "text-slate-400";
              Icon = Medal;
              bgColor = "from-slate-50 to-white";
              borderColor = "border-slate-200 shadow-slate-100/50";
              awardLabel = "Elite Artisan";
            } else if (isThird) {
              rankColor = "text-amber-700";
              Icon = Award;
              bgColor = "from-orange-50/30 to-white";
              borderColor = "border-orange-200/50";
              awardLabel = "Distinguished Voice";
            }

            return (
              <div 
                key={seller.id} 
                className={`flex flex-col items-center ${isFirst ? 'z-20 md:-translate-y-12' : 'z-10'} relative mb-12 md:mb-0 transform transition-all duration-700`}
              >
                {/* Ranking Emblem */}
                <div className={`mb-6 p-3 rounded-full bg-white border ${borderColor} shadow-xl relative overflow-hidden group`}>
                   <div className={`absolute inset-0 bg-gradient-to-br ${bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                   <Icon className={`w-8 h-8 md:w-10 md:h-10 ${rankColor} relative z-10`} />
                </div>

                {/* Profile Card */}
                <Link 
                  href={`/tz/${seller.slug}`}
                  className={`w-full max-w-[320px] bg-white border ${borderColor} rounded-[2rem] p-6 md:p-8 shadow-2xl overflow-hidden group hover:-translate-y-2 transition-all duration-500`}
                >
                  <div className="relative aspect-square rounded-[1.5rem] overflow-hidden mb-6 border border-stone-100">
                    <Image 
                      src={seller.businessImage || seller.user?.profileImage || ""} 
                      alt={seller.businessName} 
                      fill 
                      className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700 scale-105 group-hover:scale-100"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    <div className="absolute bottom-4 left-4">
                       <span className={`px-2 py-1 bg-white/90 backdrop-blur-md rounded-md text-[8px] font-mono uppercase tracking-widest text-stone-900 ${rankColor}`}>
                         #{isFirst ? 1 : isSecond ? 2 : 3}
                       </span>
                    </div>
                  </div>

                  <div className="text-center">
                    <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-stone-400 mb-2 block">
                      {awardLabel}
                    </span>
                    <h3 className="text-2xl font-serif font-bold text-stone-950 mb-2 truncate group-hover:italic transition-all">
                      {seller.businessName}
                    </h3>
                    <p className="text-xs text-stone-500 font-mono tracking-wide uppercase mb-6">
                      {seller.specialization?.name || "Professional"}
                    </p>

                    <div className="grid grid-cols-2 gap-4 py-4 border-t border-stone-50">
                      <div className="text-center">
                        <p className="text-lg font-serif font-bold text-stone-900">{seller.actualSales.toLocaleString()}</p>
                        <p className="text-[8px] font-mono text-stone-400 uppercase tracking-widest leading-none mt-1">Sales Volume</p>
                      </div>
                      <div className="text-center border-l border-stone-50">
                        <p className="text-lg font-serif font-bold text-stone-900">{seller.rating.toFixed(1)}</p>
                        <p className="text-[8px] font-mono text-stone-400 uppercase tracking-widest leading-none mt-1">Global Rating</p>
                      </div>
                    </div>
                  </div>
                </Link>

                {/* Base shadow effect for 1st place */}
                {isFirst && (
                  <div className="hidden md:block absolute -bottom-10 left-12 right-12 h-6 bg-stone-900/5 blur-2xl rounded-full" />
                )}
              </div>
            );
          })}
        </div>

        {/* Detailed Leaderboard Section */}
        <section className="mb-24">
          <div className="flex items-center justify-between mb-12 border-b border-stone-200 pb-6">
            <h2 className="text-2xl md:text-4xl font-serif font-medium text-stone-900">
              The Rankings <span className="text-stone-400 italic">4-50</span>
            </h2>
            <div className="flex items-center gap-4 text-[10px] font-mono uppercase tracking-widest text-stone-400">
              <span className="hidden md:inline">Sort by Peak Performance</span>
              <div className="w-10 h-px bg-stone-200" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-px bg-stone-200 border border-stone-200 rounded-3xl overflow-hidden shadow-xl">
            {listSellers.map((seller, idx) => (
              <Link 
                key={seller.id}
                href={`/tz/${seller.slug}`}
                className="group flex flex-wrap md:flex-nowrap items-center gap-4 md:gap-8 px-6 md:px-12 py-6 md:py-8 bg-white hover:bg-stone-50 transition-colors"
              >
                {/* Ranking */}
                <div className="w-12 text-center">
                  <span className="text-lg md:text-2xl font-serif text-stone-300 group-hover:text-stone-950 transition-colors italic">
                    {idx + 4}
                  </span>
                </div>

                {/* Info */}
                <div className="flex items-center gap-4 flex-1 min-w-[200px]">
                  <div className="relative w-12 h-12 md:w-16 md:h-16 rounded-full overflow-hidden border border-stone-100 flex-shrink-0">
                    <Image 
                      src={seller.businessImage || seller.user?.profileImage || ""} 
                      alt="" 
                      fill 
                      className="object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                    />
                  </div>
                  <div>
                    <h4 className="text-base md:text-xl font-serif font-medium text-stone-900 group-hover:italic transition-all">
                      {seller.businessName}
                    </h4>
                    <p className="text-[10px] font-mono text-stone-400 uppercase tracking-widest mt-1">
                      {seller.specialization?.name}
                    </p>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-12 ml-auto">
                  <div className="hidden lg:block text-right">
                    <div className="flex items-center justify-end gap-1 text-amber-500 mb-1">
                      <Star className="w-3 h-3 fill-current" />
                      <span className="text-sm font-serif font-bold text-stone-900">{seller.rating.toFixed(1)}</span>
                    </div>
                    <p className="text-[8px] font-mono text-stone-400 uppercase tracking-widest">{seller.totalReviews} Reviews</p>
                  </div>

                  <div className="text-right min-w-[100px]">
                    <div className="text-xl md:text-3xl font-serif font-medium text-stone-950 group-hover:-translate-x-2 transition-transform duration-500">
                      {seller.actualSales.toLocaleString()}
                    </div>
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[10px] font-mono text-stone-400 uppercase tracking-widest">Global Sales</span>
                      <ArrowUpRight className="w-3 h-3 text-stone-900" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Footer Inspiration */}
        <section className="text-center py-20 md:py-32 border-t border-stone-200">
          <div className="max-w-3xl mx-auto">
            <h3 className="text-3xl md:text-5xl font-serif italic text-stone-400 mb-8 leading-tight">
              &ldquo;True fashion is not just what we wear, but the stories told by the hands that created it.&rdquo;
            </h3>
            <div className="flex flex-col items-center gap-6">
              <span className="w-12 h-px bg-stone-900" />
              <Link 
                href="/tailors-designers"
                className="group flex items-center gap-4 text-xs font-mono uppercase tracking-[0.3em] text-stone-900 hover:tracking-[0.4em] transition-all"
              >
                Explore More Creators
                <TrendingUp className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
