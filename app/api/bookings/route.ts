import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
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
      where.service = { professionalId: user.id }
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
              professional: {
                select: {
                  firstName: true,
                  lastName: true,
                  professionalProfile: {
                    select: { businessName: true },
                  },
                },
              },
              category: true,
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
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
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

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    })

    if (!service || !service.isActive) {
      return NextResponse.json({ error: "Service not available" }, { status: 400 })
    }

    const bookingDateTime = new Date(bookingDate)
    const endTime = new Date(bookingDateTime.getTime() + service.duration * 60000)

    const booking = await prisma.booking.create({
      data: {
        customerId: user.id,
        serviceId,
        bookingDate: bookingDateTime,
        endTime,
        location,
        notes,
      },
      include: {
        service: {
          include: {
            professional: {
              select: {
                firstName: true,
                lastName: true,
                professionalProfile: {
                  select: { businessName: true },
                },
              },
            },
            category: true,
          },
        },
      },
    })

    return NextResponse.json(booking, { status: 201 })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
