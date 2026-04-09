import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { mapErrorToResponse } from '@/lib/api-utils'

// POST: Customer confirms they have received the order
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await requireAuth()

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        deliveryConfirmation: true,
        items: true,
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Only the customer who placed the order can confirm delivery
    if (order.customerId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Must be in SHIPPED or DELIVERED status to confirm
    if (!['SHIPPED', 'DELIVERED'].includes(order.status)) {
      return NextResponse.json({ error: 'Order is not in a deliverable state' }, { status: 400 })
    }

    // Update order status to DELIVERED and mark confirmation
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Update order status
      const updated = await tx.order.update({
        where: { id },
        data: {
          status: 'DELIVERED',
          actualDelivery: new Date(),
        },
      })

      // Update or create delivery confirmation
      if (order.deliveryConfirmation) {
        await tx.deliveryConfirmation.update({
          where: { id: order.deliveryConfirmation.id },
          data: {
            customerConfirmed: true,
            confirmedAt: new Date(),
          },
        })
      } else {
        await tx.deliveryConfirmation.create({
          data: {
            orderId: id,
            customerId: user.id,
            professionalId: order.items[0]?.professionalId || '',
            customerConfirmed: true,
            confirmedAt: new Date(),
            confirmationDeadline: new Date(),
          },
        })
      }

      // Notify the seller and Initiate Payout
      const professionalIds = [...new Set(order.items.map(i => i.professionalId))]
      for (const profId of professionalIds) {
        // Find professional profile and recipient code
        await tx.professionalProfile.findUnique({
          where: { userId: profId },
          select: { paystackSubaccountCode: true, businessName: true }
        })

        const sellerItems = order.items.filter(item => item.professionalId === profId)
        const sellerTotal = sellerItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)

        // 1. Send Notification
        await tx.notification.create({
          data: {
            userId: profId,
            type: 'DELIVERY_ARRIVAL',
            title: 'Delivery Confirmed!',
            message: `Customer has confirmed receipt of Order #${id.slice(-8).toUpperCase()}. Your share of GHS ${sellerTotal.toFixed(2)} has been settled via Paystack Split and will reflect in your bank/MoMo account per Paystack's settlement schedule.`,
            data: JSON.stringify({ orderId: id, amount: sellerTotal }),
          },
        })
      }

      return updated
    })

    return NextResponse.json({
      success: true,
      message: 'Delivery confirmed successfully',
      order: updatedOrder
    })
  } catch (error) {
    const { status, message } = mapErrorToResponse(error, { route: 'orders.[id].confirm-delivery' })
    return NextResponse.json({ error: message }, { status })
  }
}
