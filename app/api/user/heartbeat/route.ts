import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { mapErrorToResponse } from '@/lib/api-utils'

/**
 * POST /api/user/heartbeat
 * Updates the current user's lastSeenAt timestamp
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()

    await prisma.user.update({
      where: { id: user.id },
      data: { lastSeenAt: new Date() }
    })

    return NextResponse.json({ success: true, timestamp: new Date().toISOString() })
  } catch (error) {
    const { status, message } = mapErrorToResponse(error, { route: 'user.heartbeat.POST' })
    return NextResponse.json({ error: message }, { status })
  }
}
