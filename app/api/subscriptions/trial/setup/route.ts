import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * POST /api/subscriptions/trial/setup
 * Initialize trial for new professional (called during registration)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { professionalId } = body

    if (!professionalId) {
      return NextResponse.json(
        { error: 'professionalId is required' },
        { status: 400 }
      )
    }

    const profile = await prisma.professionalProfile.findUnique({
      where: { id: professionalId },
    })

    if (!profile) {
      return NextResponse.json(
        { error: 'Professional profile not found' },
        { status: 404 }
      )
    }

    const now = new Date()
    const trialEndDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000) // 3 months

    // Update professional profile with trial dates
    const updated = await prisma.professionalProfile.update({
      where: { id: professionalId },
      data: {
        trialStartDate: now,
        trialEndDate,
        isOnTrial: true,
        subscriptionStatus: 'TRIAL',
      },
    })

    // Create trial record
    const trial = await prisma.professionalTrial.create({
      data: {
        professionalId,
        startDate: now,
        endDate: trialEndDate,
        daysRemaining: 90,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Trial initialized successfully',
      data: {
        trialStartDate: updated.trialStartDate,
        trialEndDate: updated.trialEndDate,
        daysRemaining: 90,
        trial,
      },
    })
  } catch (error) {
    console.error('Error setting up trial:', error)
    return NextResponse.json(
      { error: 'Failed to setup trial' },
      { status: 500 }
    )
  }
}
