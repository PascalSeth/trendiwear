import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { mapErrorToResponse } from "@/lib/api-utils"
import { sendDeliveryUpdateEmail, sendStatusUpdateEmail } from "@/lib/mail"
import { NotificationType, OrderStatus } from "@prisma/client"
import { cancelAndRefundOrder } from "@/lib/orders"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id: orderId } = await params
    const { status, deliveryMethod, trackingNumber, notes, sellerDeliveryFee } = await request.json()

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        customer: { select: { id: true, email: true } }
      }

    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Authorization & Targeting Logic
    const isCustomer = order.customerId === user.id
    const isProfessional = order.items.some((item) => item.professionalId === user.id)
    const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(user.role)

    if (!isCustomer && !isProfessional && !isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Status mapping for notifications
    const statusMessages: Record<string, { title: string; message: string; type: NotificationType }> = {
      PENDING: { title: 'Order Pending', message: 'Your order is pending confirmation.', type: 'ORDER_UPDATE' },
      CONFIRMED: { title: 'Order Confirmed!', message: 'Great news! Your order has been confirmed and is being prepared.', type: 'ORDER_UPDATE' },
      PROCESSING: { title: 'Order Processing', message: 'Your order is being processed and will ship soon.', type: 'ORDER_UPDATE' },
      SHIPPED: { title: 'Order Shipped!', message: `Your package from a seller is on its way!${trackingNumber ? ` Tracking: ${trackingNumber}` : ''}`, type: 'SHIPPING_UPDATE' },
      DELIVERED: { title: 'Order Delivered!', message: 'Your order has been delivered. Please confirm receipt to release funds.', type: 'DELIVERY_ARRIVAL' },
      CANCELLED: { title: 'Order Cancelled', message: 'Your order has been cancelled.', type: 'ORDER_UPDATE' },
      READY_FOR_DELIVERY: { title: 'Ready for Delivery', message: 'Your package is ready for delivery. Delivery fee may apply.', type: 'ORDER_UPDATE' },
      READY_FOR_PICKUP: { title: 'Ready for Pickup', message: 'Your order is ready for pickup at the seller location.', type: 'ORDER_UPDATE' },
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      // 1. Update individual OrderItems for the professional
      if (isProfessional) {
        await tx.orderItem.updateMany({
          where: { 
            orderId, 
            professionalId: user.id 
          },
          data: { 
            status,
            ...(sellerDeliveryFee !== undefined && { deliveryFee: sellerDeliveryFee })
          }
        })

        // 2. Upsert DeliveryConfirmation with tracking number (if provided)
        if (trackingNumber !== undefined) {
          await tx.deliveryConfirmation.upsert({
            where: {
              orderId_professionalId: {
                orderId,
                professionalId: user.id
              }
            },
            create: {
              orderId,
              professionalId: user.id,
              customerId: order.customerId,
              trackingNumber,
              status: status === 'DELIVERED' ? 'CONFIRMED' : 'PENDING',
              confirmationDeadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 48h fallback
            },
            update: {
              trackingNumber
            }
          })
        }
      }

      // 3. Determine global Order status
      let globalStatus = status
      if (isProfessional) {
        const allItems = await tx.orderItem.findMany({ where: { orderId } })
        const statuses = allItems.map(i => i.status)
        if (statuses.every(s => s === 'DELIVERED')) globalStatus = 'DELIVERED'
        else if (statuses.some(s => s === 'SHIPPED')) globalStatus = 'SHIPPED'
        else if (statuses.some(s => s === 'PROCESSING')) globalStatus = 'PROCESSING'
        else globalStatus = order.status
      }

      // 4. Handle Refund if cancelling a paid order
      if (status === 'CANCELLED' && order.paymentStatus === 'PAID') {
        // Sellers/Admins can always trigger refund on cancellation
        if (isProfessional || isAdmin) {
          return await cancelAndRefundOrder(orderId, { bypassWindow: true })
        }
      }

      return await tx.order.update({
        where: { id: orderId },
        data: {
          status: globalStatus as OrderStatus,
          ...(deliveryMethod && { deliveryMethod }),
          ...(notes !== undefined && { notes }),
        },
        include: {
          customer: { select: { id: true, email: true } }
        }
      })
    })

    // Send notification to customer
    const notificationContent = statusMessages[status]
    if (notificationContent && order.customerId) {
        await prisma.notification.create({
          data: {
            userId: order.customerId,
            type: notificationContent.type,
            title: notificationContent.title,
            message: `Order #${orderId.slice(-8).toUpperCase()}: ${notificationContent.message}`,
            data: JSON.stringify({ orderId, status, trackingNumber, professionalId: user.id }),
          },
        })
    }

    // Send email to customer on key status changes
    if (status && order.customer?.email) {
      try {
        if (status === 'SHIPPED') {
          const fullOrder = await prisma.order.findUnique({
            where: { id: orderId },
            include: { items: { include: { product: { select: { name: true } } } } }
          })
          await sendDeliveryUpdateEmail({
            to: order.customer.email,
            orderId,
            trackingNumber: trackingNumber || undefined,
            items: fullOrder?.items.map((i) => ({ name: i.product.name, quantity: i.quantity })),
          })
        } else if (['DELIVERED', 'CANCELLED', 'PROCESSING', 'READY_FOR_PICKUP'].includes(status)) {
          const notifContent = statusMessages[status]
          if (notifContent) {
            await sendStatusUpdateEmail({
              to: order.customer.email,
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
