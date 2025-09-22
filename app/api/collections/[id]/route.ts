import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const collection = await prisma.collection.findUnique({
      where: { id },
      include: {
        category: true,
        _count: {
          select: {
            products: { where: { isActive: true, isInStock: true } },
          },
        },
      },
    })

    if (!collection) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 })
    }

    return NextResponse.json(collection)
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
    const { id } = await params
    await requireRole(["ADMIN", "SUPER_ADMIN"])
    const body = await request.json()

    const {
      name,
      slug,
      description,
      imageUrl,
      categoryId,
      season,
      isFeatured,
      order,
      isActive,
    }: {
      name?: string
      slug?: string
      description?: string
      imageUrl?: string
      categoryId?: string
      season?: "SPRING" | "SUMMER" | "FALL" | "WINTER" | "ALL_SEASON"
      isFeatured?: boolean
      order?: number
      isActive?: boolean
    } = body

    const collection = await prisma.collection.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(slug && { slug }),
        ...(description !== undefined && { description }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(categoryId !== undefined && { categoryId }),
        ...(season && { season }),
        ...(isFeatured !== undefined && { isFeatured }),
        ...(order !== undefined && { order }),
        ...(isActive !== undefined && { isActive }),
      },
      include: { category: true },
    })

    return NextResponse.json(collection)
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
    const { id } = await params
    await requireRole(["ADMIN", "SUPER_ADMIN"])

    // Check if collection has products
    const collection = await prisma.collection.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true }
        }
      }
    })

    if (!collection) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 })
    }

    if (collection._count.products > 0) {
      return NextResponse.json({
        error: "Cannot delete collection with existing products. Please remove products first."
      }, { status: 400 })
    }

    await prisma.collection.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Collection deleted successfully" })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}