import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"

export async function POST() {
  try {
    // 1. Authorize (Admin only for bulk check)
    const user = await requireAuth()
    if (!["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // 2. Find lapsed packages (DeliveryConfirmations not confirmed within 48h)
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000)
    
    const lapsedConfirmations = await prisma.deliveryConfirmation.findMany({
      where: {
        status: "PENDING",
        customerConfirmed: false,
        createdAt: {
          lt: fortyEightHoursAgo,
        },
      },
      include: {
        order: {
          include: {
            items: true
          }
        }
      }
    })

    const results = []

    for (const conf of lapsedConfirmations) {
      const order = conf.order;
      try {
        if (!order.paystackReference) {
          results.push({ orderId: order.id, professionalId: conf.professionalId, status: "failed", error: "No paystack reference" })
          continue
        }

        // Identify items for this specific seller to calculate partial refund
        // const sellerItems = order.items.filter(i => i.professionalId === conf.professionalId)
        // const sellerAmount = sellerItems.reduce((sum, i) => sum + (i.price * i.quantity), 0)
        
        // For now, we flag these or do full refund if it's the only seller.
        // Partial auto-refunds are risky without manual review.
        // We will just update the confirmation status to LAPSED for now to flag for Admin.
        await prisma.deliveryConfirmation.update({
          where: { id: conf.id },
          data: { status: "EXPIRED" } // Transition to a non-pending state
        })

        results.push({ 
          orderId: order.id, 
          professionalId: conf.professionalId, 
          status: "flagged", 
          message: "Seller package lapsed. Flagged for admin review." 
        })
      } catch (err: unknown) {
        results.push({ orderId: order.id, status: "failed", error: err instanceof Error ? err.message : String(err) })
      }
    }

    return NextResponse.json({ 
      processed: lapsedConfirmations.length,
      results 
    })

  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
