import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "12")
    const dashboard = searchParams.get("dashboard") === "true"

    // For dashboard, require super admin auth
    if (dashboard) {
      const user = await requireAuth()
      if (user.role !== "SUPER_ADMIN") {
        return NextResponse.json({ error: "Only super admins can access showcase management" }, { status: 403 })
      }
    }

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
        approvedAt: "desc",
      },
      skip: dashboard ? (page - 1) * limit : 0,
      take: dashboard ? limit : 10, // Limit to 10 for public showcase
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

    if (dashboard) {
      const total = await prisma.product.count({
        where: {
          isActive: true,
          isInStock: true,
          isShowcaseApproved: true,
        },
      })

      return NextResponse.json({
        products: productsWithReviews,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      })
    }

    return NextResponse.json(productsWithReviews)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()

    if (user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Only super admins can manage showcase products" }, { status: 403 })
    }

    const { productId } = await request.json()

    if (!productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 })
    }

    // Check if product exists and is active
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
        professional: {
          select: {
            firstName: true,
            lastName: true,
            professionalProfile: {
              select: { businessName: true },
            },
          },
        },
      },
    })

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    if (!product.isActive || !product.isInStock) {
      return NextResponse.json({ error: "Product must be active and in stock to be showcased" }, { status: 400 })
    }

    // Update product to be showcased
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        isShowcaseApproved: true,
        approvedAt: new Date(),
        approvedBy: user.id,
      },
      include: {
        category: true,
        professional: {
          select: {
            firstName: true,
            lastName: true,
            professionalProfile: {
              select: { businessName: true },
            },
          },
        },
      },
    })

    return NextResponse.json(updatedProduct, { status: 201 })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth()

    if (user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Only super admins can manage showcase products" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get("productId")

    if (!productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 })
    }

    // Check if product exists and is currently showcased
    const product = await prisma.product.findUnique({
      where: { id: productId },
    })

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    if (!product.isShowcaseApproved) {
      return NextResponse.json({ error: "Product is not currently in showcase" }, { status: 400 })
    }

    // Remove product from showcase
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        isShowcaseApproved: false,
        approvedAt: null,
        approvedBy: null,
      },
      include: {
        category: true,
        professional: {
          select: {
            firstName: true,
            lastName: true,
            professionalProfile: {
              select: { businessName: true },
            },
          },
        },
      },
    })

    return NextResponse.json(updatedProduct)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}