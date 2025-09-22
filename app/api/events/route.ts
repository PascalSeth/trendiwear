//api/events
import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth"
import { uploadFile } from "@/lib/upload"
import type { Season } from "@prisma/client"

export async function GET() {
  try {
    const events = await prisma.event.findMany({
      where: { isActive: true },
      include: {
        outfitInspirations: {
          where: { isActive: true },
          take: 6,
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: {
            outfitInspirations: { where: { isActive: true } },
          },
        },
      },
      orderBy: { name: "asc" },
    })

    return NextResponse.json(events)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"])

    const contentType = request.headers.get("content-type") || ""

    let name: string
    let description: string | undefined
    let imageUrl: string | undefined
    let dressCodes: string[]
    let seasonality: Season[]

    if (contentType.includes("multipart/form-data")) {
      // Handle FormData
      const formData = await request.formData()
      name = formData.get("name") as string
      description = formData.get("description") as string | undefined
      const imageFile = formData.get("image") as File | null
      dressCodes = JSON.parse(formData.get("dressCodes") as string || "[]")
      seasonality = JSON.parse(formData.get("seasonality") as string || "[]")

      if (imageFile) {
        // Upload to Supabase
        const fileName = `event-${Date.now()}-${imageFile.name}`
        imageUrl = await uploadFile(imageFile, "images", fileName)
      }
    } else {
      // Handle JSON
      const body = await request.json()
      name = body.name
      description = body.description
      imageUrl = body.imageUrl
      dressCodes = body.dressCodes || []
      seasonality = body.seasonality || []
    }

    const event = await prisma.event.create({
      data: {
        name,
        description,
        imageUrl,
        dressCodes,
        seasonality,
      },
      include: {
        _count: {
          select: {
            outfitInspirations: { where: { isActive: true } },
          },
        },
      },
    })

    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
