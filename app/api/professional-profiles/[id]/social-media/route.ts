import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { SocialMediaPlatform } from "@prisma/client"

interface SocialMediaInput {
  platform: string
  url: string
}

// Map common platform names to enum values
const platformMap: Record<string, SocialMediaPlatform> = {
  'website': 'FACEBOOK', // Using FACEBOOK as fallback for website links
  'instagram': 'INSTAGRAM',
  'facebook': 'FACEBOOK',
  'twitter': 'TWITTER',
  'linkedin': 'LINKEDIN',
  'youtube': 'YOUTUBE',
  'tiktok': 'TIKTOK',
  'pinterest': 'PINTEREST',
  'whatsapp': 'WHATSAPP',
}

export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const socialMedia = await prisma.socialMedia.findMany({
      where: { professionalId: id },
    })

    return NextResponse.json(socialMedia)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await requireAuth()
    const body = await request.json()

    const { socialMedia } = body as { socialMedia: SocialMediaInput[] }

    // Verify ownership
    const profile = await prisma.professionalProfile.findUnique({
      where: { id },
    })

    if (!profile) {
      return NextResponse.json({ error: "Professional profile not found" }, { status: 404 })
    }

    if (profile.userId !== user.id && !["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Delete existing social media entries
    await prisma.socialMedia.deleteMany({
      where: { professionalId: id },
    })

    // Create new social media entries (filter for valid platforms)
    if (socialMedia && socialMedia.length > 0) {
      const validEntries = socialMedia
        .filter(sm => platformMap[sm.platform.toLowerCase()])
        .map((sm) => ({
          professionalId: id,
          platform: platformMap[sm.platform.toLowerCase()],
          url: sm.url,
        }))

      if (validEntries.length > 0) {
        await prisma.socialMedia.createMany({
          data: validEntries,
        })
      }
    }

    // Fetch updated social media
    const updatedSocialMedia = await prisma.socialMedia.findMany({
      where: { professionalId: id },
    })

    return NextResponse.json(updatedSocialMedia)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
