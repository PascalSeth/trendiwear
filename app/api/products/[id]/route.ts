import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { mapErrorToResponse } from '@/lib/api-utils'
import { suggestTags } from "@/lib/fashion-engine"
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

    // FIRE AND FORGET VIEW INCREMENT (SPEED OPTIMIZATION)
    prisma.product.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    }).catch(e => console.error("View Count Failed:", e))

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        categories: true,
        collections: true,
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
                momoNumber: true,
                paymentSetupComplete: true,
                isVerified: true,
                slug: true,
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

    // If the professional hasn't set up mobile money (momoNumber), treat the
    // product as unavailable to public users. Allow owners and admins to view it.
    let viewer = null
    try {
      viewer = await requireAuth()
    } catch {
      // unauthenticated viewer
    }

    const profProfile = product.professional.professionalProfile
    const sellerHasMomo = Boolean(profProfile?.momoNumber)
    const viewerIsOwner = viewer && viewer.id === product.professionalId
    const viewerIsAdmin = viewer && ["ADMIN", "SUPER_ADMIN"].includes(viewer.role)

    if (!sellerHasMomo && !viewerIsOwner && !viewerIsAdmin && product.professional.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: "Product not available" }, { status: 404 })
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
  } catch (error: unknown) {
    const { status, message } = mapErrorToResponse(error, { route: 'products.[id].GET' })
    if (status === 401) return NextResponse.json({ error: message, toast: 'You must be logged in to continue.' }, { status })
    return NextResponse.json({ error: message }, { status })
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

    // Enforce Verified Tier for Pre-orders
    if (body.isPreorder) {
      const profile = await prisma.professionalProfile.findUnique({
        where: { userId: user.id },
      });
      if (!profile || !profile.isVerified) {
         return NextResponse.json(
            { error: "Only Verified Professionals can accept Pre-orders." },
            { status: 403 }
         );
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { collectionIds, collectionId, categoryIds, categoryId, ...restBody } = body
    const updateData: Prisma.ProductUpdateInput = { ...restBody }
    
    if (collectionIds !== undefined) {
      updateData.collections = {
        set: collectionIds.map((id: string) => ({ id }))
      }
    }

    if (categoryIds !== undefined) {
      updateData.categories = {
        set: categoryIds.map((id: string) => ({ id }))
      }
      // Also update legacy field if provided
      if (categoryIds.length > 0) {
        updateData.categoryId = categoryIds[0]
      }
    } else if (categoryId !== undefined) {
      updateData.categoryId = categoryId
      updateData.categories = {
        set: [{ id: categoryId }]
      }
    }

    // DISCOVERY ENGINE: Auto-update tags if name or description changed
    if (body.name !== undefined || body.description !== undefined) {
      const newName = body.name !== undefined ? body.name : existingProduct.name;
      const newDescription = body.description !== undefined ? body.description : existingProduct.description;
      const autoTags = suggestTags(newName, newDescription);
      updateData.styleTags = autoTags.styles;
      updateData.keywords = autoTags.keywords;
    }

    if (body.price) updateData.price = Number.parseFloat(body.price)
    if (body.stockQuantity !== undefined) updateData.stockQuantity = Number.parseInt(body.stockQuantity)
    if (body.preorderLimit !== undefined) updateData.preorderLimit = Number.parseInt(body.preorderLimit)
    if (body.estimatedDelivery !== undefined) updateData.estimatedDelivery = Number.parseInt(body.estimatedDelivery)
    if (body.discountType !== undefined) updateData.discountType = body.discountType
    if (body.discountPercentage !== undefined) updateData.discountPercentage = body.discountPercentage ? Number.parseFloat(body.discountPercentage) : null
    if (body.discountPrice !== undefined) updateData.discountPrice = body.discountPrice ? Number.parseFloat(body.discountPrice) : null
    if (body.discountStartDate !== undefined) updateData.discountStartDate = body.discountStartDate ? new Date(body.discountStartDate) : null
    if (body.discountEndDate !== undefined) updateData.discountEndDate = body.discountEndDate ? new Date(body.discountEndDate) : null
    if (body.isOnSale !== undefined) updateData.isOnSale = Boolean(body.isOnSale)
    if (body.allowPickup !== undefined) updateData.allowPickup = Boolean(body.allowPickup)
    if (body.allowDelivery !== undefined) updateData.allowDelivery = Boolean(body.allowDelivery)
    if (body.isPreorder !== undefined) updateData.isPreorder = Boolean(body.isPreorder)

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        categories: true,
        collections: true,
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
  } catch (error: unknown) {
    const { status, message } = mapErrorToResponse(error, { route: 'products.[id].PUT' })
    if (status === 401) return NextResponse.json({ error: message, toast: 'You must be logged in to continue.' }, { status })
    return NextResponse.json({ error: message }, { status })
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
  } catch (error: unknown) {
    const { status, message } = mapErrorToResponse(error, { route: 'products.[id].DELETE' })
    if (status === 401) return NextResponse.json({ error: message, toast: 'You must be logged in to continue.' }, { status })
    return NextResponse.json({ error: message }, { status })
  }
}
