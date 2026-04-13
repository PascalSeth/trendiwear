import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { mapErrorToResponse } from '@/lib/api-utils'
import { createSlug } from "@/lib/utils"
import { AnalyticsTracker } from "@/lib/analytics"
import { suggestTags } from "@/lib/fashion-engine"
import type { Prisma, ProductTag } from "@prisma/client"

// Helper function to calculate effective price with discount
function calculateEffectivePrice(product: {
  price: number
  discountPercentage?: number | null
  discountPrice?: number | null
  discountStartDate?: Date | null
  discountEndDate?: Date | null
  isOnSale?: boolean
}): { effectivePrice: number; isDiscountActive: boolean; discountAmount: number } {
  const now = new Date()
  
  // Check if discount is currently active
  const isWithinDateRange = 
    (!product.discountStartDate || new Date(product.discountStartDate) <= now) &&
    (!product.discountEndDate || new Date(product.discountEndDate) >= now)
  
  const hasDiscount = product.discountPercentage || product.discountPrice
  const isDiscountActive = Boolean(product.isOnSale && hasDiscount && isWithinDateRange)
  
  if (!isDiscountActive) {
    return { effectivePrice: product.price, isDiscountActive: false, discountAmount: 0 }
  }
  
  // Calculate effective price
  let effectivePrice = product.price
  
  if (product.discountPrice && product.discountPrice > 0) {
    // Fixed discount price takes priority
    effectivePrice = product.discountPrice
  } else if (product.discountPercentage && product.discountPercentage > 0) {
    // Calculate percentage discount
    effectivePrice = product.price * (1 - product.discountPercentage / 100)
  }
  
  const discountAmount = product.price - effectivePrice
  
  return { 
    effectivePrice: Math.round(effectivePrice * 100) / 100, // Round to 2 decimal places
    isDiscountActive, 
    discountAmount: Math.round(discountAmount * 100) / 100 
  }
}

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

    if (categoryId) {
      // Get all child ID's recursively for the selected category
      const getAllChildIds = async (parentId: string): Promise<string[]> => {
        const children = await prisma.category.findMany({
          where: { parentId, isActive: true },
          select: { id: true },
        });
        const childIds = children.map(c => c.id);
        const nestedIds = await Promise.all(childIds.map(id => getAllChildIds(id)));
        return [...childIds, ...nestedIds.flat()];
      };

      const childIds = await getAllChildIds(categoryId);
      const allTargetCategoryIds = [categoryId, ...childIds];

      // Update filtering to find products associated with ANY of these categories
      where.OR = [
        { categoryId: { in: allTargetCategoryIds } },
        { categories: { some: { id: { in: allTargetCategoryIds } } } }
      ]
    }
    if (collectionId) where.collections = { some: { id: collectionId } }
    if (professionalId) where.professionalId = professionalId

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

    // For public requests, exclude products whose professional has not completed
    // payment setup (no MoMo number / subaccount). Dashboard/admin requests
    // should still be able to see their products — the `dashboard` flag above
    // controls that behavior.
    const publicFilter = dashboard ? {} : { professional: { professionalProfile: { momoNumber: { not: null } } } }

    const effectiveWhere = { ...where, ...publicFilter }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: effectiveWhere,
        include: {
          categories: true,
          collections: true,
          professional: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              role: true,
              professionalProfile: {
                select: {
                  businessName: true,
                  businessImage: true,
                  rating: true,
                  totalReviews: true,
                  isVerified: true,
                  momoNumber: true,
                  slug: true,
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
      prisma.product.count({ where: effectiveWhere }),
    ])

    // OPTIMIZATION: Batch fetch reviews for all products in ONE query instead of per-product waterfalls
    const productIds = products.map(p => p.id)
    const allReviews = await prisma.review.findMany({
      where: {
        targetId: { in: productIds },
        targetType: "PRODUCT",
      },
      select: { targetId: true, rating: true },
    })

    // Group reviews by product ID for constant-time lookup
    const reviewMap = allReviews.reduce((acc, rev) => {
      if (!acc[rev.targetId]) acc[rev.targetId] = { count: 0, sum: 0 }
      acc[rev.targetId].count++
      acc[rev.targetId].sum += rev.rating
      return acc
    }, {} as Record<string, { count: number; sum: number }>)

    const productsWithReviewCounts = products.map((product) => {
      const stats = reviewMap[product.id] || { count: 0, sum: 0 }
      const reviewCount = stats.count
      const avgRating = reviewCount > 0 ? stats.sum / reviewCount : 0

      // Calculate effective price with discount
      const { effectivePrice, isDiscountActive, discountAmount } = calculateEffectivePrice(product)

      // For SUPER_ADMIN created products, show TrendiZip as the business
      const professional = product.professional.role === 'SUPER_ADMIN'
        ? {
            ...product.professional,
            professionalProfile: {
              businessName: 'TrendiZip',
              businessImage: '/logo3d.jpg',
              rating: 5,
              totalReviews: 0,
              isVerified: true,
            },
          }
        : product.professional

      return {
        ...product,
        professional,
        avgRating,
        effectivePrice,
        isDiscountActive,
        discountAmount,
        _count: {
          ...product._count,
          reviews: reviewCount,
        },
      }
    })

    // Track search analytics if search was performed
    if (search && !dashboard) {
      try {
        // Get user ID if authenticated
        let userId = null;
        try {
          const user = await requireAuth();
          userId = user.id;
        } catch {
          // User not authenticated, track as anonymous
        }

        // Background tracking (SPEED UP)
        AnalyticsTracker.trackSearch(
          userId,
          search,
          categoryId || undefined,
          productsWithReviewCounts.length,
          undefined, // sessionId
          request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
          request.headers.get('user-agent') || undefined
        ).catch(e => console.error('Search tracking failed:', e))
      } catch (error) {
        console.error('Error tracking search analytics:', error);
        // Don't fail the request if analytics tracking fails
      }
    }

    return NextResponse.json({
      products: productsWithReviewCounts,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    const { status, message } = mapErrorToResponse(error, { route: 'products.GET' })
    if (status === 401) return NextResponse.json({ error: message, toast: 'You must be logged in to continue.' }, { status })
    return NextResponse.json({ error: message }, { status })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    // Allow both professionals and super admins to create products
    if (user.role !== "PROFESSIONAL" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Only professionals and admins can create products" }, { status: 403 })
    }

    // Check subscription permission for professionals
    if (user.role === "PROFESSIONAL") {
      try {
        const profile = await prisma.professionalProfile.findUnique({
          where: { userId: user.id },
          include: { 
            subscription: { include: { tier: true } },
            trial: true
          }
        });

        if (!profile) {
          return NextResponse.json(
            { error: "Professional profile not found." },
            { status: 404 }
          );
        }

        const now = new Date();

        // Enforce Verified Tier for Pre-orders
        if (body.isPreorder) {
          // Re-fetch profile to guarantee we didn't miss it or its verification status
          if (!profile.isVerified) {
             return NextResponse.json(
                { error: "Only Verified Professionals can accept Pre-orders." },
                { status: 403 }
             );
          }
        }

        // Check if trial is active OR subscription is active
        const hasActiveTrial = profile.trial && now < profile.trial.endDate;
        const hasActiveSubscription = profile.subscription && 
          profile.subscription.status === "ACTIVE" && 
          profile.subscription.nextRenewalDate && 
          profile.subscription.nextRenewalDate > now;

        if (!hasActiveTrial && !hasActiveSubscription) {
          return NextResponse.json(
            { error: "Subscription expired. Please renew your subscription to add products." },
            { status: 403 }
          );
        }

        // Check product limits
        const productCount = await prisma.product.count({
          where: { professionalId: user.id }
        });

        // 1. Enforce Trial Limit (8 Products)
        if (hasActiveTrial && !hasActiveSubscription) {
          if (productCount >= 8) {
            return NextResponse.json(
              {
                error: "Trial limit reached (8 products). Please upgrade to a paid plan to list more items.",
                limitReached: true
              },
              { status: 403 }
            );
          }
        }

        // 2. Enforce Subscription Tier Limit
        if (hasActiveSubscription && profile.subscription?.tier?.monthlyListings) {
          if (productCount >= profile.subscription.tier.monthlyListings) {
            return NextResponse.json(
              {
                error: `You've reached the product limit (${profile.subscription.tier.monthlyListings}) for your tier. Please upgrade your subscription.`,
                limitReached: true
              },
              { status: 403 }
            );
          }
        }
      } catch (error) {
        console.error("Subscription check error:", error);
        // Continue anyway to avoid blocking legitimate cases
      }
    } else if (user.role === "SUPER_ADMIN") {
      // Check if super admin requires subscription
      try {
        const requireSubscriptionSetting = await prisma.systemSetting.findUnique({
          where: { key: 'superAdminRequireSubscription' }
        });

        if (requireSubscriptionSetting?.value === 'true') {
          // Super admin doesn't need subscription - skip checks
          // They have full access
        }
      } catch (error) {
        console.error("Super admin setting check error:", error);
      }
    }

    const {
      name,
      description,
      price,
      stockQuantity,
      images,
      videoUrl,
      categoryId,
      categoryIds, // Array of ID's
      collectionIds,
      sizes,
      colors,
      material,
      careInstructions,
      estimatedDelivery,
      isCustomizable,
      tags,
      isUnisex,
      submittedForShowcase,
      // Discount fields
      discountPercentage,
      discountPrice,
      discountStartDate,
      discountEndDate,
      isOnSale,
      allowPickup,
      allowDelivery,
      isPreorder,
      preorderLimit,
    } = body

    // 1. Run the "Free AI" Fashion Engine to suggest tags & styles
    const autoTags = suggestTags(name, description)

    const finalTags = ['NEW' as ProductTag, ...(tags || [])]
    const product = await prisma.product.create({
      data: {
        name,
        slug: createSlug(name),
        description,
        price: Number.parseFloat(price),
        stockQuantity: Number.parseInt(stockQuantity || '0'),
        images,
        videoUrl,
        categoryId: categoryId || (categoryIds && categoryIds[0]), // Legacy fallback
        categories: (categoryIds && categoryIds.length > 0) 
          ? { connect: categoryIds.map((id: string) => ({ id })) } 
          : (categoryId ? { connect: [{ id: categoryId }] } : undefined),
        collections: collectionIds && collectionIds.length > 0 ? { connect: collectionIds.map((id: string) => ({ id })) } : undefined,
        professionalId: user.id,
        sizes,
        colors,
        material,
        careInstructions,
        estimatedDelivery: estimatedDelivery ? Number.parseInt(estimatedDelivery) : null,
        isCustomizable: Boolean(isCustomizable),
        tags: finalTags,
        // Auto-discovered styles and keywords
        styleTags: autoTags.styles,
        keywords: autoTags.keywords,
        isUnisex: Boolean(isUnisex),
        submittedForShowcase: Boolean(submittedForShowcase),
        submittedAt: submittedForShowcase ? new Date() : null,
        // Discount fields
        discountPercentage: discountPercentage ? Number.parseFloat(discountPercentage) : null,
        discountPrice: discountPrice ? Number.parseFloat(discountPrice) : null,
        discountStartDate: discountStartDate ? new Date(discountStartDate) : null,
        discountEndDate: discountEndDate ? new Date(discountEndDate) : null,
        isOnSale: Boolean(isOnSale),
        allowPickup: allowPickup !== undefined ? Boolean(allowPickup) : true,
        allowDelivery: allowDelivery !== undefined ? Boolean(allowDelivery) : true,
        isPreorder: Boolean(isPreorder),
        preorderLimit: preorderLimit ? Number.parseInt(preorderLimit) : 0,
        discountType: body.discountType,
      },
      include: {
        categories: true,
        collections: true,
        professional: {
          select: {
            firstName: true,
            lastName: true,
            role: true,
            professionalProfile: {
              select: { businessName: true, businessImage: true },
            },
          },
        },
      },
    })

    // For SUPER_ADMIN, override business info to show TrendiZip
    const responseProduct = {
      ...product,
      professional: {
        ...product.professional,
        professionalProfile: user.role === 'SUPER_ADMIN' 
          ? { businessName: 'TrendiZip', businessImage: '/logo3d.jpg', isVerified: true }
          : product.professional.professionalProfile,
      },
    }

    return NextResponse.json(responseProduct, { status: 201 })
  } catch (error) {
    const { status, message } = mapErrorToResponse(error, { route: 'products.POST' })
    if (status === 401) return NextResponse.json({ error: message, toast: 'You must be logged in to continue.' }, { status })
    return NextResponse.json({ error: message }, { status })
  }
}
