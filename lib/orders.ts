import { sendOrderConfirmationEmail, sendStatusUpdateEmail } from '@/lib/mail'
import { EscrowStatus } from '@prisma/client'
import { refundTransaction, toPesewas } from '@/lib/paystack'

/**
 * Perform all actions required when an order is successfully paid.
 * This includes:
 * 1. Decrementing product stock
 * 2. Clearing the customer's cart
 * 3. Notifying the professional(s)
 * 4. Notifying the customer
 */
export async function fulfillOrder(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: true,
        },
      },
      customer: true,
    },
  })

  if (!order) {
    console.error(`fulfillOrder: Order ${orderId} not found`)
    return
  }

  // Skip if already fulfilled (though caller should check paymentStatus)
  // We use a transaction to be safe
  await prisma.$transaction(async (tx) => {
    // 1. Update product stock and sold count
    for (const item of order.items) {
      const product = item.product
      const stockToDecrement = Math.min(item.quantity, product.stockQuantity)
      const preorderToDecrement = Math.max(0, item.quantity - product.stockQuantity)

      await tx.product.update({
        where: { id: item.productId },
        data: {
          stockQuantity: { decrement: stockToDecrement },
          preorderLimit: preorderToDecrement > 0 ? { decrement: preorderToDecrement } : undefined,
          soldCount: { increment: item.quantity },
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

    const currencyCode = await getCurrencyCode()

    // 3. Notify the professional(s) about the new paid order
    const sellerIds = [...new Set(order.items.map((item) => item.professionalId))]
    for (const sellerId of sellerIds) {
      const sellerItems = order.items.filter((item) => item.professionalId === sellerId)
      const sellerTotal = sellerItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)

      await tx.notification.create({
        data: {
          userId: sellerId,
          type: 'ORDER_UPDATE',
          title: 'New Order - Payment Confirmed',
          message: `You have a new paid order worth ${currencyCode} ${sellerTotal.toFixed(2)}. Please prepare for shipping.`,
          data: JSON.stringify({ orderId: order.id, sellerTotal }),
        },
      })
      
      // Update professional analytics
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

      const hasPreorder = sellerItems.some(item => item.product?.isPreorder || item.isPreorder);
      const initialEscrowStatus = hasPreorder ? 'RELEASED' : 'HELD';

      // 3.1 Create Escrow record for this seller
      await tx.paymentEscrow.upsert({
        where: {
          orderId_professionalId: {
            orderId: order.id,
            professionalId: sellerId,
          }
        },
        update: {
          amount: sellerTotal,
          status: initialEscrowStatus,
        },
        create: {
          orderId: order.id,
          professionalId: sellerId,
          amount: sellerTotal,
          status: initialEscrowStatus,
        }
      })
    }

    // 4. Notify the customer about successful payment
    await tx.notification.create({
      data: {
        userId: order.customerId,
        type: 'ORDER_UPDATE',
        title: 'Payment Successful',
        message: `Your payment of ${currencyCode} ${order.totalPrice.toFixed(2)} was successful. Your order is being processed.`,
        data: JSON.stringify({ orderId: order.id }),
      },
    })
  })
  
  // 5. Send order confirmation email to customer
  try {
    const currencyCode2 = await getCurrencyCode()
    await sendOrderConfirmationEmail({
      to: order.customer.email,
      orderId: order.id,
      totalPrice: order.totalPrice,
      currency: currencyCode2,
      items: order.items.map(item => ({
        name: item.product.name,
        quantity: item.quantity,
        price: item.price,
        image: item.product.images?.[0],
      })),
    })
  } catch (emailErr) {
    console.error('Failed to send order confirmation email:', emailErr)
  }
  
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

    // Calculate refund amount (deduct 3% platform fee)
    const refundAmount = order.totalPrice - order.platformFee
    if (refundAmount <= 0) throw new Error("Invalid refund amount")

    // Initiate Paystack Refund
    try {
      await refundTransaction(order.paystackReference, toPesewas(refundAmount))
    } catch (paystackError: unknown) {
      console.error("Paystack refund error:", paystackError)
      const errorMsg = paystackError instanceof Error ? paystackError.message : "Provider error"
      throw new Error(`Refund failed: ${errorMsg}`)
    }


    // Update Database
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: "CANCELLED",
          paymentStatus: "REFUNDED",
          notes: order.notes ? `${order.notes}\n System: Refunded ${refundAmount} GHS` : `System: Refunded ${refundAmount} GHS`,
        },
      })

      await tx.paymentEscrow.updateMany({
        where: { orderId: orderId },
        data: { status: "REFUNDED" as EscrowStatus },
      })

      // Restore stock
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: { increment: item.quantity },
            soldCount: { decrement: item.quantity },
          },
        })
      }
    })

    // Notify customer about refund
    try {
      if (order.customer.email) {
        await sendStatusUpdateEmail({
          to: order.customer.email,
          orderId,
          status: 'REFUNDED',
          message: `Your order #${orderId.slice(-8).toUpperCase()} has been cancelled and a refund of GHS ${refundAmount.toFixed(2)} has been initiated.`,
        })
      }
    } catch (err) {
      console.error("Failed to send refund email:", err)
    }

    return { success: true, refunded: true, amount: refundAmount }
  } else {
    // 2. Logic for simple cancellation if NOT paid
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: "CANCELLED",
        },
      })
      // If it was PENDING/PROCESSING, items were not yet deducted (actually stock is deducted on fulfillOrder, which only happens after payment)
      // So no stock restoration needed for unpaid orders.
    })

    return { success: true, refunded: false }
  }
}
