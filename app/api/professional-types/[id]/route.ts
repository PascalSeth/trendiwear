import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"

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
    const { name, description, isActive } = body

    const professionalType = await prisma.professionalType.update({
      where: { id },
      data: {
        name,
        description,
        isActive,
      },
      include: {
        _count: {
          select: { professionals: true }
        }
      },
    })

    return NextResponse.json(professionalType)
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

    // Check if there are professionals using this type
    const professionalCount = await prisma.professionalProfile.count({
      where: { specializationId: id },
    })

    if (professionalCount > 0) {
      return NextResponse.json({
        error: "Cannot delete professional type that is being used by professionals"
      }, { status: 400 })
    }

    await prisma.professionalType.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Professional type deleted successfully" })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}