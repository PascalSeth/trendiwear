import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { mapErrorToResponse } from '@/lib/api-utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")?.trim()

    if (!query) {
      // Default / Discovery State
      const [featuredCollections, categories] = await Promise.all([
        prisma.collection.findMany({
          where: { isActive: true, isFeatured: true },
          take: 4,
          orderBy: { order: 'asc' }
        }),
        prisma.category.findMany({
          where: { isActive: true, level: 0 },
          take: 6,
          orderBy: { order: 'asc' }
        })
      ])

      return NextResponse.json({
        products: [],
        categories,
        collections: featuredCollections,
        trendingTags: ["Minimalist Look", "Streetwear 2024", "Wedding Guest", "Linen Sets", "Eco-Friendly"]
      })
    }

    // Search Mode
    const [products, matchingCategories, matchingCollections] = await Promise.all([
      prisma.product.findMany({
        where: {
          isActive: true,
          isInStock: true,
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
            { keywords: { hasSome: [query] } },
          ]
        },
        take: 6,
        include: {
          categories: true
        }
      }),
      prisma.category.findMany({
        where: {
          isActive: true,
          name: { contains: query, mode: "insensitive" }
        },
        take: 4
      }),
      prisma.collection.findMany({
        where: {
          isActive: true,
          name: { contains: query, mode: "insensitive" }
        },
        take: 4
      })
    ])

    return NextResponse.json({
      products: products.map(p => ({
        id: p.id,
        name: p.name,
        price: `${p.currency} ${p.price}`,
        category: p.categories[0]?.name || 'General',
        image: p.images[0] || 'https://images.unsplash.com/photo-1521223890158-f9f7c3d5d504?q=80&w=200&h=250&auto=format&fit=crop',
        slug: p.slug
      })),
      categories: matchingCategories,
      collections: matchingCollections,
      trendingTags: []
    })

  } catch (error) {
    const { status, message } = mapErrorToResponse(error, { route: 'search.GET' })
    return NextResponse.json({ error: message }, { status })
  }
}
