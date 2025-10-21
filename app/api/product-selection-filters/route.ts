import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const selectedCategoryId = searchParams.get("categoryId")

    // Get all parent categories (categories without parentId)
    const parentCategories = await prisma.category.findMany({
      where: {
        parentId: null,
        isActive: true
      },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { order: "asc" },
          select: {
            id: true,
            name: true,
            slug: true,
            imageUrl: true
          }
        },
        collections: {
          where: {
            isActive: true,
            ...(selectedCategoryId && { categoryId: selectedCategoryId })
          },
          orderBy: { order: "asc" },
          select: {
            id: true,
            name: true,
            slug: true,
            imageUrl: true
          }
        }
      },
      orderBy: { order: "asc" }
    })

    // If a category is selected, also get collections for that specific category
    let selectedCategoryCollections: Array<{ id: string; name: string; slug: string }> = []
    if (selectedCategoryId) {
      const category = await prisma.category.findUnique({
        where: { id: selectedCategoryId },
        include: {
          collections: {
            where: { isActive: true },
            orderBy: { order: "asc" },
            select: {
              id: true,
              name: true,
              slug: true,
              imageUrl: true
            }
          }
        }
      })
      selectedCategoryCollections = category?.collections || []
    }

    return NextResponse.json({
      parentCategories,
      selectedCategoryCollections,
      selectedCategoryId
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}