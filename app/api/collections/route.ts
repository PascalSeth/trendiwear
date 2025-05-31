import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth"
import type { Season } from "@prisma/client"
import type { Prisma } from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get("categoryId")
    const featured = searchParams.get("featured") === "true"
    const season = searchParams.get("season") as Season

    const where: Prisma.CollectionWhereInput = { isActive: true }
    if (categoryId) where.categoryId = categoryId
    if (featured) where.isFeatured = true
    if (season) where.season = season

    const collections = await prisma.collection.findMany({
      where,
      include: {
        category: true,
        products: {
          where: { isActive: true, isInStock: true },
          take: 8,
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: {
            products: { where: { isActive: true, isInStock: true } },
          },
        },
      },
      orderBy: [{ isFeatured: "desc" }, { order: "asc" }],
    })

    return NextResponse.json(collections)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"])
    const body = await request.json()

    const { name, slug, description, imageUrl, categoryId, season, isFeatured, order } = body

    const collection = await prisma.collection.create({
      data: {
        name,
        slug,
        description,
        imageUrl,
        categoryId,
        season,
        isFeatured: isFeatured || false,
        order: order || 0,
      },
      include: { category: true },
    })

    return NextResponse.json(collection, { status: 201 })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
