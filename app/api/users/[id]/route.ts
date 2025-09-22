import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, requireRole } from "@/lib/auth"
import type { Prisma } from "@prisma/client"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const currentUser = await requireAuth()

    if (currentUser.id !== id && !["ADMIN", "SUPER_ADMIN"].includes(currentUser.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        professionalProfile: {
          include: {
            socialMedia: true,
            documents: true,
            store: true,
            deliveryZones: true,
          },
        },
        measurements: true,
        addresses: true,
        _count: {
          select: {
            orders: true,
            products: true,
            reviews: true,
            wishlist: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const currentUser = await requireAuth()
    const body = await request.json()

    if (currentUser.id !== id && !["ADMIN", "SUPER_ADMIN"].includes(currentUser.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { firstName, lastName, phone, profileImage, isActive, role } = body
    const updateData: Prisma.UserUpdateInput = { firstName, lastName, phone, profileImage }

    if (["ADMIN", "SUPER_ADMIN"].includes(currentUser.role)) {
      if (isActive !== undefined) updateData.isActive = isActive
      if (role !== undefined) updateData.role = role
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        professionalProfile: true,
        measurements: true,
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await requireRole(["ADMIN", "SUPER_ADMIN"])

    await prisma.user.delete({ where: { id } })
    return NextResponse.json({ message: "User deleted successfully" })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
