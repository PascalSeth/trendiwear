import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import type { Prisma } from "@prisma/client"

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
  
  // Check if discount is currently active
  const isWithinDateRange = 
    (!product.discountStartDate || new Date(product.discountStartDate) <= now) &&
    (!product.discountEndDate || new Date(product.discountEndDate) >= now)
  
  const hasDiscount = product.discountPercentage || product.discountPrice
  const isDiscountActive = Boolean(product.isOnSale && hasDiscount && isWithinDateRange)
  
  if (!isDiscountActive) {
    return { effectivePrice: product.price, isDiscountActive: false, discountAmount: 0 }
  }
  
  // Calculate effective price
  let effectivePrice = product.price
  
  if (product.discountPrice && product.discountPrice > 0) {
    // Fixed discount price takes priority
    effectivePrice = product.discountPrice
  } else if (product.discountPercentage && product.discountPercentage > 0) {
    // Calculate percentage discount
    effectivePrice = product.price * (1 - product.discountPercentage / 100)
  }
  
  const discountAmount = product.price - effectivePrice
  
  return { 
    effectivePrice: Math.round(effectivePrice * 100) / 100,
    isDiscountActive, 
    discountAmount: Math.round(discountAmount * 100) / 100 
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    await prisma.product.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    })

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        collection: true,
        professional: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            professionalProfile: {
              select: {
                businessName: true,
                businessImage: true,
                rating: true,
                totalReviews: true,
                location: true,
                deliveryZones: true,
                isVerified: true,
              },
            },
          },
        },
        _count: {
          select: {
            wishlistItems: true,
            cartItems: true,
          },
        },
      },
    })

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    // Calculate effective price with discount
    const { effectivePrice, isDiscountActive, discountAmount } = calculateEffectivePrice(product)

    // For SUPER_ADMIN created products, show TrendiZip as the business
    const professional = product.professional.role === 'SUPER_ADMIN'
      ? {
          ...product.professional,
          professionalProfile: {
            businessName: 'TrendiZip',
            businessImage: '/logo3d.jpg',
            rating: 5,
            totalReviews: 0,
            location: null,
            deliveryZones: [],
            isVerified: true,
          },
        }
      : product.professional

    return NextResponse.json({
      ...product,
      professional,
      effectivePrice,
      isDiscountActive,
      discountAmount,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await requireAuth()
    const body = await request.json()

    const existingProduct = await prisma.product.findUnique({
      where: { id },
    })

    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    if (existingProduct.professionalId !== user.id && !["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const updateData: Prisma.ProductUpdateInput = { ...body }
    if (body.price) updateData.price = Number.parseFloat(body.price)
    if (body.stockQuantity !== undefined) updateData.stockQuantity = Number.parseInt(body.stockQuantity)
    if (body.estimatedDelivery !== undefined) updateData.estimatedDelivery = Number.parseInt(body.estimatedDelivery)
    if (body.discountPercentage !== undefined) updateData.discountPercentage = body.discountPercentage ? Number.parseFloat(body.discountPercentage) : null
    if (body.discountPrice !== undefined) updateData.discountPrice = body.discountPrice ? Number.parseFloat(body.discountPrice) : null
    if (body.discountStartDate !== undefined) updateData.discountStartDate = body.discountStartDate ? new Date(body.discountStartDate) : null
    if (body.discountEndDate !== undefined) updateData.discountEndDate = body.discountEndDate ? new Date(body.discountEndDate) : null
    if (body.isOnSale !== undefined) updateData.isOnSale = Boolean(body.isOnSale)

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        collection: true,
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
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await requireAuth()

    const existingProduct = await prisma.product.findUnique({
      where: { id },
    })

    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    if (existingProduct.professionalId !== user.id && !["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await prisma.product.delete({ where: { id } })
    return NextResponse.json({ message: "Product deleted successfully" })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
