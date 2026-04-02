import { prisma } from '@/lib/prisma';
import ProductClient from './ProductClient';
import { notFound } from 'next/navigation';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Fetch product and reviews in parallel directly from the database
  const [product, reviews] = await Promise.all([
    prisma.product.findUnique({
      where: { id, isActive: true },
      include: {
        category: { select: { name: true } },
        collection: { select: { name: true } },
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
            firstName: true,
            lastName: true,
            profileImage: true,
          },
        },
        replyUser: {
          select: {
            firstName: true,
            lastName: true,
            profileImage: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ]);

  if (!product) {
    return notFound();
  }

  // Pre-calculate effective price or discounts if needed here on server
  // ... existing calculation logic is already in Client Component but moving basic ones here is fine

  // Hydrate with clean, serialized data
  const initialData = JSON.parse(JSON.stringify(product));
  const initialReviews = JSON.parse(JSON.stringify(reviews));

  return <ProductClient initialProduct={initialData} initialReviews={initialReviews} />;
}