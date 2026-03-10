import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { mapErrorToResponse } from '@/lib/api-utils'

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
    const { name, description, duration, isHomeService, categoryId, isActive, price, imageUrl, requirements } = body

    // Build update data dynamically to only update provided fields
    const updateData: Record<string, unknown> = {}
    
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (duration !== undefined) updateData.duration = Number.parseInt(duration)
    if (isHomeService !== undefined) updateData.isHomeService = Boolean(isHomeService)
    if (categoryId !== undefined) updateData.categoryId = categoryId
    if (isActive !== undefined) updateData.isActive = Boolean(isActive)
    if (price !== undefined) updateData.price = parseFloat(price)
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl
    if (requirements !== undefined) updateData.requirements = requirements

    const service = await prisma.service.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        _count: {
          select: { bookings: true },
        },
      },
    })

    return NextResponse.json(service)
  } catch (error) {
    const { status, message } = mapErrorToResponse(error, { route: 'services.[id].PUT' })
    if (status === 401) return NextResponse.json({ error: message, toast: 'You must be logged in to continue.' }, { status })
    return NextResponse.json({ error: message }, { status })
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
    const { status, message } = mapErrorToResponse(error, { route: 'services.[id].DELETE' })
    if (status === 401) return NextResponse.json({ error: message, toast: 'You must be logged in to continue.' }, { status })
    return NextResponse.json({ error: message }, { status })
  }
}