import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  try {
    const { productId } = await params
    const user = await requireAuth()

    console.log(`User ${user.id} attempting to remove product ${productId} from wishlist`)

    // Check if the item exists in the user's wishlist
    const wishlistItem = await prisma.wishlistItem.findUnique({
      where: {
        userId_productId: {
          userId: user.id,
          productId,
        },
      },
    })

    if (!wishlistItem) {
      console.log(`Item not found in user ${user.id}'s wishlist for product ${productId}`)
      return NextResponse.json({ error: "Item not in wishlist" }, { status: 404 })
    }

    console.log(`Removing wishlist item ${wishlistItem.id} for user ${user.id} and product ${productId}`)

    // Use a transaction to ensure data consistency
    await prisma.$transaction(async (tx) => {
      // Delete the wishlist item
      await tx.wishlistItem.delete({ where: { id: wishlistItem.id } })

      // Decrement the product's wishlist count (ensure it doesn't go below 0)
      await tx.product.update({
        where: { id: productId },
        data: {
          wishlistCount: {
            decrement: 1,
            // Note: Prisma doesn't have a built-in min(0) function, but we can handle this in the application logic
          }
        },
      })

      // Ensure wishlist count doesn't go below 0
      const updatedProduct = await tx.product.findUnique({
        where: { id: productId },
        select: { wishlistCount: true }
      })

      if (updatedProduct && updatedProduct.wishlistCount < 0) {
        await tx.product.update({
          where: { id: productId },
          data: { wishlistCount: 0 }
        })
      }
    })

    console.log(`Successfully removed product ${productId} from user ${user.id}'s wishlist`)

    return NextResponse.json({ message: "Item removed from wishlist" })
  } catch (error) {
    console.error('Error removing from wishlist:', error)
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
