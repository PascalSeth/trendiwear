import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { mapErrorToResponse } from "@/lib/api-utils"
import { cancelAndRefundOrder } from "@/lib/orders"

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
        paymentEscrows: true,
      },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    if (order.customerId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // 2. Call shared cancellation logic
    const result = await cancelAndRefundOrder(orderId, { bypassWindow: false })

    return NextResponse.json({ 
      success: true, 
      message: result.refunded ? "Refund processed successfully" : "Order cancelled",
      refundAmount: result.amount
    })

  } catch (error) {
    const { status, message } = mapErrorToResponse(error, { route: 'order-refund' })
    return NextResponse.json({ error: message }, { status })
  }
}
