import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth"
import { Prisma } from "@prisma/client"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const category = await prisma.serviceCategory.findUnique({
      where: { id },
      include: {
        professionalTypes: true,
        _count: {
          select: { services: true },
        },
      } as Prisma.ServiceCategoryInclude,
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
    const { id } = await params
    const body = await request.json()
    const { name, description, imageUrl, isActive, professionalTypeIds } = body

    // Build update data dynamically to only update provided fields
    const updateData: Prisma.ServiceCategoryUpdateInput = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl
    if (isActive !== undefined) updateData.isActive = isActive
    
    // Add professional role links if provided
    if (professionalTypeIds !== undefined) {
      updateData.professionalTypes = {
        set: professionalTypeIds.map((tid: string) => ({ id: tid }))
      }
    }

    const category = await prisma.serviceCategory.update({
      where: { id },
      data: updateData,
      include: {
        professionalTypes: true,
        _count: {
          select: { services: true },
        },
      } as Prisma.ServiceCategoryInclude,
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
    const { id } = await params

    // Check if there are services using this category
    const serviceCount = await prisma.service.count({
      where: { categoryId: id },
    })

    if (serviceCount > 0) {
      return NextResponse.json({
        error: "Cannot delete service category that has services"
      }, { status: 400 })
    }

    await prisma.serviceCategory.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Service category deleted successfully" })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}