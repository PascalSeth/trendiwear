import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { mapErrorToResponse } from '@/lib/api-utils'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { reviewId, comment } = await request.json()

    if (!reviewId || !comment) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const reply = await prisma.reviewReply.create({
      data: {
        reviewId,
        userId: user.id,
        comment,
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

    return NextResponse.json(reply)
  } catch (error) {
    const { status, message } = mapErrorToResponse(error)
    return NextResponse.json({ error: message }, { status })
  }
}
