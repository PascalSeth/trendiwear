import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { initiateTransfer, toPesewas } from "@/lib/paystack"
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
        // Find professional profile for payout details
        const profProfile = await prisma.professionalProfile.findUnique({
          where: { userId: professionalId },
          select: { paystackRecipientCode: true, businessName: true }
        })

        if (!profProfile?.paystackRecipientCode) {
           results.push({ orderId, professionalId, status: "skipped", reason: "No recipient code" })
           continue
        }

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

          // Initiate Paystack Transfer (Idempotent reference)
          const payoutReference = `PAY_${conf.id.replace(/-/g, '')}`
          
          await initiateTransfer({
            source: 'balance',
            amount: toPesewas(sellerSubtotal),
            recipient: profProfile.paystackRecipientCode as string,
            reason: `Auto-Release Payout Order #${orderId.slice(-8).toUpperCase()} - ${profProfile.businessName}`,
            reference: payoutReference,
            currency: 'GHS'
          })

          // Update Escrow status to reflect successful release
          await tx.paymentEscrow.update({
            where: {
              orderId_professionalId: {
                orderId,
                professionalId
              }
            },
            data: {
              status: 'RELEASED',
              releasedAt: new Date()
            }
          })

          return { amount: sellerSubtotal }
        })

        // Notifications
        await prisma.notification.create({
          data: {
            userId: professionalId,
            type: 'DELIVERY_ARRIVAL',
            title: 'Automated Payout Released',
            message: `Order #${orderId.slice(-8).toUpperCase()} has reached the 3-day confirmation deadline. Your payout of GHS ${result.amount.toFixed(2)} has been automatically initiated.`,
            data: JSON.stringify({ orderId, amount: result.amount }),
          },
        })

        results.push({ orderId, professionalId, status: "success", amount: sellerSubtotal })
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
