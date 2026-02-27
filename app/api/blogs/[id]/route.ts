import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Try to find by ID first (UUID format), then by slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
    
    let blog = null
    if (isUUID) {
      blog = await prisma.blog.findUnique({
        where: { id },
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
      })
    }
    
    // If not found by ID, try finding by slug
    if (!blog) {
      blog = await prisma.blog.findFirst({
        where: { slug: id },
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
      })
    }

    if (!blog) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 })
    }

    // Increment view count for public views
    await prisma.blog.update({
      where: { id: blog.id },
      data: { viewCount: { increment: 1 } },
    })

    return NextResponse.json(blog)
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
    if (!["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { 
      title, 
      slug, 
      content, 
      excerpt, 
      imageUrl, 
      tags, 
      category, 
      isPublished, 
      isFeatured 
    } = body

    // Build update data - only include fields that are provided
    const updateData: Record<string, unknown> = {}
    
    if (title !== undefined) updateData.title = title
    if (slug !== undefined) updateData.slug = slug
    if (content !== undefined) updateData.content = content
    if (excerpt !== undefined) updateData.excerpt = excerpt
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl
    if (tags !== undefined) updateData.tags = tags
    if (category !== undefined) updateData.category = category
    if (isPublished !== undefined) updateData.isPublished = isPublished
    if (isFeatured !== undefined) updateData.isFeatured = isFeatured

    const blog = await prisma.blog.update({
      where: { id },
      data: updateData,
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
    })

    return NextResponse.json(blog)
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
    if (!["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { id } = await params

    await prisma.blog.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Blog deleted successfully" })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}