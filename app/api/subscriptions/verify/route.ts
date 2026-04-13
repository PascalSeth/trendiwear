import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyTransaction } from '@/lib/paystack'
import { activateSubscription } from '@/lib/subscription-service'

/**
 * GET /api/subscriptions/verify?reference=...
 * Verify subscription payment with Paystack and activate subscription.
 */
export async function GET(request: NextRequest) {
  try {
    const reference = request.nextUrl.searchParams.get('reference')

    if (!reference) {
      return NextResponse.json(
        { error: 'Payment reference is required' },
        { status: 400 }
      )
    }

    // Step 1: Find the pending payment record
    const payment = await prisma.subscriptionPayment.findUnique({
      where: { paystackReference: reference },
    })

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment record not found' },
        { status: 404 }
      )
    }

    if (payment.status === 'PAID') {
      return NextResponse.json({
        success: true,
        message: 'Subscription already active',
        data: {
          subscriptionId: payment.subscriptionId,
          status: 'PAID',
        },
      })
    }

    // Step 2: ✅ Verify with Paystack
    const paystackResult = await verifyTransaction(reference)
    const txData = paystackResult.data

    if (txData.status !== 'success') {
      return NextResponse.json(
        { error: `Payment not successful. Status: ${txData.status}` },
        { status: 402 }
      )
    }

    // Step 3: Use shared service for activation
    const result = await activateSubscription({
      professionalId: payment.professionalId,
      tierId: payment.tierId!, // verified in pay route
      billingCycle: payment.billingCycle,
      amount: payment.amount,
      reference,
      channel: txData.channel,
      paidAt: txData.paid_at ? new Date(txData.paid_at) : new Date(),
    })

    return NextResponse.json({
      success: true,
      message: 'Subscription activated successfully',
      data: result,
    })
  } catch (error) {
    console.error('Error verifying subscription payment:', error)
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    )
  }
}
