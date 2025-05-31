import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  try {
    const { productId } = await params
    const user = await requireAuth()

    const wishlistItem = await prisma.wishlistItem.findUnique({
      where: {
        userId_productId: {
          userId: user.id,
          productId,
        },
      },
    })

    if (!wishlistItem) {
      return NextResponse.json({ error: "Item not in wishlist" }, { status: 404 })
    }

    await prisma.wishlistItem.delete({ where: { id: wishlistItem.id } })

    await prisma.product.update({
      where: { id: productId },
      data: { wishlistCount: { decrement: 1 } },
    })

    return NextResponse.json({ message: "Item removed from wishlist" })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
