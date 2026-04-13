import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { mapErrorToResponse } from '@/lib/api-utils'
import type { Prisma, BookingStatus, NotificationType } from "@prisma/client"
import { addHours, isBefore, startOfDay, addDays, format } from "date-fns"
import { sendBookingRequestEmail } from "@/lib/mail"

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
          variant: true,
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
  } catch (error: unknown) {
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
      professionalId,
      variantId,
      bookingDate,
      location,
      notes,
      paymentMethod = 'PLATFORM',
      isQuoteBased = false,
      inspirationImages = [],
      requiresMeasurements = false,
    }: {
      serviceId: string
      professionalId: string
      variantId?: string
      bookingDate: string
      location?: string
      notes?: string
      paymentMethod?: 'PLATFORM' | 'IN_PERSON'
      isQuoteBased?: boolean
      inspirationImages?: string[]
      requiresMeasurements?: boolean
    } = body

    if (!professionalId) {
      return NextResponse.json({ error: "professionalId is required" }, { status: 400 })
    }

    let snapshotMeasurements = null
    if (requiresMeasurements) {
      const measurement = await prisma.measurement.findUnique({ where: { userId: user.id } })
      if (!measurement || (!measurement.bust && !measurement.waist && !measurement.height)) {
        return NextResponse.json({ 
          error: "Measurements required. Please complete your measurement profile to book this service.", 
          code: "MEASUREMENTS_REQUIRED" 
        }, { status: 400 })
      }
      snapshotMeasurements = measurement
    }

    const bookingDateTime = new Date(bookingDate)
    const tomorrow = startOfDay(addDays(new Date(), 1))

    // 1. Enforce "No same-day bookings"
    if (isBefore(bookingDateTime, tomorrow)) {
      return NextResponse.json(
        { error: "Bookings must be requested at least 24 hours in advance." },
        { status: 400 }
      )
    }

    // 2. Find the professional's service offering
    const professionalService = await prisma.professionalService.findUnique({
      where: { professionalId_serviceId: { professionalId, serviceId } },
      include: {
        service: true,
        variants: { where: { isActive: true } },
        professional: {
          include: { professionalProfile: true }
        }
      },
    })

    if (!professionalService || !professionalService.isActive || !professionalService.service.isActive) {
      return NextResponse.json({ error: "Service not available" }, { status: 400 })
    }

    if (isQuoteBased && !professionalService.professional.professionalProfile?.isVerified) {
      return NextResponse.json({ error: "Only verified professionals can offer custom quote-based services." }, { status: 403 })
    }

    // 3. Resolve price and duration
    let resolvedPrice = isQuoteBased ? 0 : professionalService.price
    let resolvedDuration = professionalService.durationOverride ?? professionalService.service.duration

    if (!isQuoteBased && variantId) {
      const variant = professionalService.variants.find(v => v.id === variantId)
      if (!variant) return NextResponse.json({ error: "Variant not found" }, { status: 400 })
      resolvedPrice = variant.price
      resolvedDuration = variant.durationMinutes
    }

    const endTime = new Date(bookingDateTime.getTime() + resolvedDuration * 60000)
    
    const depositAmount = isQuoteBased ? null : resolvedPrice * 0.5
    const balanceAmount = isQuoteBased ? null : resolvedPrice * 0.5

    // 4. Competitive Conflict Check
    // A slot is ONLY blocked if someone has PAID or if it's a confirmed IN_PERSON booking.
    const conflict = await prisma.booking.findFirst({
      where: {
        professionalId,
        OR: [
          { paymentStatus: 'PAID' },
          { paymentMethod: 'IN_PERSON', status: 'CONFIRMED' }
        ],
        AND: [
          { bookingDate: { lt: endTime } },
          { endTime: { gt: bookingDateTime } },
        ],
      },
    })

    if (conflict) {
      return NextResponse.json(
        { error: "This slot has already been secured by another customer." },
        { status: 409 }
      )
    }

    // 5. Create Booking with 6-hour confirmation window
    const requestExpiresAt = addHours(new Date(), 6)

    const booking = await prisma.booking.create({
      data: {
        customerId: user.id,
        serviceId,
        professionalId,
        ...(variantId ? { variantId } : {}),
        bookingDate: bookingDateTime,
        endTime,
        totalPrice: isQuoteBased ? null : resolvedPrice,
        depositAmount,
        balanceAmount,
        isQuoteBased,
        quoteStatus: isQuoteBased ? 'REQUESTED' : null,
        snapshotMeasurements: snapshotMeasurements || undefined,
        inspirationImages,
        location,
        notes,
        paymentMethod,
        requestExpiresAt,
        status: isQuoteBased ? 'PENDING' : 'PENDING', // PENDING serves for both Requesting quote and Requesting slot
        paymentStatus: 'UNPAID',
      },
      include: {
        service: { include: { category: true } },
        variant: true,
        customer: { select: { firstName: true, lastName: true, email: true } },
        professional: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            professionalProfile: { select: { businessName: true } },
          },
        },
      },
    })

    // 6. Notify the professional
    await prisma.notification.create({
      data: {
        userId: professionalId,
        type: "BOOKING_CONFIRMATION" as NotificationType,
        title: "New Booking Request",
        message: `You have a new booking request for ${booking.service.name} from ${booking.customer.firstName}. You have 6 hours to confirm.`,
        data: JSON.stringify({ bookingId: booking.id, expiresAt: requestExpiresAt }),
      },
    })

    // Also send email
    if (booking.professional?.email) {
      try {
        await sendBookingRequestEmail({
          to: booking.professional.email,
          customerName: `${booking.customer.firstName} ${booking.customer.lastName}`,
          serviceName: booking.service.name,
          date: format(booking.bookingDate, "PPP 'at' p"),
        })
      } catch (emailErr) {
        console.error("Failed to send booking request email:", emailErr)
      }
    }

    return NextResponse.json(booking, { status: 201 })
  } catch (error: unknown) {
    const { status, message } = mapErrorToResponse(error, { route: 'bookings.POST' })
    if (status === 401) return NextResponse.json({ error: message, toast: 'You must be logged in to continue.' }, { status })
    return NextResponse.json({ error: message }, { status })
  }
}
