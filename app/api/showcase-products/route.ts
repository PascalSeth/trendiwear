import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { mapErrorToResponse } from '@/lib/api-utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "12")
    const dashboard = searchParams.get("dashboard") === "true"

    let whereClause: Record<string, unknown> = {
      isActive: true,
      isInStock: true,
      isShowcaseApproved: true,
    }

    // For dashboard, allow SUPER_ADMIN/ADMIN to see all, PROFESSIONAL to see their own
    if (dashboard) {
      const user = await requireAuth()
      
      // SUPER_ADMIN and ADMIN can see all pending and approved
      if (user.role === "SUPER_ADMIN" || user.role === "ADMIN") {
        // Admins can see both pending and approved products
        whereClause = {
          OR: [
            { isShowcaseApproved: true },
            { submittedForShowcase: true },
          ],
        }
      } 
      // PROFESSIONAL can only see their own products (regardless of approval status)
      else if (user.role === "PROFESSIONAL") {
        whereClause = {
          professionalId: user.id,
          OR: [
            { isShowcaseApproved: true },
            { submittedForShowcase: true },
          ],
        }
      } 
      else {
        return NextResponse.json({ error: "Unauthorized access to showcase management" }, { status: 403 })
      }
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        categories: true,
        professional: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            professionalProfile: {
              select: {
                businessName: true,
                rating: true,
                totalReviews: true,
                experience: true,
                location: true,
                businessImage: true,
                slug: true,
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

    // OPTIMIZATION: Batch fetch reviews for all products in ONE query
    const productIds = products.map(p => p.id)
    const allReviews = await prisma.review.findMany({
      where: {
        targetId: { in: productIds },
        targetType: "PRODUCT",
      },
      select: { targetId: true, rating: true },
    })

    // Group reviews by product ID for constant-time lookup
    const reviewMap = allReviews.reduce((acc, rev) => {
      if (!acc[rev.targetId]) acc[rev.targetId] = { count: 0, sum: 0 }
      acc[rev.targetId].count++
      acc[rev.targetId].sum += rev.rating
      return acc
    }, {} as Record<string, { count: number; sum: number }>)

    // Transform products with reviews and seller info
    const transformedProducts = products.map((product) => {
      const stats = reviewMap[product.id] || { count: 0, sum: 0 }
      const reviewCount = stats.count
      const avgRating = reviewCount > 0 ? stats.sum / reviewCount : 0

      // Determine showcase status
      let showcaseStatus: "PENDING" | "APPROVED" | "REJECTED" = "PENDING"
      if (product.isShowcaseApproved) {
        showcaseStatus = "APPROVED"
      } else if (!product.submittedForShowcase) {
        showcaseStatus = "PENDING"
      }

      const isTrendiZip = product.professional.role === 'SUPER_ADMIN'
      
      const professional = isTrendiZip
        ? {
            ...product.professional,
            professionalProfile: {
              ...product.professional.professionalProfile,
              businessName: 'TrendiZip',
              businessImage: '/logo3d.jpg',
              slug: null,
            },
          }
        : product.professional

      return {
        ...product,
        professional,
        _count: {
          ...product._count,
          reviews: reviewCount,
        },
        averageRating: avgRating,
        showcaseStatus,
        isTrendiZip,
      }
    })

    if (dashboard) {
      const total = await prisma.product.count({
        where: {
          isActive: true,
          isInStock: true,
          isShowcaseApproved: true,
        },
      })

      return NextResponse.json({
        products: transformedProducts,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      })
    }

    return NextResponse.json(transformedProducts)
  } catch (error) {
    const { status, message } = mapErrorToResponse(error, { route: 'showcase-products.GET' })
    if (status === 401) return NextResponse.json({ error: message, toast: 'You must be logged in to continue.' }, { status })
    return NextResponse.json({ error: message }, { status })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()

    // Allow PROFESSIONAL to submit and SUPER_ADMIN to directly approve
    const allowedRoles = ["PROFESSIONAL", "ADMIN", "SUPER_ADMIN"]
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json({ error: "Only professionals and admins can submit products for showcase" }, { status: 403 })
    }

    const { productId } = await request.json()

    if (!productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 })
    }

    // Check if product exists and belongs to the user (if PROFESSIONAL)
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        categories: true,
        professional: {
          select: {
            id: true,
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

    // Professionals can only submit their own products
    if (user.role === "PROFESSIONAL" && product.professionalId !== user.id) {
      return NextResponse.json({ error: "You can only submit your own products" }, { status: 403 })
    }

    if (!product.isActive || !product.isInStock) {
      return NextResponse.json({ error: "Product must be active and in stock to be showcased" }, { status: 400 })
    }

    // Mark as submitted for showcase (pending approval)
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        submittedForShowcase: true,
        submittedAt: product.submittedAt || new Date(), // Keep original submission time if already submitted
      },
      include: {
        categories: true,
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
    const { status, message } = mapErrorToResponse(error, { route: 'showcase-products.POST' })
    if (status === 401) return NextResponse.json({ error: message, toast: 'You must be logged in to continue.' }, { status })
    return NextResponse.json({ error: message }, { status })
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
        categories: true,
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
    const { status, message } = mapErrorToResponse(error, { route: 'showcase-products.DELETE' })
    if (status === 401) return NextResponse.json({ error: message, toast: 'You must be logged in to continue.' }, { status })
    return NextResponse.json({ error: message }, { status })
  }
}