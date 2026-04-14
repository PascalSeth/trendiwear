import { prisma } from '@/lib/prisma';
import ProductClient from './ProductClient';
import { notFound } from 'next/navigation';
import { getAuthSession } from '@/lib/auth';
import { Metadata } from 'next';
import { JsonLd } from '@/components/seo';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug, isActive: true },
    select: {
      name: true,
      description: true,
      images: true,
      price: true,
      currency: true,
      categories: { select: { name: true, slug: true } },
    }
  });

  if (!product) return { title: 'Product Not Found' };

  const categoryName = product.categories?.[0]?.name || 'Fashion';
  const title = `${product.name} — Buy ${categoryName} Online in Ghana`;
  const description = product.description
    || `Shop ${product.name} — premium ${categoryName} available online in Ghana. Fast delivery to Accra, Kumasi & nationwide on TrendiZip.`;

  return {
    title,
    description,
    keywords: [
      product.name,
      categoryName,
      `${categoryName} Ghana`,
      `buy ${categoryName} online Ghana`,
      `${product.name} Ghana`,
      `African fashion Ghana`,
      `TrendiZip Ghana`,
    ],
    openGraph: {
      title: `${product.name} | TrendiZip Ghana`,
      description,
      images: product.images[0] ? [{ url: product.images[0], alt: `${product.name} — ${categoryName} in Ghana` }] : [],
    },
    alternates: {
      canonical: `https://trendizip.com/shopping/products/${slug}`,
    },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await getAuthSession();

  // 1. First fetch product by slug
  const productInfo = await prisma.product.findUnique({
    where: { slug, isActive: true },
    select: { id: true }
  });

  if (!productInfo) {
    return notFound();
  }

  const id = productInfo.id;

  // 2. Fetch rest in parallel using ID
  const [product, reviews, purchase, hasReviewed] = await Promise.all([
    prisma.product.findUnique({
      where: { id, isActive: true },
      include: {
        categories: { select: { name: true } },
        collections: { select: { name: true } },
        professional: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            professionalProfile: {
              select: {
                slug: true,
                businessName: true,
                businessImage: true,
                rating: true,
                totalReviews: true,
                isVerified: true,
                bio: true,
                location: true,
              },
            },
          },
        },
        _count: {
          select: {
            wishlistItems: true,
            cartItems: true,
            orderItems: true,
          },
        },
      },
    }),
    prisma.review.findMany({
      where: {
        targetId: id,
        targetType: 'PRODUCT',
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
          },
        },
        replyUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
          },
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profileImage: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    session?.user?.id ? prisma.order.findFirst({
      where: {
        customerId: session.user.id,
        status: "DELIVERED",
        items: {
          some: { productId: id }
        }
      },
      select: { id: true }
    }) : null,
    session?.user?.id ? prisma.review.findUnique({
      where: {
        userId_targetId_targetType: {
          userId: session.user.id,
          targetId: id,
          targetType: 'PRODUCT'
        }
      }
    }) : null,
  ]);

  if (!product) {
    return notFound();
  }

  // Hydrate with clean, serialized data
  const initialData = JSON.parse(JSON.stringify(product));
  const initialReviews = JSON.parse(JSON.stringify(reviews));

  // Structured Data (JSON-LD)
  const categoryName = product.categories?.[0]?.name || 'Fashion';
  const categorySlug = product.categories?.[0]?.name?.toLowerCase().replace(/\s+/g, '-') || 'fashion';
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const productSchema = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.name,
    "image": product.images,
    "description": product.description || `Premium ${categoryName} available in Ghana on TrendiZip.`,
    "sku": product.id,
    "inLanguage": "en-GH",
    "countryOfOrigin": { "@type": "Country", "name": "Ghana" },
    "category": categoryName,
    "brand": {
      "@type": "Brand",
      "name": product.professional.professionalProfile?.businessName || "TrendiZip"
    },
    ...(avgRating && reviews.length >= 1 ? {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": avgRating,
        "reviewCount": reviews.length,
        "bestRating": "5",
        "worstRating": "1"
      }
    } : {}),
    "offers": {
      "@type": "Offer",
      "url": `https://trendizip.com/shopping/products/${product.slug}`,
      "priceCurrency": product.currency,
      "price": product.price,
      "availability": product.isInStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "areaServed": { "@type": "Country", "name": "Ghana" },
      "seller": {
        "@type": "Organization",
        "name": product.professional.professionalProfile?.businessName || "TrendiZip"
      },
      "shippingDetails": {
        "@type": "OfferShippingDetails",
        "shippingRate": { "@type": "MonetaryAmount", "currency": "GHS" },
        "shippingDestination": {
          "@type": "DefinedRegion",
          "addressCountry": "GH"
        },
        "deliveryTime": {
          "@type": "ShippingDeliveryTime",
          "handlingTime": { "@type": "QuantitativeValue", "minValue": 1, "maxValue": 3, "unitCode": "DAY" },
          "transitTime": { "@type": "QuantitativeValue", "minValue": 1, "maxValue": 5, "unitCode": "DAY" }
        }
      },
      "hasMerchantReturnPolicy": {
        "@type": "MerchantReturnPolicy",
        "applicableCountry": "GH",
        "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
        "merchantReturnDays": 7,
        "returnMethod": "https://schema.org/ReturnByMail"
      }
    }
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://trendizip.com" },
      { "@type": "ListItem", "position": 2, "name": "Shop", "item": "https://trendizip.com/shopping" },
      { "@type": "ListItem", "position": 3, "name": categoryName, "item": `https://trendizip.com/shopping/categories/${categorySlug}` },
      { "@type": "ListItem", "position": 4, "name": product.name, "item": `https://trendizip.com/shopping/products/${product.slug}` }
    ]
  };

  return (
    <>
      <JsonLd schema={productSchema} />
      <JsonLd schema={breadcrumbSchema} />
      <ProductClient 
        initialProduct={initialData} 
        initialReviews={initialReviews}
        isLoggedIn={!!session?.user}
        hasPurchased={!!purchase}
        hasReviewed={!!hasReviewed}
      />
    </>
  );

}