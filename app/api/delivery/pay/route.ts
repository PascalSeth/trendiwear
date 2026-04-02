import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { initializeTransaction, toPesewas } from "@/lib/paystack"
import { mapErrorToResponse } from "@/lib/api-utils"

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { orderId, amount } = await request.json()

    if (!orderId || !amount) {
      return NextResponse.json({ error: "Order ID and amount are required" }, { status: 400 })
    }

    // 1. Fetch order and verify eligibility
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    if (order.customerId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    if ((order.status as string) !== "AWAITING_DELIVERY_PAYMENT") {
      return NextResponse.json({ error: "Order is not awaiting delivery payment" }, { status: 400 })
    }

    // 2. Initialize Paystack Transaction for Delivery Fee
    // We use a different reference style for delivery
    const reference = `DELIVERY_${orderId.substring(0, 8)}_${Date.now().toString(36)}`.toUpperCase()

    const paystackResponse = await initializeTransaction({
      email: user.email,
      amount: toPesewas(amount),
      reference,
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/orders`,
      metadata: {
        orderId: order.id,
        type: 'DELIVERY_FEE',
      }
    })

    // 3. Store the reference temporarily in the order
    await prisma.order.update({
      where: { id: orderId },
      data: {
        deliveryPaystackReference: reference,
      }
    })

    return NextResponse.json({
      success: true,
      authorization_url: paystackResponse.data.authorization_url,
      reference
    })

  } catch (error) {
    const { status, message } = mapErrorToResponse(error, { route: 'delivery-pay' })
    return NextResponse.json({ error: message }, { status })
  }
}
