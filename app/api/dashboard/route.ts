import { NextResponse } from 'next/server';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user || !user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get professional profile
    const professionalProfile = await prisma.professionalProfile.findUnique({
      where: { userId: user.id },
      include: {
        specialization: true
      }
    });

    if (!professionalProfile) {
      return NextResponse.json({ error: 'Professional profile not found' }, { status: 404 });
    }

    // Get current date range (last 30 days)
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    // Get products count and recent activity
    const products = await prisma.product.findMany({
      where: {
        professionalId: user.id,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        price: true,
        soldCount: true,
        viewCount: true,
        createdAt: true,
        isOnSale: true,
        discountPercentage: true,
        discountPrice: true
      }
    });

    // Get orders and revenue data
    const orders = await prisma.orderItem.findMany({
      where: {
        professionalId: user.id,
        order: {
          createdAt: {
            gte: thirtyDaysAgo
          }
        }
      },
      include: {
        order: {
          select: {
            customerId: true,
            totalPrice: true,
            createdAt: true,
            status: true
          }
        },
        product: {
          select: {
            name: true,
            price: true
          }
        }
      }
    });

    // Calculate business metrics
    const totalRevenue = orders.reduce((sum, item) => sum + item.order.totalPrice, 0);
    const completedOrders = orders.filter(item => item.order.status === 'DELIVERED').length;
    const totalOrders = orders.length;

    // Calculate average rating from reviews
    const reviews = await prisma.review.findMany({
      where: {
        targetType: 'PROFESSIONAL',
        targetId: professionalProfile.id
      },
      select: {
        rating: true
      }
    });

    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;

    const totalReviews = reviews.length;

    // Get active customers (unique customers who ordered in last 30 days)
    const activeCustomers = new Set(
      orders.map(item => item.order.customerId)
    ).size;

    // Calculate top performing services/products
    const productPerformance = orders.reduce((acc, item) => {
      const productId = item.productId;
      if (!acc[productId]) {
        acc[productId] = {
          name: item.product.name,
          revenue: 0,
          orders: 0
        };
      }
      acc[productId].revenue += item.order.totalPrice;
      acc[productId].orders += 1;
      return acc;
    }, {} as Record<string, { name: string; revenue: number; orders: number }>);

    const topServices = Object.values(productPerformance)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 3);

    // Get recent orders for quick actions
    const recentOrders = orders
      .sort((a, b) => new Date(b.order.createdAt).getTime() - new Date(a.order.createdAt).getTime())
      .slice(0, 5);

    // Calculate analytics insights
    const totalViews = products.reduce((sum, p) => sum + p.viewCount, 0);
    const totalSold = products.reduce((sum, p) => sum + p.soldCount, 0);
    const conversionRate = totalViews > 0 ? (totalSold / totalViews) * 100 : 0;

    // Get products on sale
    const productsOnSale = products.filter(p => p.isOnSale || p.discountPercentage || p.discountPrice).length;

    // Calculate period comparison (last 30 days vs previous 30 days)
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(now.getDate() - 60);

    const previousOrders = await prisma.orderItem.count({
      where: {
        professionalId: user.id,
        order: {
          createdAt: {
            gte: sixtyDaysAgo,
            lt: thirtyDaysAgo
          }
        }
      }
    });

    const orderChange = previousOrders > 0 ? ((totalOrders - previousOrders) / previousOrders) * 100 : 0;

    // Get search analytics for trending searches
    const searchAnalytics = await prisma.userSearch.groupBy({
      by: ['searchTerm'],
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 5
    });

    return NextResponse.json({
      professional: {
        businessName: professionalProfile.businessName,
        specialization: professionalProfile.specialization?.name,
        accountBalance: professionalProfile.accountBalance
      },
      metrics: {
        totalRevenue,
        completedOrders,
        avgRating: Math.round(avgRating * 10) / 10,
        totalReviews,
        activeCustomers,
        totalProducts: products.length,
        productsOnSale,
        conversionRate: Math.round(conversionRate * 100) / 100
      },
      topServices,
      recentOrders: recentOrders.map(item => ({
        id: item.orderId,
        productName: item.product.name,
        amount: item.order.totalPrice,
        status: item.order.status,
        date: item.order.createdAt
      })),
      analytics: {
        periodComparison: {
          current: totalOrders,
          previous: previousOrders,
          change: Math.round(orderChange * 100) / 100
        },
        trendingSearches: searchAnalytics.map(search => ({
          term: search.searchTerm,
          count: search._count.id
        })),
        insights: [
          {
            title: "Conversion Rate",
            description: `${conversionRate.toFixed(1)}% of views convert to sales`,
            change: conversionRate,
            period: "overall"
          },
          {
            title: "Active Promotions",
            description: `${productsOnSale} products currently on sale`,
            change: productsOnSale,
            period: "active"
          },
          {
            title: "Order Growth",
            description: orderChange >= 0 ? "Orders increased this month" : "Orders decreased this month",
            change: Math.round(orderChange * 100) / 100,
            period: "vs last month"
          }
        ]
      }
    });

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}