import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { sendDeliveryUpdateEmail } from "@/lib/mail"
import { mapErrorToResponse } from "@/lib/api-utils"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id: orderId } = await params
    const body = await request.json()
    const { riderId, riderName, riderPhone, manualDeliveryFee, trackingNumber } = body

    // 1. Fetch order to verify professional
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        items: {
          include: {
            product: true
          }
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Verify user is the professional for at least one item
    const isProfessionalForOrder = order.items.some(item => item.professionalId === user.id)
    if (!isProfessionalForOrder && !["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // 2. Update Order with Manual Delivery Details
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        riderName,
        riderPhone,
        manualDeliveryFee: manualDeliveryFee ? parseFloat(manualDeliveryFee) : 0,
        trackingNumber: trackingNumber || order.trackingNumber,
        status: "READY_FOR_DELIVERY",
        readyForDeliveryAt: new Date(),
        riderId: riderId || null,
      }
    })

    // 3. Send Notification Email to Customer
    if (order.customer.email) {
      // Get seller name
      const profile = await prisma.professionalProfile.findUnique({
        where: { userId: user.id },
        select: { businessName: true }
      });
      const sellerName = profile?.businessName || `${user.firstName} ${user.lastName}`;

      // Format items for email
      const items = order.items.map(item => ({
        name: item.product.name,
        quantity: item.quantity
      }));

      await sendDeliveryUpdateEmail({
        to: order.customer.email,
        orderId: order.id,
        riderName,
        riderPhone,
        deliveryPrice: parseFloat(manualDeliveryFee) || 0,
        trackingNumber: trackingNumber || order.trackingNumber || undefined,
        sellerName,
        items,
      })
    }

    // 4. Create in-app notification for Customer
    const sellerNameFinal = (await prisma.professionalProfile.findUnique({
      where: { userId: user.id },
      select: { businessName: true }
    }))?.businessName || `${user.firstName} ${user.lastName}`;

    await prisma.notification.create({
      data: {
        userId: order.customerId,
        type: 'ORDER_UPDATE',
        title: 'Order Ready for Delivery!',
        message: `Order #${order.id.slice(-8).toUpperCase()} from ${sellerNameFinal} is ready for delivery.${riderName ? ` Rider: ${riderName}` : ''}`,
        data: JSON.stringify({ 
          orderId: order.id, 
          status: 'READY_FOR_DELIVERY',
          riderName,
          riderPhone,
          trackingNumber
        }),
      },
    })

    return NextResponse.json({ 
      success: true, 
      order: updatedOrder
    })

  } catch (error) {
    const { status, message } = mapErrorToResponse(error, { route: 'manual-delivery' })
    return NextResponse.json({ error: message }, { status })
  }
}
