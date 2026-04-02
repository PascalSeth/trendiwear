import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { mapErrorToResponse } from '@/lib/api-utils'
import type { Prisma, OrderStatus } from "@prisma/client"
import { sendStatusUpdateEmail } from "@/lib/mail"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await requireAuth()

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        address: true,
        items: {
          include: {
            product: {
              include: {
                professional: {
                  select: {
                    firstName: true,
                    lastName: true,
                    professionalProfile: {
                      select: { businessName: true },
                    },
                  },
                },
              },
            },
          },
        },
        deliveryConfirmation: true,
        paymentEscrow: true,
        coupons: {
          include: { coupon: true },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    const canView =
      order.customerId === user.id ||
      order.items.some((item) => item.professionalId === user.id) ||
      ["ADMIN", "SUPER_ADMIN"].includes(user.role)

    if (!canView) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json(order)
  } catch (error) {
    const { status, message } = mapErrorToResponse(error, { route: 'orders.[id].GET' })
    if (status === 401) return NextResponse.json({ error: message, toast: 'You must be logged in to continue.' }, { status })
    return NextResponse.json({ error: message }, { status })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await requireAuth()
    const body = await request.json()
    const { status, trackingNumber, notes }: { status?: OrderStatus; trackingNumber?: string; notes?: string } = body

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    const canUpdate =
      order.items.some((item) => item.professionalId === user.id) || ["ADMIN", "SUPER_ADMIN"].includes(user.role)

    if (!canUpdate) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const updateData: Prisma.OrderUpdateInput = {}
    if (status) updateData.status = status
    if (trackingNumber) updateData.trackingNumber = trackingNumber
    if (notes) updateData.notes = notes

    if (status === "DELIVERED") {
      updateData.actualDelivery = new Date()

      await prisma.deliveryConfirmation.create({
        data: {
          orderId: id,
          customerId: order.customerId,
          professionalId: user.id,
          confirmationDeadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        },
      })
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        items: {
          include: { product: true },
        },
      },
    })

    // Send notification to customer about status change
    if (status) {
      const statusMessages: Record<OrderStatus, { title: string; message: string; type: 'ORDER_UPDATE' | 'SHIPPING_UPDATE' | 'DELIVERY_ARRIVAL' }> = {
        PENDING: { title: 'Order Pending', message: 'Your order is pending confirmation.', type: 'ORDER_UPDATE' },
        CONFIRMED: { title: 'Order Confirmed!', message: 'Great news! Your order has been confirmed and is being prepared.', type: 'ORDER_UPDATE' },
        PROCESSING: { title: 'Order Processing', message: 'Your order is being processed and will ship soon.', type: 'ORDER_UPDATE' },
        SHIPPED: { title: 'Order Shipped!', message: `Your order is on its way!${trackingNumber ? ` Tracking: ${trackingNumber}` : ''}`, type: 'SHIPPING_UPDATE' },
        DELIVERED: { title: 'Order Delivered!', message: 'Your order has been delivered. Please confirm receipt within 48 hours.', type: 'DELIVERY_ARRIVAL' },
        CANCELLED: { title: 'Order Cancelled', message: 'Your order has been cancelled. Contact support if you have questions.', type: 'ORDER_UPDATE' },
        REFUNDED: { title: 'Refund Processed', message: 'Your refund has been processed. It may take 3-5 business days to reflect.', type: 'ORDER_UPDATE' },
        PARTIALLY_REFUNDED: { title: 'Partial Refund', message: 'A partial refund has been issued for your order. Check your account for details.', type: 'ORDER_UPDATE' },
        READY_FOR_DELIVERY: { title: 'Ready for Delivery', message: 'Your order is ready for delivery.', type: 'ORDER_UPDATE' },
        AWAITING_DELIVERY_PAYMENT: { title: 'Payment Required', message: 'Please pay the delivery fee to proceed with your order.', type: 'ORDER_UPDATE' },
      }

      const notificationContent = statusMessages[status]
      if (notificationContent) {
        await prisma.notification.create({
          data: {
            userId: order.customerId,
            type: notificationContent.type,
            title: notificationContent.title,
            message: `Order #${id.slice(-8).toUpperCase()}: ${notificationContent.message}`,
            data: JSON.stringify({ orderId: id, status, trackingNumber }),
          },
        })

        // Also send email
        try {
          await sendStatusUpdateEmail({
            to: updatedOrder.customer.email,
            orderId: id,
            status: status,
            message: notificationContent.message,
          })
        } catch (emailErr) {
          console.error('Failed to send status update email:', emailErr)
        }
      }
    }

    return NextResponse.json(updatedOrder)
  } catch (error) {
    const { status, message } = mapErrorToResponse(error, { route: 'orders.[id].PUT' })
    if (status === 401) return NextResponse.json({ error: message, toast: 'You must be logged in to continue.' }, { status })
    return NextResponse.json({ error: message }, { status })
  }
}
