import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { mapErrorToResponse } from "@/lib/api-utils";
import { OrderStatus } from "@prisma/client";
import { cancelAndRefundOrder } from "@/lib/orders";
import { dispatchOrderCommunicationEvent, OrderCommunicationEvent } from "@/lib/notification-dispatcher";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: orderId } = await params;
    const body = await request.json().catch(() => ({}));

    const { 
      status, 
      deliveryMethod, 
      trackingNumber, 
      notes, 
      sellerDeliveryFee,
      riderName,
      riderPhone,
      cancellationReason
    } = body;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        customer: { select: { id: true, email: true } },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Resolve Professional Profile ID for current user
    const sellerProfile = await prisma.professionalProfile.findUnique({
      where: { userId: user.id },
      select: { id: true }
    });
    const sellerProfId = sellerProfile?.id;

    // Authorization & Targeting Logic
    const isCustomer = order.customerId === user.id;
    const isProfessional = order.items.some(
      (item) => item.professionalId === user.id || (sellerProfId && item.professionalId === sellerProfId)
    );
    const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(user.role);

    if (!isCustomer && !isProfessional && !isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // ANTI-FRAUD GUARD:
    // For in-store pickup orders, sellers cannot mark status as DELIVERED by themselves.
    // Only the customer (or system admin) can confirm collection to release escrow.
    const isPickup = order.deliveryMethod?.toUpperCase() === "PICKUP";
    if (isPickup && status === "DELIVERED" && isProfessional && !isAdmin && !isCustomer) {
      return NextResponse.json(
        { 
          error: "To prevent fraud, only the customer can confirm in-store collection on their device to release escrow funds." 
        }, 
        { status: 403 }
      );
    }

    // Atomic Transactional Update
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // 1. Update individual OrderItems for the professional
      if (isProfessional && sellerProfId) {
        await tx.orderItem.updateMany({
          where: { 
            orderId, 
            professionalId: { in: [sellerProfId, user.id] }
          },
          data: { 
            status,
            ...(sellerDeliveryFee !== undefined && { deliveryFee: sellerDeliveryFee })
          }
        });

        // 2. Upsert DeliveryConfirmation with tracking/rider info
        if (trackingNumber !== undefined || riderName !== undefined) {
          await tx.deliveryConfirmation.upsert({
            where: {
              orderId_professionalId: {
                orderId,
                professionalId: sellerProfId
              }
            },
            create: {
              orderId,
              professionalId: sellerProfId,
              customerId: order.customerId,
              trackingNumber: trackingNumber || `TRK-${Date.now().toString().slice(-6)}`,
              riderName,
              riderPhone,
              status: status === 'DELIVERED' ? 'CONFIRMED' : 'PENDING',
              confirmationDeadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
            },
            update: {
              trackingNumber: trackingNumber || undefined,
              riderName: riderName || undefined,
              riderPhone: riderPhone || undefined,
              status: status === 'DELIVERED' ? 'CONFIRMED' : undefined,
            }
          });
        }
      }

      // 3. Determine global Order status
      let globalStatus = status;
      if (isProfessional) {
        const allItems = await tx.orderItem.findMany({ where: { orderId } });
        const statuses = allItems.map(i => i.status);
        if (statuses.every(s => (s as string) === 'DELIVERED')) globalStatus = 'DELIVERED';
        else if (statuses.some(s => (s as string) === 'SHIPPED' || (s as string) === 'DISPATCHED')) globalStatus = 'SHIPPED';
        else if (statuses.some(s => (s as string) === 'READY_FOR_PICKUP' || (s as string) === 'PACKED')) globalStatus = 'READY_FOR_PICKUP';
        else if (statuses.some(s => (s as string) === 'PROCESSING')) globalStatus = 'PROCESSING';
        else globalStatus = order.status;
      }

      // 4. Handle Refund if cancelling a paid order
      if (status === 'CANCELLED' && order.paymentStatus === 'PAID') {
        if (isProfessional || isAdmin) {
          return await cancelAndRefundOrder(orderId, { bypassWindow: true });
        }
      }

      return await tx.order.update({
        where: { id: orderId },
        data: {
          status: globalStatus as OrderStatus,
          ...(deliveryMethod && { deliveryMethod }),
          ...(notes !== undefined && { notes }),
          ...(riderName && { riderName }),
          ...(riderPhone && { riderPhone }),
          ...(trackingNumber && { trackingNumber }),
        },
        include: {
          customer: { select: { id: true, email: true } }
        }
      });
    });

    // 5. Map status to Communication Event & Trigger Dispatcher
    let targetEvent: OrderCommunicationEvent | null = null;

    if (status === "READY_FOR_PICKUP" || status === "PACKED") {
      targetEvent = "ORDER_PACKED";
    } else if (status === "SHIPPED" || status === "DISPATCHED" || status === "ON_THE_WAY") {
      targetEvent = "ORDER_DISPATCHED";
    } else if (status === "DELIVERED" || status === "COMPLETED") {
      targetEvent = "ORDER_DELIVERED";
    } else if (status === "CANCELLED") {
      targetEvent = "ORDER_CANCELLED";
    }

    if (targetEvent) {
      await dispatchOrderCommunicationEvent({
        orderId,
        event: targetEvent,
        actorId: user.id,
        riderName,
        riderPhone,
        trackingNumber,
        cancellationReason,
      });
    }

    return NextResponse.json({ success: true, order: updatedOrder });

  } catch (error) {
    const { status, message } = mapErrorToResponse(error, { route: 'order-status' });
    return NextResponse.json({ error: message }, { status });
  }
}
