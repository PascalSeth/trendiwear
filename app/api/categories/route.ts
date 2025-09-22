import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
// import { requireRole } from "@/lib/auth"
import type { Prisma } from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeProducts = searchParams.get("includeProducts") === "true"

    // Always fetch all categories regardless of parent/child relationship
    const where: Prisma.CategoryWhereInput = {}

    const categories = await prisma.category.findMany({
      where,
      include: {
        parent: {
          select: { id: true, name: true }
        },
        children: {
          where: {},
          orderBy: { order: "asc" },
          select: { id: true, name: true }
        },
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
    console.log(`Fetched ${categories.length} categories`)
    return NextResponse.json(categories)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // await requireRole(["ADMIN", "SUPER_ADMIN"])
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
      name: string
      slug: string
      description?: string
      imageUrl?: string
      parentId?: string
      order?: number
      isActive?: boolean
    } = body

    const category = await prisma.category.create({
      data: { name, slug, description, imageUrl, parentId, order: order || 0, isActive: isActive ?? true },
      include: { parent: true, children: true },
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
