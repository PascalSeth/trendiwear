import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import type { Prisma } from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const authorId = searchParams.get("authorId")
    const featured = searchParams.get("featured") === "true"
    const published = searchParams.get("published") !== "false"
    const search = searchParams.get("search")
    const tags = searchParams.get("tags")?.split(",")

    const where: Prisma.BlogWhereInput = {}
    if (published) where.isPublished = true
    if (authorId) where.authorId = authorId
    if (featured) where.isFeatured = true

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { excerpt: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
      ]
    }

    if (tags && tags.length > 0) {
      where.tags = { hasSome: tags }
    }

    const [blogs, total] = await Promise.all([
      prisma.blog.findMany({
        where,
        include: {
          author: {
            select: {
              firstName: true,
              lastName: true,
              profileImage: true,
              professionalProfile: {
                select: { businessName: true },
              },
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      }),
      prisma.blog.count({ where }),
    ])

    return NextResponse.json({
      blogs,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    if (user.role !== "PROFESSIONAL" && !["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Only professionals and admins can create blogs" }, { status: 403 })
    }

    const { title, slug, content, excerpt, imageUrl, tags, categoryId, isPublished, isFeatured } = body

    const blog = await prisma.blog.create({
      data: {
        title,
        slug,
        content,
        excerpt,
        imageUrl,
        tags: tags || [],
        authorId: user.id,
        categoryId,
        isPublished: Boolean(isPublished),
        isFeatured: Boolean(isFeatured),
      },
      include: {
        author: {
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

    return NextResponse.json(blog, { status: 201 })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
