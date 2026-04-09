import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import CollectionDetailClient from './CollectionDetailClient';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Fetch collection and products in parallel on the server
  const collection = await prisma.collection.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          products: { where: { isActive: true, isInStock: true } },
        },
      },
    },
  });

  if (!collection) {
    return notFound();
  }

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      isInStock: true,
      collections: { some: { id } }
    },
    include: {
      category: {
        select: { id: true, name: true, slug: true }
      },
      professional: {
        select: {
          id: true,
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
        select: {
          wishlistItems: true,
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  // Extract available filters for the client
  const colors = new Set<string>();
  const sizes = new Set<string>();
  products.forEach((product) => {
    product.colors?.forEach(color => colors.add(color));
    product.sizes?.forEach(size => sizes.add(size));
  });

  // Prepare data for the client (serialization)
  const initialCollection = JSON.parse(JSON.stringify(collection));
  const initialProducts = JSON.parse(JSON.stringify(products));

  return (
    <CollectionDetailClient 
      collection={initialCollection} 
      products={initialProducts}
      availableColors={Array.from(colors).sort()}
      availableSizes={Array.from(sizes).sort()}
    />
  );
}
