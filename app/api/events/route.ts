//api/events
import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth"
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
    const body = await request.json()

    const {
      name,
      description,
      imageUrl,
      dressCodes,
      seasonality,
    }: {
      name: string
      description?: string
      imageUrl?: string
      dressCodes?: string[]
      seasonality?: Season[]
    } = body

    const event = await prisma.event.create({
      data: {
        name,
        description,
        imageUrl,
        dressCodes: dressCodes || [],
        seasonality: seasonality || [],
      },
    })

    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
