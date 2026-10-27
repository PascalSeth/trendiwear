import React from 'react';
import { prisma } from '@/lib/prisma';
import Image from 'next/image';
import Link from 'next/link';
import { Crown, Medal, Award, TrendingUp, Star, ArrowUpRight, Trophy } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Hall of Fame | Top Sellers Rankings",
  description: "Discover the most successful and highly-rated fashion professionals on TrendiZip. Our seasonal leaderboard celebrates the top designers and tailors in Ghana.",
  keywords: ["top tailors Ghana", "best fashion designers Accra", "TrendiZip top sellers", "African fashion rankings", "best tailors near me", "top rated Ghanaian designers"],
  openGraph: {
    title: "Hall of Fame | Top Sellers Rankings",
    description: "Discover the most successful and highly-rated fashion professionals on TrendiZip. Our seasonal leaderboard celebrates the top designers and tailors.",
    url: "https://trendizip.com/top-sellers",
    type: "website",
  },
  alternates: {
    canonical: "https://trendizip.com/top-sellers",
  },
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

      <main className="relative z-10 pt-28 md:pt-36 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-10 md:mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-stone-200 bg-white/70 backdrop-blur-sm text-[11px] font-medium uppercase tracking-wider text-stone-600 mb-4 shadow-2xs">
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <span>Leaderboard</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-normal tracking-tight text-stone-950 mb-3 leading-tight">
            Top Sellers
          </h1>
          <p className="max-w-lg mx-auto text-xs sm:text-sm text-stone-600 font-sans leading-relaxed">
            Leading fashion designers and tailors ranked by verified sales volume and client ratings on TrendiZip.
          </p>
        </div>

        {/* The Podium Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 items-end gap-4 sm:gap-6 mb-16 md:mb-20">
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
              borderColor = "border-amber-300 shadow-amber-100/50";
              awardLabel = "#1 Top Seller";
            } else if (isSecond) {
              rankColor = "text-slate-400";
              Icon = Medal;
              bgColor = "from-slate-50 to-white";
              borderColor = "border-slate-300 shadow-slate-100/50";
              awardLabel = "#2 Top Seller";
            } else if (isThird) {
              rankColor = "text-amber-700";
              Icon = Award;
              bgColor = "from-orange-50/30 to-white";
              borderColor = "border-orange-200/50";
              awardLabel = "#3 Top Seller";
            }

            return (
              <div 
                key={seller.id} 
                className={`flex flex-col items-center ${isFirst ? 'z-20 md:-translate-y-6' : 'z-10'} relative mb-6 md:mb-0 transition-all duration-500`}
              >
                {/* Ranking Emblem */}
                <div className={`mb-3 p-2.5 rounded-full bg-white border ${borderColor} shadow-sm relative overflow-hidden group`}>
                   <div className={`absolute inset-0 bg-gradient-to-br ${bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                   <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${rankColor} relative z-10`} />
                </div>

                {/* Profile Card */}
                <Link 
                  href={`/tz/${seller.slug}`}
                  className={`w-full max-w-[270px] bg-white border ${borderColor} rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300`}
                >
                  <div className="relative aspect-square rounded-xl overflow-hidden mb-3 border border-stone-100 bg-stone-100">
                    <Image 
                      src={seller.businessImage || seller.user?.profileImage || ""} 
                      alt={seller.businessName} 
                      fill 
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
                    <div className="absolute bottom-2.5 left-2.5">
                       <span className={`px-2 py-0.5 bg-white/95 backdrop-blur-xs rounded-md text-[10px] font-mono font-bold uppercase tracking-wider text-stone-900 ${rankColor}`}>
                         #{isFirst ? 1 : isSecond ? 2 : 3}
                       </span>
                    </div>
                  </div>

                  <div className="text-center">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 mb-1 block">
                      {awardLabel}
                    </span>
                    <h3 className="text-base sm:text-lg font-serif font-bold text-stone-950 mb-1 truncate">
                      {seller.businessName}
                    </h3>
                    <p className="text-[11px] text-stone-500 font-sans tracking-wide truncate mb-3">
                      {seller.specialization?.name || "Designer & Tailor"}
                    </p>

                    <div className="grid grid-cols-2 gap-2 py-2.5 border-t border-stone-100">
                      <div className="text-center">
                        <p className="text-sm sm:text-base font-mono font-bold text-stone-900">{seller.actualSales.toLocaleString()}</p>
                        <p className="text-[9px] text-stone-400 font-sans uppercase tracking-wider mt-0.5">Sales</p>
                      </div>
                      <div className="text-center border-l border-stone-100">
                        <p className="text-sm sm:text-base font-mono font-bold text-stone-900">{seller.rating.toFixed(1)}</p>
                        <p className="text-[9px] text-stone-400 font-sans uppercase tracking-wider mt-0.5">Rating</p>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>

        {/* Detailed Leaderboard Section */}
        <section className="mb-16 md:mb-20">
          <div className="flex items-center justify-between mb-6 border-b border-stone-200/80 pb-4">
            <h2 className="text-xl sm:text-2xl font-serif font-normal text-stone-900">
              The Rankings
            </h2>
            <div className="text-xs text-stone-500 font-sans">
              Ranked by verified orders
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200/80 overflow-hidden shadow-xs divide-y divide-stone-100">
            {listSellers.map((seller, idx) => (
              <Link 
                key={seller.id}
                href={`/tz/${seller.slug}`}
                className="group flex items-center gap-3 sm:gap-6 px-4 sm:px-6 py-3.5 sm:py-4 hover:bg-stone-50/70 transition-colors"
              >
                {/* Ranking */}
                <div className="w-8 text-center shrink-0">
                  <span className="text-sm sm:text-base font-mono font-bold text-stone-400 group-hover:text-stone-900 transition-colors">
                    #{idx + 4}
                  </span>
                </div>

                {/* Info */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden border border-stone-200 flex-shrink-0 bg-stone-100">
                    <Image 
                      src={seller.businessImage || seller.user?.profileImage || ""} 
                      alt={seller.businessName} 
                      fill 
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-sm font-semibold text-stone-900 truncate">
                      {seller.businessName}
                    </h3>
                    <p className="text-[11px] text-stone-500 font-sans truncate">
                      {seller.specialization?.name || "Professional"}
                    </p>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6 sm:gap-8 ml-auto shrink-0">
                  <div className="hidden sm:block text-right">
                    <div className="flex items-center justify-end gap-1 text-amber-500 text-xs">
                      <Star className="w-3 h-3 fill-current" />
                      <span className="font-semibold text-stone-900">{seller.rating.toFixed(1)}</span>
                    </div>
                    <p className="text-[10px] text-stone-400 font-sans">{seller.totalReviews} reviews</p>
                  </div>

                  <div className="text-right min-w-[70px]">
                    <div className="text-sm sm:text-base font-mono font-bold text-stone-950">
                      {seller.actualSales.toLocaleString()}
                    </div>
                    <span className="text-[10px] text-stone-400 font-sans block leading-none">
                      {seller.actualSales === 1 ? 'sale' : 'sales'}
                    </span>
                  </div>

                  <div className="text-stone-300 group-hover:text-stone-900 transition-colors">
                    <ArrowUpRight size={14} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Footer CTA */}
        <section className="text-center py-10 md:py-14 border-t border-stone-200">
          <div className="max-w-xl mx-auto space-y-3">
            <h3 className="text-xl sm:text-2xl font-serif text-stone-900">
              Looking for custom tailoring?
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 font-sans leading-relaxed">
              Explore profiles, view past creations, and place made-to-measure orders directly with verified designers.
            </p>
            <div className="pt-2">
              <Link 
                href="/tailors-designers"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-stone-900 hover:bg-black text-white text-xs font-semibold transition-all shadow-xs"
              >
                <span>Find a Tailor</span>
                <TrendingUp className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
