import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import prisma from '@/lib/prisma'
import { initializeTransaction, toPesewas } from '@/lib/paystack'

/**
 * POST /api/subscriptions/pay
 * Initialize subscription payment via Paystack
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const user = session.user

    const body = await request.json()
    const { tierId, billingCycle, callbackUrl } = body

    if (!tierId || !billingCycle) {
      return NextResponse.json(
        { error: 'tierId and billingCycle are required' },
        { status: 400 }
      )
    }

    // Get tier
    const tier = await prisma.subscriptionTier.findUnique({
      where: { id: tierId },
    })

    if (!tier) {
      return NextResponse.json(
        { error: 'Subscription tier not found' },
        { status: 404 }
      )
    }

    // Get professional profile
    const profile = await prisma.professionalProfile.findUnique({
      where: { userId: user.id },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    if (!profile) {
      return NextResponse.json(
        { error: 'Professional profile not found' },
        { status: 404 }
      )
    }

    // Calculate amount based on billing cycle
    let amount: number
    let cycle: 'WEEKLY' | 'MONTHLY' | 'YEARLY'

    switch (billingCycle) {
      case 'WEEKLY':
        amount = tier.weeklyPrice
        cycle = 'WEEKLY'
        break
      case 'MONTHLY':
        amount = tier.monthlyPrice
        cycle = 'MONTHLY'
        break
      case 'YEARLY':
        amount = tier.yearlyPrice
        cycle = 'YEARLY'
        break
      default:
        return NextResponse.json(
          { error: 'Invalid billing cycle' },
          { status: 400 }
        )
    }

    // Generate reference
    const reference = `SUB-${profile.id}-${Date.now()}`

    // Convert amount to smallest currency unit (pesewas for GHS)
    // Round amount for precision
    const round = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100
    const finalAmount = round(amount)
    const amountInPesewas = toPesewas(finalAmount)

    try {
      // Initialize Paystack transaction
      const paystackResponse = await initializeTransaction({
        email: profile.user.email,
        amount: amountInPesewas,
        reference,
        callback_url: callbackUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscription/payment-complete`,
        metadata: {
          tierId,
          billingCycle: cycle,
          professionalId: profile.id,
          type: 'SUBSCRIPTION_PAYMENT',
        },
      })

      // Store payment reference in temp record for webhook
      const now = new Date()
      const renewalDays = cycle === 'WEEKLY' ? 7 : cycle === 'MONTHLY' ? 30 : 365
      const nextRenewal = new Date(now.getTime() + renewalDays * 24 * 60 * 60 * 1000)

      await prisma.subscriptionPayment.create({
        data: {
          // subscriptionId is intentionally omitted — it will be set by verify route
          professionalId: profile.id,
          tierId,          // ✅ store tier so verify can create the subscription
          amount: finalAmount,
          billingCycle: cycle,
          status: 'PENDING',
          paystackReference: reference,
          nextRenewal,
        },
      })

      return NextResponse.json({
        success: true,
        data: {
          authorizationUrl: paystackResponse.data.authorization_url,
          accessCode: paystackResponse.data.access_code,
          reference,
        },
      })
    } catch (paystackError) {
      console.error('Paystack error:', paystackError)
      return NextResponse.json(
        {
          error: paystackError instanceof Error ? paystackError.message : 'Failed to initialize payment',
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error initiating subscription payment:', error)
    return NextResponse.json(
      { error: 'Failed to initiate payment' },
      { status: 500 }
    )
  }
}
