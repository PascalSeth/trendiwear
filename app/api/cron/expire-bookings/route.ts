import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * ⏰ Cron API Endpoint: Expire Pending Bookings
 * Automatically cleans up booking requests where requestExpiresAt < now() and status == 'PENDING'.
 * Can be triggered via Vercel Cron, GitHub Actions, or internal scheduler.
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    // Optional secret check if CRON_SECRET is configured
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized cron trigger" }, { status: 401 })
    }

    const now = new Date()

    // 1. Find expired pending bookings
    const expiredBookings = await prisma.booking.findMany({
      where: {
        status: "PENDING",
        requestExpiresAt: {
          lt: now
        }
      },
      include: {
        customer: { select: { firstName: true, email: true } },
        service: { select: { name: true } },
        professional: { select: { firstName: true } }
      }
    })

    if (expiredBookings.length === 0) {
      return NextResponse.json({ message: "No expired pending bookings found", expiredCount: 0 })
    }

    const expiredIds = expiredBookings.map(b => b.id)

    // 2. Batch update status to EXPIRED
    await prisma.booking.updateMany({
      where: { id: { in: expiredIds } },
      data: {
        status: "EXPIRED",
        failureReason: "Request expired after 6 hours without professional confirmation."
      }
    })

    // 3. Create notifications for customers
    for (const booking of expiredBookings) {
      await prisma.notification.create({
        data: {
          userId: booking.customerId,
          type: "BOOKING_UPDATE",
          title: "Booking Request Expired",
          message: `Your booking request for ${booking.service.name} with ${booking.professional.firstName} has expired. No charges were made.`,
          data: JSON.stringify({ bookingId: booking.id, status: "EXPIRED" })
        }
      })
    }

    return NextResponse.json({
      message: `Successfully expired ${expiredBookings.length} pending booking requests.`,
      expiredCount: expiredBookings.length,
      expiredBookingIds: expiredIds
    })
  } catch (error: unknown) {
    console.error("Cron Expire Bookings Error:", error)
    const errObj = error as { message?: string }
    return NextResponse.json({ error: errObj.message || "Failed to process expired bookings" }, { status: 500 })
  }
}
