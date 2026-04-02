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
    const isOnTrial = profile.trialStartDate && profile.trialEndDate && now < profile.trialEndDate
    const daysRemaining = profile.trialEndDate
      ? Math.ceil((profile.trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : 0

    return NextResponse.json({
      success: true,
      data: {
        isOnTrial,
        trialStartDate: profile.trialStartDate,
        trialEndDate: profile.trialEndDate,
        daysRemaining: Math.max(0, daysRemaining),
        subscriptionStatus: profile.subscriptionStatus,
        currentSubscription: profile.subscription,
        trial: profile.trial,
        isTrialExpired: profile.trialEndDate && now > profile.trialEndDate,
        trialExpiredAt: profile.trialEndDate,
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

