import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { mapErrorToResponse } from '@/lib/api-utils'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await requireAuth()
    const body = await request.json()
    const { quantity } = body

    if (quantity < 1) {
      return NextResponse.json({ error: "Quantity must be at least 1" }, { status: 400 })
    }

    const cartItem = await prisma.cartItem.findFirst({
      where: { id, userId: user.id },
      include: { product: true },
    })

    if (!cartItem) {
      return NextResponse.json({ error: "Cart item not found" }, { status: 404 })
    }

    if (cartItem.product.stockQuantity < quantity) {
      return NextResponse.json({ error: "Insufficient stock" }, { status: 400 })
    }

    const updatedItem = await prisma.cartItem.update({
      where: { id },
      data: { quantity },
      include: {
        product: {
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
        },
      },
    })

    return NextResponse.json(updatedItem)
  } catch (error) {
    const { status, message } = mapErrorToResponse(error, { route: 'cart.[id].PUT' })
    if (status === 401) return NextResponse.json({ error: message, toast: 'You must be logged in to continue.' }, { status })
    return NextResponse.json({ error: message }, { status })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await requireAuth()

    const cartItem = await prisma.cartItem.findFirst({
      where: { id, userId: user.id },
    })

    if (!cartItem) {
      return NextResponse.json({ error: "Cart item not found" }, { status: 404 })
    }

    await prisma.cartItem.delete({ where: { id } })
    return NextResponse.json({ message: "Item removed from cart" })
  } catch (error) {
    const { status, message } = mapErrorToResponse(error, { route: 'cart.[id].DELETE' })
    if (status === 401) return NextResponse.json({ error: message, toast: 'You must be logged in to continue.' }, { status })
    return NextResponse.json({ error: message }, { status })
  }
}
