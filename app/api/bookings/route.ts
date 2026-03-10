import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { mapErrorToResponse } from '@/lib/api-utils'
import type { Prisma, BookingStatus } from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const status = searchParams.get("status") as BookingStatus
    const serviceId = searchParams.get("serviceId")

    const where: Prisma.BookingWhereInput = {}

    if (user.role === "CUSTOMER") {
      where.customerId = user.id
    } else if (user.role === "PROFESSIONAL") {
      where.professionalId = user.id
    } else if (!["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (status) where.status = status
    if (serviceId) where.serviceId = serviceId

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          customer: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
          service: {
            include: {
              category: true,
            },
          },
          professional: {
            select: {
              firstName: true,
              lastName: true,
              professionalProfile: {
                select: { businessName: true },
              },
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { bookingDate: "desc" },
      }),
      prisma.booking.count({ where }),
    ])

    return NextResponse.json({
      bookings,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    const { status, message } = mapErrorToResponse(error, { route: 'bookings.GET' })
    if (status === 401) return NextResponse.json({ error: message, toast: 'You must be logged in to continue.' }, { status })
    return NextResponse.json({ error: message }, { status })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    const {
      serviceId,
      bookingDate,
      location,
      notes,
    }: {
      serviceId: string
      bookingDate: string
      location?: string
      notes?: string
    } = body

    // Find the service and get the professional who offers it
    const professionalService = await prisma.professionalService.findFirst({
      where: {
        serviceId,
        isActive: true,
      },
      include: {
        professional: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            professionalProfile: {
              select: { businessName: true },
            },
          },
        },
        service: true,
      },
    })

    if (!professionalService || !professionalService.service.isActive) {
      return NextResponse.json({ error: "Service not available" }, { status: 400 })
    }

    const bookingDateTime = new Date(bookingDate)
    const endTime = new Date(bookingDateTime.getTime() + professionalService.service.duration * 60000)

    const booking = await prisma.booking.create({
      data: {
        customerId: user.id,
        serviceId,
        professionalId: professionalService.professionalId,
        bookingDate: bookingDateTime,
        endTime,
        location,
        notes,
      },
      include: {
        service: {
          include: {
            category: true,
          },
        },
        professional: {
          select: {
            firstName: true,
            lastName: true,
            professionalProfile: {
              select: { businessName: true },
            },
          },
        },
      },
    })

    return NextResponse.json(booking, { status: 201 })
  } catch (error) {
    const { status, message } = mapErrorToResponse(error, { route: 'bookings.POST' })
    if (status === 401) return NextResponse.json({ error: message, toast: 'You must be logged in to continue.' }, { status })
    return NextResponse.json({ error: message }, { status })
  }
}
