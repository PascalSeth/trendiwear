import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"

// Reply to a review (for professionals/sellers)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const { replyText } = await request.json()

    if (!replyText || typeof replyText !== 'string' || replyText.trim().length === 0) {
      return NextResponse.json({ error: "Reply text is required" }, { status: 400 })
    }

    // Get the review to check if user can reply
    const review = await prisma.review.findUnique({
      where: { id },
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

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 })
    }

    // Check if user is authorized to reply
    // For product reviews, the product owner can reply
    // For professional reviews, the professional can reply
    // Admins can always reply
    let canReply = false

    if (["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      canReply = true
    } else if (review.targetType === "PRODUCT") {
      // Check if user owns the product
      const product = await prisma.product.findUnique({
        where: { id: review.targetId },
        select: { professionalId: true },
      })
      canReply = product?.professionalId === user.id
    } else if (review.targetType === "PROFESSIONAL") {
      // Check if the review is about this user
      canReply = review.targetId === user.id
    } else if (review.targetType === "SERVICE") {
      // Check if user owns the service
      const service = await prisma.professionalService.findUnique({
        where: { id: review.targetId },
        select: { professionalId: true },
      })
      canReply = service?.professionalId === user.id
    }

    if (!canReply) {
      return NextResponse.json({ error: "You are not authorized to reply to this review" }, { status: 403 })
    }

    // Update the review with the reply
    const updatedReview = await prisma.review.update({
      where: { id },
      data: {
        replyText: replyText.trim(),
        replyUserId: user.id,
        repliedAt: new Date(),
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
    })

    return NextResponse.json(updatedReview)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    if (!["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { id } = await params

    await prisma.review.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Review deleted successfully" })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}