import { prisma } from "@/lib/prisma"
import { dispatchOrderCommunicationEvent } from "@/lib/notification-dispatcher"

/**
 * Transition an order from PENDING to PROCESSING upon payment confirmation.
 * Handles inventory deduction, cart cleanup, and professional notifications.
 * Can be called safely from webhooks or payment verify endpoints.
 */
export async function fulfillOrder(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: { product: true },
      },
      customer: { select: { email: true } },
    },
  })

  if (!order) {
    console.error(`fulfillOrder: Order ${orderId} not found`)
    return
  }

  // Idempotency check: if already processed/paid, skip
  if (order.paymentStatus === 'PAID' && order.status !== 'PENDING') {
    console.log(`fulfillOrder: Order ${orderId} is already fulfilled. Skipping.`)
    return
  }

  await prisma.$transaction(async (tx) => {
    // 1. Deduct stock for all items in the order
    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stockQuantity: {
            decrement: item.quantity,
          },
        },
      })
    }

    // 1.1 Update all OrderItem statuses to PROCESSING
    await tx.orderItem.updateMany({
      where: { orderId },
      data: { status: 'PROCESSING' }
    })

    // 2. Clear cart items
    await tx.cartItem.deleteMany({
      where: {
        userId: order.customerId,
        productId: { in: order.items.map((item) => item.productId) },
      },
    })

    // 3. Update professional analytics & Escrow records
    const sellerIds = [...new Set(order.items.map((item) => item.professionalId))]
    for (const sellerId of sellerIds) {
      const sellerItems = order.items.filter((item) => item.professionalId === sellerId)
      const sellerTotal = sellerItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)

      await tx.professionalAnalytics.upsert({
        where: { professionalId: sellerId },
        update: {
          totalOrders: { increment: 1 },
          totalRevenue: { increment: sellerTotal },
        },
        create: {
          professionalId: sellerId,
          totalOrders: 1,
          totalRevenue: sellerTotal,
        },
      })

      // Create Escrow record for this seller in HELD state
      await tx.paymentEscrow.upsert({
        where: {
          orderId_professionalId: {
            orderId: order.id,
            professionalId: sellerId,
          }
        },
        update: {
          amount: sellerTotal,
          status: 'HELD',
          lastAttemptAt: new Date(),
        },
        create: {
          orderId: order.id,
          professionalId: sellerId,
          amount: sellerTotal,
          status: 'HELD',
          lastAttemptAt: new Date(),
        }
      })
    }
  })

  // 4. Dispatch Centralized Communication Event (Customer & Sellers DB Notifications + Emails)
  await dispatchOrderCommunicationEvent({
    orderId: order.id,
    event: "ORDER_PAID"
  })

  console.log(`Order ${orderId} successfully fulfilled.`)
}

/**
 * Handle order cancellation and initiate refund if paid.
 * @param orderId The ID of the order to cancel
 * @param options.bypassWindow If true, bypasses the 12-hour refund window check (used for seller/admin cancellations)
 */
export async function cancelAndRefundOrder(orderId: string, { bypassWindow = false }: { bypassWindow?: boolean } = {}) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      customer: { select: { email: true } }
    },
  })

  if (!order) throw new Error("Order not found")

  // 1. Logic for Refund if PAID
  if (order.paymentStatus === "PAID") {
    if (!order.paystackReference) throw new Error("Payment information (reference) missing")

    // Check 12 hour window for customer cancellations
    if (!bypassWindow && order.paystackPaidAt) {
      const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000)
      if (new Date(order.paystackPaidAt) < twelveHoursAgo) {
        throw new Error("Refund window expired. Please contact support or the seller.")
      }
    }

    // Call Paystack Refund API
    try {
      const refundRes = await fetch("https://api.paystack.co/refund", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ transaction: order.paystackReference }),
      })

      const refundData = await refundRes.json()
      if (!refundRes.ok && refundData.message !== "Transaction has already been fully refunded") {
        throw new Error(refundData.message || "Failed to process Paystack refund")
      }
    } catch (err: unknown) {
      console.error("Paystack refund error:", err)
      const errObj = err as { message?: string }
      throw new Error(`Refund failed: ${errObj.message}`)
    }
  }

  // 2. Restock Inventory
  await prisma.$transaction(async (tx) => {
    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stockQuantity: { increment: item.quantity } },
      })
    }

    // Update Escrow status if applicable
    await tx.paymentEscrow.updateMany({
      where: { orderId: order.id },
      data: { status: 'REFUNDED' }
    })

    // 3. Mark order as CANCELLED & REFUNDED
    await tx.order.update({
      where: { id: order.id },
      data: {
        status: "CANCELLED",
        paymentStatus: order.paymentStatus === "PAID" ? "REFUNDED" : order.paymentStatus,
      },
    })
  })

  // 4. Dispatch Centralized Communication Event for Cancellation
  await dispatchOrderCommunicationEvent({
    orderId: order.id,
    event: "ORDER_CANCELLED"
  })

  return { success: true }
}
