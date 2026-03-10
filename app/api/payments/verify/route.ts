import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { mapErrorToResponse } from '@/lib/api-utils'
import { verifyTransaction, toCedis } from '@/lib/paystack'

// GET: Verify a payment by reference
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    const reference = searchParams.get('reference')

    if (!reference) {
      return NextResponse.json(
        { error: 'Payment reference is required' },
        { status: 400 }
      )
    }

    // Find the order by reference
    const order = await prisma.order.findUnique({
      where: { paystackReference: reference },
      include: {
        customer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                images: true,
              },
            },
          },
        },
      },
    })

    // If no order exists yet, verify the payment and return success
    // The order will be created by the client after verification
    if (!order) {
      // Still verify with Paystack to ensure payment was successful
      const paystackResponse = await verifyTransaction(reference)
      const { data } = paystackResponse

      if (data.status === 'success') {
        return NextResponse.json({
          success: true,
          status: 'success',
          message: 'Payment verified. Ready to create order.',
          verifiedAmount: data.amount,
          needsOrderCreation: true,
        })
      } else {
        return NextResponse.json({
          success: false,
          status: 'failed',
          error: 'Payment verification failed',
        })
      }
    }

    // Verify the order belongs to the user
    if (order.customerId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // If already completed, return the order
    if (order.paymentStatus === 'PAID') {
      return NextResponse.json({
        success: true,
        status: 'success',
        message: 'Payment already verified',
        order: {
          id: order.id,
          totalPrice: order.totalPrice,
          paymentStatus: order.paymentStatus,
          status: order.status,
          paidAt: order.paystackPaidAt,
        },
      })
    }

    // Verify with Paystack
    const paystackResponse = await verifyTransaction(reference)
    const { data } = paystackResponse

    if (data.status === 'success') {
      // Payment successful - update order
      const updatedOrder = await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'PAID',
          status: 'PROCESSING',
          paystackPaidAt: new Date(data.paid_at),
          paystackChannel: data.channel,
          paystackFees: data.fees ? toCedis(data.fees) : null,
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

      // Create notification for customer
      await prisma.notification.create({
        data: {
          userId: order.customerId,
          type: 'ORDER_UPDATE',
          title: 'Payment Successful',
          message: `Your payment of GHS ${order.totalPrice.toFixed(2)} for order #${order.id.substring(0, 8)} was successful.`,
          data: { orderId: order.id },
        },
      })

      // Notify each seller
      const sellerIds = [...new Set(order.items.map(item => item.professionalId))]
      for (const sellerId of sellerIds) {
        const sellerItems = order.items.filter(item => item.professionalId === sellerId)
        const sellerTotal = sellerItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)

        await prisma.notification.create({
          data: {
            userId: sellerId,
            type: 'ORDER_UPDATE',
            title: 'New Order Received',
            message: `You have a new order worth GHS ${sellerTotal.toFixed(2)}. Please prepare for shipping.`,
            data: {
              orderId: order.id,
              items: sellerItems.map(i => ({ productId: i.productId, quantity: i.quantity })),
            },
          },
        })
      }

      return NextResponse.json({
        success: true,
        status: 'success',
        message: 'Payment verified successfully',
        order: {
          id: updatedOrder.id,
          totalPrice: updatedOrder.totalPrice,
          paymentStatus: updatedOrder.paymentStatus,
          status: updatedOrder.status,
          paidAt: updatedOrder.paystackPaidAt,
          channel: updatedOrder.paystackChannel,
        },
      })
    } else if (data.status === 'pending') {
      return NextResponse.json({
        success: false,
        status: 'pending',
        message: 'Payment is still being processed',
      })
    } else {
      // Payment failed
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'FAILED',
        },
      })

      return NextResponse.json({
        success: false,
        status: data.status,
        message: data.gateway_response || 'Payment failed',
      })
    }
  } catch (error) {
    const { status, message } = mapErrorToResponse(error, { route: 'payments.verify' })
    if (status === 401) return NextResponse.json({ error: message, toast: 'You must be logged in to continue.' }, { status })
    return NextResponse.json({ error: message }, { status })
  }
}
