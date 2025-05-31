import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth"
import type { Prisma } from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const parentId = searchParams.get("parentId")
    const includeProducts = searchParams.get("includeProducts") === "true"

    const where: Prisma.CategoryWhereInput = { isActive: true }
    if (parentId) {
      where.parentId = parentId
    } else if (parentId === null) {
      where.parentId = null
    }

    const categories = await prisma.category.findMany({
      where,
      include: {
        children: {
          where: { isActive: true },
          orderBy: { order: "asc" },
        },
        collections: {
          where: { isActive: true },
          orderBy: { order: "asc" },
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

    return NextResponse.json(categories)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"])
    const body = await request.json()

    const {
      name,
      slug,
      description,
      imageUrl,
      parentId,
      order,
    }: {
      name: string
      slug: string
      description?: string
      imageUrl?: string
      parentId?: string
      order?: number
    } = body

    const category = await prisma.category.create({
      data: { name, slug, description, imageUrl, parentId, order: order || 0 },
      include: { parent: true, children: true },
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
