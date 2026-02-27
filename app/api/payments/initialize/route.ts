import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import {
  initializeTransaction,
  generateReference,
  toPesewas,
  calculateSplit,
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

    // Fetch the order with items and professional details
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
              include: {
                professional: {
                  include: {
                    professionalProfile: {
                      select: {
                        id: true,
                        businessName: true,
                        paystackSubaccountCode: true,
                        paymentSetupComplete: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        address: true,
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
        authorizationUrl: `https://checkout.paystack.com/${order.paystackAccessCode}`,
        reference: order.paystackReference,
        accessCode: order.paystackAccessCode,
      })
    }

    // Group items by professional for split payments
    const professionalItems = new Map<string, {
      subaccountCode: string | null
      businessName: string
      amount: number
      items: typeof order.items
    }>()

    for (const item of order.items) {
      const professional = item.product.professional
      const profile = professional.professionalProfile

      if (!professionalItems.has(item.professionalId)) {
        professionalItems.set(item.professionalId, {
          subaccountCode: profile?.paystackSubaccountCode || null,
          businessName: profile?.businessName || `${professional.firstName} ${professional.lastName}`,
          amount: 0,
          items: [],
        })
      }

      const profData = professionalItems.get(item.professionalId)!
      profData.amount += item.price * item.quantity
      profData.items.push(item)
    }

    // Generate unique reference
    const reference = generateReference('TZ')
    
    // Calculate platform fee
    const { platformFee, platformFeePercent } = calculateSplit(order.totalPrice)

    // Build split payment configuration
    // For single seller orders, use simple subaccount split
    // For multi-seller orders, use split code (more complex)
    const professionals = Array.from(professionalItems.values())
    
    let transactionPayload: Parameters<typeof initializeTransaction>[0]

    if (professionals.length === 1 && professionals[0].subaccountCode) {
      // Single seller with subaccount - use direct subaccount split
      transactionPayload = {
        email: order.customer.email,
        amount: toPesewas(order.totalPrice),
        reference,
        callback_url: callbackUrl || `${process.env.NEXT_PUBLIC_APP_URL}/orders/${orderId}/payment-complete`,
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
        subaccount: professionals[0].subaccountCode,
        bearer: 'account', // Platform bears transaction charges
        channels: ['card', 'mobile_money', 'bank_transfer'],
      }
    } else if (professionals.some(p => p.subaccountCode)) {
      // Multiple sellers or mixed - use percentage split
      const subaccounts = professionals
        .filter(p => p.subaccountCode)
        .map(p => ({
          subaccount: p.subaccountCode!,
          share: Math.round((p.amount / order.totalPrice) * (100 - platformFeePercent)),
        }))

      transactionPayload = {
        email: order.customer.email,
        amount: toPesewas(order.totalPrice),
        reference,
        callback_url: callbackUrl || `${process.env.NEXT_PUBLIC_APP_URL}/orders/${orderId}/payment-complete`,
        metadata: {
          orderId: order.id,
          customerId: user.id,
          custom_fields: [
            {
              display_name: 'Order ID',
              variable_name: 'order_id',
              value: order.id,
            },
          ],
        },
        split: {
          type: 'percentage',
          bearer_type: 'account',
          subaccounts,
        },
        channels: ['card', 'mobile_money', 'bank_transfer'],
      }
    } else {
      // No subaccounts - payment goes to main account
      // You may want to handle this case differently (e.g., reject payment)
      transactionPayload = {
        email: order.customer.email,
        amount: toPesewas(order.totalPrice),
        reference,
        callback_url: callbackUrl || `${process.env.NEXT_PUBLIC_APP_URL}/orders/${orderId}/payment-complete`,
        metadata: {
          orderId: order.id,
          customerId: user.id,
          noSplit: true, // Flag that this payment didn't split
          custom_fields: [
            {
              display_name: 'Order ID',
              variable_name: 'order_id',
              value: order.id,
            },
          ],
        },
        channels: ['card', 'mobile_money', 'bank_transfer'],
      }
    }

    // Initialize transaction with Paystack
    const paystackResponse = await initializeTransaction(transactionPayload)

    // Update order with payment reference
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paystackReference: reference,
        paystackAccessCode: paystackResponse.data.access_code,
        platformFee,
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
    console.error('Payment initialization error:', error)
    const message = error instanceof Error ? error.message : 'Failed to initialize payment'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
