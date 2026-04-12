import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { mapErrorToResponse } from '@/lib/api-utils'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await requireAuth()

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        customer: {
          select: {
            firstName: true,
            lastName: true,
          }
        }
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Only the customer who placed the order can notify
    if (order.customerId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Must be a pickup order and in READY_FOR_PICKUP status
    if (order.deliveryMethod !== 'PICKUP') {
      return NextResponse.json({ error: 'This is not a pickup order' }, { status: 400 })
    }

    if (order.status !== 'READY_FOR_PICKUP') {
       return NextResponse.json({ error: 'Order is not ready for pickup yet' }, { status: 400 })
    }

    // Notify all sellers involved in the order
    const professionalIds = [...new Set(order.items.map(i => i.professionalId))]
    
    for (const profId of professionalIds) {
      await prisma.notification.create({
        data: {
          userId: profId,
          type: 'ORDER_UPDATE',
          title: 'Customer On The Way!',
          message: `${order.customer.firstName} ${order.customer.lastName} is on their way to pick up Order #${id.slice(-8).toUpperCase()}!`,
          data: JSON.stringify({ orderId: id, action: 'INCOMING_CUSTOMER' }),
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Seller notified successfully'
    })

  } catch (error) {
    const { status, message } = mapErrorToResponse(error, { route: 'orders.[id].on-the-way' })
    return NextResponse.json({ error: message }, { status })
  }
}
