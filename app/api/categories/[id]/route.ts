import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { order: "asc" },
        },
        collections: {
          where: { isActive: true },
          orderBy: { order: "asc" },
        },
        _count: {
          select: {
            products: { where: { isActive: true, isInStock: true } },
          },
        },
      },
    })

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }

    return NextResponse.json(category)
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
    await requireRole(["ADMIN", "SUPER_ADMIN"])
    const { id } = await params;
    const body = await request.json()

    const {
      name,
      slug,
      description,
      imageUrl,
      parentId,
      order,
      isActive,
    }: {
      name?: string
      slug?: string
      description?: string
      imageUrl?: string
      parentId?: string
      order?: number
      isActive?: boolean
    } = body

    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(slug && { slug }),
        ...(description !== undefined && { description }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(parentId !== undefined && { parentId }),
        ...(order !== undefined && { order }),
        ...(isActive !== undefined && { isActive }),
      },
      include: { parent: true, children: true },
    })

    return NextResponse.json(category)
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
    await requireRole(["ADMIN", "SUPER_ADMIN"])
    const { id } = await params;

    // Check if category has children or collections
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        children: true,
        collections: true,
        _count: {
          select: { products: true }
        }
      }
    })

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }

    if (category.children.length > 0 || category.collections.length > 0 || category._count.products > 0) {
      return NextResponse.json({
        error: "Cannot delete category with existing children, collections, or products. Please remove dependencies first."
      }, { status: 400 })
    }

    await prisma.category.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Category deleted successfully" })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}