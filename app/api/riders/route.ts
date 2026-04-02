import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { mapErrorToResponse } from "@/lib/api-utils"

export async function GET() {
  try {
    const user = await requireAuth()
    
    if (user.role !== "PROFESSIONAL" && !["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Get the professional profile ID
    const professionalProfile = await prisma.professionalProfile.findUnique({
      where: { userId: user.id }
    })

    if (!professionalProfile) {
      return NextResponse.json({ error: "Professional profile not found" }, { status: 404 })
    }

    const riders = await prisma.rider.findMany({
      where: { professionalId: professionalProfile.id },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ riders })
  } catch (error) {
    const { status, message } = mapErrorToResponse(error, { route: 'riders' })
    return NextResponse.json({ error: message }, { status })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    
    if (user.role !== "PROFESSIONAL") {
      return NextResponse.json({ error: "Only professionals can manage riders" }, { status: 403 })
    }

    const professionalProfile = await prisma.professionalProfile.findUnique({
      where: { userId: user.id }
    })

    if (!professionalProfile) {
      return NextResponse.json({ error: "Professional profile not found" }, { status: 404 })
    }

    const { name, phone, licenseNumber, vehicleType } = await request.json()

    if (!name || !phone) {
      return NextResponse.json({ error: "Name and Phone are required" }, { status: 400 })
    }

    const rider = await prisma.rider.create({
      data: {
        name,
        phone,
        licenseNumber,
        vehicleType,
        professionalId: professionalProfile.id,
      }
    })

    return NextResponse.json(rider, { status: 201 })
  } catch (error) {
    const { status, message } = mapErrorToResponse(error, { route: 'riders' })
    return NextResponse.json({ error: message }, { status })
  }
}
