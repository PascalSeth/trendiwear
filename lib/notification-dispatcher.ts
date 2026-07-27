import { prisma } from "@/lib/prisma";
import { 
  sendDeliveryUpdateEmail, 
  sendOrderConfirmationEmail, 
  sendStatusUpdateEmail 
} from "@/lib/mail";
import { getCurrencyCode } from "@/lib/currency";
import type { NotificationType } from "@prisma/client";

export type OrderCommunicationEvent =
  | "ORDER_PAID"
  | "ORDER_PACKED"
  | "ORDER_DISPATCHED"
  | "ORDER_DELIVERED"
  | "ORDER_CANCELLED";

export interface DispatchOrderPayload {
  orderId: string;
  orderItemId?: string;
  event: OrderCommunicationEvent;
  actorId?: string; // ID of user initiating the action
  riderName?: string;
  riderPhone?: string;
  trackingNumber?: string;
  cancellationReason?: string;
}

/**
 * Single authoritative Communication Engine for Order Status Events.
 * Handles targeted customer & seller DB notifications, email alerts, and WhatsApp link generation.
 */
export async function dispatchOrderCommunicationEvent(params: DispatchOrderPayload) {
  const {
    orderId,
    orderItemId,
    event,
    riderName,
    riderPhone,
    trackingNumber,
    cancellationReason,
  } = params;

  try {
    // 1. Fetch Order details with items, customer, and seller profiles
    const orderData = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                name: true,
                images: true,
                professionalId: true,
                professional: {
                  select: {
                    id: true,
                    professionalProfile: {
                      select: {
                        id: true,
                        userId: true,
                        businessName: true,
                        location: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!orderData) {
      console.error(`[NotificationDispatcher] Order #${orderId} not found.`);
      return;
    }

    const order = orderData as unknown as {
      id: string;
      customerId: string;
      totalPrice: number;
      deliveryMethod?: string;
      customer?: { id?: string; email?: string; firstName?: string };
      items?: Array<{
        id: string;
        price: number;
        quantity: number;
        professionalId?: string;
        product?: {
          name?: string;
          images?: string[];
          professional?: {
            id?: string;
            professionalProfile?: {
              userId?: string;
              businessName?: string;
            };
          };
        };
      }>;
    };
    const currencyCode = await getCurrencyCode();
    const customerUserId = order.customer?.id || order.customerId;
    const customerEmail = order.customer?.email;
    const shortOrderId = order.id.slice(0, 8).toUpperCase();

    // 2. Identify target item(s) and target seller(s)
    const targetItems = orderItemId
      ? (order.items || []).filter((i) => i.id === orderItemId)
      : order.items || [];

    const sellerMap = new Map<string, { userId: string; businessName: string; totalAmount: number }>();

    for (const item of targetItems) {
      const profProfile = item.product?.professional?.professionalProfile;
      const sellerUserId = profProfile?.userId || item.product?.professional?.id || item.professionalId;
      const businessName = profProfile?.businessName || "Merchant Store";

      if (sellerUserId) {
        const existing = sellerMap.get(sellerUserId) || {
          userId: sellerUserId,
          businessName,
          totalAmount: 0,
        };
        existing.totalAmount += (Number(item.price) || 0) * (Number(item.quantity) || 1);
        sellerMap.set(sellerUserId, existing);
      }
    }

    // 3. Process Event Dispatching
    switch (event) {

      // ─── EVENT 1: ORDER PAID ───────────────────────────────────────────────
      case "ORDER_PAID": {
        if (customerUserId) {
          await prisma.notification.create({
            data: {
              userId: customerUserId,
              type: "ORDER_UPDATE" as NotificationType,
              title: "Payment Confirmed & Order Placed",
              message: `Your payment of ${currencyCode} ${order.totalPrice.toFixed(
                2
              )} for Order #${shortOrderId} was successful. Sellers are preparing your items!`,
              data: JSON.stringify({ orderId: order.id, event }),
            },
          });
        }

        // Sellers Notifications (Isolated per merchant)
        for (const seller of sellerMap.values()) {
          await prisma.notification.create({
            data: {
              userId: seller.userId,
              type: "ORDER_UPDATE" as NotificationType,
              title: "New Paid Order Received",
              message: `You have a new paid order #${shortOrderId} worth ${currencyCode} ${seller.totalAmount.toFixed(
                2
              )}. Please pack and prepare for dispatch!`,
              data: JSON.stringify({ orderId: order.id, sellerTotal: seller.totalAmount, event }),
            },
          });
        }

        // Email Alert to Customer
        if (customerEmail) {
          try {
            await sendOrderConfirmationEmail({
              to: customerEmail,
              orderId: order.id,
              totalPrice: order.totalPrice,
              currency: currencyCode,
              items: ((order.items || []) as Record<string, unknown>[]).map((i) => ({
                name: (i.product as Record<string, unknown>)?.name as string || "Item",
                quantity: (i.quantity as number) || 1,
                price: (i.price as number) || 0,
                image: ((i.product as Record<string, unknown>)?.images as string[])?.[0],
              })),
            });
          } catch (err) {
            console.error("[NotificationDispatcher] Email Error:", err);
          }
        }
        break;
      }

      // ─── EVENT 2: ORDER PACKED / READY ─────────────────────────────────────
      case "ORDER_PACKED": {
        const isPickup = (order.deliveryMethod || "").toUpperCase() === "PICKUP";
        const title = isPickup ? "Ready for In-Store Pickup!" : "Item Packed & Awaiting Dispatch";
        const message = isPickup
          ? `Your order #${shortOrderId} has been packed and is ready for pickup at the seller's boutique!`
          : `Your order #${shortOrderId} has been packed and is awaiting rider pickup.`;

        if (customerUserId) {
          await prisma.notification.create({
            data: {
              userId: customerUserId,
              type: "ORDER_UPDATE" as NotificationType,
              title,
              message,
              data: JSON.stringify({ orderId: order.id, event, isPickup }),
            },
          });
        }

        if (customerEmail) {
          try {
            await sendStatusUpdateEmail({
              to: customerEmail,
              orderId: order.id,
              status: isPickup ? "READY_FOR_PICKUP" : "PROCESSING",
              message,
            });
          } catch (err) {
            console.error("[NotificationDispatcher] Email Error:", err);
          }
        }
        break;
      }

      // ─── EVENT 3: ORDER DISPATCHED ─────────────────────────────────────────
      case "ORDER_DISPATCHED": {
        const riderInfoText = riderName
          ? ` Rider: ${riderName} ${riderPhone ? `(Tel: ${riderPhone})` : ""}`
          : "";
        const trackingText = trackingNumber ? ` Waybill: ${trackingNumber}.` : "";
        const message = `Your order #${shortOrderId} is out for delivery!${riderInfoText}${trackingText}`;

        if (customerUserId) {
          await prisma.notification.create({
            data: {
              userId: customerUserId,
              type: "SHIPPING_UPDATE" as NotificationType,
              title: "Order Dispatched & Out for Delivery",
              message,
              data: JSON.stringify({
                orderId: order.id,
                event,
                riderName,
                riderPhone,
                trackingNumber,
              }),
            },
          });
        }

        if (customerEmail) {
          try {
            await sendDeliveryUpdateEmail({
              to: customerEmail,
              orderId: order.id,
              riderName,
              riderPhone,
              trackingNumber,
              items: ((order.items || []) as Record<string, unknown>[]).map((i) => ({
                name: (i.product as Record<string, unknown>)?.name as string || "Item",
                quantity: (i.quantity as number) || 1,
              })),
            });
          } catch (err) {
            console.error("[NotificationDispatcher] Email Error:", err);
          }
        }
        break;
      }

      // ─── EVENT 4: ORDER DELIVERED ──────────────────────────────────────────
      case "ORDER_DELIVERED": {
        const isPickup = (order.deliveryMethod || "").toUpperCase() === "PICKUP";
        const custTitle = isPickup ? "Item Collected In-Store" : "Order Delivered!";
        const custMessage = isPickup
          ? `Your order #${shortOrderId} was collected in-store. Thank you for choosing TrendiZip!`
          : `Your order #${shortOrderId} has been delivered! Please inspect your package.`;

        if (customerUserId) {
          await prisma.notification.create({
            data: {
              userId: customerUserId,
              type: "DELIVERY_ARRIVAL" as NotificationType,
              title: custTitle,
              message: custMessage,
              data: JSON.stringify({ orderId: order.id, event }),
            },
          });
        }

        // Sellers Notifications (Escrow Released)
        for (const seller of sellerMap.values()) {
          await prisma.notification.create({
            data: {
              userId: seller.userId,
              type: "PAYMENT_RELEASED" as NotificationType,
              title: "Order Completed & Escrow Settled",
              message: `Order #${shortOrderId} has been marked completed. Funds worth ${currencyCode} ${seller.totalAmount.toFixed(
                2
              )} have been released to your withdrawable wallet balance!`,
              data: JSON.stringify({ orderId: order.id, event, sellerTotal: seller.totalAmount }),
            },
          });
        }

        if (customerEmail) {
          try {
            await sendStatusUpdateEmail({
              to: customerEmail,
              orderId: order.id,
              status: "DELIVERED",
              message: custMessage,
            });
          } catch (err) {
            console.error("[NotificationDispatcher] Email Error:", err);
          }
        }
        break;
      }

      // ─── EVENT 5: ORDER CANCELLED ──────────────────────────────────────────
      case "ORDER_CANCELLED": {
        const reasonText = cancellationReason ? ` Reason: ${cancellationReason}.` : "";
        const message = `Order #${shortOrderId} has been cancelled.${reasonText}`;

        if (customerUserId) {
          await prisma.notification.create({
            data: {
              userId: customerUserId,
              type: "ORDER_UPDATE" as NotificationType,
              title: "Order Cancelled",
              message,
              data: JSON.stringify({ orderId: order.id, event, cancellationReason }),
            },
          });
        }

        // Sellers Notifications
        for (const seller of sellerMap.values()) {
          await prisma.notification.create({
            data: {
              userId: seller.userId,
              type: "ORDER_UPDATE" as NotificationType,
              title: "Order Cancelled",
              message: `Order #${shortOrderId} was cancelled. Inventory has been restocked.`,
              data: JSON.stringify({ orderId: order.id, event }),
            },
          });
        }

        if (customerEmail) {
          try {
            await sendStatusUpdateEmail({
              to: customerEmail,
              orderId: order.id,
              status: "CANCELLED",
              message,
            });
          } catch (err) {
            console.error("[NotificationDispatcher] Email Error:", err);
          }
        }
        break;
      }

      default:
        break;
    }

    console.log(`[NotificationDispatcher] Successfully dispatched event '${event}' for Order #${shortOrderId}`);
  } catch (error) {
    console.error("[NotificationDispatcher] Error dispatching communication event:", error);
  }
}
