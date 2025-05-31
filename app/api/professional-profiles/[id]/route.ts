import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import type { Prisma } from "@prisma/client"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const profile = await prisma.professionalProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            profileImage: true,
            email: true,
            phone: true,
          },
        },
        socialMedia: true,
        documents: true,
        store: true,
        deliveryZones: true,
      },
    })

    if (!profile) {
      return NextResponse.json({ error: "Professional profile not found" }, { status: 404 })
    }

    return NextResponse.json(profile)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await requireAuth()
    const body = await request.json()

    const existingProfile = await prisma.professionalProfile.findUnique({
      where: { id },
    })

    if (!existingProfile) {
      return NextResponse.json({ error: "Professional profile not found" }, { status: 404 })
    }

    if (existingProfile.userId !== user.id && !["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const updateData: Prisma.ProfessionalProfileUpdateInput = { ...body }
    delete updateData.socialMedia
    delete updateData.deliveryZones

    const profile = await prisma.professionalProfile.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true },
        },
        socialMedia: true,
        deliveryZones: true,
      },
    })

    return NextResponse.json(profile)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
