import { type NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { PAYSTACK_CONFIG, toCedis, verifyTransaction } from '@/lib/paystack'
import { fulfillOrder } from '@/lib/orders'
import crypto from 'crypto'
import { format } from 'date-fns'

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

interface ChargeSuccessData {
  reference: string
  amount: number
  paid_at: string
  channel: string
  fees?: number
  metadata?: Record<string, unknown>
}

// Handle successful charge/payment
async function handleChargeSuccess(data: ChargeSuccessData) {
  const { reference, paid_at, channel, fees } = data
  
  // 1. Try to find if this is a Booking payment
  const booking = await prisma.booking.findUnique({
    where: { paystackReference: reference }
  })

  if (booking) {
    // 2. Check for race condition (Did someone else secure the slot while this user was paying?)
    const conflict = await prisma.booking.findFirst({
      where: {
        professionalId: booking.professionalId,
        id: { not: booking.id },
        OR: [
          { paymentStatus: 'PAID' },
          { paymentMethod: 'IN_PERSON', status: 'CONFIRMED' }
        ],
        AND: [
          { bookingDate: { lt: booking.endTime || new Date() } },
          { endTime: { gt: booking.bookingDate } },
        ],
      },
    })

    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        paymentStatus: 'PAID',
        paystackPaidAt: new Date(paid_at),
        paystackFees: fees ? toCedis(fees) : null,
      },
    })

    // Notify Customer & Pro
    await prisma.notification.createMany({
      data: [
        {
          userId: booking.customerId,
          type: 'BOOKING_UPDATE',
          title: conflict ? 'Booking Success (Conflict Alert)' : 'Appointment Secured',
          message: conflict 
            ? `Your payment was successful, but the slot was secured by another customer just moments before. Please contact the professional for a reschedule or refund.`
            : `Your payment for the session with ${booking.id.slice(-6)} was successful. Your slot is now locked.`,
          data: { bookingId: booking.id, hasConflict: !!conflict },
        },
        {
          userId: booking.professionalId,
          type: 'BOOKING_UPDATE',
          title: conflict ? 'URGENT: Booking Conflict' : 'Session Paid & Locked',
          message: conflict
            ? `A customer paid for a slot on ${format(new Date(booking.bookingDate), 'MMM dd')} that was just secured by another session. You must resolve this manually.`
            : `The customer has paid for their appointment on ${format(new Date(booking.bookingDate), 'MMM dd')}.`,
          data: { bookingId: booking.id, hasConflict: !!conflict },
        }
      ]
    })
    
    console.log('Successfully processed payment for booking:', booking.id)
    return
  }

  // 2. Fallback to Order payment
  const order = await prisma.order.findUnique({
    where: { paystackReference: reference },
    include: { items: true },
  })

  if (order) {
    if (order.paymentStatus === 'PAID') return

    // Verify with Paystack API
    try {
      const verification = await verifyTransaction(reference)
      if (verification.data.status !== 'success') return
    } catch (error) {
      console.error('Failed to verify transaction:', error)
      return
    }

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

    await fulfillOrder(order.id)
    console.log('Successfully processed payment for order:', order.id)
    return
  }

  console.error('No Order or Booking found for reference:', reference)
}

// Handle failed charge
async function handleChargeFailed(data: {
  reference: string
  gateway_response?: string
}) {
  const { reference } = data

  // Check Order
  const order = await prisma.order.findUnique({
    where: { paystackReference: reference },
  })

  if (order) {
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: 'FAILED' },
    })
    await prisma.notification.create({
      data: {
        userId: order.customerId,
        type: 'ORDER_UPDATE',
        title: 'Order Payment Failed',
        message: `Your payment for order #${order.id.substring(0, 8)} failed.`,
        data: { orderId: order.id },
      },
    })
    return
  }

  // Check Booking
  const booking = await prisma.booking.findUnique({
    where: { paystackReference: reference },
  })
  
  if (booking) {
    await prisma.booking.update({
      where: { id: booking.id },
      data: { paymentStatus: 'UNPAID' }, // Revert or stay unpaid
    })
    await prisma.notification.create({
      data: {
        userId: booking.customerId,
        type: 'BOOKING_UPDATE',
        title: 'Booking Payment Failed',
        message: `Your payment for the professional session failed. Please retry from your bookings page.`,
        data: { bookingId: booking.id },
      },
    })
  }
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
  // For Registered Business accounts, we monitor transfer failures for administrative audit
  // and potential automated retries depending on the failure reason.
}
