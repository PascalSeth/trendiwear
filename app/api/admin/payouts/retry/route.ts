import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { initiateTransfer, toPesewas } from '@/lib/paystack'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { escrowId, manual } = await request.json()

    if (!escrowId) {
      return NextResponse.json({ error: 'Escrow ID is required' }, { status: 400 })
    }

    const escrow = await prisma.paymentEscrow.findUnique({
      where: { id: escrowId },
      include: {
        professional: {
          include: {
            professionalProfile: {
              select: {
                paystackRecipientCode: true,
                businessName: true
              }
            }
          }
        }
      }
    })

    if (!escrow) {
      return NextResponse.json({ error: 'Escrow record not found' }, { status: 404 })
    }

    if (escrow.status === 'RELEASED') {
      return NextResponse.json({ error: 'Payout already released' }, { status: 400 })
    }

    // Manual override: Just mark as released
    if (manual) {
      const updated = await prisma.paymentEscrow.update({
        where: { id: escrowId },
        data: {
          status: 'RELEASED',
          releasedAt: new Date(),
          failureReason: 'Manually Released by Admin'
        }
      })
      return NextResponse.json({ success: true, message: 'Payout marked as manually released.', data: updated })
    }

    // Automated Retry
    const recipientCode = escrow.professional.professionalProfile?.paystackRecipientCode
    if (!recipientCode) {
      return NextResponse.json({ error: 'Professional has no payout recipient setup.' }, { status: 400 })
    }

    // Determine reference
    const reference = `RETRY_${escrow.id.replace(/-/g, '').slice(0, 15)}_${Date.now()}`

    try {
      await initiateTransfer({
        source: 'balance',
        amount: toPesewas(escrow.amount),
        recipient: recipientCode,
        reason: `Retry Payout: ${escrow.orderId ? 'Order' : 'Booking'} Payout - ${escrow.professional.professionalProfile?.businessName}`,
        reference,
        currency: 'GHS'
      })

      const updated = await prisma.paymentEscrow.update({
        where: { id: escrowId },
        data: {
          status: 'RELEASED',
          releasedAt: new Date(),
          failureReason: null,
          lastAttemptAt: new Date()
        }
      })

      // Notify professional
      await prisma.notification.create({
        data: {
          userId: escrow.professionalId,
          type: 'PAYMENT_RELEASED',
          title: 'Payout Successful!',
          message: `Your payout of GHS ${escrow.amount.toFixed(2)} has been successfully processed.`,
          data: JSON.stringify({ escrowId: escrow.id, amount: escrow.amount }),
        },
      })

      return NextResponse.json({ success: true, message: 'Transfer successful!', data: updated })

    } catch (paystackError: unknown) {
      console.error('[Admin-Retry] Paystack Error:', paystackError)
      const errorMsg = (paystackError as Error).message || 'Unknown Transfer Error'
      
      const updated = await prisma.paymentEscrow.update({
        where: { id: escrowId },
        data: {
          failureReason: errorMsg.toLowerCase().includes('balance') ? 'Insufficient Balance' : errorMsg,
          lastAttemptAt: new Date()
        }
      })

      return NextResponse.json({ 
        error: errorMsg, 
        isBalanceError: errorMsg.toLowerCase().includes('balance'),
        data: updated 
      }, { status: 400 })
    }

  } catch (error: unknown) {
    console.error('[Admin-Retry] General Error:', error)
    return NextResponse.json({ error: (error as Error).message || 'Internal Server Error' }, { status: 500 })
  }
}
