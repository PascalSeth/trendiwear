import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import prisma from '@/lib/prisma'
import { activateSubscription } from '@/lib/subscription-service'
import { fulfillOrder } from '@/lib/orders'
import { toCedis } from '@/lib/paystack'

/**
 * POST /api/webhooks/paystack
 * Secure webhook handler for Paystack events.
 * Handles both Subscriptions and Orders for maximum reliability.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = req.headers.get('x-paystack-signature')

    if (!signature) {
      return new Response('No signature', { status: 400 })
    }

    // 1. Verify Signature
    const secret = process.env.PAYSTACK_SECRET_KEY!
    const expectedSignature = crypto
      .createHmac('sha512', secret)
      .update(body)
      .digest('hex')

    if (signature !== expectedSignature) {
      console.warn('Invalid Paystack signature detected')
      return new Response('Invalid signature', { status: 401 })
    }

    const event = JSON.parse(body)
    const { event: eventName, data } = event

    console.info(`Paystack Webhook Received: ${eventName}`, { reference: data.reference })

    // 2. Handle Success Events
    if (eventName === 'charge.success') {
      const metadata = data.metadata
      const reference = data.reference

      // --- SUBSCRIPTION HANDLING ---
      if (metadata?.type === 'SUBSCRIPTION_PAYMENT') {
        const { professionalId, tierId, billingCycle } = metadata

        console.info('Processing Webhook Subscription:', { professionalId, reference })

        await activateSubscription({
          professionalId,
          tierId,
          billingCycle,
          amount: data.amount / 100, // Pesewas to Cedis
          reference,
          channel: data.channel,
          paidAt: data.paid_at ? new Date(data.paid_at) : new Date(),
        })
      }

      // --- BOOKING DEPOSIT HANDLING ---
      if (metadata?.type === 'BOOKING_DEPOSIT' && metadata?.bookingId) {
        const bookingId = metadata.bookingId
        console.info('Processing Webhook Booking Deposit:', { bookingId, reference })

        const booking = await prisma.booking.findUnique({ where: { id: bookingId } })
        
        if (booking && booking.paymentStatus !== 'PAID') {
          // If balanceAmount is null or 0, that means they paid the full thing, else it's a deposit.
          const isFullPayment = !booking.balanceAmount || booking.balanceAmount <= 0
          
          await prisma.booking.update({
            where: { id: bookingId },
            data: {
              paymentStatus: isFullPayment ? 'PAID' : 'PARTIALLY_PAID',
              status: 'CONFIRMED',
              paystackPaidAt: new Date(data.paid_at),
              paystackFees: data.fees ? toCedis(data.fees) : null,
            }
          })
          
          await prisma.paymentEscrow.create({
            data: {
              bookingId: bookingId,
              professionalId: booking.professionalId,
              amount: booking.depositAmount ?? booking.totalPrice ?? toCedis(data.amount),
              status: booking.isQuoteBased ? 'RELEASED' : 'RELEASED', // Deposits go directly to tailor to buy fabric
              releasedAt: new Date(),
            }
          })
        }
      }

      // --- BOOKING BALANCE HANDLING ---
      if (metadata?.type === 'BOOKING_BALANCE' && metadata?.bookingInvoiceId) {
        const invoiceId = metadata.bookingInvoiceId
        console.info('Processing Webhook Booking Balance:', { invoiceId, reference })

        const invoice = await prisma.bookingInvoice.findUnique({ where: { id: invoiceId }, include: { booking: true } })
        
        if (invoice && invoice.status !== 'PAID') {
           await prisma.bookingInvoice.update({
              where: { id: invoice.id },
              data: { 
                status: 'PAID',
                paystackReference: reference
              }
           })
           
           await prisma.booking.update({
              where: { id: invoice.bookingId },
              data: { paymentStatus: 'PAID' }
           })
           
           await prisma.paymentEscrow.create({
              data: { 
                bookingId: invoice.bookingId, 
                professionalId: invoice.professionalId, 
                amount: invoice.amount, 
                status: 'HELD' 
              }
           })
        }
      }

      // --- SHIPPING INVOICE HANDLING ---
      if (metadata?.type === 'SHIPPING_INVOICE') {
        const { invoiceId, orderId } = metadata
        console.info('Processing Webhook Shipping Invoice:', { invoiceId, orderId, reference })

        const invoice = await prisma.shippingInvoice.findUnique({
          where: { id: invoiceId },
        })

        if (invoice && invoice.status !== 'PAID') {
          await prisma.shippingInvoice.update({
            where: { id: invoiceId },
            data: {
              status: 'PAID',
              paidAt: data.paid_at ? new Date(data.paid_at) : new Date(),
            },
          })

          // Update related order items to dispatch ready
          await prisma.orderItem.updateMany({
            where: { 
              orderId, 
              professionalId: invoice.professionalId,
              isPreorder: true
            },
            data: { status: 'CONFIRMED' } // Allows seller to trigger local Delivery later
          })
          
          await prisma.notification.create({
            data: {
              userId: invoice.professionalId,
              type: 'ORDER_UPDATE',
              title: 'Shipping Invoice Paid',
              message: `The shipping invoice for Order #${orderId.slice(0, 8)} has been paid. You can now dispatch the item!`,
              data: JSON.stringify({ invoiceId, orderId }),
            }
          })
        }
      }

      // --- ORDER HANDLING ---
      // We also handle orders here in case the browser redirect failed
      if (metadata?.orderId) {
        const orderId = metadata.orderId
        console.info('Processing Webhook Order:', { orderId, reference })

        const order = await prisma.order.findUnique({
          where: { id: orderId },
        })

        if (order && order.paymentStatus !== 'PAID') {
          await prisma.order.update({
            where: { id: orderId },
            data: {
              paymentStatus: 'PAID',
              status: 'PROCESSING',
              paystackPaidAt: new Date(data.paid_at),
              paystackChannel: data.channel,
              paystackFees: data.fees ? toCedis(data.fees) : null,
            },
          })

          // Trigger fulfillment (stock, cart, notifications)
          await fulfillOrder(orderId)
        }
      }
    }

    // Acknowledge receipt (Paystack expects 200 OK)
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook Error:', error)
    return new Response('Webhook Handler Error', { status: 500 })
  }
}
