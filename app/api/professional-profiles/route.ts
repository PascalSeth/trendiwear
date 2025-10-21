import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"
import type { Prisma } from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const isPublic = searchParams.get("public") === "true"

    if (isPublic) {
      // Public endpoint to fetch all professional profiles
      const profiles = await prisma.professionalProfile.findMany({
        where: {},
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              profileImage: true,
              email: true,
            },
            include: {
              products: {
                where: { isActive: true },
              },
              professionalServices: {
                where: { isActive: true },
              },
              _count: {
                select: {
                  products: true,
                  professionalServices: true,
                },
              },
            },
          },
          specialization: {
            select: {
              name: true,
            },
          },
          socialMedia: true,
          store: true,
          deliveryZones: true,
        },
        orderBy: { createdAt: "desc" },
      })

      return NextResponse.json(profiles)
    }

    // Private endpoint for authenticated user
    const { getUser } = getKindeServerSession()
    const user = await getUser()

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const profile = await prisma.professionalProfile.findUnique({
      where: { userId: user.id },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            profileImage: true,
            email: true,
            products: {
              where: { isActive: true },
            },
            professionalServices: {
              where: { isActive: true },
            },
            _count: {
              select: {
                products: true,
                professionalServices: true,
              },
            },
          },
        },
        specialization: {
          select: {
            name: true,
          },
        },
        socialMedia: true,
        store: true,
        deliveryZones: true,
      },
    })

    if (!profile) {
      return NextResponse.json({ error: "Professional profile not found" }, { status: 404 })
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error("Error in professional-profiles GET:", error)
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    const existingProfile = await prisma.professionalProfile.findUnique({
      where: { userId: user.id },
    })

    const {
      businessName,
      businessImage,
      specializationId,
      experience,
      bio,
      portfolioUrl,
      spotlightVideoUrl,
      latitude,
      longitude,
      location,
      availability,
      freeDeliveryThreshold,
      socialMedia,
    }: {
      businessName: string
      businessImage?: string
      specializationId: string
      experience: number
      bio?: string
      portfolioUrl?: string
      spotlightVideoUrl?: string
      latitude?: number
      longitude?: number
      location?: string
      availability?: string
      freeDeliveryThreshold?: number
      socialMedia?: Prisma.SocialMediaCreateWithoutProfessionalInput[]
    } = body

    let profile;

    if (existingProfile) {
      // Update existing profile
      profile = await prisma.professionalProfile.update({
        where: { userId: user.id },
        data: {
          businessName,
          businessImage,
          specializationId,
          experience,
          bio,
          portfolioUrl,
          spotlightVideoUrl,
          ...(latitude && { latitude }),
          ...(longitude && { longitude }),
          ...(location && { location }),
          availability,
          freeDeliveryThreshold,
          socialMedia: {
            deleteMany: {}, // Clear existing social media
            create: socialMedia || []
          },
        },
        include: {
          user: {
            select: { firstName: true, lastName: true, email: true },
          },
          socialMedia: true,
        },
      })
    } else {
      // Create new profile
      profile = await prisma.professionalProfile.create({
        data: {
          userId: user.id,
          businessName,
          businessImage,
          specializationId,
          experience,
          bio,
          portfolioUrl,
          spotlightVideoUrl,
          ...(latitude && { latitude }),
          ...(longitude && { longitude }),
          ...(location && { location }),
          availability,
          freeDeliveryThreshold,
          socialMedia: { create: socialMedia || [] },
        },
        include: {
          user: {
            select: { firstName: true, lastName: true, email: true },
          },
          socialMedia: true,
        },
      })
    }

    // Only update user role if this is a new profile
    if (!existingProfile) {
      await prisma.user.update({
        where: { id: user.id },
        data: { role: "PROFESSIONAL" },
      })
    }

    return NextResponse.json(profile, { status: existingProfile ? 200 : 201 })
  } catch (error) {
    console.error("Error in professional-profiles POST:", error)
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
