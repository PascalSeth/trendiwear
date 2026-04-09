import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { mapErrorToResponse } from '@/lib/api-utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const professionalId = searchParams.get("professionalId")

    if (!professionalId) {
      return NextResponse.json({ error: "Professional ID is required" }, { status: 400 })
    }

    const collections = await prisma.portfolioCollection.findMany({
      where: { professionalId },
      orderBy: { order: 'asc' }
    })

    return NextResponse.json(collections)
  } catch (error) {
    const { status, message } = mapErrorToResponse(error, { route: 'portfolio-collections.GET' })
    return NextResponse.json({ error: message }, { status })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    
    // Check if professional profile exists
    const profile = await prisma.professionalProfile.findUnique({
      where: { userId: user.id }
    })

    if (!profile) {
      return NextResponse.json({ error: "Professional profile not found" }, { status: 404 })
    }

    const body = await request.json()
    const { name, description, images, coverImage, order } = body

    const collection = await prisma.portfolioCollection.create({
      data: {
        professionalId: profile.id,
        name,
        description,
        images: images || [],
        coverImage,
        order: order || 0
      }
    })

    return NextResponse.json(collection, { status: 201 })
  } catch (error) {
    const { status, message } = mapErrorToResponse(error, { route: 'portfolio-collections.POST' })
    return NextResponse.json({ error: message }, { status })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { id, name, description, images, coverImage, order } = body

    if (!id) {
      return NextResponse.json({ error: "Collection ID is required" }, { status: 400 })
    }

    // Verify ownership
    const collection = await prisma.portfolioCollection.findUnique({
      where: { id },
      include: { professional: true }
    })

    if (!collection || collection.professional.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized or collection not found" }, { status: 403 })
    }

    const updated = await prisma.portfolioCollection.update({
      where: { id },
      data: {
        name,
        description,
        images,
        coverImage,
        order
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    const { status, message } = mapErrorToResponse(error, { route: 'portfolio-collections.PUT' })
    return NextResponse.json({ error: message }, { status })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Collection ID is required" }, { status: 400 })
    }

    // Verify ownership
    const collection = await prisma.portfolioCollection.findUnique({
      where: { id },
      include: { professional: true }
    })

    if (!collection || collection.professional.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized or collection not found" }, { status: 403 })
    }

    await prisma.portfolioCollection.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    const { status, message } = mapErrorToResponse(error, { route: 'portfolio-collections.DELETE' })
    return NextResponse.json({ error: message }, { status })
  }
}
