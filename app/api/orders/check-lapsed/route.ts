import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { refundTransaction, toPesewas } from "@/lib/paystack"
import { requireAuth } from "@/lib/auth"

export async function POST() {
  try {
    // 1. Authorize (Admin only for bulk check)
    const user = await requireAuth()
    if (!["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // 2. Find lapsed orders
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000)
    
    const lapsedOrders = await prisma.order.findMany({
      where: {
        status: "READY_FOR_DELIVERY",
        readyForDeliveryAt: {
          lt: fortyEightHoursAgo,
        },
        paymentStatus: "PAID",
      },
    })

    const results = []

    for (const order of lapsedOrders) {
      try {
        if (!order.paystackReference) {
          results.push({ orderId: order.id, status: "failed", error: "No paystack reference" })
          continue
        }

        // Calculate refund amount (Total - Tax)
        const refundAmount = order.totalPrice - order.tax
        const amountPesewas = toPesewas(refundAmount)

        // Trigger Paystack Refund
        await refundTransaction(order.paystackReference, amountPesewas)

        // Update Order Status
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: "REFUNDED",
            paymentStatus: "REFUNDED",
            notes: (order.notes || "") + "\n[System] Auto-refunded due to 48h delivery lapse.",
          },
        })

        results.push({ orderId: order.id, status: "success", amount: refundAmount })
      } catch (err: unknown) {
        results.push({ orderId: order.id, status: "failed", error: err instanceof Error ? err.message : String(err) })
      }
    }

    return NextResponse.json({ 
      processed: lapsedOrders.length,
      results 
    })

  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
