import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"

export async function GET() {
  try {
    const user = await requireAuth()

    const cartItems = await prisma.cartItem.findMany({
      where: { userId: user.id },
      include: {
        product: {
          include: {
            professional: {
              select: {
                firstName: true,
                lastName: true,
                professionalProfile: {
                  select: {
                    businessName: true,
                    deliveryZones: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
    const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)

    return NextResponse.json({
      items: cartItems,
      summary: {
        itemCount,
        subtotal,
        estimatedTotal: subtotal * 1.16,
      },
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { productId, quantity = 1, size, color } = body

    const product = await prisma.product.findUnique({
      where: { id: productId },
    })

    if (!product || !product.isActive || !product.isInStock) {
      return NextResponse.json({ error: "Product not available" }, { status: 400 })
    }

    if (product.stockQuantity < quantity) {
      return NextResponse.json({ error: "Insufficient stock" }, { status: 400 })
    }

    const existingItem = await prisma.cartItem.findUnique({
      where: {
        userId_productId_size_color: {
          userId: user.id,
          productId,
          size: size || "",
          color: color || "",
        },
      },
    })

    let cartItem
    if (existingItem) {
      cartItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
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
    } else {
      cartItem = await prisma.cartItem.create({
        data: {
          userId: user.id,
          productId,
          quantity,
          size,
          color,
        },
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
    }

    await prisma.product.update({
      where: { id: productId },
      data: { cartCount: { increment: 1 } },
    })

    return NextResponse.json(cartItem, { status: 201 })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
