import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import type { Prisma } from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "12")
    const professionalId = searchParams.get("professionalId")
    const categoryId = searchParams.get("categoryId")
    const isHomeService = searchParams.get("isHomeService")
    const search = searchParams.get("search")
    const minPrice = searchParams.get("minPrice")
    const maxPrice = searchParams.get("maxPrice")

    const where: Prisma.ServiceWhereInput = { isActive: true }
    if (professionalId) where.professionalId = professionalId
    if (categoryId) where.categoryId = categoryId
    if (isHomeService !== null) where.isHomeService = isHomeService === "true"

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ]
    }

    if (minPrice || maxPrice) {
      where.price = {}
      if (minPrice) where.price.gte = Number.parseFloat(minPrice)
      if (maxPrice) where.price.lte = Number.parseFloat(maxPrice)
    }

    const [services, total] = await Promise.all([
      prisma.service.findMany({
        where,
        include: {
          professional: {
            select: {
              firstName: true,
              lastName: true,
              professionalProfile: {
                select: {
                  businessName: true,
                  rating: true,
                  totalReviews: true,
                  location: true,
                },
              },
            },
          },
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

    const service = await prisma.service.create({
      data: {
        name,
        description,
        price: Number.parseFloat(price),
        duration: Number.parseInt(duration),
        imageUrl,
        professionalId: user.id,
        categoryId,
        isHomeService: Boolean(isHomeService),
        requirements,
      },
      include: {
        professional: {
          select: {
            firstName: true,
            lastName: true,
            professionalProfile: {
              select: { businessName: true },
            },
          },
        },
        category: true,
      },
    })

    return NextResponse.json(service, { status: 201 })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
