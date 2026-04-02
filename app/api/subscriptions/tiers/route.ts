import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * GET /api/subscriptions/tiers
 * Fetch all available subscription tiers
 */
export async function GET() {
  try {
    const tiers = await prisma.subscriptionTier.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json({
      success: true,
      data: tiers,
    })
  } catch (error) {
    console.error('Error fetching subscription tiers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscription tiers' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/subscriptions/tiers (ADMIN ONLY)
 * Create a new subscription tier
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      description,
      weeklyPrice,
      monthlyPrice,
      yearlyPrice,
      features,
      storageLimit,
      monthlyListings,
      analyticsAccess,
      prioritySupport,
      featuredBadge,
      order,
    } = body

    // Validate required fields
    if (!name || !weeklyPrice || !monthlyPrice || !yearlyPrice) {
      return NextResponse.json(
        { error: 'Missing required fields: name, weeklyPrice, monthlyPrice, yearlyPrice' },
        { status: 400 }
      )
    }

    const tier = await prisma.subscriptionTier.create({
      data: {
        name,
        description,
        weeklyPrice,
        monthlyPrice,
        yearlyPrice,
        features: features || [],
        storageLimit: storageLimit || 1000,
        monthlyListings: monthlyListings || 10,
        analyticsAccess: analyticsAccess || false,
        prioritySupport: prioritySupport || false,
        featuredBadge: featuredBadge || false,
        order: order || 0,
      },
    })

    return NextResponse.json({
      success: true,
      data: tier,
    })
  } catch (error) {
    console.error('Error creating subscription tier:', error)
    return NextResponse.json(
      { error: 'Failed to create subscription tier' },
      { status: 500 }
    )
  }
}
