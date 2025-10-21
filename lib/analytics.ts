import { prisma } from './prisma';
import { UserAction, MovementTarget } from '@prisma/client';

export class AnalyticsTracker {
  /**
   * Track user search queries
   */
  static async trackSearch(
    userId: string | null,
    searchTerm: string,
    category?: string,
    resultsCount: number = 0,
    sessionId?: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    try {
      await prisma.userSearch.create({
        data: {
          userId,
          searchTerm,
          category,
          resultsCount,
          sessionId,
          ipAddress,
          userAgent
        }
      });

      // Update trending searches
      await prisma.trendingSearch.upsert({
        where: { searchTerm },
        update: { searchCount: { increment: 1 } },
        create: { searchTerm, category }
      });
    } catch (error) {
      console.error('Error tracking search:', error);
    }
  }

  /**
   * Track user movements and actions
   */
  static async trackMovement(
    userId: string | null,
    action: UserAction,
    targetType: MovementTarget,
    targetId: string,
    referrer?: string,
    sessionId?: string,
    ipAddress?: string,
    userAgent?: string,
    metadata?: Record<string, unknown>
  ) {
    try {
      await prisma.userMovement.create({
        data: {
          userId,
          action,
          targetType,
          targetId,
          referrer,
          sessionId,
          ipAddress,
          userAgent,
// eslint-disable-next-line @typescript-eslint/no-explicit-any
          metadata: metadata as any // Prisma Json type
        }
      });

      // Update product analytics if it's a product-related action
      if (targetType === 'PRODUCT') {
        const productId = targetId;

        switch (action) {
          case 'VIEW_PRODUCT':
            if (userId === null) {
              // Increment for anonymous users
              await prisma.product.update({
                where: { id: productId },
                data: { viewCount: { increment: 1 } }
              });
            } else {
              // Check if logged-in user has already viewed this product
              const existingView = await prisma.userMovement.findFirst({
                where: {
                  userId,
                  action: 'VIEW_PRODUCT',
                  targetId: productId
                }
              });
              if (!existingView) {
                // Only increment if it's the first view by this user
                await prisma.product.update({
                  where: { id: productId },
                  data: { viewCount: { increment: 1 } }
                });
              }
            }
            break;
          case 'ADD_TO_WISHLIST':
            await prisma.product.update({
              where: { id: productId },
              data: { wishlistCount: { increment: 1 } }
            });
            break;
          case 'ADD_TO_CART':
            await prisma.product.update({
              where: { id: productId },
              data: { cartCount: { increment: 1 } }
            });
            break;
          case 'PURCHASE':
            await prisma.product.update({
              where: { id: productId },
              data: { soldCount: { increment: 1 } }
            });
            break;
        }
      }
    } catch (error) {
      console.error('Error tracking movement:', error);
    }
  }

  /**
   * Update daily product performance metrics
   */
  static async updateProductPerformance(productId: string, date: Date = new Date()) {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      // Get product data
      const productData = await prisma.product.findUnique({
        where: { id: productId },
        select: {
          viewCount: true,
          wishlistCount: true,
          cartCount: true,
          soldCount: true
        }
      });

      if (!productData) return;

      // Get movements for this product today
      const movements = await prisma.userMovement.findMany({
        where: {
          targetId: productId,
          targetType: 'PRODUCT',
          createdAt: {
            gte: startOfDay,
            lte: endOfDay
          }
        }
      });

      // Calculate metrics
      const views = movements.filter(m => m.action === 'VIEW_PRODUCT').length;
      const searches = movements.filter(m => m.action === 'SEARCH').length;
      const wishlists = movements.filter(m => m.action === 'ADD_TO_WISHLIST').length;
      const cartAdds = movements.filter(m => m.action === 'ADD_TO_CART').length;
      const purchases = movements.filter(m => m.action === 'PURCHASE').length;
      const productInfo = await prisma.product.findUnique({
        where: { id: productId },
        select: { price: true, professionalId: true }
      });
      const revenue = purchases * (productInfo?.price || 0);
      const profId = productInfo?.professionalId;

      const conversionRate = views > 0 ? (purchases / views) * 100 : 0;

      // Update or create performance record
      await prisma.productPerformance.upsert({
        where: {
          productId_date: {
            productId,
            date: startOfDay
          }
        },
        update: {
          views: { increment: views },
          searches: { increment: searches },
          wishlists: { increment: wishlists },
          cartAdds: { increment: cartAdds },
          purchases: { increment: purchases },
          revenue: { increment: revenue },
          conversionRate
        },
        create: {
          productId,
          professionalId: profId || '',
          date: startOfDay,
          views,
          searches,
          wishlists,
          cartAdds,
          purchases,
          revenue,
          conversionRate
        }
      });
    } catch (error) {
      console.error('Error updating product performance:', error);
    }
  }

  /**
   * Get seasonal trends and patterns
   */
  static async getSeasonalInsights(professionalId: string, years: number = 2) {
    try {
      const currentYear = new Date().getFullYear();
      const insights = [];

      for (let year = currentYear - years + 1; year <= currentYear; year++) {
        // Get December data for each year
        const decemberStart = new Date(year, 11, 1); // December 1st
        const decemberEnd = new Date(year, 11, 31, 23, 59, 59);

        // Get movements for products in December
        const decemberMovements = await prisma.userMovement.findMany({
          where: {
            targetType: 'PRODUCT',
            createdAt: {
              gte: decemberStart,
              lte: decemberEnd
            }
          }
        });

        // Get product IDs from movements
        const productIds = Array.from(new Set(decemberMovements.map(m => m.targetId)));

        // Fetch products with professional info
        const products = await prisma.product.findMany({
          where: {
            id: { in: productIds },
            professionalId: professionalId
          },
          select: {
            id: true,
            name: true
          }
        });

        const productMap = new Map(products.map(p => [p.id, p.name]));

        // Filter movements for this professional's products and group by product
        const productStats = decemberMovements
          .filter(movement => productMap.has(movement.targetId))
          .reduce((acc, movement) => {
            const productName = productMap.get(movement.targetId) || 'Unknown';
            if (!acc[productName]) {
              acc[productName] = { views: 0, purchases: 0 };
            }

            if (movement.action === 'VIEW_PRODUCT') acc[productName].views++;
            if (movement.action === 'PURCHASE') acc[productName].purchases++;

            return acc;
          }, {} as Record<string, { views: number; purchases: number }>);

        // Find top products for December
        const topProducts = Object.entries(productStats)
          .sort(([,a], [,b]) => b.purchases - a.purchases)
          .slice(0, 3)
          .map(([name, stats]) => ({ name, ...stats }));

        insights.push({
          year,
          month: 'December',
          topProducts,
          totalViews: Object.values(productStats).reduce((sum, p) => sum + p.views, 0),
          totalPurchases: Object.values(productStats).reduce((sum, p) => sum + p.purchases, 0)
        });
      }

      return insights;
    } catch (error) {
      console.error('Error getting seasonal insights:', error);
      return [];
    }
  }
}