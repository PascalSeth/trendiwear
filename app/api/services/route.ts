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
    const forDashboard = searchParams.get("dashboard") === "true"

    // For dashboard view, get professional's services with their pricing
    if (forDashboard) {
      try {
        const user = await requireAuth()
        
        const professionalServices = await prisma.professionalService.findMany({
          where: {
            professionalId: user.id,
            isActive: true,
          },
          include: {
            service: {
              include: {
                category: true,
                _count: {
                  select: { bookings: true },
                },
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
          orderBy: { createdAt: "desc" },
        })

        // Transform to expected format
        const services = professionalServices.map(ps => ({
          id: ps.service.id,
          name: ps.service.name,
          description: ps.service.description,
          duration: ps.service.duration,
          imageUrl: ps.service.imageUrl,
          categoryId: ps.service.categoryId,
          isHomeService: ps.service.isHomeService,
          requirements: ps.service.requirements,
          isActive: ps.service.isActive,
          createdAt: ps.service.createdAt,
          updatedAt: ps.service.updatedAt,
          price: ps.price,
          professionalId: ps.professionalId,
          category: ps.service.category,
          professional: ps.professional,
          _count: ps.service._count,
        }))

        return NextResponse.json({
          services,
          pagination: { page: 1, limit: services.length, total: services.length, pages: 1 },
        })
      } catch {
        // User not authenticated, fall through to public services
      }
    }

    const where: Prisma.ServiceWhereInput = { isActive: true }
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
          professionalServices: {
            take: 1,
            select: { price: true },
          },
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

    // Add price from first professional service (for display purposes)
    const servicesWithPrice = services.map(s => ({
      ...s,
      price: s.professionalServices[0]?.price || 0,
    }))

    return NextResponse.json({
      services: servicesWithPrice,
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
