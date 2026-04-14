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
    select: { name: true, description: true, images: true }
  });

  if (!product) return { title: 'Product Not Found' };

  return {
    title: product.name,
    description: product.description || `Shop ${product.name} on TrendiZip. Best quality luxury fashion.`,
    openGraph: {
      title: `${product.name} | TrendiZip`,
      description: product.description || `Discover ${product.name} on TrendiZip.`,
      images: product.images[0] ? [{ url: product.images[0] }] : [],
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
  const productSchema = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.name,
    "image": product.images,
    "description": product.description,
    "sku": product.id,
    "brand": {
      "@type": "Brand",
      "name": product.professional.professionalProfile?.businessName || "TrendiZip"
    },
    "offers": {
      "@type": "Offer",
      "url": `https://trendizip.com/shopping/products/${product.slug}`,
      "priceCurrency": product.currency,
      "price": product.price,
      "availability": product.isInStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": product.professional.professionalProfile?.businessName || "TrendiZip"
      }
    }
  };

  return (
    <>
      <JsonLd schema={productSchema} />
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