import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const allowedRoles = ["PROFESSIONAL", "ADMIN", "SUPER_ADMIN"];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { error: "Only professionals, admins, or super admins can bulk import outfit inspirations" },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { eventId, items } = body as {
      eventId: string;
      items: Array<{
        outfitImageUrl: string;
        title?: string;
        description?: string;
        tags?: string[];
        totalPrice?: number;
      }>;
    };

    if (!eventId) {
      return NextResponse.json({ error: "Target event ID is required" }, { status: 400 });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "At least one image item is required for bulk import" }, { status: 400 });
    }

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      return NextResponse.json({ error: "Target event category not found" }, { status: 404 });
    }

    const createdRecords = [];

    for (let index = 0; index < items.length; index++) {
      const item = items[index];
      if (!item.outfitImageUrl) continue;

      const title = item.title?.trim() || `${event.name} Lookbook #${index + 1}`;
      const description = item.description?.trim() || `Curated lookbook concept for ${event.name}`;
      const tags = item.tags && Array.isArray(item.tags) ? item.tags : [event.name];

      // Check if image URL already exists in DB
      const baseUrl = item.outfitImageUrl.split('?')[0].split('&v=')[0];
      const existing = await prisma.outfitInspiration.findFirst({
        where: {
          eventId,
          outfitImageUrl: { contains: baseUrl },
        },
      });

      if (!existing) {
        const record = await prisma.outfitInspiration.create({
          data: {
            eventId,
            stylistId: user.id,
            title: title.slice(0, 150),
            description,
            outfitImageUrl: item.outfitImageUrl,
            totalPrice: item.totalPrice || null,
            tags,
            likes: Math.floor(Math.random() * 40) + 10,
            isActive: true,
            isFeatured: index < 2,
          },
        });
        createdRecords.push(record);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${createdRecords.length} outfit inspirations into ${event.name}!`,
      countImported: createdRecords.length,
      records: createdRecords,
    });
  } catch (error: unknown) {
    console.error("[Bulk Import Error]", error);
    const errObj = error as { message?: string };
    return NextResponse.json(
      { error: errObj?.message || "Failed to bulk import outfit inspirations" },
      { status: 500 }
    );
  }
}
