import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'

/**
 * Middleware to check subscription/trial status for dashboard access
 * Redirects to subscription page if features are restricted
 */
export async function checkDashboardAccess(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.redirect(new URL('/auth/signin', request.url))
    }

    const profile = await prisma.professionalProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        trial: true,
        subscription: true,
      }
    })

    if (!profile) {
      return NextResponse.next()
    }

    const now = new Date()

    // Check if on active trial
    if (profile.trial && now < profile.trial.endDate) {
      const daysRemaining = Math.ceil((profile.trial.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      // Add headers for client-side awareness
      const response = NextResponse.next()
      response.headers.set('X-Trial-Status', 'ACTIVE')
      response.headers.set('X-Trial-Days-Remaining', daysRemaining.toString())

      // Show warning if less than 7 days
      if (daysRemaining <= 7) {
        response.headers.set('X-Trial-Expiring-Soon', 'true')
      }

      return response
    }

    // Check if has active subscription
    // Check if has active subscription
    if (profile.subscription && profile.subscription.status === 'ACTIVE' && now < profile.subscription.nextRenewalDate) {
      const response = NextResponse.next()
      response.headers.set('X-Subscription-Status', 'ACTIVE')
      response.headers.set('X-Subscription-Tier', profile.subscription.tierId)
      return response
    }

    // Trial expired and no subscription - redirect to subscription page
    const pathname = request.nextUrl.pathname
    const isSubscriptionPage = pathname.includes('/subscription')
    const isViewOnlyPage = pathname.includes('/analytics') || pathname.includes('/dashboard/page')

    if (!isSubscriptionPage && !isViewOnlyPage) {
      return NextResponse.redirect(new URL('/dashboard/subscription', request.url))
    }

    const response = NextResponse.next()
    response.headers.set('X-Subscription-Status', 'EXPIRED')
    response.headers.set('X-Access-Level', 'VIEW_ONLY')

    return response
  } catch (error) {
    console.error('Error checking dashboard access:', error)
    return NextResponse.next()
  }
}

/**
 * Middleware wrapper for API routes to restrict actions based on subscription
 */
export async function checkSubscriptionForAction(
  request: NextRequest,
  action: 'ADD_PRODUCT' | 'ADD_SERVICE' | 'VIEW_ANALYTICS' | 'EDIT_PROFILE'
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return {
        allowed: false,
        status: 401,
        message: 'Unauthorized',
      }
    }

    const profile = await prisma.professionalProfile.findUnique({
      where: { userId: session.user.id },
      include: { 
        subscription: { include: { tier: true } },
        trial: true
      },
    })

    if (!profile) {
      return {
        allowed: false,
        status: 404,
        message: 'Professional profile not found',
      }
    }

    const now = new Date()

    // Check trial status
    if (profile.trial && now < profile.trial.endDate) {
      // All actions allowed during trial
      return { allowed: true }
    }

    // Trial expired
    const isActive = profile.subscription?.status === 'ACTIVE' && now < profile.subscription.nextRenewalDate

    if (!isActive) {
      return {
        allowed: false,
        status: 403,
        message: 'Trial or Subscription expired. Please subscribe to continue.',
      }
    }

    // Check specific permissions based on action
    const tier = profile.subscription?.tier

    switch (action) {
      case 'ADD_PRODUCT':
      case 'ADD_SERVICE':
        return { allowed: true }

      case 'VIEW_ANALYTICS':
        if (tier?.analyticsAccess) {
          return { allowed: true }
        }
        return {
          allowed: false,
          status: 403,
          message: 'Analytics not available in your subscription tier',
        }

      case 'EDIT_PROFILE':
        return { allowed: true }

      default:
        return { allowed: true }
    }
  } catch (error) {
    console.error('Error checking subscription for action:', error)
    return {
      allowed: false,
      status: 500,
      message: 'Error checking permissions',
    }
  }
}
