import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import prisma from '@/lib/prisma'

/**
 * GET /api/subscriptions/current
 * Get current professional's subscription
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch user with role
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true }
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if super admins require subscription
    const requireSubscriptionSetting = await prisma.systemSetting.findUnique({
      where: { key: 'superAdminRequireSubscription' }
    })
    const isSuperAdmin = dbUser.role === 'SUPER_ADMIN'
    const superAdminRequiresSubscription = requireSubscriptionSetting?.value === 'true'

    // Super admins always have full access if not required to have subscription
    if (isSuperAdmin && !superAdminRequiresSubscription) {
      return NextResponse.json({
        success: true,
        data: {
          canAddProducts: true,
          canCreateServices: true,
          canViewAnalytics: true,
          canUploadVideo: true,
          isSuperAdmin: true,
          isTrialActive: false,
          daysRemaining: null,
        }
      })
    }

    // Safe sequential fetch to bypass Prisma P2022 join error
    const profile = await prisma.professionalProfile.findUnique({
      where: { userId: dbUser.id }
    })

    if (!profile) {
      return NextResponse.json({ error: 'Professional profile not found' }, { status: 404 })
    }

    // Fetch related data independently
    const [trial, subscription] = await Promise.all([
      prisma.professionalTrial.findUnique({
        where: { professionalId: profile.id }
      }),
      prisma.subscription.findUnique({
        where: { professionalId: profile.id },
        include: {
          tier: true,
          payments: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        }
      })
    ])

    // Check trial status from relation
    const now = new Date()
    const isTrialActive = trial && trial.endDate > now
    const daysRemaining = trial
      ? Math.max(0, Math.ceil((trial.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : null

    // Check if has active subscription
    const hasActiveSubscription = subscription
      && subscription.status === 'ACTIVE'
      && subscription.nextRenewalDate > now

    // Determine permissions
    const canAccess = isTrialActive || hasActiveSubscription
    const analyticsAccess = subscription?.tier?.analyticsAccess ?? false

    return NextResponse.json({
      success: true,
      data: {
        ...profile,
        trial,
        subscription,
        canAddProducts: canAccess,
        canCreateServices: canAccess,
        canViewAnalytics: isTrialActive || (hasActiveSubscription && analyticsAccess),
        canUploadVideo: canAccess,
        subscriptionStatus: subscription?.status || (isTrialActive ? 'TRIAL' : 'INACTIVE'),
        isTrialActive,
        daysRemaining,
        hasActiveSubscription,
      }
    })
  } catch (error) {
    console.error('Error fetching subscription status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscription status' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/subscriptions/current
 * Create or upgrade professional's subscription
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const user = session.user

    const body = await request.json()
    const { tierId, billingCycle } = body

    if (!tierId || !billingCycle) {
      return NextResponse.json(
        { error: 'tierId and billingCycle are required' },
        { status: 400 }
      )
    }

    // Validate billing cycle
    if (!['WEEKLY', 'MONTHLY', 'YEARLY'].includes(billingCycle)) {
      return NextResponse.json(
        { error: 'billingCycle must be WEEKLY, MONTHLY, or YEARLY' },
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

    const profile = await prisma.professionalProfile.findUnique({
      where: { userId: user.id },
    })

    if (!profile) {
      return NextResponse.json(
        { error: 'Professional profile not found' },
        { status: 404 }
      )
    }

    // Calculate price and renewal date
    let price: number
    let renewalDays: number

    switch (billingCycle) {
      case 'WEEKLY':
        price = tier.weeklyPrice
        renewalDays = 7
        break
      case 'MONTHLY':
        price = tier.monthlyPrice
        renewalDays = 30
        break
      case 'YEARLY':
        price = tier.yearlyPrice
        renewalDays = 365
        break
      default:
        renewalDays = 30
        price = tier.monthlyPrice
    }

    const now = new Date()
    const nextRenewalDate = new Date(now.getTime() + renewalDays * 24 * 60 * 60 * 1000)

    // Create or update subscription
    const subscription = await prisma.$transaction(async (tx) => {
      if (profile.subscriptionId) {
        // Update existing subscription
        const sub = await tx.subscription.update({
          where: { id: profile.subscriptionId },
          data: {
            tierId,
            billingCycle,
            status: 'ACTIVE',
            currentAmount: price,
            startDate: now,
            nextRenewalDate,
            autoRenew: true,
          },
          include: { tier: true },
        })

        // Sync the profile (link subscription)
        await tx.professionalProfile.update({
          where: { id: profile.id },
          data: {
            lastSubscriptionRenew: now,
          },
        })
        return sub
      } else {
        // Create new subscription
        const sub = await tx.subscription.create({
          data: {
            professionalId: profile.id,
            tierId,
            billingCycle,
            status: 'ACTIVE',
            currentAmount: price,
            startDate: now,
            nextRenewalDate,
            autoRenew: true,
          },
          include: { tier: true },
        })

        // Update professional profile (link subscription)
        await tx.professionalProfile.update({
          where: { id: profile.id },
          data: {
            subscriptionId: sub.id,
            lastSubscriptionRenew: now,
          },
        })
        return sub
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Subscription created successfully',
      data: subscription,
    })
  } catch (error) {
    console.error('Error creating subscription:', error)
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/subscriptions/current
 * Cancel professional's subscription
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const user = session.user

    const body = await request.json()
    const { reason } = body

    const profile = await prisma.professionalProfile.findUnique({
      where: { userId: user.id },
      include: { subscription: true },
    })

    if (!profile || !profile.subscription) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      )
    }

    // Cancel subscription
    const cancelled = await prisma.subscription.update({
      where: { id: profile.subscription.id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        reason: reason || 'User requested cancellation',
        autoRenew: false,
      },
      include: { tier: true },
    })

    // Update professional profile
    await prisma.professionalProfile.update({
      where: { id: profile.id },
      data: {
        subscriptionId: null,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Subscription cancelled successfully',
      data: cancelled,
    })
  } catch (error) {
    console.error('Error cancelling subscription:', error)
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}
