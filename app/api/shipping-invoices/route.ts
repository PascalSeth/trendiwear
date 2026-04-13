import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { mapErrorToResponse } from "@/lib/api-utils"

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()

    // Ensure only Professionals or Admins can issue invoices
    if (!["PROFESSIONAL", "ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { orderId, amount } = body

    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 })
    }

    // Amount can be 0 if the user selected PICKUP
    if (typeof amount !== 'number' || amount < 0) {
      return NextResponse.json({ error: "valid amount is required" }, { status: 400 })
    }

    // Verify order exists and seller owns at least one item in it
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        customer: true,
      }
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Check if seller owns items in this order
    const hasItems = order.items.some(item => item.professionalId === user.id)
    if (!hasItems && !["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden: You don't own items in this order" }, { status: 403 })
    }

    // Ensure customer didn't select pickup if charging a shipping fee
    if (order.deliveryMethod === 'PICKUP' && amount > 0) {
      return NextResponse.json(
        { error: "Customer selected PICKUP for this order. Shipping amount must be 0." },
        { status: 400 }
      )
    }

    const isPickup = order.deliveryMethod === 'PICKUP'

    // Prevent duplicate active invoices
    const existingActive = await prisma.shippingInvoice.findFirst({
      where: {
        orderId,
        professionalId: user.id,
        status: 'PENDING',
      }
    })

    if (existingActive) {
      return NextResponse.json({ error: "Active invoice already exists for this order" }, { status: 400 })
    }

    // Create the invoice
    // Expires in 7 days
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    // Wait, if amount is 0 (Pickup), we can immediately mark it as PAID and pickupReady
    const initialStatus = amount === 0 ? 'PAID' : 'PENDING'

    const invoice = await prisma.shippingInvoice.create({
      data: {
        orderId,
        professionalId: user.id,
        amount,
        status: initialStatus,
        expiresAt,
        pickupReady: isPickup,
      }
    })

    // Note: The logic for handling pre-order completion (notifying buyer) goes here.
    // E.g. Send email "Your pre-order has arrived! Pay shipping or come pick it up."
    await prisma.notification.create({
      data: {
        userId: order.customerId,
        type: 'ORDER_UPDATE',
        title: isPickup ? 'Pre-order Ready for Pickup' : 'Shipping Invoice Issued',
        message: isPickup 
          ? `Your pre-order for Order #${order.id.slice(0, 8)} has arrived and is ready for pickup!`
          : `Your pre-order for Order #${order.id.slice(0, 8)} has arrived. Please pay the shipping balance of GHS ${amount.toFixed(2)} within 7 days.`,
        data: JSON.stringify({ invoiceId: invoice.id, orderId }),
      }
    })

    return NextResponse.json({
      success: true,
      message: isPickup ? "Pickup notification sent" : "Shipping invoice issued successfully",
      invoice
    })

  } catch (error) {
    const { status, message } = mapErrorToResponse(error, { route: 'shipping-invoices.POST' })
    return NextResponse.json({ error: message }, { status })
  }
}
