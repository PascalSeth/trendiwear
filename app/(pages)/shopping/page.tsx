import { prisma } from '@/lib/prisma';
import ShoppingClient from './ShoppingClient';

export default async function Page() {
  // Fetch all primary data in parallel on the server
  const [categories, featuredProducts, trendingProducts, collections] = await Promise.all([
    // Parent Categories (Top level)
    prisma.category.findMany({
      where: { parentId: null, isActive: true },
      include: {
        _count: {
          select: { products: true }
        },
        children: {
          where: { isActive: true },
          include: {
            _count: {
              select: { products: true }
            }
          }
        }
      },
      orderBy: { order: 'asc' }
    }),
    
    // New Arrivals (Featured)
    prisma.product.findMany({
      where: { isActive: true, isInStock: true },
      include: {
        category: { select: { name: true } },
        professional: {
          select: {
            firstName: true,
            lastName: true,
            professionalProfile: {
              select: {
                businessName: true,
                businessImage: true,
                rating: true,
                isVerified: true
              }
            }
          }
        },
        _count: {
          select: { wishlistItems: true, orderItems: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 8 // Show more on the shop page
    }),

    // Trending (Most Viewed)
    prisma.product.findMany({
      where: { isActive: true, isInStock: true },
      include: {
        category: { select: { name: true } },
        professional: {
          select: {
            firstName: true,
            lastName: true,
            professionalProfile: {
              select: {
                businessName: true,
                businessImage: true,
                rating: true,
                isVerified: true
              }
            }
          }
        },
        _count: {
          select: { wishlistItems: true, orderItems: true }
        }
      },
      orderBy: { viewCount: 'desc' },
      take: 8
    }),

    // Collections
    prisma.collection.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { products: true }
        }
      },
      orderBy: { order: 'asc' },
      take: 5
    })
  ]);

  // OPTIMIZATION: Manually fetch reviews/ratings for products in batch if needed.
  // The current product list uses the professionalProfile.rating as a proxy, 
  // but we can compute specific product stars here if we want absolute precision.

  // Process categories to include total product count (Parent + All Children)
  const processedCategories = categories.map((cat: any) => {
    const directProducts = cat._count?.products || 0;
    const childrenProducts = cat.children?.reduce((sum: number, child: any) => sum + (child._count?.products || 0), 0) || 0;
    
    return {
      ...cat,
      _count: {
        products: directProducts + childrenProducts
      }
    };
  });

  // Hydrate the client component with clean, serialized data
  const initialData = JSON.parse(JSON.stringify({
    categories: processedCategories,
    featuredProducts,
    trendingProducts,
    collections
  }));

  return <ShoppingClient initialData={initialData} />;
}