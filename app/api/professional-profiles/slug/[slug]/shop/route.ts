import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Helper function to calculate effective price with discount
function calculateEffectivePrice(product: {
  price: number
  discountPercentage?: number | null
  discountPrice?: number | null
  discountStartDate?: Date | null
  discountEndDate?: Date | null
  isOnSale?: boolean
}): { effectivePrice: number; isDiscountActive: boolean; discountAmount: number } {
  const now = new Date()
  
  const isWithinDateRange = 
    (!product.discountStartDate || new Date(product.discountStartDate) <= now) &&
    (!product.discountEndDate || new Date(product.discountEndDate) >= now)
  
  const hasDiscount = product.discountPercentage || product.discountPrice
  const isDiscountActive = Boolean(product.isOnSale && hasDiscount && isWithinDateRange)
  
  if (!isDiscountActive) {
    return { effectivePrice: product.price, isDiscountActive: false, discountAmount: 0 }
  }
  
  let effectivePrice = product.price
  
  if (product.discountPrice && product.discountPrice > 0) {
    effectivePrice = product.discountPrice
  } else if (product.discountPercentage && product.discountPercentage > 0) {
    effectivePrice = product.price * (1 - product.discountPercentage / 100)
  }
  
  const discountAmount = product.price - effectivePrice
  
  return { 
    effectivePrice: Math.round(effectivePrice * 100) / 100,
    isDiscountActive, 
    discountAmount: Math.round(discountAmount * 100) / 100 
  }
}

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
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Calculate discount fields for each product
    const productsWithDiscount = products.map((product) => {
      const { effectivePrice, isDiscountActive, discountAmount } = calculateEffectivePrice(product)
      return {
        ...product,
        effectivePrice,
        isDiscountActive,
        discountAmount,
      }
    })

    // Get unique categories from products with images
    const categories = Array.from(
      new Set(products.map(product => product.categoryId))
    ).map(async (categoryId) => {
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
        select: { id: true, name: true, slug: true, imageUrl: true }
      });
      return {
        id: category?.id || categoryId,
        name: category?.name || 'Unknown',
        slug: category?.slug || 'unknown',
        imageUrl: category?.imageUrl || null,
        productCount: products.filter(p => p.categoryId === categoryId).length,
      };
    });

    const resolvedCategories = await Promise.all(categories);

    return NextResponse.json({
      profile,
      products: productsWithDiscount,
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