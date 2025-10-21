import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"

export async function GET() {
  try {
    const user = await requireAuth()

    const wishlistItems = await prisma.wishlistItem.findMany({
      where: { userId: user.id },
      include: {
        product: {
          include: {
            professional: {
              select: {
                firstName: true,
                lastName: true,
                professionalProfile: {
                  select: {
                    businessName: true,
                    rating: true,
                  },
                },
              },
            },
            _count: {
              select: {
                wishlistItems: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ items: wishlistItems })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { productId } = body

    console.log(`User ${user.id} attempting to add product ${productId} to wishlist`)

    // Validate product exists and is active
    const product = await prisma.product.findUnique({
      where: { id: productId },
    })

    if (!product) {
      console.log(`Product ${productId} not found`)
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    if (!product.isActive) {
      console.log(`Product ${productId} is not active`)
      return NextResponse.json({ error: "Product is not available" }, { status: 400 })
    }

    // Check if item already exists in user's wishlist
    const existingItem = await prisma.wishlistItem.findUnique({
      where: {
        userId_productId: {
          userId: user.id,
          productId,
        },
      },
    })

    if (existingItem) {
      console.log(`Product ${productId} already in user ${user.id}'s wishlist`)
      return NextResponse.json({
        error: "Product already in wishlist",
        item: existingItem
      }, { status: 409 }) // 409 Conflict is more appropriate
    }

    console.log(`Creating wishlist item for user ${user.id} and product ${productId}`)

    // Use a transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Create the wishlist item
      const wishlistItem = await tx.wishlistItem.create({
        data: {
          userId: user.id,
          productId,
        },
        include: {
          product: {
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
            },
          },
        },
      })

      // Increment the product's wishlist count
      await tx.product.update({
        where: { id: productId },
        data: { wishlistCount: { increment: 1 } },
      })

      return wishlistItem
    })

    console.log(`Successfully added product ${productId} to user ${user.id}'s wishlist`)

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error adding to wishlist:', error)
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
