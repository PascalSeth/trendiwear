import prisma from './prisma'
import { SubscriptionBillingCycle } from '@prisma/client'

/**
 * Activate or renew a subscription for a professional.
 * This can be called from both the redirect-based verify route 
 * and the Paystack webhook for redundancy.
 */
export async function activateSubscription(params: {
  professionalId: string
  tierId: string
  billingCycle: SubscriptionBillingCycle
  amount: number
  reference: string
  channel?: string
  paidAt?: Date
}) {
  const { professionalId, tierId, billingCycle, amount, reference, channel, paidAt } = params

  const now = paidAt || new Date()
  const renewalDays = billingCycle === 'WEEKLY' ? 7 : billingCycle === 'YEARLY' ? 365 : 30

  return await prisma.$transaction(async (tx) => {
    // 1. Find or create the subscription
    const existingSubscription = await tx.subscription.findUnique({
      where: { professionalId },
    })

    let nextRenewalDate: Date

    // LOGIC: DATE STACKING
    // If user has an ACTIVE subscription that hasn't expired, append the new time
    if (existingSubscription && existingSubscription.status === 'ACTIVE' && existingSubscription.nextRenewalDate > now) {
      nextRenewalDate = new Date(existingSubscription.nextRenewalDate.getTime() + renewalDays * 24 * 60 * 60 * 1000)
    } else {
      nextRenewalDate = new Date(now.getTime() + renewalDays * 24 * 60 * 60 * 1000)
    }

    // 2. Update the payment record
    await tx.subscriptionPayment.update({
      where: { paystackReference: reference },
      data: {
        status: 'PAID',
        paidAt: now,
        nextRenewal: nextRenewalDate,
        paystackChannel: channel,
      },
    })

    let subscriptionId: string

    if (existingSubscription) {
      const updatedSub = await tx.subscription.update({
        where: { id: existingSubscription.id },
        data: {
          tierId,
          billingCycle,
          status: 'ACTIVE',
          currentAmount: amount,
          nextRenewalDate,
        },
      })
      subscriptionId = updatedSub.id
    } else {
      const newSub = await tx.subscription.create({
        data: {
          professionalId,
          tierId,
          billingCycle,
          status: 'ACTIVE',
          currentAmount: amount,
          startDate: now,
          nextRenewalDate,
        },
      })
      subscriptionId = newSub.id
    }

    // 3. Update the payment record with subscriptionId
    await tx.subscriptionPayment.update({
      where: { paystackReference: reference },
      data: { subscriptionId },
    })

    // 4. Link subscription to profile
    await tx.professionalProfile.update({
      where: { id: professionalId },
      data: {
        subscriptionId,
        lastSubscriptionRenew: now,
      },
    })

    // 5. TRIAL CLEANUP: Mark any existing trial as completed
    await tx.professionalTrial.updateMany({
      where: { 
        professionalId,
        completed: false 
      },
      data: { completed: true }
    })

    return {
      success: true,
      subscriptionId,
      nextRenewalDate,
    }
  })
}

/**
 * Initialize a 90-day trial for a professional.
 */
export async function initializeTrial(professionalId: string) {
  const now = new Date()
  const trialEndDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)

  return await prisma.professionalTrial.upsert({
    where: { professionalId },
    create: {
      professionalId,
      startDate: now,
      endDate: trialEndDate,
      daysRemaining: 90,
    },
    update: {
      startDate: now,
      endDate: trialEndDate,
      daysRemaining: 90,
    },
  })
}
