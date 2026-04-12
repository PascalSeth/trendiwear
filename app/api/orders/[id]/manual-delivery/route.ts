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
    const { riderName, riderPhone, manualDeliveryFee, trackingNumber } = body

    // 1. Fetch order and professional profile
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        items: {
          where: { professionalId: user.id },
          include: { product: true }
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    if (order.items.length === 0 && !["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized or no items for this professional in this order" }, { status: 403 })
    }

    // 2. Perform Targeted Updates in a Transaction
    const result = await prisma.$transaction(async (tx) => {
      // A. Update specific OrderItems
      await tx.orderItem.updateMany({
        where: { 
          orderId, 
          professionalId: user.id 
        },
        data: { 
          status: "READY_FOR_DELIVERY",
          deliveryFee: manualDeliveryFee ? parseFloat(manualDeliveryFee.toString()) : 0
        }
      })

      // B. Upsert DeliveryConfirmation with Fulfillment Details
      const confirmation = await tx.deliveryConfirmation.upsert({
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
          status: "PENDING",
          riderName,
          riderPhone,
          trackingNumber,
          confirmationDeadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 48 hours
        },
        update: {
          riderName,
          riderPhone,
          trackingNumber,
          status: "PENDING",
           // Reset customer confirmation if it was already confirmed but re-dispatched
          customerConfirmed: false,
          confirmedAt: null
        }
      })

      // C. Update global order status if applicable
      // Determine if overall order should move to READY_FOR_DELIVERY
      // We do this if it was PROCESSING or CONFIRMED
      if (order.status === 'PROCESSING' || order.status === 'CONFIRMED') {
         await tx.order.update({
           where: { id: orderId },
           data: { status: 'READY_FOR_DELIVERY' }
         })
      }

      return confirmation
    })

    // 3. Send Notification Email to Customer
    if (order.customer.email) {
      const profile = await prisma.professionalProfile.findUnique({
        where: { userId: user.id },
        select: { businessName: true }
      });
      const sellerName = profile?.businessName || `${user.firstName} ${user.lastName}`;

      await sendDeliveryUpdateEmail({
        to: order.customer.email,
        orderId: order.id,
        riderName,
        riderPhone,
        deliveryPrice: parseFloat(manualDeliveryFee?.toString() || "0"),
        trackingNumber: trackingNumber || undefined,
        sellerName,
        items: order.items.map(item => ({ name: item.product.name, quantity: item.quantity })),
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
        title: 'Package Ready for Delivery!',
        message: `A package from ${sellerNameFinal} (Order #${order.id.slice(-8).toUpperCase()}) is ready for delivery.${riderName ? ` Rider: ${riderName}` : ''}`,
        data: JSON.stringify({ 
          orderId: order.id, 
          status: 'READY_FOR_DELIVERY',
          professionalId: user.id,
          riderName,
          riderPhone,
          trackingNumber
        }),
      },
    })

    return NextResponse.json({ 
      success: true, 
      confirmation: result
    })

  } catch (error) {
    const { status, message } = mapErrorToResponse(error, { route: 'manual-delivery' })
    return NextResponse.json({ error: message }, { status })
  }
}
