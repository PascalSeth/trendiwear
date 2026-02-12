import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-config"
import type { Prisma } from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const isPublic = searchParams.get("public") === "true"
    const limit = searchParams.get("limit")

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
        ...(limit && { take: parseInt(limit) }),
      })

      return NextResponse.json(profiles)
    }

    // Private endpoint for authenticated user
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user from database using email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Allow SUPER_ADMIN and ADMIN to fetch all professional profiles
    if (user.role === "SUPER_ADMIN" || user.role === "ADMIN") {
      const profiles = await prisma.professionalProfile.findMany({
        where: {},
        select: {
          id: true,
          userId: true,
          businessName: true,
          businessImage: true,
          specializationId: true,
          experience: true,
          bio: true,
          portfolioUrl: true,
          spotlightVideoUrl: true,
          latitude: true,
          longitude: true,
          location: true,
          availability: true,
          freeDeliveryThreshold: true,
          isVerified: true,
          rating: true,
          totalReviews: true,
          completedOrders: true,
          accountBalance: true,
          creditScore: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true,
              email: true,
              role: true,
              products: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  images: true,
                  isActive: true,
                },
                where: { isActive: true },
              },
              professionalServices: {
                select: {
                  id: true,
                  price: true,
                  isActive: true,
                  service: {
                    select: {
                      id: true,
                      name: true,
                      description: true,
                      duration: true,
                      imageUrl: true,
                    },
                  },
                },
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
              id: true,
              name: true,
            },
          },
          socialMedia: true,
          store: true,
          deliveryZones: true,
        },
        orderBy: { createdAt: "desc" },
        ...(limit && { take: parseInt(limit) }),
      })
      console.log("Fetched professional profiles for admin:", profiles)
      return NextResponse.json(profiles)
    }

    // For regular users, return only their own profile
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
    console.log("Fetched professional profile:", profile)
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
