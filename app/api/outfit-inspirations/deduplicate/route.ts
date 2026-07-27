import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const allowedRoles = ["ADMIN", "SUPER_ADMIN"];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { error: "Only super admins or admins can deduplicate inspirations" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");

    const whereClause: { eventId?: string } = {};
    if (eventId && eventId !== "all") {
      whereClause.eventId = eventId;
    }

    const outfits = await prisma.outfitInspiration.findMany({
      where: whereClause,
      select: { id: true, eventId: true, title: true, outfitImageUrl: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const duplicateIdsToDelete: string[] = [];
    const seenImageUrls = new Map<string, string>(); // Base Image URL -> First Outfit ID

    for (const outfit of outfits) {
      // Extract base image URL (strip query params, &v=..., quality settings)
      const baseUrl = outfit.outfitImageUrl.split('?')[0].split('&v=')[0].trim();
      const baseTitle = outfit.title.replace(/\s*#\d+$/i, '').trim().toLowerCase();

      // Check both URL and base title globally across events
      const isDuplicateUrl = seenImageUrls.has(baseUrl);
      const isDuplicateTitle = seenImageUrls.has(baseTitle);

      if (isDuplicateUrl || isDuplicateTitle) {
        duplicateIdsToDelete.push(outfit.id);
      } else {
        seenImageUrls.set(baseUrl, outfit.id);
        if (baseTitle) seenImageUrls.set(baseTitle, outfit.id);
      }
    }

    if (duplicateIdsToDelete.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No duplicate outfit inspirations found across database events!",
        countDeleted: 0,
      });
    }

    const deleted = await prisma.outfitInspiration.deleteMany({
      where: {
        id: { in: duplicateIdsToDelete },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully cleaned up and deleted ${deleted.count} duplicate outfit inspiration records across all database events.`,
      countDeleted: deleted.count,
    });
  } catch (error: unknown) {
    console.error("[Outfit Deduplication Error]", error);
    const errObj = error as { message?: string };
    return NextResponse.json(
      { error: errObj?.message || "Failed to deduplicate outfit inspirations" },
      { status: 500 }
    );
  }
}
