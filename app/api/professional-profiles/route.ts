import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-config"
import { createSubaccount, updateSubaccount, validateGhanaPhone, PAYSTACK_CONFIG, listBanks } from '@/lib/paystack'
import { mapErrorToResponse } from '@/lib/api-utils'
import type { CreateSubaccountPayload } from '@/lib/paystack'
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
          businessName: true,
          businessImage: true,
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

    // Optional payment setup fields (automated flow)
    const { momoNumber, momoProvider } = body as { momoNumber?: string; momoProvider?: string }

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

    // If momoNumber and momoProvider were provided as part of the profile
    // creation/update, attempt to create/update a Paystack subaccount
    if (momoNumber && momoProvider) {
      // Normalize and map provider values (accept different casings and common names)
      const normalize = (v: string) => v.trim().toLowerCase()
      const providerMap: Record<string, string> = {
        mtn: 'mtn',
        'mtn mobile money': 'mtn',
        telecel: 'tel',
        tel: 'tel',
        vod: 'tel',
        vodafone: 'tel',
        'vodafone mobile money': 'tel',
        tgo: 'tgo',
        airteltigo: 'tgo',
        'airtel tigo': 'tgo',
        'airteltigo money': 'tgo',
        airtel: 'tgo',
        tigo: 'tgo',
      }

      const normalized = normalize(momoProvider)
      const mappedProvider = providerMap[normalized] || normalized

      // Validate provider against allowed codes
      const validProviders = Object.values(PAYSTACK_CONFIG.momoProviders)
      if (!validProviders.includes(mappedProvider)) {
        return NextResponse.json({ error: 'Invalid mobile money provider. Use: mtn, tel, or tgo' }, { status: 400 })
      }

      // Validate phone
      const phoneValidation = validateGhanaPhone(momoNumber)
      if (!phoneValidation.valid) {
        return NextResponse.json({ error: 'Invalid Ghana phone number format' }, { status: 400 })
      }

      const formattedPhone = phoneValidation.formatted

      // Re-fetch profile to ensure we have latest data (and any existing subaccount code)
      const freshProfile = await prisma.professionalProfile.findUnique({
        where: { userId: user.id },
        include: { user: { select: { firstName: true, lastName: true, email: true, phone: true } } },
      })

      if (!freshProfile) {
        return NextResponse.json({ error: 'Professional profile not found after update' }, { status: 500 })
      }

      // Step 1: fetch Paystack mobile_money banks and resolve bank code
      type PaystackBank = { code?: string; name?: string; slug?: string; id?: number; active?: boolean }
      let bankCandidate: PaystackBank | undefined
      try {
        const banksRes = await listBanks('ghana', 'mobile_money')
        const banks: PaystackBank[] = (banksRes.data as PaystackBank[]) || []

        const keywordsMap: Record<string, string[]> = {
          mtn: ['mtn', 'mtn mobile money'],
          tel: ['vodafone', 'vod', 'telecel', 'vodafone cash'],
          tgo: ['airteltigo', 'airtel', 'tigo', 'airteltigo money'],
        }

        const keywords = keywordsMap[mappedProvider] || [mappedProvider]

        bankCandidate = banks.find((b) => {
          const name = (b.name || '').toLowerCase()
          const slug = (b.slug || '').toLowerCase()
          const code = String(b.code || '').toLowerCase()
          return keywords.some(k => name.includes(k) || slug.includes(k) || code === k)
        })
      } catch (bankErr) {
        console.warn('Failed to fetch Paystack banks:', bankErr)
      }

      if (!bankCandidate) {
        return NextResponse.json({ error: 'Could not resolve Paystack bank code for the selected MoMo provider. Please choose from the provider list.' }, { status: 400 })
      }

      // Build payload using Paystack settlement_bank (bank code) as per documentation
      const subaccountPayload: CreateSubaccountPayload = {
        business_name: freshProfile.businessName,
        settlement_bank: (bankCandidate?.code || String(bankCandidate?.id || '')).toString(),
        account_number: formattedPhone,
        percentage_charge: PAYSTACK_CONFIG.platformFeePercent,
        description: `TrendiWear seller account for ${freshProfile.businessName}`,
        primary_contact_email: freshProfile.user.email,
        primary_contact_name: `${freshProfile.user.firstName} ${freshProfile.user.lastName}`,
        primary_contact_phone: freshProfile.user.phone || formattedPhone,
        metadata: {
          professionalId: freshProfile.id,
          userId: user.id,
        },
      }

      try {
        let subaccountCode: string | undefined
        if (freshProfile.paystackSubaccountCode) {
          const res = await updateSubaccount(freshProfile.paystackSubaccountCode, subaccountPayload)
          subaccountCode = res.data.subaccount_code
        } else {
          const res = await createSubaccount(subaccountPayload)
          subaccountCode = res.data.subaccount_code
        }

        // Persist payment setup info only after successful Paystack response
        await prisma.professionalProfile.update({
          where: { id: freshProfile.id },
          data: {
            momoNumber: formattedPhone,
            momoProvider: mappedProvider,
            paystackSubaccountCode: subaccountCode,
            paymentSetupComplete: true,
          },
        })
      } catch (payErr) {
        console.error('Automated subaccount creation failed:', payErr)
        return NextResponse.json({ error: payErr instanceof Error ? payErr.message : 'Failed to setup Paystack subaccount' }, { status: 500 })
      }
    }

    return NextResponse.json(profile, { status: existingProfile ? 200 : 201 })
  } catch (error) {
    const { status, message } = mapErrorToResponse(error, { route: 'professional-profiles.POST' })
    return NextResponse.json({ error: message }, { status })
  }
}
