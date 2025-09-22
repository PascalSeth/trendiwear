import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import type { Prisma } from "@prisma/client"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const outfit = await prisma.outfitInspiration.findUnique({
      where: { id },
      include: {
        event: true,
        stylist: {
          select: {
            firstName: true,
            lastName: true,
            professionalProfile: {
              select: { businessName: true },
            },
          },
        },
        products: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                images: true,
              },
            },
          },
        },
        _count: {
          select: { savedByUsers: true },
        },
      },
    })

    if (!outfit) {
      return NextResponse.json({ error: "Outfit inspiration not found" }, { status: 404 })
    }

    return NextResponse.json(outfit)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params

    const allowedRoles = ["PROFESSIONAL", "ADMIN", "SUPER_ADMIN"]

    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { error: "Only professionals, admins, or super admins can update outfit inspirations" },
        { status: 403 }
      )
    }

    const existingOutfit = await prisma.outfitInspiration.findUnique({
      where: { id },
    })

    if (!existingOutfit) {
      return NextResponse.json({ error: "Outfit inspiration not found" }, { status: 404 })
    }

    if (existingOutfit.stylistId !== user.id && !["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const {
      eventId,
      title,
      description,
      outfitImageUrl,
      totalPrice,
      tags,
      products,
      isFeatured,
      isActive,
    }: {
      eventId?: string
      title?: string
      description?: string
      outfitImageUrl?: string
      totalPrice?: number
      tags?: string[]
      products?: { productId: string; position?: number; notes?: string }[]
      isFeatured?: boolean
      isActive?: boolean
    } = await request.json()

    const updateData: Prisma.OutfitInspirationUpdateInput = {}
    if (eventId !== undefined) updateData.event = { connect: { id: eventId } }
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (outfitImageUrl !== undefined) updateData.outfitImageUrl = outfitImageUrl
    if (totalPrice !== undefined) updateData.totalPrice = totalPrice
    if (tags !== undefined) updateData.tags = tags
    if (isFeatured !== undefined) updateData.isFeatured = isFeatured
    if (isActive !== undefined) updateData.isActive = isActive

    if (products !== undefined) {
      // Delete existing products and create new ones
      await prisma.outfitProduct.deleteMany({
        where: { outfitId: id },
      })

      if (products.length > 0) {
        updateData.products = {
          create: products,
        }
      }
    }

    const outfit = await prisma.outfitInspiration.update({
      where: { id },
      data: updateData,
      include: {
        event: true,
        stylist: {
          select: {
            firstName: true,
            lastName: true,
            professionalProfile: {
              select: { businessName: true },
            },
          },
        },
        products: {
          include: {
            product: true,
          },
        },
      },
    })

    return NextResponse.json(outfit)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params

    const allowedRoles = ["PROFESSIONAL", "ADMIN", "SUPER_ADMIN"]

    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { error: "Only professionals, admins, or super admins can delete outfit inspirations" },
        { status: 403 }
      )
    }

    const existingOutfit = await prisma.outfitInspiration.findUnique({
      where: { id },
    })

    if (!existingOutfit) {
      return NextResponse.json({ error: "Outfit inspiration not found" }, { status: 404 })
    }

    if (existingOutfit.stylistId !== user.id && !["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await prisma.outfitInspiration.delete({ where: { id } })
    return NextResponse.json({ message: "Outfit inspiration deleted successfully" })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}