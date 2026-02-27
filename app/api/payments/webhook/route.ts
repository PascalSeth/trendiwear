import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PAYSTACK_CONFIG, toCedis, verifyTransaction } from '@/lib/paystack'
import crypto from 'crypto'

// Disable body parsing for webhook signature verification
export const runtime = 'nodejs'

// Verify Paystack webhook signature
function verifyWebhookSignature(payload: string, signature: string): boolean {
  const hash = crypto
    .createHmac('sha512', PAYSTACK_CONFIG.secretKey)
    .update(payload)
    .digest('hex')
  return hash === signature
}

// POST: Handle Paystack webhook events
export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-paystack-signature')
    
    if (!signature) {
      console.error('Missing Paystack signature')
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    const payload = await request.text()
    
    // Verify signature
    if (!verifyWebhookSignature(payload, signature)) {
      console.error('Invalid Paystack signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const event = JSON.parse(payload)
    console.log('Paystack webhook event:', event.event)

    // Handle different event types
    switch (event.event) {
      case 'charge.success':
        await handleChargeSuccess(event.data)
        break
        
      case 'charge.failed':
        await handleChargeFailed(event.data)
        break
        
      case 'transfer.success':
        await handleTransferSuccess(event.data)
        break
        
      case 'transfer.failed':
        await handleTransferFailed(event.data)
        break
        
      default:
        console.log('Unhandled webhook event:', event.event)
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    // Still return 200 to prevent Paystack from retrying
    return NextResponse.json({ received: true, error: 'Processing error' })
  }
}

// Handle successful charge/payment
async function handleChargeSuccess(data: {
  reference: string
  amount: number
  paid_at: string
  channel: string
  fees: number
  metadata?: {
    orderId?: string
    customerId?: string
  }
}) {
  const { reference, amount, paid_at, channel, fees } = data

  // Find order by reference
  const order = await prisma.order.findUnique({
    where: { paystackReference: reference },
    include: {
      items: true,
    },
  })

  if (!order) {
    console.error('Order not found for reference:', reference)
    return
  }

  // Skip if already processed
  if (order.paymentStatus === 'PAID') {
    console.log('Order already processed:', order.id)
    return
  }

  // Verify with Paystack API to be extra safe
  try {
    const verification = await verifyTransaction(reference)
    if (verification.data.status !== 'success') {
      console.error('Verification failed for reference:', reference)
      return
    }
  } catch (error) {
    console.error('Failed to verify transaction:', error)
    return
  }

  // Update order
  await prisma.order.update({
    where: { id: order.id },
    data: {
      paymentStatus: 'PAID',
      status: 'PROCESSING',
      paystackPaidAt: new Date(paid_at),
      paystackChannel: channel,
      paystackFees: fees ? toCedis(fees) : null,
    },
  })

  // Update product stock and sold count
  for (const item of order.items) {
    await prisma.product.update({
      where: { id: item.productId },
      data: {
        stockQuantity: { decrement: item.quantity },
        soldCount: { increment: item.quantity },
      },
    })
  }

  // Create notifications
  await prisma.notification.create({
    data: {
      userId: order.customerId,
      type: 'ORDER_UPDATE',
      title: 'Payment Confirmed',
      message: `Your payment of GHS ${toCedis(amount).toFixed(2)} has been confirmed. Your order is being processed.`,
      data: { orderId: order.id },
    },
  })

  // Notify sellers
  const sellerIds = [...new Set(order.items.map(item => item.professionalId))]
  for (const sellerId of sellerIds) {
    const sellerItems = order.items.filter(item => item.professionalId === sellerId)
    const sellerTotal = sellerItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)

    await prisma.notification.create({
      data: {
        userId: sellerId,
        type: 'ORDER_UPDATE',
        title: 'New Order - Payment Confirmed',
        message: `You have a new paid order worth GHS ${sellerTotal.toFixed(2)}. Please prepare for shipping.`,
        data: { orderId: order.id },
      },
    })

    // Update professional analytics
    await prisma.professionalAnalytics.upsert({
      where: { professionalId: sellerId },
      update: {
        totalOrders: { increment: 1 },
        totalRevenue: { increment: sellerTotal },
      },
      create: {
        professionalId: sellerId,
        totalOrders: 1,
        totalRevenue: sellerTotal,
      },
    })
  }

  console.log('Successfully processed payment for order:', order.id)
}

// Handle failed charge
async function handleChargeFailed(data: {
  reference: string
  gateway_response?: string
}) {
  const { reference, gateway_response } = data

  const order = await prisma.order.findUnique({
    where: { paystackReference: reference },
  })

  if (!order) {
    console.error('Order not found for failed charge:', reference)
    return
  }

  await prisma.order.update({
    where: { id: order.id },
    data: {
      paymentStatus: 'FAILED',
    },
  })

  await prisma.notification.create({
    data: {
      userId: order.customerId,
      type: 'ORDER_UPDATE',
      title: 'Payment Failed',
      message: `Your payment for order #${order.id.substring(0, 8)} failed. ${gateway_response || 'Please try again.'}`,
      data: { orderId: order.id },
    },
  })

  console.log('Payment failed for order:', order.id)
}

// Handle successful transfer to seller
async function handleTransferSuccess(data: {
  reference: string
  amount: number
  recipient: {
    details: {
      account_number: string
      account_name: string
      bank_name: string
    }
  }
}) {
  console.log('Transfer successful:', data.reference, 'Amount:', toCedis(data.amount))
  // This is for tracking when sellers receive their funds
  // You could add a transfers table to track this
}

// Handle failed transfer
async function handleTransferFailed(data: {
  reference: string
  reason?: string
}) {
  console.error('Transfer failed:', data.reference, 'Reason:', data.reason)
  // Handle failed transfers - may need manual intervention
}
