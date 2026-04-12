// Product Detail Page - Community Edition
import { prisma } from '@/lib/prisma';
import ProductClient from './ProductClient';
import { notFound } from 'next/navigation';
import { getAuthSession } from '@/lib/auth';

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

  // Pre-calculate effective price or discounts if needed here on server
  // ... existing calculation logic is already in Client Component but moving basic ones here is fine

  // Hydrate with clean, serialized data
  const initialData = JSON.parse(JSON.stringify(product));
  const initialReviews = JSON.parse(JSON.stringify(reviews));

  return (
    <ProductClient 
      initialProduct={initialData} 
      initialReviews={initialReviews}
      isLoggedIn={!!session?.user}
      hasPurchased={!!purchase}
      hasReviewed={!!hasReviewed}
    />
  );

}