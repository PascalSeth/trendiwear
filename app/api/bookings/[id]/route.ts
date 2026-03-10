import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { mapErrorToResponse } from '@/lib/api-utils'
import type { BookingStatus } from "@prisma/client"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await requireAuth()
    const body = await request.json()
    const { status, notes }: { status?: BookingStatus; notes?: string } = body

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { service: true },
    })

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    const canUpdate =
      booking.customerId === user.id ||
      booking.professionalId === user.id ||
      ["ADMIN", "SUPER_ADMIN"].includes(user.role)

    if (!canUpdate) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: { status, notes },
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        service: true,
      },
    })

    return NextResponse.json(updatedBooking)
  } catch (error) {
    const { status, message } = mapErrorToResponse(error, { route: 'bookings.[id].PUT' })
    if (status === 401) return NextResponse.json({ error: message, toast: 'You must be logged in to continue.' }, { status })
    return NextResponse.json({ error: message }, { status })
  }
}
