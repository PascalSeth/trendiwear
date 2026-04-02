import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { mapErrorToResponse } from "@/lib/api-utils"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params
    
    const professionalProfile = await prisma.professionalProfile.findUnique({
      where: { userId: user.id }
    })

    if (!professionalProfile) {
      return NextResponse.json({ error: "Professional profile not found" }, { status: 404 })
    }

    const rider = await prisma.rider.findFirst({
      where: { id, professionalId: professionalProfile.id }
    })

    if (!rider) {
      return NextResponse.json({ error: "Rider not found" }, { status: 404 })
    }

    const { name, phone, licenseNumber, vehicleType, isActive } = await request.json()

    const updatedRider = await prisma.rider.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(phone && { phone }),
        ...(licenseNumber !== undefined && { licenseNumber }),
        ...(vehicleType !== undefined && { vehicleType }),
        ...(isActive !== undefined && { isActive }),
      }
    })

    return NextResponse.json(updatedRider)
  } catch (error) {
    const { status, message } = mapErrorToResponse(error, { route: 'riders' })
    return NextResponse.json({ error: message }, { status })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params

    const professionalProfile = await prisma.professionalProfile.findUnique({
      where: { userId: user.id }
    })

    if (!professionalProfile) {
      return NextResponse.json({ error: "Professional profile not found" }, { status: 404 })
    }

    const rider = await prisma.rider.findFirst({
      where: { id, professionalId: professionalProfile.id }
    })

    if (!rider) {
      return NextResponse.json({ error: "Rider not found" }, { status: 404 })
    }

    await prisma.rider.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    const { status, message } = mapErrorToResponse(error, { route: 'riders' })
    return NextResponse.json({ error: message }, { status })
  }
}
