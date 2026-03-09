import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"

// Helper function to calculate effective price with discount
function calculateEffectivePrice(product: {
  price: number
  discountPercentage?: number | null
  discountPrice?: number | null
  discountStartDate?: Date | null
  discountEndDate?: Date | null
  isOnSale?: boolean
}): { effectivePrice: number; isDiscountActive: boolean; discountAmount: number } {
  const now = new Date()
  
  const isWithinDateRange = 
    (!product.discountStartDate || new Date(product.discountStartDate) <= now) &&
    (!product.discountEndDate || new Date(product.discountEndDate) >= now)
  
  const hasDiscount = product.discountPercentage || product.discountPrice
  const isDiscountActive = Boolean(product.isOnSale && hasDiscount && isWithinDateRange)
  
  if (!isDiscountActive) {
    return { effectivePrice: product.price, isDiscountActive: false, discountAmount: 0 }
  }
  
  let effectivePrice = product.price
  
  if (product.discountPrice && product.discountPrice > 0) {
    effectivePrice = product.discountPrice
  } else if (product.discountPercentage && product.discountPercentage > 0) {
    effectivePrice = product.price * (1 - product.discountPercentage / 100)
  }
  
  const discountAmount = product.price - effectivePrice
  
  return { 
    effectivePrice: Math.round(effectivePrice * 100) / 100,
    isDiscountActive, 
    discountAmount: Math.round(discountAmount * 100) / 100 
  }
}

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

    // Calculate effective prices for each item
    const itemsWithDiscount = cartItems.map(item => {
      const { effectivePrice, isDiscountActive, discountAmount } = calculateEffectivePrice(item.product)
      return {
        ...item,
        product: {
          ...item.product,
          effectivePrice,
          isDiscountActive,
          discountAmount,
        },
      }
    })

    // Use effective price for subtotal calculation
    const subtotal = itemsWithDiscount.reduce((sum, item) => {
      const price = item.product.effectivePrice
      return sum + price * item.quantity
    }, 0)
    const itemCount = itemsWithDiscount.reduce((sum, item) => sum + item.quantity, 0)

    return NextResponse.json({
      items: itemsWithDiscount,
      summary: {
        itemCount,
        subtotal,
        estimatedTotal: subtotal * 1.03,
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

    // Calculate effective price for the item
    const { effectivePrice, isDiscountActive, discountAmount } = calculateEffectivePrice(cartItem.product)
    const itemWithDiscount = {
      ...cartItem,
      product: {
        ...cartItem.product,
        effectivePrice,
        isDiscountActive,
        discountAmount,
      },
    }

    return NextResponse.json({ item: itemWithDiscount }, { status: 201 })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
