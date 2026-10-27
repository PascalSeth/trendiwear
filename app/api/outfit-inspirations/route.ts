//api/outfit-imspirations
import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { mapErrorToResponse } from '@/lib/api-utils'
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
                  currency: true,
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

    // If no DB inspirations exist for this event, fetch relevant model trend images from Unsplash
    if (eventId && outfits.length === 0) {
      const event = await prisma.event.findUnique({ where: { id: eventId } })
      if (event) {
        const query = `${event.name} Black fashion model style outfit`
        const accessKey = process.env.UNSPLASH_ACCESS_KEY
        if (accessKey) {
          try {
            const uRes = await fetch(
              `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&page=${page}&per_page=${limit}&orientation=portrait`,
              {
                headers: { Authorization: `Client-ID ${accessKey}` },
                next: { revalidate: 3600 },
              }
            )
            if (uRes.ok) {
              const uData = await uRes.json()
              const unsplashOutfits = uData.results.map((photo: { id: string; description?: string; alt_description?: string; urls: { regular: string }; links: { download_location: string }; likes?: number; user?: { name: string } }) => ({
                id: `unsplash_${photo.id}`,
                eventId: event.id,
                title: photo.description || photo.alt_description || `${event.name} Concept`,
                description: photo.description || photo.alt_description || `Popular look for ${event.name}`,
                outfitImageUrl: photo.urls.regular,
                downloadLocation: photo.links.download_location,
                totalPrice: null,
                tags: [event.name, 'Editorial', 'Inspiration'],
                likes: photo.likes || 12,
                stylist: {
                  firstName: `Photo by ${photo.user?.name || 'Photographer'}`,
                  lastName: `on Unsplash`,
                  professionalProfile: {
                    businessName: `Photo by ${photo.user?.name || 'Photographer'} on Unsplash`,
                  },
                },
                products: [],
                _count: { savedByUsers: photo.likes || 0 },
              }))

              return NextResponse.json({
                outfits: unsplashOutfits,
                pagination: { page, limit, total: uData.total || unsplashOutfits.length, pages: Math.ceil((uData.total || unsplashOutfits.length) / limit) },
              })
            }
          } catch (err) {
            console.error('[Outfit Inspirations Unsplash Fallback Error]', err)
          }
        }
      }
    }

    return NextResponse.json({
      outfits,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    const { status, message } = mapErrorToResponse(error, { route: 'outfit-inspirations.GET' })
    if (status === 401) return NextResponse.json({ error: message, toast: 'You must be logged in to continue.' }, { status })
    return NextResponse.json({ error: message }, { status })
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
    const { status, message } = mapErrorToResponse(error, { route: 'outfit-inspirations.POST' })
    if (status === 401) return NextResponse.json({ error: message, toast: 'You must be logged in to continue.' }, { status })
    return NextResponse.json({ error: message }, { status })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth();
    const allowedRoles = ["PROFESSIONAL", "ADMIN", "SUPER_ADMIN"];
    
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { error: "Only professionals, admins, or super admins can delete outfit inspirations" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const body = await request.json().catch(() => ({}));
    const idsParam = searchParams.get("ids") || searchParams.get("id");
    const ids: string[] = body.ids || (idsParam ? idsParam.split(",").map(i => i.trim()).filter(Boolean) : []);

    if (ids.length === 0) {
      return NextResponse.json({ error: "No inspiration IDs specified for deletion" }, { status: 400 });
    }

    const where: Prisma.OutfitInspirationWhereInput = {
      id: { in: ids }
    };

    if (user.role === "PROFESSIONAL") {
      where.stylistId = user.id;
    }

    const deleted = await prisma.outfitInspiration.deleteMany({ where });

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${deleted.count} outfit inspirations`,
      countDeleted: deleted.count,
    });
  } catch (error) {
    const { status, message } = mapErrorToResponse(error, { route: 'outfit-inspirations.DELETE' });
    return NextResponse.json({ error: message }, { status });
  }
}