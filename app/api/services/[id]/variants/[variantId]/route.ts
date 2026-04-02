import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { mapErrorToResponse } from "@/lib/api-utils"

// PUT /api/services/[id]/variants/[variantId]
// Professional updates a specific variant.
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; variantId: string }> }
) {
  try {
    const user = await requireAuth()
    const { id: serviceId, variantId } = await params

    if (user.role !== "PROFESSIONAL") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Confirm the variant belongs to this professional's service
    const variant = await prisma.serviceVariant.findUnique({
      where: { id: variantId },
      include: { professionalService: true },
    })

    if (!variant || variant.professionalService.professionalId !== user.id || variant.professionalService.serviceId !== serviceId) {
      return NextResponse.json({ error: "Variant not found" }, { status: 404 })
    }

    const body = await request.json()
    const { name, description, price, durationMinutes, isActive } = body

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (price !== undefined) updateData.price = Number.parseFloat(price)
    if (durationMinutes !== undefined) updateData.durationMinutes = Number.parseInt(durationMinutes)
    if (isActive !== undefined) updateData.isActive = Boolean(isActive)

    const updated = await prisma.serviceVariant.update({
      where: { id: variantId },
      data: updateData,
    })

    return NextResponse.json(updated)
  } catch (error) {
    const { status, message } = mapErrorToResponse(error, { route: "services.[id].variants.[variantId].PUT" })
    if (status === 401) return NextResponse.json({ error: message, toast: "You must be logged in to continue." }, { status })
    return NextResponse.json({ error: message }, { status })
  }
}

// DELETE /api/services/[id]/variants/[variantId]
// Professional deletes a variant. Blocked if active bookings reference it.
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; variantId: string }> }
) {
  try {
    const user = await requireAuth()
    const { id: serviceId, variantId } = await params

    if (user.role !== "PROFESSIONAL") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const variant = await prisma.serviceVariant.findUnique({
      where: { id: variantId },
      include: { professionalService: true },
    })

    if (!variant || variant.professionalService.professionalId !== user.id || variant.professionalService.serviceId !== serviceId) {
      return NextResponse.json({ error: "Variant not found" }, { status: 404 })
    }

    const activeBookings = await prisma.booking.count({
      where: {
        variantId,
        status: { in: ["PENDING", "CONFIRMED", "IN_PROGRESS"] },
      },
    })

    if (activeBookings > 0) {
      return NextResponse.json(
        { error: "Cannot delete a variant with active bookings" },
        { status: 400 }
      )
    }

    await prisma.serviceVariant.delete({ where: { id: variantId } })
    return NextResponse.json({ message: "Variant deleted" })
  } catch (error) {
    const { status, message } = mapErrorToResponse(error, { route: "services.[id].variants.[variantId].DELETE" })
    if (status === 401) return NextResponse.json({ error: message, toast: "You must be logged in to continue." }, { status })
    return NextResponse.json({ error: message }, { status })
  }
}
