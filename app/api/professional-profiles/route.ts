import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-config"
import { createTransferRecipient, validateGhanaPhone, PAYSTACK_CONFIG } from '@/lib/paystack'
import { initializeTrial } from '@/lib/subscription-service'
import { mapErrorToResponse } from '@/lib/api-utils'
import type { CreateTransferRecipientPayload } from '@/lib/paystack'
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
        select: {
          id: true,
          userId: true,
          businessName: true,
          businessImage: true,
          galleryImages: true,
          portfolioCollections: true,
          experience: true,
          bio: true,
          location: true,
          completedOrders: true,
          rating: true,
          totalReviews: true,
          slug: true,
          isVerified: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              profileImage: true,
              email: true,
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
        },
        orderBy: { createdAt: "desc" },
        ...(limit && { take: parseInt(limit) }),
      })

      // Compute actual sales per professional from order items
      // Count items from all non-cancelled orders (payment is verified by Paystack before order creation)
      const salesCounts = await prisma.orderItem.groupBy({
        by: ['professionalId'],
        _sum: { quantity: true },
        _count: { id: true },
        where: {
          order: {
            status: { notIn: ['CANCELLED', 'REFUNDED'] },
          },
        },
      })
      const salesMap = new Map(salesCounts.map(s => [s.professionalId, s._sum.quantity || s._count.id || 0]))

      const enrichedProfiles = profiles.map(p => ({
        ...p,
        actualSales: salesMap.get(p.userId) || 0,
      }))

      return NextResponse.json(enrichedProfiles)
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
          galleryImages: true,
          portfolioCollections: true,
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
        portfolioCollections: true,
      },
    })
    console.log("Fetched professional profile:", profile)
    if (!profile) {
      return NextResponse.json({ error: "Professional profile not found" }, { status: 404 })
    }

    return NextResponse.json(profile)
  } catch (error) {
    const { status, message } = mapErrorToResponse(error, { route: 'professional-profiles.GET' })
    return NextResponse.json({ error: message }, { status })
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
      galleryImages,
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
      galleryImages?: string[]
      spotlightVideoUrl?: string
      latitude?: number
      longitude?: number
      location?: string
      availability?: string
      freeDeliveryThreshold?: number
      socialMedia?: Prisma.SocialMediaCreateWithoutProfessionalInput[]
    } = body

    // Enforce mandatory payment setup fields
    const { momoNumber, momoProvider } = body as { momoNumber?: string; momoProvider?: string }
    if (!momoNumber || !momoProvider) {
      return NextResponse.json({ error: 'Mobile Money Number and Provider are required for registration.' }, { status: 400 })
    }

    let profile;

    if (existingProfile) {
      // Update existing profile
      profile = await prisma.professionalProfile.update({
        where: { userId: user.id },
        data: {
          businessName,
          businessImage,
          // Generate slug if none exists
          ...(businessName && !existingProfile.slug && { slug: businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') }),
          specializationId,
          experience,
          bio,
          portfolioUrl,
          galleryImages,
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
          slug: businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
          businessImage,
          specializationId,
          experience,
          bio,
          portfolioUrl,
          galleryImages,
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

      // Initialize Trial
      await initializeTrial(profile.id)
    }

    // Only update user role if this is a new profile
    if (!existingProfile) {
      await prisma.user.update({
        where: { id: user.id },
        data: { role: "PROFESSIONAL" },
      })
    }

    // If momoNumber and momoProvider were provided as part of the profile
    // creation/update, attempt to register a Paystack transfer recipient
    if (momoNumber && momoProvider) {
      // Normalize and map provider values
      const normalize = (v: string) => v.trim().toUpperCase()
      const provider = normalize(momoProvider)
      
      // Map common variants if needed
      const mappedProvider = (provider === 'TEL' || provider === 'VODAFONE') ? 'VOD' : 
                            (provider === 'TGO' || provider === 'AIRTELTIGO') ? 'ATL' : 
                            provider

      // Validate provider against allowed codes
      const validProviders = Object.values(PAYSTACK_CONFIG.momoProviders)
      if (!validProviders.includes(mappedProvider)) {
        return NextResponse.json({ error: 'Invalid mobile money provider. Please select a valid provider from the list.' }, { status: 400 })
      }

      // Validate phone
      const phoneValidation = validateGhanaPhone(momoNumber)
      if (!phoneValidation.valid) {
        return NextResponse.json({ error: 'Invalid Ghana phone number format' }, { status: 400 })
      }

      const formattedPhone = phoneValidation.formatted

      // Proactive Uniqueness Check: Ensure no other profile uses this momoNumber
      const conflictingProfile = await prisma.professionalProfile.findFirst({
        where: { 
          momoNumber: formattedPhone,
          userId: { not: user.id } // Exclude current user if they are just updating
        }
      })

      if (conflictingProfile) {
        return NextResponse.json({ 
          error: 'This Mobile Money number is already registered with another business account. Please use a unique number.' 
        }, { status: 409 })
      }

      // Re-fetch profile to ensure we have latest data
      const freshProfile = await prisma.professionalProfile.findUnique({
        where: { userId: user.id },
        include: { user: { select: { firstName: true, lastName: true, email: true, phone: true } } },
      })

      if (!freshProfile) {
        return NextResponse.json({ error: 'Professional profile not found after update' }, { status: 500 })
      }

      // Build payload for Paystack Transfer Recipient
      const recipientPayload: CreateTransferRecipientPayload = {
        type: "mobile_money",
        name: `${freshProfile.user.firstName} ${freshProfile.user.lastName}`,
        account_number: formattedPhone,
        bank_code: mappedProvider,
        currency: "GHS",
        description: `TrendiWear payout recipient for ${freshProfile.businessName}`,
        metadata: {
          professionalId: freshProfile.id,
          userId: user.id,
        },
      }

      try {
        const res = await createTransferRecipient(recipientPayload)
        const recipientCode = res.data.recipient_code

        // Persist recipient info
        await prisma.professionalProfile.update({
          where: { id: freshProfile.id },
          data: {
            momoNumber: formattedPhone,
            momoProvider: mappedProvider,
            paystackRecipientCode: recipientCode,
            paymentSetupComplete: true,
          },
        })
      } catch (payErr) {
        console.error('Automated payout setup failed:', payErr)
        return NextResponse.json({ error: payErr instanceof Error ? payErr.message : 'Failed to setup Paystack recipient' }, { status: 500 })
      }
    }

    return NextResponse.json(profile, { status: existingProfile ? 200 : 201 })
  } catch (error) {
    const { status, message } = mapErrorToResponse(error, { route: 'professional-profiles.POST' })
    return NextResponse.json({ error: message }, { status })
  }
}
