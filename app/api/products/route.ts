import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import type { Prisma, ProductTag, Gender } from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "12")
    const categoryId = searchParams.get("categoryId")
    const collectionId = searchParams.get("collectionId")
    const professionalId = searchParams.get("professionalId")
    const search = searchParams.get("search")
    const minPrice = searchParams.get("minPrice")
    const maxPrice = searchParams.get("maxPrice")
    const tags = searchParams.get("tags")?.split(",") as ProductTag[]
    const gender = searchParams.get("gender") as Gender
    const colors = searchParams.get("colors")?.split(",")
    const sizes = searchParams.get("sizes")?.split(",")
    const sortBy = searchParams.get("sortBy") || "createdAt"
    const sortOrder = searchParams.get("sortOrder") || "desc"
    const dashboard = searchParams.get("dashboard") === "true" // Flag for dashboard requests
    const showcase = searchParams.get("showcase") // "pending" for showcase submissions

    const where: Prisma.ProductWhereInput = {
      isActive: true,
    }

    // Role-based filtering for dashboard
    if (dashboard) {
      try {
        const user = await requireAuth()
        if (user.role === "PROFESSIONAL") {
          where.professionalId = user.id
          // For professionals, don't filter by isInStock to show all their products
          delete where.isInStock
        } else if (user.role === "CUSTOMER") {
          where.isInStock = true // Customers only see in-stock products
        }
        // Admins can see all products
      } catch {
        // If not authenticated, show only in-stock products
        where.isInStock = true
      }
    } else {
      // Public API - only show active and in-stock products
      where.isInStock = true
    }

    if (categoryId) where.categoryId = categoryId
    if (collectionId) where.collectionId = collectionId
    if (professionalId) where.professionalId = professionalId
    if (gender) where.gender = gender

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

    if (tags && tags.length > 0) where.tags = { hasSome: tags }
    if (colors && colors.length > 0) where.colors = { hasSome: colors }
    if (sizes && sizes.length > 0) where.sizes = { hasSome: sizes }

    // Showcase filter for dashboard
    if (showcase === "pending") {
      where.submittedForShowcase = true
      where.isShowcaseApproved = false
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput = {}
    if (sortBy === "createdAt" || sortBy === "price" || sortBy === "viewCount") {
      orderBy[sortBy] = sortOrder as "asc" | "desc"
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          collection: true,
          professional: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              professionalProfile: {
                select: {
                  businessName: true,
                  rating: true,
                  totalReviews: true,
                },
              },
            },
          },
          _count: {
            select: {
              wishlistItems: true,
              cartItems: true,
              orderItems: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
      }),
      prisma.product.count({ where }),
    ])

    // If you need review counts, you'll need to fetch them separately
    // since there's no direct relation in your schema
    const productsWithReviewCounts = await Promise.all(
      products.map(async (product) => {
        const reviewCount = await prisma.review.count({
          where: {
            targetId: product.id,
            targetType: "PRODUCT",
          },
        })
        
        return {
          ...product,
          _count: {
            ...product._count,
            reviews: reviewCount,
          },
        }
      })
    )

    return NextResponse.json({
      products: productsWithReviewCounts,
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
      return NextResponse.json({ error: "Only professionals can create products" }, { status: 403 })
    }

    const {
      name,
      description,
      price,
      stockQuantity,
      images,
      categoryId,
      collectionId,
      sizes,
      colors,
      material,
      careInstructions,
      estimatedDelivery,
      isCustomizable,
      tags,
      gender,
      submittedForShowcase,
    } = body

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: Number.parseFloat(price),
        stockQuantity: Number.parseInt(stockQuantity),
        images,
        categoryId,
        collectionId,
        professionalId: user.id,
        sizes,
        colors,
        material,
        careInstructions,
        estimatedDelivery: estimatedDelivery ? Number.parseInt(estimatedDelivery) : null,
        isCustomizable: Boolean(isCustomizable),
        tags,
        gender: gender || "UNISEX",
        submittedForShowcase: Boolean(submittedForShowcase),
        submittedAt: submittedForShowcase ? new Date() : null,
      },
      include: {
        category: true,
        collection: true,
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

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}