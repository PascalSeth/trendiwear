import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params

    // First try to find by exact slug match
    let profile = await prisma.professionalProfile.findUnique({
      where: { slug },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            profileImage: true,
            email: true,
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

    if (profile) {
      // Fetch reviews and products in parallel
      const [reviews, products] = await Promise.all([
        prisma.review.findMany({
          where: {
            targetId: profile.id,
            targetType: 'PROFESSIONAL'
          },
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                profileImage: true,
              },
            },
          },
          take: 3,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.product.findMany({
          where: {
            professionalId: profile.userId,
            isActive: true,
          },
          include: {
            professional: {
              select: {
                firstName: true,
                lastName: true,
                professionalProfile: {
                  select: {
                    businessName: true,
                    businessImage: true,
                  },
                },
              },
            },
            _count: {
              select: {
                wishlistItems: true,
              },
            },
          },
          take: 3,
          orderBy: { createdAt: 'desc' }
        })
      ])

      return NextResponse.json({ ...profile, reviews, products })
    }

    // If not found by slug, try to find by business name (URL decoded)
    if (!profile) {
      const decodedSlug = decodeURIComponent(slug).replace(/-/g, ' ')
      profile = await prisma.professionalProfile.findFirst({
        where: {
          businessName: {
            equals: decodedSlug,
            mode: 'insensitive'
          }
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true,
              email: true,
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

      if (profile) {
        // Fetch reviews and products in parallel
        const [reviews, products] = await Promise.all([
          prisma.review.findMany({
            where: {
              targetId: profile.id,
              targetType: 'PROFESSIONAL'
            },
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  profileImage: true,
                },
              },
            },
            take: 3,
            orderBy: { createdAt: 'desc' }
          }),
          prisma.product.findMany({
            where: {
              professionalId: profile.userId,
              isActive: true,
            },
            include: {
              professional: {
                select: {
                  firstName: true,
                  lastName: true,
                  professionalProfile: {
                    select: {
                      businessName: true,
                      businessImage: true,
                    },
                  },
                },
              },
              _count: {
                select: {
                  wishlistItems: true,
                },
              },
            },
            take: 3,
            orderBy: { createdAt: 'desc' }
          })
        ])

        return NextResponse.json({ ...profile, reviews, products })
      }
    }

    // If still not found, try to find by user name (for non-professionals or fallback)
    if (!profile) {
      const decodedSlug = decodeURIComponent(slug)
      const [firstName, lastName] = decodedSlug.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1))

      profile = await prisma.professionalProfile.findFirst({
        where: {
          user: {
            firstName: {
              equals: firstName,
              mode: 'insensitive'
            },
            lastName: {
              equals: lastName,
              mode: 'insensitive'
            }
          }
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true,
              email: true,
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

      if (profile) {
        // Fetch reviews and products in parallel
        const [reviews, products] = await Promise.all([
          prisma.review.findMany({
            where: {
              targetId: profile.id,
              targetType: 'PROFESSIONAL'
            },
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  profileImage: true,
                },
              },
            },
            take: 3,
            orderBy: { createdAt: 'desc' }
          }),
          prisma.product.findMany({
            where: {
              professionalId: profile.userId,
              isActive: true,
            },
            include: {
              professional: {
                select: {
                  firstName: true,
                  lastName: true,
                  professionalProfile: {
                    select: {
                      businessName: true,
                      businessImage: true,
                    },
                  },
                },
              },
              _count: {
                select: {
                  wishlistItems: true,
                },
              },
            },
            take: 3,
            orderBy: { createdAt: 'desc' }
          })
        ])

        return NextResponse.json({ ...profile, reviews, products })
      }
    }

    if (!profile) {
      return NextResponse.json({ error: "Professional profile not found" }, { status: 404 })
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error("Error in professional-profiles slug GET:", error)
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}