import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { initializeTransaction, toPesewas } from "@/lib/paystack"
import { mapErrorToResponse } from "@/lib/api-utils"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const invoiceId = id

    // 1. Fetch Invoice
    const invoice = await prisma.shippingInvoice.findUnique({
      where: { id: invoiceId },
      include: {
        order: {
          include: {
            customer: true
          }
        }
      }
    })

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    if (invoice.order.customerId !== user.id) {
      return NextResponse.json({ error: "Unauthorized. You do not own this order." }, { status: 403 })
    }

    // 2. Validate Invoice Status
    if (invoice.status === 'PAID') {
      return NextResponse.json({ error: "This invoice has already been paid" }, { status: 400 })
    }

    if (invoice.status === 'CANCELLED') {
      return NextResponse.json({ error: "This invoice was cancelled and cannot be paid" }, { status: 400 })
    }

    if (new Date() > new Date(invoice.expiresAt)) {
      return NextResponse.json({ error: "This invoice has expired" }, { status: 400 })
    }

    if (invoice.amount <= 0) {
      return NextResponse.json({ error: "Invalid invoice amount" }, { status: 400 })
    }

    // 3. Initialize Paystack Transaction
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const callbackUrl = `${baseUrl}/dashboard/purchases/orders/${invoice.orderId}?payment=success`

    const paystackResponse = await initializeTransaction({
      email: invoice.order.customer.email,
      amount: toPesewas(invoice.amount),
      callback_url: callbackUrl,
      metadata: {
        type: 'SHIPPING_INVOICE',
        invoiceId: invoice.id,
        orderId: invoice.orderId,
      }
    })

    if (!paystackResponse || !paystackResponse.status) {
      throw new Error(paystackResponse?.message || 'Failed to initialize Paystack payment')
    }

    // Store the reference
    await prisma.shippingInvoice.update({
      where: { id: invoice.id },
      data: { paystackReference: paystackResponse.data.reference }
    })

    return NextResponse.json({
      success: true,
      authorization_url: paystackResponse.data.authorization_url,
      reference: paystackResponse.data.reference
    })

  } catch (error) {
    const { status, message } = mapErrorToResponse(error, { route: 'shipping-invoices.[id].pay' })
    return NextResponse.json({ error: message }, { status })
  }
}
