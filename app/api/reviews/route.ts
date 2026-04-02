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

    let isVerified = false
    if (orderId) {
      const order = await prisma.order.findFirst({
        where: {
          id: orderId,
          customerId: user.id,
          status: "DELIVERED",
        },
        include: { items: true },
      })

      if (order) {
        if (targetType === "PRODUCT") {
          isVerified = order.items.some((item) => item.productId === targetId)
        } else if (targetType === "PROFESSIONAL") {
          isVerified = order.items.some((item) => item.professionalId === targetId)
        }
      }
    }

    const review = await prisma.review.create({
      data: {
        userId: user.id,
        targetId,
        targetType,
        orderId,
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

    if (targetType === "PROFESSIONAL") {
      const professionalReviews = await prisma.review.findMany({
        where: { targetId, targetType: "PROFESSIONAL" },
      })

      const sumOfRatings = professionalReviews.reduce((sum, r) => sum + r.rating, 0)
      const totalReviews = professionalReviews.length
      
      // Inject the base default seed of 4.0 algorithm
      const baselineRating = 4.0;
      const baselineWeight = 1;
      const avgRating = (baselineRating * baselineWeight + sumOfRatings) / (baselineWeight + totalReviews)

      await prisma.professionalProfile.update({
        where: { userId: targetId },
        data: {
          rating: avgRating,
          totalReviews,
        },
      })
    } else if (targetType === "PRODUCT") {
      const productReviews = await prisma.review.findMany({
        where: { targetId, targetType: "PRODUCT" },
      })

      const sumOfRatings = productReviews.reduce((sum, r) => sum + r.rating, 0)
      const totalReviews = productReviews.length
      
      const baselineRating = 4.0;
      const baselineWeight = 1;
      const avgRating = (baselineRating * baselineWeight + sumOfRatings) / (baselineWeight + totalReviews)

      await prisma.productAnalytics.upsert({
        where: { productId: targetId },
        create: {
          productId: targetId,
          avgRating,
        },
        update: {
          avgRating,
        }
      }).catch(e => console.error("Could not update missing product analytics", e))
    }

    return NextResponse.json(review, { status: 201 })
  } catch (error) {
    const { status, message } = mapErrorToResponse(error, { route: 'reviews.POST' })
    if (status === 401) return NextResponse.json({ error: message, toast: 'You must be logged in to continue.' }, { status })
    return NextResponse.json({ error: message }, { status })
  }
}
