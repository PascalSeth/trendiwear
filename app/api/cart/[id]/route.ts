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

    console.log(`[cart.[id].PUT] Attempting to update cart item: ${id} to quantity: ${quantity} for user: ${user.id}`)

    if (quantity < 1) {
      return NextResponse.json({ error: "Quantity must be at least 1" }, { status: 400 })
    }

    const cartItem = await prisma.cartItem.findUnique({
      where: { id },
      include: { product: true },
    })

    if (!cartItem) {
      console.log(`[cart.[id].PUT] Cart item ${id} not found in DB.`)
      return NextResponse.json({ error: "Cart item not found" }, { status: 404 })
    }

    if (cartItem.userId !== user.id) {
       console.log(`[cart.[id].PUT] Cart item ${id} belongs to user ${cartItem.userId}, but requested by user ${user.id}.`)
       return NextResponse.json({ error: "Unauthorized access to cart item" }, { status: 403 })
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

    console.log(`[cart.[id].PUT] Successfully updated cart item ${id}`)
    return NextResponse.json(updatedItem)
  } catch (error) {
    console.error(`[cart.[id].PUT] Error:`, error)
    const { status, message } = mapErrorToResponse(error, { route: 'cart.[id].PUT' })
    if (status === 401) return NextResponse.json({ error: message, toast: 'You must be logged in to continue.' }, { status })
    return NextResponse.json({ error: message }, { status })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await requireAuth()

    console.log(`[cart.[id].DELETE] Attempting to remove cart item: ${id} for user: ${user.id} (${user.email})`)

    const cartItem = await prisma.cartItem.findUnique({
      where: { id },
    })

    if (!cartItem) {
      console.log(`[cart.[id].DELETE] Cart item ${id} not found at all in DB.`)
      return NextResponse.json({ error: "Cart item not found" }, { status: 404 })
    }

    if (cartItem.userId !== user.id) {
      console.log(`[cart.[id].DELETE] Cart item ${id} belongs to user ${cartItem.userId}, but requested by user ${user.id}.`)
      return NextResponse.json({ error: "Unauthorized access to cart item" }, { status: 403 })
    }

    await prisma.cartItem.delete({ where: { id } })
    console.log(`[cart.[id].DELETE] Successfully removed cart item ${id}`)
    return NextResponse.json({ message: "Item removed from cart" })
  } catch (error) {
    console.error(`[cart.[id].DELETE] Error:`, error)
    const { status, message } = mapErrorToResponse(error, { route: 'cart.[id].DELETE' })
    if (status === 401) return NextResponse.json({ error: message, toast: 'You must be logged in to continue.' }, { status })
    return NextResponse.json({ error: message }, { status })
  }
}
