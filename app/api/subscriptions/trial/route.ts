import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import prisma from '@/lib/prisma'

/**
 * GET /api/subscriptions/trial
 * Get current professional's trial status
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const user = session.user

    const profile = await prisma.professionalProfile.findUnique({
      where: { userId: user.id },
      include: {
        trial: true,
        subscription: {
          include: { tier: true },
        },
      },
    })

    if (!profile) {
      // Return empty response for non-professionals (e.g., super admins)
      return NextResponse.json({
        success: true,
        data: {
          isOnTrial: false,
          trialStartDate: null,
          trialEndDate: null,
          daysRemaining: 0,
          subscriptionStatus: null,
          currentSubscription: null,
          trial: null,
          isTrialExpired: false,
          trialExpiredAt: null,
        },
      })
    }

    const now = new Date()
    const trial = profile.trial
    const subscription = profile.subscription
    
    const isOnTrial = trial && now < trial.endDate
    const daysRemaining = trial
      ? Math.ceil((trial.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : 0

    const productCount = await prisma.product.count({
      where: { professionalId: profile.id }
    })
    const productLimit = 8
    const isLimitReached = productCount >= productLimit

    return NextResponse.json({
      success: true,
      data: {
        isOnTrial,
        trialStartDate: trial?.startDate || null,
        trialEndDate: trial?.endDate || null,
        daysRemaining: Math.max(0, daysRemaining),
        productCount,
        productLimit,
        isLimitReached,
        subscriptionStatus: subscription?.status || (isOnTrial ? 'TRIAL' : 'EXPIRED'),
        currentSubscription: subscription,
        trial: trial,
        isTrialExpired: trial && now > trial.endDate,
        trialExpiredAt: trial?.endDate || null,
      },
    })
  } catch (error) {
    console.error('Error fetching trial status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trial status' },
      { status: 500 }
    )
  }
}

