import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * PUT /api/subscriptions/tiers/[id]
 * Update a subscription tier
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
      isActive,
      order,
    } = body

    // Validate required fields
    if (!name || weeklyPrice === undefined || monthlyPrice === undefined || yearlyPrice === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: name, weeklyPrice, monthlyPrice, yearlyPrice' },
        { status: 400 }
      )
    }

    const tier = await prisma.subscriptionTier.update({
      where: { id },
      data: {
        name,
        description,
        weeklyPrice,
        monthlyPrice,
        yearlyPrice,
        features: features || [],
        storageLimit: storageLimit || 1000,
        monthlyListings: monthlyListings || 10,
        analyticsAccess: analyticsAccess ?? false,
        prioritySupport: prioritySupport ?? false,
        featuredBadge: featuredBadge ?? false,
        isActive: isActive ?? true,
        order: order || 0,
      },
    })

    return NextResponse.json({
      success: true,
      data: tier,
    })
  } catch (error) {
    console.error('Error updating subscription tier:', error)
    return NextResponse.json(
      { error: 'Failed to update subscription tier' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/subscriptions/tiers/[id]
 * Delete a subscription tier
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if tier has active subscriptions
    const activeSubscriptions = await prisma.subscription.count({
      where: {
        tierId: id,
        status: 'ACTIVE',
      },
    })

    if (activeSubscriptions > 0) {
      return NextResponse.json(
        { error: 'Cannot delete tier with active subscriptions. Deactivate or migrate subscriptions first.' },
        { status: 400 }
      )
    }

    await prisma.subscriptionTier.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Tier deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting subscription tier:', error)
    return NextResponse.json(
      { error: 'Failed to delete subscription tier' },
      { status: 500 }
    )
  }
}
