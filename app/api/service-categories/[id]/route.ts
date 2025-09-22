import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"])
    const { id } = await params
    const body = await request.json()
    const { name, description, imageUrl, isActive } = body

    const category = await prisma.serviceCategory.update({
      where: { id },
      data: {
        name,
        description,
        imageUrl,
        isActive,
      },
      include: {
        _count: {
          select: { services: true },
        },
      },
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