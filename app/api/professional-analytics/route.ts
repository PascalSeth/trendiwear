import { NextRequest, NextResponse } from 'next/server';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user || !user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters for date filtering
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d'; // 7d, 30d, 90d, 1y
    const compare = searchParams.get('compare') === 'true';

    // Calculate date range
    const now = new Date();
    const startDate = new Date();

    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Get professional profile
    const professionalProfile = await prisma.professionalProfile.findUnique({
      where: { userId: user.id },
      select: { id: true, businessName: true }
    });

    if (!professionalProfile) {
      return NextResponse.json({ error: 'Professional profile not found' }, { status: 404 });
    }

    // Get products owned by this professional
    const products = await prisma.product.findMany({
      where: {
        professionalId: user.id,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        price: true,
        viewCount: true,
        wishlistCount: true,
        cartCount: true,
        soldCount: true
      }
    });

    const productIds = products.map(p => p.id);

    // Get search analytics for this professional's products
    const searchAnalytics = await prisma.userSearch.groupBy({
      by: ['searchTerm', 'category'],
      where: {
        searchedAt: {
          gte: startDate
        }
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 10
    });

    // Get product performance data
    const productPerformance = await prisma.productPerformance.findMany({
      where: {
        productId: {
          in: productIds
        },
        date: {
          gte: startDate
        }
      },
      include: {
        product: {
          select: {
            name: true,
            price: true
          }
        }
      },
      orderBy: {
        revenue: 'desc'
      },
      take: 10
    });

    // Get user movements for this professional's products
    const userMovements = await prisma.userMovement.groupBy({
      by: ['action', 'targetType'],
      where: {
        targetId: {
          in: productIds
        },
        createdAt: {
          gte: startDate
        }
      },
      _count: {
        id: true
      }
    });

    // Get order analytics
    const orders = await prisma.orderItem.findMany({
      where: {
        professionalId: user.id,
        order: {
          createdAt: {
            gte: startDate
          }
        }
      },
      include: {
        order: {
          select: {
            createdAt: true,
            totalPrice: true,
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

    // Calculate revenue by month for trend analysis
    const monthlyRevenue = orders.reduce((acc, item) => {
      const month = item.order.createdAt.toISOString().slice(0, 7); // YYYY-MM
      acc[month] = (acc[month] || 0) + item.order.totalPrice;
      return acc;
    }, {} as Record<string, number>);

    // Get top products by revenue
    const topProducts = orders.reduce((acc, item) => {
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

    const topProductsArray = Object.values(topProducts)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Calculate conversion rates
    const totalViews = products.reduce((sum, p) => sum + p.viewCount, 0);
    const totalPurchases = products.reduce((sum, p) => sum + p.soldCount, 0);
    const conversionRate = totalViews > 0 ? (totalPurchases / totalViews) * 100 : 0;

    // Get trending searches that might relate to this professional's products
    const trendingSearches = await prisma.trendingSearch.findMany({
      where: {
        lastSearched: {
          gte: startDate
        }
      },
      orderBy: {
        searchCount: 'desc'
      },
      take: 10
    });

    // Get most clicked products (based on actual view counts)
    const mostClickedProducts = products
      .filter(p => p.viewCount > 0)
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, 5)
      .map(product => ({
        name: product.name,
        views: product.viewCount,
        clicks: Math.floor(product.viewCount * 0.3), // Estimated clicks based on industry average CTR
        ctr: product.viewCount > 0 ? Math.min((product.soldCount / product.viewCount) * 100, 100) : 0
      }));

    // Calculate actual peak shopping hours from order data
    const orderHours = orders.map(order => {
      const hour = new Date(order.order.createdAt).getHours();
      return hour;
    });

    const hourCounts = orderHours.reduce((acc, hour) => {
      if (hour >= 6 && hour < 12) acc.morning++;
      else if (hour >= 12 && hour < 18) acc.afternoon++;
      else if (hour >= 18 && hour < 22) acc.evening++;
      else acc.night++;
      return acc;
    }, { morning: 0, afternoon: 0, evening: 0, night: 0 });

    const totalOrders = orders.length;
    const peakHours = {
      morning: totalOrders > 0 ? Math.round((hourCounts.morning / totalOrders) * 100) : 0,
      afternoon: totalOrders > 0 ? Math.round((hourCounts.afternoon / totalOrders) * 100) : 0,
      evening: totalOrders > 0 ? Math.round((hourCounts.evening / totalOrders) * 100) : 0,
      night: totalOrders > 0 ? Math.round((hourCounts.night / totalOrders) * 100) : 0
    };

    // Placeholder for seasonal insights - will be calculated after comparisonData
    let seasonalInsights: Array<{
      title: string;
      description: string;
      change: number;
      period: string;
    }> = [];

    // Add product category insights
    const categoryPerformance = await prisma.product.groupBy({
      by: ['categoryId'],
      where: {
        professionalId: user.id,
        createdAt: {
          gte: startDate
        }
      },
      _count: {
        id: true
      },
      _sum: {
        soldCount: true
      }
    });

    if (categoryPerformance.length > 0) {
      const topCategory = categoryPerformance
        .sort((a, b) => (b._sum.soldCount || 0) - (a._sum.soldCount || 0))[0];

      if (topCategory._sum.soldCount && topCategory._sum.soldCount > 0) {
        seasonalInsights.push({
          title: "Top Category Performance",
          description: `Best performing product category`,
          change: topCategory._sum.soldCount,
          period: "units sold in period"
        });
      }
    }

    // Compare with previous period if requested
    let comparisonData = null;
    if (compare) {
      const prevStartDate = new Date(startDate);
      const prevEndDate = new Date(startDate);

      if (period === '7d') {
        prevStartDate.setDate(prevStartDate.getDate() - 7);
        prevEndDate.setDate(prevEndDate.getDate() - 7);
      } else if (period === '30d') {
        prevStartDate.setMonth(prevStartDate.getMonth() - 1);
        prevEndDate.setMonth(prevEndDate.getMonth() - 1);
      } else if (period === '90d') {
        prevStartDate.setMonth(prevStartDate.getMonth() - 3);
        prevEndDate.setMonth(prevEndDate.getMonth() - 3);
      } else if (period === '1y') {
        prevStartDate.setFullYear(prevStartDate.getFullYear() - 1);
        prevEndDate.setFullYear(prevEndDate.getFullYear() - 1);
      }

      const prevOrders = await prisma.orderItem.count({
        where: {
          professionalId: user.id,
          order: {
            createdAt: {
              gte: prevStartDate,
              lt: prevEndDate
            }
          }
        }
      });

      const currentOrders = orders.length;
      const orderChange = prevOrders > 0 ? ((currentOrders - prevOrders) / prevOrders) * 100 : 0;

      comparisonData = {
        previousPeriod: {
          orders: prevOrders,
          period: `${prevStartDate.toISOString().slice(0, 10)} to ${prevEndDate.toISOString().slice(0, 10)}`
        },
        currentPeriod: {
          orders: currentOrders,
          period: `${startDate.toISOString().slice(0, 10)} to ${now.toISOString().slice(0, 10)}`
        },
        changes: {
          orders: orderChange
        }
      };
    }

    // Calculate seasonal insights from actual data
    seasonalInsights = [];

    // Get current period revenue vs previous period
    if (comparisonData) {
      seasonalInsights.push({
        title: "Period Performance",
        description: comparisonData.changes.orders >= 0 ? "Revenue increased this period" : "Revenue decreased this period",
        change: Math.round(comparisonData.changes.orders * 100) / 100,
        period: "vs previous period"
      });
    }

    // Calculate Q4 contribution if we're in Q4 or have historical data
    const currentQuarter = Math.floor(now.getMonth() / 3) + 1;
    if (currentQuarter === 4 || Object.keys(monthlyRevenue).length > 0) {
      const q4Months = Object.keys(monthlyRevenue).filter(month => {
        const monthNum = parseInt(month.split('/')[0]);
        return monthNum >= 10 && monthNum <= 12; // Oct, Nov, Dec
      });

      const q4Revenue = q4Months.reduce((sum, month) => sum + monthlyRevenue[month], 0);
      const totalRevenue = Object.values(monthlyRevenue).reduce((sum, rev) => sum + rev, 0);

      if (totalRevenue > 0) {
        const q4Percentage = (q4Revenue / totalRevenue) * 100;
        seasonalInsights.push({
          title: "Q4 Revenue Contribution",
          description: "Holiday season performance",
          change: Math.round(q4Percentage * 100) / 100,
          period: "of total revenue"
        });
      }
    }

    // Add discount analytics
    const discountAnalytics = await prisma.product.groupBy({
      by: ['professionalId'],
      where: {
        professionalId: user.id,
        OR: [
          { discountPercentage: { not: null } },
          { discountPrice: { not: null } },
          { isOnSale: true }
        ]
      },
      _count: {
        id: true
      },
      _sum: {
        soldCount: true
      }
    });

    const productsOnSale = discountAnalytics[0]?._count?.id || 0;
    const discountSales = discountAnalytics[0]?._sum?.soldCount || 0;

    // Add discount insights
    if (productsOnSale > 0) {
      seasonalInsights.push({
        title: "Products on Sale",
        description: `${productsOnSale} products currently discounted`,
        change: productsOnSale,
        period: "active discounts"
      });

      if (discountSales > 0) {
        seasonalInsights.push({
          title: "Discount Sales",
          description: "Units sold through discounts",
          change: discountSales,
          period: "discounted units"
        });
      }
    }

    // Add some default insights if no data
    if (seasonalInsights.length === 0) {
      seasonalInsights = [
        {
          title: "Peak Shopping Hours",
          description: `Most orders placed ${peakHours.afternoon > peakHours.morning ? 'in afternoon' : 'in morning'}`,
          change: Math.max(peakHours.afternoon, peakHours.morning),
          period: "of daily orders"
        },
        {
          title: "Conversion Rate",
          description: "Views to purchases ratio",
          change: conversionRate,
          period: "conversion rate"
        }
      ];
    }

    return NextResponse.json({
      period,
      dateRange: {
        start: startDate.toISOString(),
        end: now.toISOString()
      },
      overview: {
        totalProducts: products.length,
        totalRevenue: Object.values(monthlyRevenue).reduce((sum, rev) => sum + rev, 0),
        totalOrders: orders.length,
        conversionRate: Math.round(conversionRate * 100) / 100,
        avgOrderValue: orders.length > 0 ? Object.values(monthlyRevenue).reduce((sum, rev) => sum + rev, 0) / orders.length : 0
      },
      topProducts: topProductsArray,
      monthlyRevenue,
      searchAnalytics,
      userMovements,
      trendingSearches,
      productPerformance,
      comparison: comparisonData,
      mostClickedProducts,
      peakHours,
      seasonalInsights
    });

  } catch (error) {
    console.error('Error fetching professional analytics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}