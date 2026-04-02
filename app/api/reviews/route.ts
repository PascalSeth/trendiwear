import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { mapErrorToResponse } from '@/lib/api-utils'
import type { Prisma, ReviewType } from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const targetId = searchParams.get("targetId")
    const targetType = searchParams.get("targetType") as ReviewType
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const rating = searchParams.get("rating")

    const where: Prisma.ReviewWhereInput = {}
    if (targetId) where.targetId = targetId
    if (targetType) where.targetType = targetType
    if (rating) where.rating = Number.parseInt(rating)

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
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
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.review.count({ where }),
    ])

    return NextResponse.json({
      reviews,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    const { status, message } = mapErrorToResponse(error, { route: 'reviews.GET' })
    if (status === 401) return NextResponse.json({ error: message, toast: 'You must be logged in to continue.' }, { status })
    return NextResponse.json({ error: message }, { status })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const {
      targetId,
      targetType,
      orderId,
      rating,
      title,
      comment,
      images,
    }: {
      targetId: string
      targetType: ReviewType
      orderId?: string
      rating: number
      title?: string
      comment?: string
      images?: string[]
    } = body

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 })
    }

    const existingReview = await prisma.review.findUnique({
      where: {
        userId_targetId_targetType: {
          userId: user.id,
          targetId,
          targetType,
        },
      },
    })

    if (existingReview) {
      return NextResponse.json({ error: "You have already reviewed this item" }, { status: 400 })
    }

    let targetOrderId = orderId
    let isVerified = false

    // ENFORCE PURCHASE VERIFICATION FOR PRODUCTS
    if (targetType === "PRODUCT") {
      const purchase = await prisma.order.findFirst({
        where: {
          customerId: user.id,
          status: "DELIVERED",
          items: {
            some: { productId: targetId }
          }
        },
        orderBy: { createdAt: 'desc' },
        select: { id: true }
      })

      if (!purchase) {
        return NextResponse.json({ 
          error: "You must purchase and receive this product before leaving a review." 
        }, { status: 403 })
      }
      
      targetOrderId = purchase.id
      isVerified = true
    }

    const review = await prisma.review.create({
      data: {
        userId: user.id,
        targetId,
        targetType,
        orderId: targetOrderId,
        rating,
        title,
        comment,
        images: images || [],
        isVerified,
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            profileImage: true,
          },
        },
      },
    })

    // UPDATE RATINGS
    if (targetType === "PROFESSIONAL") {
      const professionalReviews = await prisma.review.findMany({
        where: { targetId, targetType: "PROFESSIONAL" },
      })

      const sumOfRatings = professionalReviews.reduce((sum, r) => sum + r.rating, 0)
      const totalReviews = professionalReviews.length
      
      // Calculate a true average for more accuracy
      const avgRating = sumOfRatings / totalReviews

      await prisma.professionalProfile.update({
        where: { userId: targetId },
        data: {
          rating: avgRating,
          totalReviews,
        },
      })
    } else if (targetType === "PRODUCT") {
      // Find the professional ID for this product to update their overall Artisan rating
      const product = await prisma.product.findUnique({
        where: { id: targetId },
        select: { professionalId: true }
      })

      const productReviews = await prisma.review.findMany({
        where: { targetId, targetType: "PRODUCT" },
      })

      const sumOfRatings = productReviews.reduce((sum, r) => sum + r.rating, 0)
      const totalReviews = productReviews.length
      const avgRating = sumOfRatings / totalReviews

      // Update product analytics
      await prisma.productAnalytics.upsert({
        where: { productId: targetId },
        create: {
          productId: targetId,
          avgRating,
        },
        update: {
          avgRating,
        }
      })

      // Update the Professional's overall rating too (Arisan Rating)
      if (product?.professionalId) {
        // Average of ALL reviews related to this professional (Product + Service + Professional)
        const allReviews = await prisma.review.findMany({
          where: { 
            OR: [
              { targetId: product.professionalId, targetType: "PROFESSIONAL" },
              { 
                targetType: "PRODUCT", 
                targetId: { in: (await prisma.product.findMany({ 
                  where: { professionalId: product.professionalId }, 
                  select: { id: true } 
                })).map(p => p.id) } 
              }
            ]
          }
        })

        const totalSum = allReviews.reduce((sum, r) => sum + r.rating, 0)
        const totalCount = allReviews.length
        
        await prisma.professionalProfile.update({
          where: { userId: product.professionalId },
          data: {
            rating: totalSum / totalCount,
            totalReviews: totalCount
          }
        })
      }
    }

    return NextResponse.json(review, { status: 201 })
  } catch (error) {
    const { status, message } = mapErrorToResponse(error, { route: 'reviews.POST' })
    if (status === 401) return NextResponse.json({ error: message, toast: 'You must be logged in to continue.' }, { status })
    return NextResponse.json({ error: message }, { status })
  }
}
