import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyTransaction } from '@/lib/paystack'

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
      include: { subscription: true },
    })

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment record not found' },
        { status: 404 }
      )
    }

    if (payment.status === 'PAID') {
      return NextResponse.json(
        { error: 'Payment already verified' },
        { status: 400 }
      )
    }

    // Step 2: ✅ Verify with Paystack — never trust the client
    const paystackResult = await verifyTransaction(reference)
    const txData = paystackResult.data

    if (txData.status !== 'success') {
      return NextResponse.json(
        { error: `Payment not successful. Status: ${txData.status}` },
        { status: 402 }
      )
    }

    // Step 3: Calculate renewal date from the billing cycle on the payment
    const now = new Date()
    const renewalDays =
      payment.billingCycle === 'WEEKLY'
        ? 7
        : payment.billingCycle === 'YEARLY'
        ? 365
        : 30
    const nextRenewalDate = new Date(now.getTime() + renewalDays * 24 * 60 * 60 * 1000)

    // Step 4: Mark the payment as paid
    await prisma.subscriptionPayment.update({
      where: { id: payment.id },
      data: {
        status: 'PAID',
        paidAt: now,
        nextRenewal: nextRenewalDate,
        paystackChannel: txData.channel,
      },
    })

    let subscriptionId: string

    if (payment.subscriptionId) {
      // Step 5a: Update existing subscription's renewal date
      await prisma.subscription.update({
        where: { id: payment.subscriptionId },
        data: { status: 'ACTIVE', nextRenewalDate },
      })
      subscriptionId = payment.subscriptionId
    } else {
      // Step 5b: ✅ Fixed — must have a tierId to create a subscription
      if (!payment.tierId) {
        return NextResponse.json(
          {
            error:
              'Cannot activate subscription: missing tier information on payment record. Please contact support.',
          },
          { status: 500 }
        )
      }

      const subscription = await prisma.subscription.create({
        data: {
          professionalId: payment.professionalId,
          tierId: payment.tierId,
          billingCycle: payment.billingCycle,
          status: 'ACTIVE',
          currentAmount: payment.amount,
          startDate: now,
          nextRenewalDate,
        },
      })
      subscriptionId = subscription.id

      // Link subscription to the payment record
      await prisma.subscriptionPayment.update({
        where: { id: payment.id },
        data: { subscriptionId },
      })
    }

    // Step 6: Sync the professional profile
    await prisma.professionalProfile.update({
      where: { id: payment.professionalId },
      data: {
        subscriptionId,
        subscriptionStatus: 'ACTIVE',
        isOnTrial: false,
        lastSubscriptionRenew: now,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Subscription activated successfully',
      data: {
        subscriptionId,
        paymentId: payment.id,
        status: 'PAID',
        nextRenewalDate,
      },
    })
  } catch (error) {
    console.error('Error verifying subscription payment:', error)
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    )
  }
}
