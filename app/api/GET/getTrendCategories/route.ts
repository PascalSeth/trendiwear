import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth"
import { uploadFile } from "@/lib/upload"

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { order: "asc" },
        },
        _count: {
          select: {
            products: { where: { isActive: true } },
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

    const formData = await request.formData()
    const name = formData.get("name") as string
    const categoryId = formData.get("categoryId") as string | null
    const imageFile = formData.get("image") as File | null

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    let imageUrl: string | undefined

    if (imageFile) {
      // Upload to Supabase
      const fileName = `trend-category-${Date.now()}-${imageFile.name}`
      imageUrl = await uploadFile(imageFile, "images", fileName)
    }

    // Generate slug from name
    const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        imageUrl,
        parentId: categoryId || null,
        order: 0, // Default order
      },
      include: { parent: true, children: true },
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}