import { type NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { mapErrorToResponse } from '@/lib/api-utils'
import {
  initializeTransaction,
  generateReference,
  toPesewas,
} from '@/lib/paystack'

// POST: Initialize a payment for an order
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { orderId, callbackUrl } = body

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    // Fetch the order with customer details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                name: true,
              }
            }
          }
        },
      },
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Verify the order belongs to the user
    if (order.customerId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Check if already paid
    if (order.paymentStatus === 'PAID') {
      return NextResponse.json(
        { error: 'Order is already paid' },
        { status: 400 }
      )
    }

    // Check if there's an existing valid payment reference
    if (order.paystackReference && order.paymentStatus === 'PENDING') {
      // Return existing payment link
      return NextResponse.json({
        success: true,
        authorizationUrl: `https://checkout.paystack.com/${order.paystackAccessCode}`,
        reference: order.paystackReference,
        accessCode: order.paystackAccessCode,
      })
    }

    // Use client-provided reference if supplied, otherwise generate unique reference
    interface InitBody {
      orderId: string
      callbackUrl?: string
      reference?: string
    }

    const parsed = body as InitBody
    const reference = parsed.reference || generateReference('TZ')
    
    const paystackResponse = await initializeTransaction({
      email: order.customer.email,
      amount: toPesewas(order.totalPrice),
      reference,
      callback_url: callbackUrl || `${process.env.NEXT_PUBLIC_APP_URL}/orders/${orderId}/payment-complete`,
      // All splits/subaccounts removed so funds go to platform escrow
      metadata: {
        orderId: order.id,
        customerId: user.id,
        orderItems: order.items.map(item => ({
          productId: item.productId,
          name: item.product.name,
          quantity: item.quantity,
          price: item.price,
        })),
        custom_fields: [
          {
            display_name: 'Order ID',
            variable_name: 'order_id',
            value: order.id,
          },
          {
            display_name: 'Customer',
            variable_name: 'customer_name',
            value: `${order.customer.firstName} ${order.customer.lastName}`,
          },
        ],
      },
      channels: ['card', 'mobile_money', 'bank_transfer'],
    })

    // Update order with payment reference
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paystackReference: reference,
        paystackAccessCode: paystackResponse.data.access_code,
        paymentMethod: 'paystack',
      },
    })

    return NextResponse.json({
      success: true,
      authorizationUrl: paystackResponse.data.authorization_url,
      reference: paystackResponse.data.reference,
      accessCode: paystackResponse.data.access_code,
    })
  } catch (error) {
    const { status, message } = mapErrorToResponse(error, { route: 'payments.initialize' })
    if (status === 401) return NextResponse.json({ error: message, toast: 'You must be logged in to continue.' }, { status })
    return NextResponse.json({ error: message }, { status })
  }
}
