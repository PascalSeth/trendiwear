import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { mapErrorToResponse } from '@/lib/api-utils'

// POST - Toggle verification status (Admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await requireAuth()

    // Only admins can verify professionals
    if (!["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const { isVerified } = body

    const existingProfile = await prisma.professionalProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true }
        }
      }
    })

    if (!existingProfile) {
      return NextResponse.json({ error: "Professional profile not found" }, { status: 404 })
    }

    // Update verification status
    const updatedProfile = await prisma.professionalProfile.update({
      where: { id },
      data: { isVerified: isVerified ?? !existingProfile.isVerified },
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true }
        }
      }
    })

    // Create notification for the professional
    await prisma.notification.create({
      data: {
        userId: existingProfile.userId,
        type: 'SYSTEM_UPDATE',
        title: updatedProfile.isVerified ? '🎉 Account Verified!' : 'Verification Status Updated',
        message: updatedProfile.isVerified
          ? 'Congratulations! Your business has been verified by TrendiWear. You now have a verified badge on your profile and products.'
          : 'Your verification status has been updated. Please contact support if you have questions.',
        data: JSON.stringify({
          profileId: id,
          isVerified: updatedProfile.isVerified,
          verifiedAt: new Date().toISOString(),
        }),
      },
    })

    return NextResponse.json({ 
      success: true, 
      isVerified: updatedProfile.isVerified,
      message: updatedProfile.isVerified ? 'Professional verified successfully' : 'Verification removed'
    })
  } catch (error) {
    const { status, message } = mapErrorToResponse(error, { route: 'professional-profiles.[id].verify' })
    if (status === 401) return NextResponse.json({ error: message, toast: 'You must be logged in to continue.' }, { status })
    return NextResponse.json({ error: message }, { status })
  }
}
