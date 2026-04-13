import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import prisma from '@/lib/prisma'
import { mapErrorToResponse } from '@/lib/api-utils'

/**
 * POST /api/admin/verify-seller
 * Admin endpoint to approve or reject a professional's verification documents.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify Admin Authorization
    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (!adminUser || (adminUser.role !== 'ADMIN' && adminUser.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Forbidden: Admin access only' }, { status: 403 })
    }

    const { professionalId, action, message } = await request.json()

    if (!professionalId || !action) {
      return NextResponse.json(
        { error: 'professionalId and action (APPROVE/REJECT) are required.' },
        { status: 400 }
      )
    }

    if (action === 'APPROVE') {
      await prisma.$transaction([
        // 1. Mark all pending documents as verified
        prisma.verificationDocument.updateMany({
          where: { professionalId },
          data: {
            isVerified: true,
            verifiedAt: new Date(),
            verificationMessage: null
          }
        }),
        // 2. Set the profile as verified
        prisma.professionalProfile.update({
          where: { id: professionalId },
          data: { isVerified: true }
        })
      ])

      return NextResponse.json({
        success: true,
        message: 'Professional successfully verified.'
      })
    } else if (action === 'REJECT') {
      if (!message) {
        return NextResponse.json({ error: 'A rejection message is required.' }, { status: 400 })
      }

      await prisma.$transaction([
        // 1. Unverify documents and add message
        prisma.verificationDocument.updateMany({
          where: { professionalId },
          data: {
            isVerified: false,
            verificationMessage: message,
            verifiedAt: null
          }
        }),
        // 2. Ensure profile flag is false
        prisma.professionalProfile.update({
          where: { id: professionalId },
          data: { isVerified: false }
        })
      ])

      return NextResponse.json({
        success: true,
        message: 'Professional verification rejected with provided feedback.'
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    const { status, message } = mapErrorToResponse(error, { route: 'admin.verify-seller.POST' })
    return NextResponse.json({ error: message }, { status })
  }
}
