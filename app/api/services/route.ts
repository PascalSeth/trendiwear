import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import type { Prisma } from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "12")
    const categoryId = searchParams.get("categoryId")
    const isHomeService = searchParams.get("isHomeService")
    const search = searchParams.get("search")

    const where: Prisma.ServiceWhereInput = { isActive: true }
    // Note: Filtering by professionalId, price, etc. would require joining with ProfessionalService
    // For now, keeping basic filters
    if (categoryId) where.categoryId = categoryId
    if (isHomeService !== null) where.isHomeService = isHomeService === "true"

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ]
    }

    const [services, total] = await Promise.all([
      prisma.service.findMany({
        where,
        include: {
          category: true,
          _count: {
            select: { bookings: true },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.service.count({ where }),
    ])

    return NextResponse.json({
      services,
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

    if (user.role !== "PROFESSIONAL") {
      return NextResponse.json({ error: "Only professionals can create services" }, { status: 403 })
    }

    const { name, description, price, duration, imageUrl, categoryId, isHomeService, requirements } = body

    // First check if service already exists
    let service = await prisma.service.findFirst({
      where: {
        name,
        categoryId,
        duration: Number.parseInt(duration),
      },
    })

    if (!service) {
      // Create base service
      service = await prisma.service.create({
        data: {
          name,
          description,
          duration: Number.parseInt(duration),
          imageUrl,
          categoryId,
          isHomeService: Boolean(isHomeService),
          requirements,
        },
      })
    }

    // Create professional service offering
    const professionalService = await prisma.professionalService.create({
      data: {
        professionalId: user.id,
        serviceId: service.id,
        price: Number.parseFloat(price),
      },
      include: {
        service: {
          include: {
            category: true,
          },
        },
        professional: {
          select: {
            firstName: true,
            lastName: true,
            professionalProfile: {
              select: { businessName: true },
            },
          },
        },
      },
    })

    return NextResponse.json(professionalService, { status: 201 })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
