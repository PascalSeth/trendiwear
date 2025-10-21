import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth"
import { BadgeCategory } from "@prisma/client"

export async function POST() {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"])

    const badges = [
      {
        name: "First Post",
        description: "Created your first social post",
        iconUrl: "/badges/first-post.png",
        category: BadgeCategory.SOCIAL,
        pointsRequired: 0
      },
      {
        name: "Fashion Guru",
        description: "Earned 1000 reputation points",
        iconUrl: "/badges/fashion-guru.png",
        category: BadgeCategory.ACHIEVEMENT,
        pointsRequired: 1000
      },
      {
        name: "Trendsetter",
        description: "Posted 50 fashion-related content",
        iconUrl: "/badges/trendsetter.png",
        category: BadgeCategory.CREATIVE,
        pointsRequired: 0
      },
      {
        name: "Community Builder",
        description: "Helped 100 community members",
        iconUrl: "/badges/community-builder.png",
        category: BadgeCategory.COMMUNITY,
        pointsRequired: 0
      },
      {
        name: "Style Influencer",
        description: "Gained 500 followers",
        iconUrl: "/badges/style-influencer.png",
        category: BadgeCategory.SOCIAL,
        pointsRequired: 0
      }
    ]

    // Create badges if they don't exist
    const createdBadges = []
    for (const badgeData of badges) {
      const existingBadge = await prisma.badge.findUnique({
        where: { name: badgeData.name }
      })

      if (!existingBadge) {
        const badge = await prisma.badge.create({
          data: badgeData
        })
        createdBadges.push(badge)
      }
    }

    return NextResponse.json({
      message: `Created ${createdBadges.length} new badges`,
      badges: createdBadges
    }, { status: 201 })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function GET() {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"])

    const badges = await prisma.badge.findMany({
      orderBy: { createdAt: "asc" }
    })

    return NextResponse.json(badges)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}