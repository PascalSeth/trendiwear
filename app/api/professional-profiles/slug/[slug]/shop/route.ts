import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // Get profile using the same logic as the existing slug route
    const profileResponse = await fetch(`${request.nextUrl.origin}/api/professional-profiles/slug/${slug}`)
    if (!profileResponse.ok) {
      return NextResponse.json({ error: "Professional profile not found" }, { status: 404 })
    }
    const profile = await profileResponse.json()

    // Get products by professional ID
    const products = await prisma.product.findMany({
      where: {
        professionalId: profile.userId,
        isActive: true,
        isInStock: true,
      },
      include: {
        category: {
          select: {
            name: true,
          },
        },
        collection: {
          select: {
            name: true,
          },
        },
        professional: {
          select: {
            firstName: true,
            lastName: true,
            professionalProfile: {
              select: {
                businessName: true,
                businessImage: true,
                rating: true,
                totalReviews: true,
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
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Get unique categories from products
    const categories = Array.from(
      new Set(products.map(product => product.categoryId))
    ).map(async (categoryId) => {
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
        select: { name: true }
      });
      return {
        name: category?.name || 'Unknown',
        productCount: products.filter(p => p.categoryId === categoryId).length,
      };
    });

    const resolvedCategories = await Promise.all(categories);

    return NextResponse.json({
      profile,
      products,
      categories: resolvedCategories,
      stats: {
        totalProducts: products.length,
        totalCategories: resolvedCategories.length,
      },
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}