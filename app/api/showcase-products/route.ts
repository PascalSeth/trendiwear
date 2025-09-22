import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        isInStock: true,
        isShowcaseApproved: true,
      },
      include: {
        category: true,
        professional: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            professionalProfile: {
              select: {
                businessName: true,
                rating: true,
                totalReviews: true,
                experience: true,
                location: true,
                businessImage: true,
              },
            },
          },
        },
        _count: {
          select: {
            wishlistItems: true,
            orderItems: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10, // Limit to 10 for showcase
    })

    // Add review counts
    const productsWithReviews = await Promise.all(
      products.map(async (product) => {
        const reviewCount = await prisma.review.count({
          where: {
            targetId: product.id,
            targetType: "PRODUCT",
          },
        })

        // Calculate average rating
        const reviews = await prisma.review.findMany({
          where: {
            targetId: product.id,
            targetType: "PRODUCT",
          },
          select: { rating: true },
        })

        const avgRating = reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : 0

        return {
          ...product,
          _count: {
            ...product._count,
            reviews: reviewCount,
          },
          averageRating: avgRating,
        }
      })
    )

    return NextResponse.json(productsWithReviews)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}