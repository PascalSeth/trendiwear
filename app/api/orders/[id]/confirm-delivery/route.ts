import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { mapErrorToResponse } from '@/lib/api-utils'
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

      // 3. Option 1 Wallet Escrow Release: Add earnings to seller's withdrawable accountBalance
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

      // Credit seller's in-app account balance & Record WalletTransaction audit ledger
      const profProfileObj = await tx.professionalProfile.findFirst({
        where: { userId: professionalId }
      });

      if (profProfileObj) {
        const balBefore = profProfileObj.accountBalance || 0;
        const balAfter = balBefore + sellerSubtotal;

        await tx.professionalProfile.update({
          where: { id: profProfileObj.id },
          data: {
            accountBalance: { increment: sellerSubtotal }
          }
        });

        const walletTxModel = (tx as unknown as Record<string, { create: (data: unknown) => Promise<unknown> }>).walletTransaction || (prisma as unknown as Record<string, { create: (data: unknown) => Promise<unknown> }>).walletTransaction;
        if (walletTxModel?.create) {
          await walletTxModel.create({
            data: {
              professionalId: profProfileObj.id,
              amount: sellerSubtotal,
              balanceBefore: balBefore,
              balanceAfter: balAfter,
              type: "ESCROW_RELEASE",
              referenceId: orderId,
              description: `Escrow Released for Delivered Order #${orderId.slice(0, 8)}`,
            }
          });
        }
      }

      return {
        success: true,
        transferSuccess: true,
        amount: sellerSubtotal,
        businessName: profProfile?.businessName || 'Seller'
      }
    })

    if (result.alreadyConfirmed) {
      return NextResponse.json({
        success: true,
        message: `Receipt already confirmed. Funds were previously credited.`,
      })
    }

    // 4. Notifications
    await prisma.notification.create({
      data: {
        userId: professionalId,
        type: 'PAYMENT_RELEASED',
        title: 'Payment Released to Wallet!',
        message: `Customer confirmed receipt of Order #${orderId.slice(-8).toUpperCase()}. GH₵ ${result.amount.toFixed(2)} has been added to your withdrawable wallet balance!`,
        data: JSON.stringify({ 
          orderId, 
          amount: result.amount, 
          status: 'RELEASED' 
        }),
      },
    })

    return NextResponse.json({
      success: true,
      message: `Receipt confirmed for ${result.businessName}. GH₵ ${result.amount.toFixed(2)} released to seller wallet balance.`,
      data: result
    })

  } catch (error) {
    const { status, message } = mapErrorToResponse(error, { route: 'orders.[id].confirm-delivery' })
    return NextResponse.json({ error: message }, { status })
  }
}
