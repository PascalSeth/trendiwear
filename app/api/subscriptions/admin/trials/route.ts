import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * GET /api/subscriptions/admin/trials
 * Fetch all professional trials (admin only) - shows active and completed
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const completed = searchParams.get('completed') // Optional filter: 'true', 'false', or null for all

    let where = {}
    if (completed !== null) {
      where = {
        completed: completed === 'true',
      }
    }

    const trials = await prisma.professionalTrial.findMany({
      where,
      include: {
        professional: {
          select: {
            id: true,
            businessName: true,
          },
        },
      },
      orderBy: {
        endDate: 'asc',
      },
    })

    return NextResponse.json({
      success: true,
      data: trials,
    })
  } catch (error) {
    console.error('Error fetching trials:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trials' },
      { status: 500 }
    )
  }
}
