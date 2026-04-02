import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { mapErrorToResponse } from "@/lib/api-utils"

// GET /api/services/[id]/variants
// Returns all active variants for a professional's service.
// Query param ?professionalId= required for public access.
// Authenticated professionals automatically scope to themselves.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: serviceId } = await params
    const { searchParams } = new URL(request.url)
    const queryProfessionalId = searchParams.get("professionalId")

    let professionalId = queryProfessionalId

    // If no professionalId provided, try to resolve from auth
    if (!professionalId) {
      try {
        const user = await requireAuth()
        if (user.role === "PROFESSIONAL") professionalId = user.id
      } catch {
        // unauthenticated public request — professionalId must be in query
      }
    }

    if (!professionalId) {
      return NextResponse.json(
        { error: "professionalId is required" },
        { status: 400 }
      )
    }

    const professionalService = await prisma.professionalService.findUnique({
      where: { professionalId_serviceId: { professionalId, serviceId } },
      include: {
        variants: {
          where: { isActive: true },
          orderBy: { price: "asc" },
        },
      },
    })

    if (!professionalService) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 })
    }

    return NextResponse.json({ variants: professionalService.variants })
  } catch (error) {
    const { status, message } = mapErrorToResponse(error, { route: "services.[id].variants.GET" })
    return NextResponse.json({ error: message }, { status })
  }
}

// POST /api/services/[id]/variants
// Professional adds a new variant/pricing tier to one of their services.
// Body: { name, description?, price, durationMinutes }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id: serviceId } = await params

    if (user.role !== "PROFESSIONAL") {
      return NextResponse.json({ error: "Only professionals can manage service variants" }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, price, durationMinutes } = body

    if (!name || price === undefined || !durationMinutes) {
      return NextResponse.json({ error: "name, price, and durationMinutes are required" }, { status: 400 })
    }

    const professionalService = await prisma.professionalService.findUnique({
      where: { professionalId_serviceId: { professionalId: user.id, serviceId } },
    })

    if (!professionalService) {
      return NextResponse.json({ error: "Service not in your listing" }, { status: 404 })
    }

    const variant = await prisma.serviceVariant.create({
      data: {
        professionalServiceId: professionalService.id,
        name,
        description,
        price: Number.parseFloat(price),
        durationMinutes: Number.parseInt(durationMinutes),
      },
    })

    return NextResponse.json(variant, { status: 201 })
  } catch (error) {
    const { status, message } = mapErrorToResponse(error, { route: "services.[id].variants.POST" })
    if (status === 401) return NextResponse.json({ error: message, toast: "You must be logged in to continue." }, { status })
    return NextResponse.json({ error: message }, { status })
  }
}
