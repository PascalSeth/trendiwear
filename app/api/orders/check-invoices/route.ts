import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { OrderStatus } from "@prisma/client"

/**
 * POST /api/orders/check-invoices
 * Cron job endpoint to enforce the strict Pre-order Ghosting Penalty.
 * Finds all PENDING Shipping Invoices that have exceeded their 7-day expiresAt limit.
 * Cancels the invoice, cancels the pre-order items, and returns the stock.
 * NO refunds are issued (100% forfeiture policy).
 */
export async function POST() {
  try {
    // 1. Authorize (Admin or automated cron engine only)
    const user = await requireAuth()
    if (!["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // 2. Find expired PENDING invoices
    const now = new Date()
    const expiredInvoices = await prisma.shippingInvoice.findMany({
      where: {
        status: "PENDING",
        expiresAt: {
          lt: now,
        },
      },
      include: {
        order: {
          include: {
            items: true
          }
        }
      }
    })

    const results = []

    for (const invoice of expiredInvoices) {
      const { orderId, professionalId } = invoice

      try {
        await prisma.$transaction(async (tx) => {
          // A. Mark Invoice as CANCELLED
          await tx.shippingInvoice.update({
            where: { id: invoice.id },
            data: { status: 'CANCELLED' }
          })

          // B. Target ONLY the Pre-order items from this specific seller in this order
          const preOrderItems = invoice.order.items.filter(
            i => i.professionalId === professionalId && i.isPreorder === true
          )

          // C. Mark items as CANCELLED (Forfeited)
          await tx.orderItem.updateMany({
            where: { 
              orderId, 
              professionalId,
              isPreorder: true
            },
            data: { status: 'CANCELLED' as OrderStatus, notes: 'Cancelled Due To Unpaid Shipping Invoice (Forfeited)' }
          })

          // D. Return the physical stock to the seller so they can resell it
          for (const item of preOrderItems) {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stockQuantity: { increment: item.quantity },
                soldCount: { decrement: item.quantity },
              }
            })
          }

          // E. Check if the overall Order status needs to be updated.
          // If all items in this order are cancelled, cancel the overall order.
          const currentItems = await tx.orderItem.findMany({ where: { orderId } })
          const allCancelled = currentItems.every(i => i.status === 'CANCELLED' || i.status === 'REFUNDED')
          if (allCancelled) {
            await tx.order.update({
              where: { id: orderId },
              data: { status: 'CANCELLED' }
            })
          }
        })

        // Annotate the result
        results.push({ invoiceId: invoice.id, orderId, professionalId, status: "success", action: "Forfeited" })

        // F. Notify Seller
        await prisma.notification.create({
          data: {
            userId: professionalId,
            type: 'ORDER_UPDATE',
            title: 'Pre-order Forfeited',
            message: `Order #${orderId.slice(0, 8)} - The customer failed to pay the shipping invoice. The pre-order is cancelled. You retain the deposit and the item has been returned to your stock.`,
            data: JSON.stringify({ invoiceId: invoice.id, orderId }),
          },
        })

        // G. Notify Customer
        await prisma.notification.create({
          data: {
            userId: invoice.order.customerId,
            type: 'ORDER_UPDATE',
            title: 'Pre-order Cancelled',
            message: `Your pre-order for Order #${orderId.slice(0, 8)} was cancelled because the shipping invoice expired. Pursuant to our verified pre-order policy, the deposit is forfeited.`,
            data: JSON.stringify({ invoiceId: invoice.id, orderId }),
          },
        })

      } catch (err: unknown) {
        console.error(`Penalty execution failed for Invoice ${invoice.id}:`, err)
        results.push({ invoiceId: invoice.id, orderId, status: "failed", error: err instanceof Error ? err.message : String(err) })
      }
    }

    return NextResponse.json({ 
      processed: expiredInvoices.length,
      results 
    })

  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
