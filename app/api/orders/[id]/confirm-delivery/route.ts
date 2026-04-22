import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { mapErrorToResponse } from '@/lib/api-utils'
import { initiateTransfer, toPesewas } from '@/lib/paystack'
import { OrderStatus } from '@prisma/client'

// POST: Customer confirms they have received the package from a specific seller
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: orderId } = await params
    const user = await requireAuth()
    const { professionalId } = await (async () => {
      try { return await request.json() } catch { return {} }
    })()

    if (!professionalId) {
      return NextResponse.json({ error: 'Seller (Professional ID) is required' }, { status: 400 })
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        customer: true,
        deliveryConfirmations: {
          where: { professionalId }
        }
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.customerId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Identify items for this seller
    const sellerItems = order.items.filter(i => i.professionalId === professionalId)
    if (sellerItems.length === 0) {
      return NextResponse.json({ error: 'No items found for this seller in this order' }, { status: 404 })
    }

    // 1. Process Database Updates & Initiate Payout
    const result = await prisma.$transaction(async (tx) => {
      // Find or create confirmation BEFORE checking confirmed state
      let confirmation = await tx.deliveryConfirmation.findUnique({
        where: {
          orderId_professionalId: {
            orderId,
            professionalId
          }
        }
      })

      // If already confirmed, we DON'T initiate a new payout
      if (confirmation?.customerConfirmed) {
         return {
           alreadyConfirmed: true,
           amount: 0,
           businessName: "" 
         }
      }

      // Update items for this seller
      await tx.orderItem.updateMany({
        where: { orderId, professionalId },
        data: { status: 'DELIVERED' as OrderStatus }
      })

      // Update or create delivery confirmation
      if (confirmation) {
          confirmation = await tx.deliveryConfirmation.update({
            where: { id: confirmation.id },
            data: { customerConfirmed: true, confirmedAt: new Date(), status: 'CONFIRMED' }
          })
      } else {
          confirmation = await tx.deliveryConfirmation.create({
            data: {
              orderId,
              customerId: user.id,
              professionalId,
              customerConfirmed: true,
              confirmedAt: new Date(),
              confirmationDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
              status: 'CONFIRMED'
            }
          })
      }

      // Check if ALL sellers in the order are now confirmed
      const allItems = await tx.orderItem.findMany({ where: { orderId } })
      const allDelivered = allItems.every(i => i.status === 'DELIVERED')
      
      if (allDelivered) {
        await tx.order.update({
          where: { id: orderId },
          data: { status: 'DELIVERED', actualDelivery: new Date() }
        })
      }

      // 2. Calculate Payout (Items only, no shipping)
      const sellerSubtotal = sellerItems.reduce((sum, i) => sum + (i.price * i.quantity), 0)
      
      // Fetch professional payout details
      const profProfile = await tx.professionalProfile.findUnique({
        where: { userId: professionalId },
        select: { paystackRecipientCode: true, businessName: true }
      })

      if (!profProfile?.paystackRecipientCode) {
        throw new Error(`Seller ${profProfile?.businessName || 'unknown'} has no payment recipient setup. Payout delayed.`)
      }

      // 3. Initiate Paystack Transfer (Escrow Release)
      // Use the confirmation ID as a deterministic reference for idempotency
      const payoutReference = `PAY_${confirmation.id.replace(/-/g, '')}`
      let transferSuccess = false
      let failureReason = null

      try {
          await initiateTransfer({
            source: 'balance',
            amount: toPesewas(sellerSubtotal),
            recipient: profProfile.paystackRecipientCode as string,
            reason: `Payout for Order #${orderId.slice(-8).toUpperCase()} - ${profProfile.businessName}`,
            reference: payoutReference,
            currency: 'GHS'
          })
          transferSuccess = true
          
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
              releasedAt: new Date(),
              failureReason: null,
              lastAttemptAt: new Date()
            }
          })
      } catch (paystackError: unknown) {
          console.error('[Payout] Paystack Transfer Error:', paystackError)
          const errorMsg = (paystackError as Error).message || ""
          const isBalanceError = errorMsg.toLowerCase().includes('balance') || errorMsg.toLowerCase().includes('insufficient')
          failureReason = isBalanceError ? 'Insufficient Balance' : 'Transfer Failed'

          await tx.paymentEscrow.update({
            where: {
              orderId_professionalId: {
                orderId,
                professionalId
              }
            },
            data: {
              failureReason,
              lastAttemptAt: new Date()
            }
          })
      }

      return {
        success: true,
        transferSuccess,
        failureReason,
        amount: sellerSubtotal,
        businessName: profProfile.businessName
      }
    })

    if (result.alreadyConfirmed) {
      return NextResponse.json({
        success: true,
        message: `Receipt already confirmed. No new payout initiated.`,
      })
    }

    // 4. Notifications
    const notificationTitle = result.transferSuccess ? 'Payout Initiated!' : 'Receipt Confirmed'
    const notificationMessage = result.transferSuccess 
      ? `Customer confirmed receipt of Order #${orderId.slice(-8).toUpperCase()}. Your payout of GHS ${result.amount.toFixed(2)} has been initiated and will reflect in your account within 24-48 hours.`
      : `Customer confirmed receipt of Order #${orderId.slice(-8).toUpperCase()}. Your payout of GHS ${result.amount.toFixed(2)} is being processed by our system and will reflect once finalized.`

    await prisma.notification.create({
      data: {
        userId: professionalId,
        type: 'DELIVERY_ARRIVAL',
        title: notificationTitle,
        message: notificationMessage,
        data: JSON.stringify({ 
          orderId, 
          amount: result.amount, 
          status: result.transferSuccess ? 'INITIATED' : 'PROCESSING' 
        }),
      },
    })

    return NextResponse.json({
      success: true,
      message: result.transferSuccess 
        ? `Receipt confirmed for ${result.businessName}. Payout initiated.` 
        : `Receipt confirmed for ${result.businessName}. Payout pending (Balance Check Required).`,
      data: result
    })

  } catch (error) {
    const { status, message } = mapErrorToResponse(error, { route: 'orders.[id].confirm-delivery' })
    return NextResponse.json({ error: message }, { status })
  }
}
