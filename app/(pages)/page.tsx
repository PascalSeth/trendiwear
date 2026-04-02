// app/(pages)/page.tsx
import React from 'react';
import ShowCase from '../components/ShowCase';
import TopSellers from '../components/sections/TopSellers';
import NewArrivals from '../components/sections/NewArrivals';
import BlogIntro from '../components/sections/BlogIntro';
import FashionInspo from '../components/Intro';
import { prisma } from '@/lib/prisma';

interface ShowcaseProduct {
  id: string;
  name: string;
  images: string[];
  price: number;
  currency: string;
  category: {
    id: string;
    name: string;
  };
  professional: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
    professionalProfile: {
      businessName: string;
      businessImage: string | null;
      rating: number;
      totalReviews: number;
      slug: string;
    } | null;
  };
  _count: {
    wishlistItems: number;
    orderItems: number;
    reviews?: number;
  };
  averageRating?: number;
}

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
  actualSales?: number;
}

// This is a Server Component, we can fetch data directly from Prisma!
export default async function Page() {
  // Fetch data in parallel for multiple sections
  const [showcaseProducts, topSellers] = await Promise.all([
    // Showcase Products
    prisma.product.findMany({
      where: {
        isActive: true,
        isInStock: true,
        isShowcaseApproved: true,
      },
      include: {
        category: true,
        professional: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            professionalProfile: {
              select: {
                businessName: true,
                businessImage: true,
                rating: true,
                totalReviews: true,
                slug: true,
              },
            },
          },
        },
        _count: {
          select: {
            wishlistItems: true,
            orderItems: true,
          },
        },
      },
      orderBy: { approvedAt: "desc" },
      take: 6,
    }),
    
    // Top Sellers (Professionals)
    prisma.professionalProfile.findMany({
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
      take: 10,
    })
  ]);

  // Compute actual sales for top sellers from order items
  const sellerUserIds = (topSellers as TopSeller[]).map((s) => s.userId);
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
  const hydratedTopSellers = (topSellers as TopSeller[]).map((s) => ({
    ...s,
    actualSales: salesMap.get(s.userId) || 0,
  }));

  // OPTIMIZATION: Manually fetch reviews for showcase products (since there's no direct relation)
  const productIds = (showcaseProducts as ShowcaseProduct[]).map((p) => p.id);
  const reviews = await prisma.review.findMany({
    where: {
      targetId: { in: productIds },
      targetType: "PRODUCT",
    },
    select: { targetId: true, rating: true },
  });

  const reviewMap = reviews.reduce((acc: Record<string, { count: number; sum: number }>, rev: { targetId: string; rating: number }) => {
    if (!acc[rev.targetId]) acc[rev.targetId] = { count: 0, sum: 0 };
    acc[rev.targetId].count++;
    acc[rev.targetId].sum += rev.rating;
    return acc;
  }, {});

  const hydratedShowcase = (showcaseProducts as unknown as ShowcaseProduct[]).map((p) => {
    const stats = reviewMap[p.id] || { count: 0, sum: 0 };
    return {
      ...p,
      averageRating: stats.count > 0 ? stats.sum / stats.count : 0,
      _count: {
        ...p._count,
        reviews: stats.count,
      }
    };
  });

  return (
    <div className='w-full min-h-screen'>
      {/* Hero Section - First Impression (Hydrated with server data) */}
      <ShowCase initialProducts={JSON.parse(JSON.stringify(hydratedShowcase))} />

      {/* Fashion Inspiration - Educational Content */}
      <section className="relative">
        <FashionInspo />
      </section>   

      {/* New Arrivals - Fresh Content */}
      <section className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-white to-slate-50/50 -z-10" />
        <NewArrivals />
      </section> 

      {/* Top Sellers - Social Proof (Hydrated with server data) */}
      <section className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50/50 to-white -z-10" />
        <TopSellers initialSellers={JSON.parse(JSON.stringify(hydratedTopSellers))} />
      </section>

      {/* Blog Content - Additional Insights */}
      <section className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-white to-slate-50/30 -z-10" />
        <BlogIntro />
      </section>
    </div>
  );
}
