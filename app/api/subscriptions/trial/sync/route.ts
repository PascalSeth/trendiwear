import { NextResponse } from 'next/server'
import { syncAllTrialDays } from '@/lib/subscription'
import { requireAuth } from '@/lib/auth'

/**
 * POST /api/subscriptions/trial/sync
 * Manually trigger a synchronization of all trial daysRemaining fields in the DB.
 * This can be called by an admin or a scheduled cron job.
 */
export async function POST() {
  try {
    // 1. Authorization check
    const user = await requireAuth()
    if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // 2. Perform sync
    const result = await syncAllTrialDays()

    return NextResponse.json({
      success: true,
      message: 'Trial sync completed successfully',
      data: result
    })
  } catch (error) {
    console.error('Error in trial sync route:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to sync trials' },
      { status: 500 }
    )
  }
}
