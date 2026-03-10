import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { mapErrorToResponse } from '@/lib/api-utils'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()

    if (user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Only super admins can approve showcase products" }, { status: 403 })
    }

    const { id } = await params
    const { approved } = await request.json()

    if (typeof approved !== "boolean") {
      return NextResponse.json({ error: "Approved must be a boolean" }, { status: 400 })
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        isShowcaseApproved: approved,
        approvedAt: approved ? new Date() : null,
        approvedBy: approved ? user.id : null,
      },
      include: {
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

    return NextResponse.json(product)
  } catch (error) {
    const { status, message } = mapErrorToResponse(error, { route: 'products.[id].showcase.PUT' })
    if (status === 401) return NextResponse.json({ error: message, toast: 'You must be logged in to continue.' }, { status })
    return NextResponse.json({ error: message }, { status })
  }
}