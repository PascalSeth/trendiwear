import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import prisma from '@/lib/prisma'
import { mapErrorToResponse } from '@/lib/api-utils'

/**
 * POST /api/professional-profiles/verification
 * Allows a professional to submit their National ID and Business Proof for verification.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await prisma.professionalProfile.findUnique({
      where: { userId: session.user.id },
    })

    if (!profile) {
      return NextResponse.json({ error: 'Professional profile not found' }, { status: 404 })
    }

    const { 
      nationalIdFrontUrl, 
      nationalIdBackUrl, 
      selfieUrl, 
      businessProofUrl 
    } = await request.json()

    if (!nationalIdFrontUrl || !nationalIdBackUrl || !selfieUrl || !businessProofUrl) {
      return NextResponse.json(
        { error: 'All verification documents (ID front, ID back, Selfie, and Business Proof) are required.' },
        { status: 400 }
      )
    }

    // Use a transaction to create/update document records
    await prisma.$transaction([
      // 1. National ID Front
      prisma.verificationDocument.upsert({
        where: {
          id: (await prisma.verificationDocument.findFirst({
            where: { professionalId: profile.id, documentType: 'NATIONAL_ID_FRONT' }
          }))?.id || 'new-id-front'
        },
        update: {
          documentUrl: nationalIdFrontUrl,
          isVerified: false,
          verificationMessage: null,
          verifiedAt: null,
          uploadedAt: new Date(),
        },
        create: {
          professionalId: profile.id,
          documentType: 'NATIONAL_ID_FRONT',
          documentUrl: nationalIdFrontUrl,
        }
      }),
      // 2. National ID Back
      prisma.verificationDocument.upsert({
        where: {
          id: (await prisma.verificationDocument.findFirst({
            where: { professionalId: profile.id, documentType: 'NATIONAL_ID_BACK' }
          }))?.id || 'new-id-back'
        },
        update: {
          documentUrl: nationalIdBackUrl,
          isVerified: false,
          verificationMessage: null,
          verifiedAt: null,
          uploadedAt: new Date(),
        },
        create: {
          professionalId: profile.id,
          documentType: 'NATIONAL_ID_BACK',
          documentUrl: nationalIdBackUrl,
        }
      }),
      // 3. Selfie
      prisma.verificationDocument.upsert({
        where: {
          id: (await prisma.verificationDocument.findFirst({
            where: { professionalId: profile.id, documentType: 'SELFIE' }
          }))?.id || 'new-selfie'
        },
        update: {
          documentUrl: selfieUrl,
          isVerified: false,
          verificationMessage: null,
          verifiedAt: null,
          uploadedAt: new Date(),
        },
        create: {
          professionalId: profile.id,
          documentType: 'SELFIE',
          documentUrl: selfieUrl,
        }
      }),
      // 4. Business Registration
      prisma.verificationDocument.upsert({
        where: {
          id: (await prisma.verificationDocument.findFirst({
            where: { professionalId: profile.id, documentType: 'BUSINESS_REGISTRATION' }
          }))?.id || 'new-biz'
        },
        update: {
          documentUrl: businessProofUrl,
          isVerified: false,
          verificationMessage: null,
          verifiedAt: null,
          uploadedAt: new Date(),
        },
        create: {
          professionalId: profile.id,
          documentType: 'BUSINESS_REGISTRATION',
          documentUrl: businessProofUrl,
        }
      })
    ])

    return NextResponse.json({
      success: true,
      message: 'Verification documents submitted successfully. Our team will review them shortly.'
    })

  } catch (error) {
    const { status, message } = mapErrorToResponse(error, { route: 'verification.POST' })
    return NextResponse.json({ error: message }, { status })
  }
}

/**
 * GET /api/professional-profiles/verification
 * Returns the current verification status and documents.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await prisma.professionalProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        documents: {
          select: {
            id: true,
            documentType: true,
            documentUrl: true,
            isVerified: true,
            verificationMessage: true,
            uploadedAt: true,
          }
        }
      }
    })

    if (!profile) {
      return NextResponse.json({ error: 'Professional profile not found' }, { status: 404 })
    }

    return NextResponse.json({
      isVerified: profile.isVerified,
      documents: profile.documents,
    })

  } catch (error) {
    const { status, message } = mapErrorToResponse(error, { route: 'verification.GET' })
    return NextResponse.json({ error: message }, { status })
  }
}
