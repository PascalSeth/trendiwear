import prisma from '@/lib/prisma'

/**
 * Check if a professional can access dashboard features
 * Returns true if they are on active subscription or still in trial
 */
export async function canAccessDashboardFeatures(professionalId: string): Promise<boolean> {
  try {
    const profile = await prisma.professionalProfile.findUnique({
      where: { id: professionalId },
      include: {
        trial: true,
        subscription: true,
      }
    })

    if (!profile) return false

    const now = new Date()

    // Check if on active trial
    if (profile.trial && now < profile.trial.endDate) {
      return true
    }

    // Check if has active subscription
    if (profile.subscription && profile.subscription.status === 'ACTIVE') {
      // Check if it's not expired
      if (now < profile.subscription.nextRenewalDate) {
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
        trial: true,
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
    if (profile.trial && now < profile.trial.endDate) {
      const daysRemaining = Math.ceil((profile.trial.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      
      const productCount = await prisma.product.count({
        where: { professionalId }
      })

      const trialLimit = 8
      const isLimitReached = productCount >= trialLimit

      return {
        canView: true,
        canAddProducts: !isLimitReached,
        canAddServices: true,
        canEditProfile: true,
        canViewAnalytics: false,
        accessLevel: isLimitReached ? 'VIEW_ONLY' : 'FULL',
        reason: isLimitReached 
          ? `Trial limit reached (8 products). Upgrade to add more.` 
          : `Trial active: ${daysRemaining} days remaining (${productCount}/8 products)`,
      }
    }

    // Trial expired, check subscription
    if (!profile.subscription || profile.subscription.status !== 'ACTIVE' || now > profile.subscription.nextRenewalDate) {
      return {
        canView: true,
        canAddProducts: false,
        canAddServices: false,
        canEditProfile: false,
        canViewAnalytics: false,
        accessLevel: 'VIEW_ONLY',
        reason: 'Trial or Subscription expired. Renew to continue using full features.',
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
      include: { trial: true },
    })

    if (!profile || !profile.trial) return false

    const now = new Date()
    const daysUntilExpiry = Math.ceil((profile.trial.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

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
