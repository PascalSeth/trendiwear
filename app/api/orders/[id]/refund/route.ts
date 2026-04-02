import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { refundTransaction, toPesewas } from "@/lib/paystack"
import { mapErrorToResponse } from "@/lib/api-utils"
import { EscrowStatus } from "@prisma/client"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const orderId = id

    // 1. Fetch order and check ownership/status
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        paymentEscrow: true,
      },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    if (order.customerId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // 2. Validate refund eligibility
    if (order.paymentStatus !== "PAID") {
      return NextResponse.json({ error: "Only paid orders can be refunded" }, { status: 400 })
    }

    if (order.status !== "PENDING" && order.status !== "PROCESSING") {
      return NextResponse.json({ error: "Orders that have been shipped or delivered cannot be refunded automatically" }, { status: 400 })
    }

    if (!order.paystackPaidAt) {
      return NextResponse.json({ error: "Payment information not found" }, { status: 400 })
    }

    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000)
    if (new Date(order.paystackPaidAt) < twelveHoursAgo) {
      return NextResponse.json({ 
        error: "Refund window expired", 
        message: "Refunds can only be requested within 12 hours of payment." 
      }, { status: 400 })
    }

    // 3. Calculate refund amount (deduct platform fee)
    // Refund amount = subtotal + shippingCost + tax - discount (which is totalPrice - platformFee)
    const refundAmount = order.totalPrice - order.platformFee
    
    if (refundAmount <= 0) {
      return NextResponse.json({ error: "Invalid refund amount" }, { status: 400 })
    }

    // 4. Initiate Paystack Refund
    if (!order.paystackReference) {
      return NextResponse.json({ error: "Paystack reference missing" }, { status: 400 })
    }

    try {
      await refundTransaction(order.paystackReference, toPesewas(refundAmount))
    } catch (paystackError: unknown) {
      const errorMsg = paystackError instanceof Error ? paystackError.message : "Failed to initiate refund with Paystack."
      console.error("Paystack refund error:", paystackError)
      return NextResponse.json({ 
        error: "Refund failed", 
        message: errorMsg
      }, { status: 500 })
    }

    // 5. Update Database within a transaction
    await prisma.$transaction(async (tx) => {
      // Update order status
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: "CANCELLED",
          paymentStatus: "REFUNDED",
          notes: order.notes ? `${order.notes}\n Refunded: ${refundAmount} GHS` : `Refunded: ${refundAmount} GHS`,
        },
      })

      // Update escrow record if it exists
      if (order.paymentEscrow) {
        await tx.paymentEscrow.update({
          where: { orderId: orderId },
          data: { status: "REFUNDED" as EscrowStatus },
        })
      }

      // Restore stock (optional but recommended)
      const orderItems = await tx.orderItem.findMany({
        where: { orderId: orderId },
      })

      for (const item of orderItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: { increment: item.quantity },
            soldCount: { decrement: item.quantity },
          },
        })
      }
    })

    return NextResponse.json({ 
      success: true, 
      message: "Refund processed successfully",
      refundAmount: refundAmount
    })

  } catch (error) {
    const { status, message } = mapErrorToResponse(error, { route: 'order-refund' })
    return NextResponse.json({ error: message }, { status })
  }
}
