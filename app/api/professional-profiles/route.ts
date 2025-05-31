import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import type { Prisma, ProfessionalType } from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "12")
    const specialization = searchParams.get("specialization") as ProfessionalType
    const location = searchParams.get("location")
    const minRating = searchParams.get("minRating")
    const search = searchParams.get("search")
    const verified = searchParams.get("verified")

    const where: Prisma.ProfessionalProfileWhereInput = {
      isVerified: verified === "true" ? true : undefined,
    }

    if (specialization) where.specialization = specialization
    if (location) where.location = { contains: location, mode: "insensitive" }
    if (minRating) where.rating = { gte: Number.parseFloat(minRating) }

    if (search) {
      where.OR = [
        { businessName: { contains: search, mode: "insensitive" } },
        { bio: { contains: search, mode: "insensitive" } },
        {
          user: {
            OR: [
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
            ],
          },
        },
      ]
    }

    const [profiles, total] = await Promise.all([
      prisma.professionalProfile.findMany({
        where,
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              profileImage: true,
              email: true,
            },
          },
          socialMedia: true,
          store: true,
          deliveryZones: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ isVerified: "desc" }, { rating: "desc" }, { totalReviews: "desc" }],
      }),
      prisma.professionalProfile.count({ where }),
    ])

    return NextResponse.json({
      profiles,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
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

    if (existingProfile) {
      return NextResponse.json({ error: "Professional profile already exists" }, { status: 400 })
    }

    const {
      businessName,
      businessImage,
      specialization,
      experience,
      bio,
      portfolioUrl,
      location,
      availability,
      freeDeliveryThreshold,
      socialMedia,
      deliveryZones,
    }: {
      businessName: string
      businessImage?: string
      specialization: ProfessionalType
      experience: number
      bio?: string
      portfolioUrl?: string
      location: string
      availability?: string
      freeDeliveryThreshold?: number
      socialMedia?: Prisma.SocialMediaCreateWithoutProfessionalInput[]
      deliveryZones?: Prisma.DeliveryZoneCreateWithoutProfessionalInput[]
    } = body

    const profile = await prisma.professionalProfile.create({
      data: {
        userId: user.id,
        businessName,
        businessImage,
        specialization,
        experience,
        bio,
        portfolioUrl,
        location,
        availability,
        freeDeliveryThreshold,
        socialMedia: { create: socialMedia || [] },
        deliveryZones: { create: deliveryZones || [] },
      },
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true },
        },
        socialMedia: true,
        deliveryZones: true,
      },
    })

    await prisma.user.update({
      where: { id: user.id },
      data: { role: "PROFESSIONAL" },
    })

    return NextResponse.json(profile, { status: 201 })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
