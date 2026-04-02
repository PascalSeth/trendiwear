import prisma from '@/lib/prisma'

/**
 * Check if a professional can access dashboard features
 * Returns true if they are on active subscription or still in trial
 */
export async function canAccessDashboardFeatures(professionalId: string): Promise<boolean> {
  try {
    const profile = await prisma.professionalProfile.findUnique({
      where: { id: professionalId },
    })

    if (!profile) return false

    const now = new Date()

    // Check if on trial
    if (profile.isOnTrial && profile.trialEndDate && now < profile.trialEndDate) {
      return true
    }

    // Check if has active subscription
    if (profile.subscriptionStatus === 'ACTIVE' && profile.subscriptionId) {
      const subscription = await prisma.subscription.findUnique({
        where: { id: profile.subscriptionId },
      })

      if (subscription && subscription.status === 'ACTIVE') {
        return true
      }
    }

    return false
  } catch (error) {
    console.error('Error checking dashboard access:', error)
    return false
  }
}

/**
 * Get professional's access tier permissions
 */
export async function getProfessionalAccessTier(
  professionalId: string
): Promise<{
  canView: boolean
  canAddProducts: boolean
  canAddServices: boolean
  canEditProfile: boolean
  canViewAnalytics: boolean
  accessLevel: 'FULL' | 'VIEW_ONLY' | 'DENIED'
  reason?: string
}> {
  try {
    const profile = await prisma.professionalProfile.findUnique({
      where: { id: professionalId },
      include: {
        subscription: { include: { tier: true } },
      },
    })

    if (!profile) {
      return {
        canView: false,
        canAddProducts: false,
        canAddServices: false,
        canEditProfile: false,
        canViewAnalytics: false,
        accessLevel: 'DENIED',
        reason: 'Professional profile not found',
      }
    }

    const now = new Date()

    // Check trial status
    if (profile.isOnTrial && profile.trialEndDate && now < profile.trialEndDate) {
      const daysRemaining = Math.ceil((profile.trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      return {
        canView: true,
        canAddProducts: true,
        canAddServices: true,
        canEditProfile: true,
        canViewAnalytics: false,
        accessLevel: 'FULL',
        reason: `Trial active: ${daysRemaining} days remaining`,
      }
    }

    // Trial expired, check subscription
    if (!profile.subscription || profile.subscription.status !== 'ACTIVE') {
      return {
        canView: true,
        canAddProducts: false,
        canAddServices: false,
        canEditProfile: false,
        canViewAnalytics: false,
        accessLevel: 'VIEW_ONLY',
        reason: 'Trial expired. Subscribe to continue using full features.',
      }
    }

    // Has active subscription - check tier
    const tier = profile.subscription.tier
    return {
      canView: true,
      canAddProducts: true,
      canAddServices: true,
      canEditProfile: true,
      canViewAnalytics: tier.analyticsAccess,
      accessLevel: 'FULL',
      reason: `Active subscription: ${tier.name}`,
    }
  } catch (error) {
    console.error('Error getting professional access tier:', error)
    return {
      canView: false,
      canAddProducts: false,
      canAddServices: false,
      canEditProfile: false,
      canViewAnalytics: false,
      accessLevel: 'DENIED',
      reason: 'Error checking access level',
    }
  }
}

/**
 * Check if trial is about to expire (within 7 days)
 */
export async function isTrialExpiringSoon(professionalId: string): Promise<boolean> {
  try {
    const profile = await prisma.professionalProfile.findUnique({
      where: { id: professionalId },
    })

    if (!profile || !profile.trialEndDate) return false

    const now = new Date()
    const daysUntilExpiry = Math.ceil((profile.trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    return daysUntilExpiry > 0 && daysUntilExpiry <= 7
  } catch (error) {
    console.error('Error checking trial expiry:', error)
    return false
  }
}

/**
 * Get subscription renewal information
 */
export async function getSubscriptionRenewalInfo(professionalId: string) {
  try {
    const profile = await prisma.professionalProfile.findUnique({
      where: { id: professionalId },
      include: {
        subscription: { include: { tier: true } },
      },
    })

    if (!profile || !profile.subscription) {
      return null
    }

    const subscription = profile.subscription
    const now = new Date()
    const daysUntilRenewal = Math.ceil(
      (subscription.nextRenewalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    )

    return {
      subscriptionId: subscription.id,
      tierId: subscription.tierId,
      tierName: subscription.tier.name,
      billingCycle: subscription.billingCycle,
      currentAmount: subscription.currentAmount,
      nextRenewalDate: subscription.nextRenewalDate,
      daysUntilRenewal,
      autoRenew: subscription.autoRenew,
      status: subscription.status,
    }
  } catch (error) {
    console.error('Error getting subscription renewal info:', error)
    return null
  }
}

/**
 * Update trial end date calculation
 */
export async function calculateTrialDaysRemaining(trialEndDate: Date): Promise<number> {
  const now = new Date()
  const millisecondsRemaining = trialEndDate.getTime() - now.getTime()

  if (millisecondsRemaining <= 0) return 0

  return Math.ceil(millisecondsRemaining / (1000 * 60 * 60 * 24))
}
