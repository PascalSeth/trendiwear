import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { mapErrorToResponse } from "@/lib/api-utils"
import { sendDeliveryUpdateEmail, sendStatusUpdateEmail } from "@/lib/mail"
import { NotificationType } from "@prisma/client"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id: orderId } = await params
    const { status, deliveryMethod, trackingNumber, notes } = await request.json()

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
      }
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Authorization: Customer can cancel or switch to pickup if specific status
    // Professional can update status of their orders
    const isCustomer = order.customerId === user.id
    const isProfessional = order.items.some((item) => item.professionalId === user.id)
    const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(user.role)

    if (!isCustomer && !isProfessional && !isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Validate Status Transitions
    if (isCustomer) {
      if (status === "CANCELLED" && (order.status as string) !== "PENDING") {
        return NextResponse.json({ error: "Cannot cancel order at this stage" }, { status: 400 })
      }
      if (status === "READY_FOR_PICKUP" && (order.status as string) !== "AWAITING_DELIVERY_PAYMENT") {
         return NextResponse.json({ error: "Invalid status transition" }, { status: 400 })
      }
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        ...(deliveryMethod && { deliveryMethod }),
        ...(trackingNumber !== undefined && { trackingNumber }),
        ...(notes !== undefined && { notes }),
      },
      include: {
        customer: {
          select: {
            id: true,
            email: true,
          }
        }
      }
    })

    // Send notifications
    const statusMessages: Record<string, { title: string; message: string; type: NotificationType }> = {
      PENDING: { title: 'Order Pending', message: 'Your order is pending confirmation.', type: 'ORDER_UPDATE' },
      CONFIRMED: { title: 'Order Confirmed!', message: 'Great news! Your order has been confirmed and is being prepared.', type: 'ORDER_UPDATE' },
      PROCESSING: { title: 'Order Processing', message: 'Your order is being processed and will ship soon.', type: 'ORDER_UPDATE' },
      SHIPPED: { title: 'Order Shipped!', message: `Your order is on its way!${trackingNumber ? ` Tracking: ${trackingNumber}` : ''}`, type: 'SHIPPING_UPDATE' },
      DELIVERED: { title: 'Order Delivered!', message: 'Your order has been delivered. Please confirm receipt within 48 hours.', type: 'DELIVERY_ARRIVAL' },
      CANCELLED: { title: 'Order Cancelled', message: 'Your order has been cancelled. Contact support if you have questions.', type: 'ORDER_UPDATE' },
      READY_FOR_DELIVERY: { title: 'Ready for Delivery', message: 'Your order is ready for delivery.', type: 'ORDER_UPDATE' },
      AWAITING_DELIVERY_PAYMENT: { title: 'Payment Required', message: 'Please pay the delivery fee to proceed with your order.', type: 'ORDER_UPDATE' },
      READY_FOR_PICKUP: { title: 'Ready for Pickup', message: 'Your order is ready for pickup at the store.', type: 'ORDER_UPDATE' },
    }

    const notificationContent = statusMessages[status]
    if (notificationContent && updatedOrder.customerId) {
      await prisma.notification.create({
        data: {
          userId: updatedOrder.customerId,
          type: notificationContent.type,
          title: notificationContent.title,
          message: `Order #${orderId.slice(-8).toUpperCase()}: ${notificationContent.message}`,
          data: JSON.stringify({ orderId, status, trackingNumber }),
        },
      })
    }

    // Send email to customer on key status changes
    if (status && updatedOrder.customer?.email) {
      try {
        if (status === 'SHIPPED') {
          const fullOrder = await prisma.order.findUnique({
            where: { id: orderId },
            include: { items: { include: { product: { select: { name: true } } } } }
          })
          await sendDeliveryUpdateEmail({
            to: updatedOrder.customer.email,
            orderId,
            trackingNumber: trackingNumber || undefined,
            items: fullOrder?.items.map((i) => ({ name: i.product.name, quantity: i.quantity })),
          })
        } else if (['DELIVERED', 'CANCELLED', 'PROCESSING'].includes(status)) {
          const notifContent = statusMessages[status]
          if (notifContent) {
            await sendStatusUpdateEmail({
              to: updatedOrder.customer.email,
              orderId,
              status,
              message: `Order #${orderId.slice(-8).toUpperCase()}: ${notifContent.message}`,
            })
          }
        }
      } catch (emailErr) {
        console.error('Failed to send status email:', emailErr)
      }
    }

    return NextResponse.json({ success: true, order: updatedOrder })

  } catch (error) {
    const { status, message } = mapErrorToResponse(error, { route: 'order-status' })
    return NextResponse.json({ error: message }, { status })
  }
}
