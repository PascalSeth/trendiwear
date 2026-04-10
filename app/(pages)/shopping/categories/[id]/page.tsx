import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import CategoryDetailClient from './CategoryDetailClient';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // 1. Fetch category with children and basic counts
  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      parent: {
        select: { id: true, name: true, slug: true }
      },
      children: {
        where: { isActive: true },
        orderBy: { order: "asc" },
        select: {
          id: true,
          name: true,
          slug: true,
          imageUrl: true,
          _count: {
            select: {
              products: { where: { isActive: true, isInStock: true } },
            },
          },
        },
      },
      _count: {
        select: {
          products: { where: { isActive: true, isInStock: true } },
        },
      },
    },
  });

  if (!category) {
    return notFound();
  }

  // 2. Fetch all products recursively (including children)
  // Helper to get child IDs
  const getAllChildIds = async (parentId: string): Promise<string[]> => {
    const children = await prisma.category.findMany({
      where: { parentId, isActive: true },
      select: { id: true },
    });
    const childIds = children.map(c => c.id);
    const nestedIds = await Promise.all(childIds.map(id => getAllChildIds(id)));
    return [...childIds, ...nestedIds.flat()];
  };

  const childIds = await getAllChildIds(id);
  const allCategoryIds = [id, ...childIds];

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      isInStock: true,
      categories: { 
        some: { 
          id: { in: allCategoryIds } 
        } 
      }
    },
    include: {
      categories: {
        select: { id: true, name: true, slug: true }
      },
      collections: {
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
  const initialCategory = JSON.parse(JSON.stringify(category));
  const initialProducts = JSON.parse(JSON.stringify(products));

  return (
    <CategoryDetailClient 
      category={initialCategory} 
      initialProducts={initialProducts}
      availableColors={Array.from(colors).sort()}
      availableSizes={Array.from(sizes).sort()}
    />
  );
}