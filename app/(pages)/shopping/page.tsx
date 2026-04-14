import { prisma } from '@/lib/prisma';
import ShoppingClient from './ShoppingClient';
import { Metadata } from 'next';
import { JsonLd } from '@/components/seo';

export const metadata: Metadata = {
  title: "Buy Ankara, Kente & African Dresses Online in Ghana",
  description: "Shop Ghana's largest curated fashion marketplace. Discover Ankara, Kente, African print dresses, church wear, wedding guest & graduation styles. Fast delivery to Accra, Kumasi & nationwide.",
  keywords: [
    "buy dresses online Ghana", "Ankara dresses Ghana", "Kente dresses Ghana",
    "African print dresses Ghana", "church dresses Ghana", "church dresses Accra",
    "wedding guest dresses Ghana", "graduation dresses Kente", "ladies dresses Ghana",
    "African fashion online Ghana", "made in Ghana fashion", "Ghanaian traditional wear online",
    "buy African fashion online Ghana", "affordable Ankara online Accra", "fashion Ghana"
  ],
  alternates: {
    canonical: 'https://trendizip.com/shopping',
  },
  openGraph: {
    title: "Buy Ankara, Kente & African Dresses | TrendiZip Ghana",
    description: "Discover curated Ankara, Kente & African print collections. Shop church wear, wedding dresses & more. Fast delivery across Ghana.",
    url: 'https://trendizip.com/shopping',
    siteName: 'TrendiZip',
    locale: 'en_GH',
    type: 'website',
  },
};

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
        categories: { select: { id: true, name: true, slug: true } },
        collections: { select: { id: true, name: true, slug: true } },
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
        categories: { select: { id: true, name: true, slug: true } },
        collections: { select: { id: true, name: true, slug: true } },
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

  interface CategoryWithProducts {
    _count?: { products: number };
    children?: Array<{ _count?: { products: number } }>;
  }

  // Process categories to include total product count (Parent + All Children)
  const processedCategories = categories.map((cat) => {
    const c = cat as unknown as CategoryWithProducts;
    const directProducts = c._count?.products || 0;
    const childrenProducts = c.children?.reduce((sum: number, child) => sum + (child._count?.products || 0), 0) || 0;
    
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

  const shoppingSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Buy Ankara, Kente & African Dresses Online in Ghana",
    "description": "Ghana's largest curated fashion marketplace featuring Ankara, Kente, African print dresses and more.",
    "url": "https://trendizip.com/shopping",
    "inLanguage": "en-GH",
    "provider": {
      "@type": "Organization",
      "name": "TrendiZip",
      "url": "https://trendizip.com",
      "areaServed": { "@type": "Country", "name": "Ghana" }
    },
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://trendizip.com" },
        { "@type": "ListItem", "position": 2, "name": "Shop", "item": "https://trendizip.com/shopping" }
      ]
    }
  };

  return (
    <>
      <JsonLd schema={shoppingSchema} />
      <ShoppingClient initialData={initialData} />
    </>
  );
}