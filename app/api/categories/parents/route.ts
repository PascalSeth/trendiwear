import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeProducts = searchParams.get("includeProducts") === "true"

    // Fetch only parent categories where parentId is null
    const where: Prisma.CategoryWhereInput = {
      parentId: null,
    }

    const categories = await prisma.category.findMany({
      where,
      include: {
        collections: {
          where: { isActive: true },
          orderBy: { order: "asc" },
          select: { id: true, name: true }
        },
        ...(includeProducts && {
          products: {
            where: { isActive: true, isInStock: true },
            take: 8,
            orderBy: { createdAt: "desc" },
          },
        }),
        _count: {
          select: {
            products: { where: { isActive: true, isInStock: true } },
          },
        },
      },
      orderBy: { order: "asc" },
    })
    console.log(`Fetched ${categories.length} parent categories`)
    return NextResponse.json(categories)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}