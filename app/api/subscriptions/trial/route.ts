import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import prisma from '@/lib/prisma'

/**
 * GET /api/subscriptions/trial
 * Fast single-endpoint status query for current professional's trial, active subscription, and AI Credits
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = session.user.id

    // Fetch profile with relations safely
    const profile = await prisma.professionalProfile.findUnique({
      where: { userId },
      include: {
        trial: true,
        subscription: {
          include: { tier: true },
        },
      },
    })

    if (!profile) {
      return NextResponse.json({
        success: true,
        data: {
          isOnTrial: false,
          trialStartDate: null,
          trialEndDate: null,
          daysRemaining: 0,
          productCount: 0,
          productLimit: 15,
          isLimitReached: false,
          aiCreditsBalance: 10,
          aiCreditsLimit: 10,
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
    
    const calculatedDaysRemaining = trial
      ? Math.max(0, Math.ceil((trial.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : 0
    
    const finalDaysRemaining = calculatedDaysRemaining

    // Non-blocking sync DB update if needed
    if (trial && trial.daysRemaining !== finalDaysRemaining) {
      prisma.professionalTrial.update({
        where: { id: trial.id },
        data: { daysRemaining: finalDaysRemaining }
      }).catch(err => console.error('Failed async daysRemaining update:', err))
    }

    const isOnTrial = Boolean(trial && finalDaysRemaining > 0 && !trial.completed)

    // Parallel count queries for product and service listings
    const [productCount, serviceCount] = await Promise.all([
      prisma.product.count({
        where: { 
          professionalId: profile.id,
          isDeleted: false
        }
      }),
      prisma.professionalService.count({
        where: { 
          professionalId: profile.id,
          isActive: true
        }
      })
    ])

    const totalListings = productCount + serviceCount
    const listingLimit = subscription?.tier?.monthlyListings || 15
    const isLimitReached = totalListings >= listingLimit

    const rawProfile = profile as Record<string, unknown>
    const rawTier = subscription?.tier as Record<string, unknown> | undefined

    let aiCreditsLimit = (rawTier?.aiCreditsLimit as number) ?? 10
    let aiCreditsBalance = (rawProfile?.aiCreditsBalance as number) ?? 10
    const aiCreditsUsedThisMonth = (rawProfile?.aiCreditsUsedThisMonth as number) ?? 0

    // STRICT ALIGNMENT FOR ACTIVE SUBSCRIPTIONS:
    // Ensure aiCreditsLimit and aiCreditsBalance are 100% in sync with active tier
    if (subscription?.status === 'ACTIVE' && rawTier) {
      const tierName = (rawTier.name as string || '').toLowerCase()
      const isLegend = tierName.includes('legend')
      const isOhene = tierName.includes('ohene') || tierName.includes('royal')

      aiCreditsLimit = isLegend ? 120 : isOhene ? 40 : ((rawTier.aiCreditsLimit as number) || 10)
      const targetBalance = Math.max(0, aiCreditsLimit - aiCreditsUsedThisMonth)

      // Strict equality check: sync DB balance if there is any mismatch
      if (aiCreditsBalance !== targetBalance) {
        aiCreditsBalance = targetBalance
        prisma.professionalProfile.update({
          where: { id: profile.id },
          data: { aiCreditsBalance: targetBalance }
        }).catch(err => console.error('Failed auto-syncing tier AI credits:', err))
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        isOnTrial,
        trialStartDate: trial?.startDate || null,
        trialEndDate: trial?.endDate || null,
        daysRemaining: finalDaysRemaining,
        productCount: totalListings,
        productLimit: listingLimit,
        isLimitReached,
        aiCreditsBalance,
        aiCreditsLimit,
        aiCreditsUsedThisMonth,
        subscriptionStatus: subscription?.status || (isOnTrial ? 'TRIAL' : 'EXPIRED'),
        currentSubscription: subscription,
        trial: trial ? {
          ...trial,
          daysRemaining: finalDaysRemaining
        } : null,
        isTrialExpired: trial ? trial.daysRemaining <= 0 : false,
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
