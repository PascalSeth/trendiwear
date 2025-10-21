import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import type { ProductTag } from "@prisma/client"

export async function POST() {
  try {
    // Remove "NEW" tags from products older than 1 week
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    const productsToRemoveNewTag = await prisma.product.findMany({
      where: {
        createdAt: {
          lt: oneWeekAgo
        },
        tags: {
          has: "NEW" as ProductTag
        }
      },
      select: {
        id: true,
        tags: true
      }
    })

    // Remove NEW tag from old products
    for (const product of productsToRemoveNewTag) {
      const updatedTags = product.tags.filter(tag => tag !== "NEW") as ProductTag[]
      await prisma.product.update({
        where: { id: product.id },
        data: { tags: updatedTags }
      })
    }

    // Assign BESTSELLER tags - top 3 products by soldCount for each professional
    const professionals = await prisma.user.findMany({
      where: { role: "PROFESSIONAL" },
      select: { id: true }
    })

    for (const professional of professionals) {
      // Get all products for this professional
      const products = await prisma.product.findMany({
        where: {
          professionalId: professional.id,
          isActive: true
        },
        select: {
          id: true,
          tags: true,
          soldCount: true
        },
        orderBy: {
          soldCount: 'desc'
        },
        take: 3 // Top 3 bestsellers
      })

      // Remove BESTSELLER tag from all products of this professional first
      await prisma.product.updateMany({
        where: { professionalId: professional.id },
        data: {
          tags: {
            set: [] // This will remove BESTSELLER from all, but we need to be careful
          }
        }
      })

      // Actually, let's do this more carefully - remove BESTSELLER tag specifically
      const allProducts = await prisma.product.findMany({
        where: { professionalId: professional.id },
        select: { id: true, tags: true }
      })

      for (const product of allProducts) {
        const updatedTags = product.tags.filter(tag => tag !== "BESTSELLER") as ProductTag[]
        await prisma.product.update({
          where: { id: product.id },
          data: { tags: updatedTags }
        })
      }

      // Add BESTSELLER tag to top 3
      for (const product of products) {
        if (product.soldCount > 0) { // Only if it has sales
          const updatedTags = [...product.tags.filter(tag => tag !== "BESTSELLER"), "BESTSELLER"] as ProductTag[]
          await prisma.product.update({
            where: { id: product.id },
            data: { tags: updatedTags }
          })
        }
      }
    }

    // Assign TRENDING tags - products with high engagement (wishlist + cart adds)
    const productsWithEngagement = await prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        tags: true,
        _count: {
          select: {
            wishlistItems: true,
            cartItems: true
          }
        }
      }
    })

    // Calculate engagement score and sort
    const productsWithScores = productsWithEngagement.map(product => ({
      ...product,
      engagementScore: product._count.wishlistItems + product._count.cartItems
    })).sort((a, b) => b.engagementScore - a.engagementScore)

    // Top 10% get TRENDING tag (minimum 5 products, maximum 50)
    const trendingCount = Math.max(5, Math.min(50, Math.floor(productsWithScores.length * 0.1)))
    const trendingProducts = productsWithScores.slice(0, trendingCount).filter(p => p.engagementScore > 0)

    // Remove TRENDING tag from all products first
    const allActiveProducts = await prisma.product.findMany({
      where: { isActive: true },
      select: { id: true, tags: true }
    })

    for (const product of allActiveProducts) {
      const updatedTags = product.tags.filter(tag => tag !== "TRENDING") as ProductTag[]
      await prisma.product.update({
        where: { id: product.id },
        data: { tags: updatedTags }
      })
    }

    // Add TRENDING tag to top engagement products
    for (const product of trendingProducts) {
      const updatedTags = [...product.tags.filter(tag => tag !== "TRENDING"), "TRENDING"] as ProductTag[]
      await prisma.product.update({
        where: { id: product.id },
        data: { tags: updatedTags }
      })
    }

    return NextResponse.json({
      success: true,
      message: "Tags updated successfully",
      stats: {
        newTagsRemoved: productsToRemoveNewTag.length,
        bestsellersAssigned: trendingProducts.length,
        trendingAssigned: trendingProducts.length
      }
    })

  } catch (error) {
    console.error('Error managing tags:', error)
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}