import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { mapErrorToResponse } from '@/lib/api-utils'
import { BookingStatus } from "@prisma/client"
import { initializeTransaction, generateReference, toPesewas } from "@/lib/paystack"
import { sendBookingStatusEmail } from "@/lib/mail"
import { format } from "date-fns"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await requireAuth()
    const body = await request.json()
    const { status, notes }: { status?: BookingStatus; notes?: string } = body

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { 
        service: true,
        customer: { select: { email: true, firstName: true, lastName: true } },
        professional: {
          include: {
            professionalProfile: { select: { businessName: true } }
          }
        }
      },
    })

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    const isProfessional = booking.professionalId === user.id
    const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(user.role)
    const isCustomer = booking.customerId === user.id

    if (!isProfessional && !isAdmin && !isCustomer) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // --- LOGIC: Professional Confirmation ---
    const extraData: Record<string, string> = {}

    if (status === 'CONFIRMED' && booking.status === 'PENDING' && (isProfessional || isAdmin)) {
      // 1. Re-check slot availability (competitive)
      const conflict = await prisma.booking.findFirst({
        where: {
          professionalId: booking.professionalId,
          id: { not: booking.id },
          OR: [
            { paymentStatus: 'PAID' },
            { paymentMethod: 'IN_PERSON', status: 'CONFIRMED' }
          ],
          AND: [
            { bookingDate: { lt: booking.endTime || new Date() } },
            { endTime: { gt: booking.bookingDate } },
          ],
        },
      })

      if (conflict) {
        return NextResponse.json({ error: "This slot has already been secured by another customer." }, { status: 409 })
      }

      // 2. Initialize Payment if PLATFORM
      if (booking.paymentMethod === 'PLATFORM' && booking.paymentStatus === 'UNPAID') {
        try {
          const reference = generateReference('BK')
          const paystackResponse = await initializeTransaction({
            email: booking.customer.email,
            amount: toPesewas(booking.totalPrice || 0),
            reference,
            callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/bookings?reference=${reference}`,
            metadata: {
              bookingId: booking.id,
              type: 'booking_payment'
            },
          })
          
          extraData.paystackReference = reference
          extraData.paystackAccessCode = paystackResponse.data.access_code
        } catch (err) {
          console.error("Paystack Init Error:", err)
          return NextResponse.json({ error: "Failed to initialize payment gateway. Please try again." }, { status: 500 })
        }
      }
      // 3. Handle IN_PERSON confirmation
      if (booking.paymentMethod === 'IN_PERSON') {
        extraData.paymentStatus = 'PENDING_IN_PERSON'
      }
    }

    // --- LOGIC: Completion settlement ---
    if (status === 'COMPLETED') {
      extraData.paymentStatus = 'PAID'
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: { 
        status, 
        notes,
        ...extraData
      },
      include: {
        customer: { select: { firstName: true, lastName: true, email: true } },
        service: true,
      },
    })

    // Notify the customer about the status update
    if (status && status !== booking.status) {
      const isConfirmed = status === 'CONFIRMED'
      const isPlatform = booking.paymentMethod === 'PLATFORM'
      
      let message = `Your booking for ${updatedBooking.service.name} has been ${status.toLowerCase()}.`
      if (isConfirmed && isPlatform) {
        message += " Please complete your payment in the Bookings section to secure your slot."
      }

      await prisma.notification.create({
        data: {
          userId: booking.customerId,
          type: "BOOKING_UPDATE",
          title: `Booking ${status.charAt(0) + status.slice(1).toLowerCase()}`,
          message,
          data: JSON.stringify({ 
            bookingId: updatedBooking.id, 
            status, 
            paymentStatus: updatedBooking.paymentStatus,
            paystackReference: updatedBooking.paystackReference 
          }),
        },
      })

      // Also send email
      if (status === 'CONFIRMED' || status === 'CANCELLED') {
        try {
          await sendBookingStatusEmail({
            to: booking.customer.email,
            status: status as 'CONFIRMED' | 'CANCELLED',
            serviceName: updatedBooking.service.name,
            date: format(booking.bookingDate, "PPP 'at' p"),
            businessName: booking.professional.professionalProfile?.businessName || `${booking.professional.firstName} ${booking.professional.lastName}`,
            bookingId: updatedBooking.id,
          })
        } catch (emailErr) {
          console.error("Failed to send booking status email:", emailErr)
        }
      }
    }

    return NextResponse.json(updatedBooking)
  } catch (error: unknown) {
    const { status, message } = mapErrorToResponse(error, { route: 'bookings.[id].PUT' })
    if (status === 401) return NextResponse.json({ error: message, toast: 'You must be logged in to continue.' }, { status })
    return NextResponse.json({ error: message }, { status })
  }
}
