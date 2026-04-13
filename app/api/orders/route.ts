import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { mapErrorToResponse } from '@/lib/api-utils'
import { PAYSTACK_CONFIG } from "@/lib/paystack"
import type { Prisma, OrderStatus, PaymentStatus } from "@prisma/client"

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

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const status = searchParams.get("status") as OrderStatus
    const view = searchParams.get("view") // 'buyer' or 'seller'

    const where: Prisma.OrderWhereInput = {}

    // Explicit View Filtering
    if (view === "buyer") {
      where.customerId = user.id
    } else if (view === "seller") {
      if (!["PROFESSIONAL", "ADMIN", "SUPER_ADMIN"].includes(user.role)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
      }
      where.items = { some: { professionalId: user.id } }
    } else {
      // Legacy / Default Behavior
      if (user.role === "CUSTOMER") {
        where.customerId = user.id
      } else if (user.role === "PROFESSIONAL") {
        where.items = { some: { professionalId: user.id } }
      } else if (!["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
      // Admins (with no view specified) get everything for dashboards
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
            where: view === "seller" ? { professionalId: user.id } : undefined,
            include: {
              product: {
                include: {
                  professional: {
                    include: {
                      professionalProfile: {
                        select: {
                          businessName: true,
                          location: true,
                          latitude: true,
                          longitude: true,
                        }
                      }
                    }
                  }
                }
              },
            },
          },
          deliveryConfirmations: {
            where: view === "seller" ? { professionalId: user.id } : undefined,
          },
          paymentEscrows: true,
          shippingInvoices: true,
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
      deliveryMethod,
      couponCode,
      paystackReference,
      paymentStatus,
    }: {
      addressId: string
      items: OrderItemInput[]
      deliveryZone?: string
      deliveryMethod?: 'PICKUP' | 'DELIVERY'
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

    // OPTIMIZATION: Batch fetch all needed products in ONE query
    const itemIds = items.map(i => i.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: itemIds } },
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

    const productMap = products.reduce((acc, p) => {
      acc[p.id] = p
      return acc
    }, {} as Record<string, typeof products[number]>)

    let subtotal = 0
    let shippingCost = 0
    const orderItems: Array<{
      productId: string;
      professionalId: string;
      quantity: number;
      size?: string;
      color?: string;
      price: number;
      notes?: string;
      isPreorder: boolean;
      estimatedDelivery: number | null;
    }> = []

    for (const item of items) {
      const product = productMap[item.productId]

      if (!product || !product.isActive) {
        return NextResponse.json({ error: `Product ${product?.name || item.productId} is not available` }, { status: 400 })
      }

      const totalAvailable = product.stockQuantity + (product.isPreorder ? (product.preorderLimit || 0) : 0);
      
      if (item.quantity > totalAvailable) {
        const errorMsg = totalAvailable === 0
          ? `Product ${product.name} is currently out of stock` 
          : `Insufficient availability for ${product.name}. Only ${totalAvailable} remaining (including pre-orders).`;
        return NextResponse.json({ error: errorMsg }, { status: 400 })
      }

      // Calculate effective price with any active discounts
      const { effectivePrice } = calculateEffectivePrice(product)
      const itemTotal = effectivePrice * item.quantity
      subtotal += itemTotal
      
      // Shipping is now paid offline (in person), so we don't calculate or charge it here
      shippingCost = 0

      orderItems.push({
        productId: item.productId,
        professionalId: product.professionalId,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
        price: effectivePrice,
        notes: item.notes,
        isPreorder: product.isPreorder,
        estimatedDelivery: product.estimatedDelivery,
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
        }
      }
    }

    const round = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100

    const platformFee = round((subtotal - discount) * (PAYSTACK_CONFIG.platformFeePercent / 100))
    const tax = 0
    const totalPrice = round(subtotal + shippingCost + platformFee + tax - discount)

    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          customerId: user.id,
          addressId,
          subtotal,
          shippingCost,
          tax,
          platformFee,
          totalPrice,
          deliveryZone,
          deliveryMethod: deliveryMethod || 'DELIVERY',
          items: { 
            create: orderItems.map(item => ({
              product: { connect: { id: item.productId } },
              professionalId: item.professionalId,
              quantity: item.quantity,
              size: item.size,
              color: item.color,
              price: item.price,
              notes: item.notes,
              isPreorder: item.isPreorder,
              estimatedDelivery: item.estimatedDelivery,
            }))
          },
          // Set payment info if provided (after successful payment)
          ...(paystackReference && { paystackReference }),
          ...(paymentStatus && { paymentStatus: paymentStatus as PaymentStatus }),
        },
      })

      return newOrder
    })

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    console.error("Order creation error:", error)
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
