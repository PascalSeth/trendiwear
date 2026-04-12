import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { mapErrorToResponse } from "@/lib/api-utils"
import type { Prisma } from "@prisma/client"
import { createSlug } from "@/lib/utils"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { searchParams } = new URL(request.url)
    const includeProducts = searchParams.get("includeProducts") === "true"
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const page = Number.parseInt(searchParams.get("page") || "1")

    const resolvedParams = await params
    const categoryId = resolvedParams.id

    // Fetch the category with its children
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        parent: {
          select: { id: true, name: true, slug: true }
        },
        children: {
          where: { isActive: true },
          orderBy: { order: "asc" },
          select: {
            id: true,
            name: true,
            slug: true,
            imageUrl: true,
            _count: {
              select: {
                products: { where: { isActive: true, isInStock: true } },
              },
            },
          },
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

    let products: (Prisma.ProductGetPayload<{
      include: {
        categories: { select: { id: true, name: true, slug: true } },
        collections: { select: { id: true, name: true, slug: true } },
        professional: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            professionalProfile: {
              select: {
                businessName: true,
                businessImage: true,
                rating: true,
                totalReviews: true,
              },
            },
          },
        },
        _count: {
          select: {
            wishlistItems: true,
            cartItems: true,
            orderItems: true,
          },
        },
      }
    }> & { _count: { reviews: number } })[] = []
    let totalProducts = 0
    let pagination = null

    if (includeProducts) {
      // Get all child category IDs recursively
      const getAllChildIds = async (parentId: string): Promise<string[]> => {
        const children = await prisma.category.findMany({
          where: { parentId, isActive: true },
          select: { id: true },
        })
        const childIds = children.map(c => c.id)
        const nestedIds = await Promise.all(childIds.map(id => getAllChildIds(id)))
        return [...childIds, ...nestedIds.flat()]
      }

      const childIds = await getAllChildIds(categoryId)
      const allCategoryIds = [categoryId, ...childIds]

      // Fetch products from this category and all its children
      const where: Prisma.ProductWhereInput = {
        isActive: true,
        isInStock: true,
        categories: { some: { id: { in: allCategoryIds } } },
      }

      const [productsData, total] = await Promise.all([
        prisma.product.findMany({
          where,
          include: {
            categories: {
              select: { id: true, name: true, slug: true }
            },
            collections: {
              select: { id: true, name: true, slug: true }
            },
            professional: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                professionalProfile: {
                  select: {
                    businessName: true,
                    businessImage: true,
                    rating: true,
                    totalReviews: true,
                  },
                },
              },
            },
            _count: {
              select: {
                wishlistItems: true,
                cartItems: true,
                orderItems: true,
              },
            },
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: "desc" },
        }),
        prisma.product.count({ where }),
      ])

      // Add review counts
      products = await Promise.all(
        productsData.map(async (product) => {
          const reviewCount = await prisma.review.count({
            where: {
              targetId: product.id,
              targetType: "PRODUCT",
            },
          })

          return {
            ...product,
            _count: {
              ...product._count,
              reviews: reviewCount,
            },
          }
        })
      )

      totalProducts = total
      pagination = {
        page,
        limit,
        total: totalProducts,
        pages: Math.ceil(totalProducts / limit)
      }
    }

    return NextResponse.json({
      category,
      products,
      pagination,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await requireAdmin()

    const body = await request.json()
    const {
      name,
      slug,
      description,
      imageUrl,
      parentId,
      order,
      isActive,
    } = body

    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(slug && { slug: createSlug(slug) }),
        ...(description !== undefined && { description }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(parentId !== undefined && { parentId }),
        ...(order !== undefined && { order: Number(order) }),
        ...(isActive !== undefined && { isActive }),
      },
    })

    return NextResponse.json(category)
  } catch (error) {
    const { status, message } = mapErrorToResponse(error, { route: 'categories.[id].PATCH' })
    return NextResponse.json({ error: message }, { status })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return PATCH(request, { params })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await requireAdmin()

    // Check if category has children
    const childrenCount = await prisma.category.count({
      where: { parentId: id }
    })

    if (childrenCount > 0) {
      return NextResponse.json({ 
        error: "Cannot delete category with subcategories. Delete children first." 
      }, { status: 400 })
    }

    // Check if category has products
    const productsCount = await prisma.product.count({
      where: { categoryId: id }
    })

    if (productsCount > 0) {
      return NextResponse.json({ 
        error: "Cannot delete category with products. Reassign or delete products first." 
      }, { status: 400 })
    }

    await prisma.category.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Category deleted successfully" })
  } catch (error) {
     const { status, message } = mapErrorToResponse(error, { route: 'categories.[id].DELETE' })
     return NextResponse.json({ error: message }, { status })
  }
}