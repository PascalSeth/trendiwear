import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { initializeTrial } from '@/lib/subscription-service'

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

    // Step 1: Use shared service for trial initialization
    const trial = await initializeTrial(professionalId)

    return NextResponse.json({
      success: true,
      message: 'Trial initialized successfully',
      data: {
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
