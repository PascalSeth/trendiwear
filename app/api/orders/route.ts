import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { mapErrorToResponse } from '@/lib/api-utils'
import type { Prisma, OrderStatus, PaymentStatus } from "@prisma/client"

// Helper function to calculate effective price with discount
function calculateEffectivePrice(product: {
  price: number
  discountPercentage?: number | null
  discountPrice?: number | null
  discountStartDate?: Date | null
  discountEndDate?: Date | null
  isOnSale?: boolean
}): { effectivePrice: number; isDiscountActive: boolean } {
  const now = new Date()
  
  const isWithinDateRange = 
    (!product.discountStartDate || new Date(product.discountStartDate) <= now) &&
    (!product.discountEndDate || new Date(product.discountEndDate) >= now)
  
  const hasDiscount = product.discountPercentage || product.discountPrice
  const isDiscountActive = Boolean(product.isOnSale && hasDiscount && isWithinDateRange)
  
  if (!isDiscountActive) {
    return { effectivePrice: product.price, isDiscountActive: false }
  }
  
  let effectivePrice = product.price
  
  if (product.discountPrice && product.discountPrice > 0) {
    effectivePrice = product.discountPrice
  } else if (product.discountPercentage && product.discountPercentage > 0) {
    effectivePrice = product.price * (1 - product.discountPercentage / 100)
  }
  
  return { effectivePrice: Math.round(effectivePrice * 100) / 100, isDiscountActive }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const status = searchParams.get("status") as OrderStatus

    const where: Prisma.OrderWhereInput = {}

    if (user.role === "CUSTOMER") {
      where.customerId = user.id
    } else if (user.role === "PROFESSIONAL") {
      where.items = {
        some: { professionalId: user.id },
      }
    } else if (!["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (status) where.status = status

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          customer: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              profileImage: true,
            },
          },
          address: true,
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  images: true,
                  price: true,
                },
              },
            },
          },
          deliveryConfirmation: true,
          paymentEscrow: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.order.count({ where }),
    ])

    return NextResponse.json({
      orders,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    const { status, message } = mapErrorToResponse(error, { route: 'orders' })
    if (status === 401) return NextResponse.json({ error: message, toast: 'You must be logged in to continue.' }, { status })
    return NextResponse.json({ error: message }, { status })
  }
}

interface OrderItemInput {
  productId: string
  quantity: number
  size?: string
  color?: string
  notes?: string
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    const {
      addressId,
      items,
      deliveryZone,
      couponCode,
      paystackReference,
      paymentStatus,
    }: {
      addressId: string
      items: OrderItemInput[]
      deliveryZone?: string
      couponCode?: string
      paystackReference?: string
      paymentStatus?: string
    } = body

    const address = await prisma.address.findFirst({
      where: { id: addressId, userId: user.id },
    })

    if (!address) {
      return NextResponse.json({ error: "Invalid address" }, { status: 400 })
    }

    let subtotal = 0
    let shippingCost = 0
    const orderItems: Prisma.OrderItemCreateWithoutOrderInput[] = []

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: {
          professional: {
            include: {
              professionalProfile: {
                include: { deliveryZones: true },
              },
            },
          },
        },
      })

      if (!product || !product.isActive || !product.isInStock) {
        return NextResponse.json({ error: `Product ${item.productId} is not available` }, { status: 400 })
      }

      if (product.stockQuantity < item.quantity) {
        return NextResponse.json({ error: `Insufficient stock for ${product.name}` }, { status: 400 })
      }

      // Calculate effective price with any active discounts
      const { effectivePrice } = calculateEffectivePrice(product)
      const itemTotal = effectivePrice * item.quantity
      subtotal += itemTotal

      if (deliveryZone && product.professional.professionalProfile?.deliveryZones) {
        const zone = product.professional.professionalProfile.deliveryZones.find((z) => z.zoneName === deliveryZone)
        if (zone) {
          const freeDeliveryThreshold =
            zone.freeDeliveryAbove || product.professional.professionalProfile.freeDeliveryThreshold
          if (!freeDeliveryThreshold || itemTotal < freeDeliveryThreshold) {
            shippingCost += zone.baseDeliveryFee
          }
        }
      }

      orderItems.push({
        product: { connect: { id: item.productId } },
        professionalId: product.professionalId,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
        price: effectivePrice,
        notes: item.notes,
      })
    }

    let discount = 0
    if (couponCode) {
      const coupon = await prisma.coupon.findFirst({
        where: {
          code: couponCode,
          isActive: true,
          validFrom: { lte: new Date() },
          validUntil: { gte: new Date() },
        },
      })

      if (coupon && (!coupon.minOrderAmount || subtotal >= coupon.minOrderAmount)) {
        if (coupon.type === "PERCENTAGE") {
          discount = Math.min((subtotal * coupon.value) / 100, coupon.maxDiscount || Number.POSITIVE_INFINITY)
        } else if (coupon.type === "FIXED_AMOUNT") {
          discount = Math.min(coupon.value, subtotal)
        } else if (coupon.type === "FREE_SHIPPING") {
          discount = shippingCost
        }
      }
    }

    const tax = (subtotal - discount) * 0.03
    const totalPrice = subtotal + shippingCost + tax - discount

    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          customerId: user.id,
          addressId,
          subtotal,
          shippingCost,
          tax,
          totalPrice,
          deliveryZone,
          items: { create: orderItems },
          // Set payment info if provided (after successful payment)
          ...(paystackReference && { paystackReference }),
          ...(paymentStatus && { paymentStatus: paymentStatus as PaymentStatus }),
        },
        include: {
          items: { include: { product: true } },
        },
      })

      // Update product stock using the original item input
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: { decrement: item.quantity },
            soldCount: { increment: item.quantity },
          },
        })
      }

      // Clear cart items
      await tx.cartItem.deleteMany({
        where: {
          userId: user.id,
          productId: { in: items.map((item) => item.productId) },
        },
      })

      const professionalTotals = new Map<string, number>()
      for (const item of newOrder.items) {
        const current = professionalTotals.get(item.professionalId) || 0
        professionalTotals.set(item.professionalId, current + item.price * item.quantity)
      }

      for (const [professionalId, amount] of Array.from(professionalTotals.entries())) {
        await tx.paymentEscrow.create({
          data: {
            orderId: newOrder.id,
            professionalId,
            amount,
            releaseDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          },
        })

        // Notify the professional about the new order
        await tx.notification.create({
          data: {
            userId: professionalId,
            type: 'ORDER_UPDATE',
            title: 'New Order Received!',
            message: `You have a new order worth GHS ${amount.toFixed(2)}. Check your dashboard to process it.`,
            data: JSON.stringify({ orderId: newOrder.id, amount }),
          },
        })
      }

      // Notify the customer about successful order
      await tx.notification.create({
        data: {
          userId: user.id,
          type: 'ORDER_UPDATE',
          title: 'Order Placed Successfully!',
          message: `Your order #${newOrder.id.slice(-8).toUpperCase()} has been placed. Total: GHS ${newOrder.totalPrice.toFixed(2)}`,
          data: JSON.stringify({ orderId: newOrder.id, totalPrice: newOrder.totalPrice }),
        },
      })

      return newOrder
    })

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
