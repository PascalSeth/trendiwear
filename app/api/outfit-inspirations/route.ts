//api/outfit-imspirations
import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import type { Prisma } from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "12")
    const eventId = searchParams.get("eventId")
    const stylistId = searchParams.get("stylistId")
    const featured = searchParams.get("featured") === "true"
    const search = searchParams.get("search")

    const where: Prisma.OutfitInspirationWhereInput = { isActive: true }
    if (eventId) where.eventId = eventId
    if (stylistId) where.stylistId = stylistId
    if (featured) where.isFeatured = true

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { tags: { hasSome: [search] } },
      ]
    }

    const [outfits, total] = await Promise.all([
      prisma.outfitInspiration.findMany({
        where,
        include: {
          event: true,
          stylist: {
            select: {
              firstName: true,
              lastName: true,
              professionalProfile: {
                select: { businessName: true },
              },
            },
          },
          products: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  images: true,
                },
              },
            },
          },
          _count: {
            select: { savedByUsers: true },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ isFeatured: "desc" }, { likes: "desc" }, { createdAt: "desc" }],
      }),
      prisma.outfitInspiration.count({ where }),
    ])

    return NextResponse.json({
      outfits,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const allowedRoles = ["PROFESSIONAL", "ADMIN", "SUPER_ADMIN"];
    
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { error: "Only professionals, admins, or super admins can create outfit inspirations" },
        { status: 403 }
      );
    }

    const {
      eventId,
      title,
      description,
      outfitImageUrl,
      totalPrice,
      tags,
      products,
    }: {
      eventId: string;
      title: string;
      description?: string;
      outfitImageUrl: string;
      totalPrice?: number;
      tags?: string[];
      products?: { productId: string; position?: number; notes?: string }[];
    } = await request.json();

    const outfit = await prisma.outfitInspiration.create({
      data: {
        eventId,
        stylistId: user.id,
        title,
        description,
        outfitImageUrl,
        totalPrice,
        tags: tags || [],
        products: {
          create: products || [],
        },
      },
      include: {
        event: true,
        stylist: {
          select: {
            firstName: true,
            lastName: true,
            professionalProfile: {
              select: { businessName: true },
            },
          },
        },
        products: {
          include: {
            product: true,
          },
        },
      },
    });

    return NextResponse.json(outfit, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}