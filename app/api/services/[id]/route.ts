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
    const { name, description, duration, isHomeService, categoryId, isActive } = body

    const service = await prisma.service.update({
      where: { id },
      data: {
        name,
        description,
        duration: Number.parseInt(duration),
        isHomeService: Boolean(isHomeService),
        categoryId,
        isActive: Boolean(isActive),
      },
      include: {
        category: true,
        _count: {
          select: { bookings: true },
        },
      },
    })

    return NextResponse.json(service)
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

    // Check if there are bookings for this service
    const bookingCount = await prisma.booking.count({
      where: { serviceId: id },
    })

    if (bookingCount > 0) {
      return NextResponse.json({
        error: "Cannot delete service that has bookings"
      }, { status: 400 })
    }

    await prisma.service.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Service deleted successfully" })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}