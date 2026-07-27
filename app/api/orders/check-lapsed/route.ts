import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { OrderStatus } from "@prisma/client"

export async function POST() {
  try {
    // 1. Authorize (Admin only for bulk check)
    const user = await requireAuth()
    if (!["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // 2. Find lapsed packages (Priority: READY_FOR_DELIVERY/SHIPPED and >3 days old)
    // We check DeliveryConfirmation where status is PENDING and customerConfirmed is false
    const seventyTwoHoursAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    
    const lapsedConfirmations = await prisma.deliveryConfirmation.findMany({
      where: {
        status: "PENDING",
        customerConfirmed: false,
        createdAt: {
          lt: seventyTwoHoursAgo,
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

    for (const conf of lapsedConfirmations) {
      const orderId = conf.orderId
      const professionalId = conf.professionalId

      try {
        // Calculate Payout for this specific seller's items in this order
        const sellerItems = conf.order.items.filter(i => i.professionalId === professionalId)
        const sellerSubtotal = sellerItems.reduce((sum, i) => sum + (i.price * i.quantity), 0)

        if (sellerSubtotal <= 0) {
           results.push({ orderId, professionalId, status: "skipped", reason: "Zero amount" })
           continue
        }

        // Execute DB updates and Payout in a safe flow
        const result = await prisma.$transaction(async (tx) => {
          // Update items for this seller to DELIVERED
          await tx.orderItem.updateMany({
            where: { orderId, professionalId },
            data: { status: 'DELIVERED' as OrderStatus }
          })

          // Update confirmation record
          await tx.deliveryConfirmation.update({
            where: { id: conf.id },
            data: { 
              status: "CONFIRMED", 
              customerConfirmed: true, 
              confirmedAt: new Date() 
            }
          })

          // Check if overall order needs status update
          const allItems = await tx.orderItem.findMany({ where: { orderId } })
          const allDelivered = allItems.every(i => i.status === 'DELIVERED')
          if (allDelivered) {
            await tx.order.update({
              where: { id: orderId },
              data: { status: 'DELIVERED', actualDelivery: new Date() }
            })
          }

          // Option 1 Wallet Escrow Release for Lapsed Orders
          await tx.paymentEscrow.upsert({
            where: {
              orderId_professionalId: {
                orderId,
                professionalId
              }
            },
            update: {
              status: 'RELEASED',
              releasedAt: new Date(),
              failureReason: null,
              lastAttemptAt: new Date()
            },
            create: {
              orderId,
              professionalId,
              amount: sellerSubtotal,
              status: 'RELEASED',
              releasedAt: new Date(),
              failureReason: null,
              lastAttemptAt: new Date()
            }
          })

          // Credit seller's in-app account balance
          await tx.professionalProfile.updateMany({
            where: { userId: professionalId },
            data: {
              accountBalance: { increment: sellerSubtotal }
            }
          })

          return { amount: sellerSubtotal, transferSuccess: true }
        })

        // Notifications
        await prisma.notification.create({
          data: {
            userId: professionalId,
            type: 'PAYMENT_RELEASED',
            title: 'Auto-Release: Payment Credited!',
            message: `Order #${orderId.slice(-8).toUpperCase()} reached the 3-day confirmation deadline. GH₵ ${result.amount.toFixed(2)} has been added to your withdrawable wallet balance!`,
            data: JSON.stringify({ 
              orderId, 
              amount: result.amount,
              status: 'RELEASED'
            }),
          },
        })

        results.push({ 
          orderId, 
          professionalId, 
          status: "success", 
          amount: sellerSubtotal 
        })
      } catch (err: unknown) {
        console.error(`[Auto-Payout] Failed for Order ${orderId}, Seller ${professionalId}:`, err)
        results.push({ orderId, professionalId, status: "failed", error: err instanceof Error ? err.message : String(err) })
      }
    }

    return NextResponse.json({ 
      processed: lapsedConfirmations.length,
      results 
    })

  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
