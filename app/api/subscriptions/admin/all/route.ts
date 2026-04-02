import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import type { SubscriptionStatus } from '@prisma/client'

/**
 * GET /api/subscriptions/admin/all
 * Fetch all subscriptions (admin only) - shows all statuses
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // Optional filter

    const where = status ? { status: status as SubscriptionStatus } : {}

    const subscriptions = await prisma.subscription.findMany({
      where,
      include: {
        tier: {
          select: {
            name: true,
          },
        },
        professional: {
          select: {
            id: true,
            businessName: true,
          },
        },
      },
      orderBy: {
        startDate: 'desc',
      },
    })

    return NextResponse.json({
      success: true,
      data: subscriptions,
    })
  } catch (error) {
    console.error('Error fetching subscriptions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions' },
      { status: 500 }
    )
  }
}
