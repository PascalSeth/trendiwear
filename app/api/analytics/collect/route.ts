// app/api/analytics/collect/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserAction, MovementTarget } from "@prisma/client";
import { getAuthSession } from "@/lib/auth";

interface IncomingEvent {
  type: string;
  productId?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  timestamp?: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || !Array.isArray(body.events) || body.events.length === 0) {
      return NextResponse.json({ success: true, count: 0 });
    }

    const sessionId: string | undefined = body.sessionId;
    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";
    const referrer = req.headers.get("referer") || undefined;

    // Optional user authentication
    let userId: string | null = null;
    try {
      const session = await getAuthSession();
      if (session?.user && "id" in session.user) {
        userId = (session.user as { id: string }).id;
      }
    } catch {
      // Guest shopper tracking
    }

    const events: IncomingEvent[] = body.events;

    // Map each telemetry event to UserMovement action & target
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const movementRecords: any[] = [];
    const productViewIncrements = new Set<string>();
    const productCartIncrements = new Set<string>();

    for (const evt of events) {
      const targetId = evt.productId || evt.targetId || "market-session";
      let action: UserAction = UserAction.VIEW_PRODUCT;
      let targetType: MovementTarget = MovementTarget.PRODUCT;

      const meta: Record<string, unknown> = {
        ...(evt.metadata || {}),
        eventType: evt.type,
        clientTimestamp: evt.timestamp,
      };

      switch (evt.type) {
        case "IMPRESSION":
          action = UserAction.VIEW_PRODUCT;
          targetType = MovementTarget.PRODUCT;
          if (evt.productId) productViewIncrements.add(evt.productId);
          break;

        case "DWELL":
          action = UserAction.VIEW_PRODUCT;
          targetType = MovementTarget.PRODUCT;
          meta.isDwell = true;
          break;

        case "SIZE_GUIDE_OPENED":
          action = UserAction.VIEW_PRODUCT;
          targetType = MovementTarget.PRODUCT;
          meta.isSizeGuideOpened = true;
          break;

        case "BESPOKE_TOGGLED":
          action = UserAction.VIEW_PRODUCT;
          targetType = MovementTarget.PRODUCT;
          meta.isBespokeToggled = true;
          break;

        case "GALLERY_SWIPE":
          action = UserAction.VIEW_PRODUCT;
          targetType = MovementTarget.PRODUCT;
          meta.isGallerySwipe = true;
          break;

        case "ADD_TO_CART":
          action = UserAction.ADD_TO_CART;
          targetType = MovementTarget.PRODUCT;
          if (evt.productId) productCartIncrements.add(evt.productId);
          break;

        case "CHECKOUT_DROP":
          action = UserAction.PURCHASE;
          targetType = MovementTarget.CART;
          meta.isCheckoutDrop = true;
          break;

        default:
          action = UserAction.VIEW_PRODUCT;
          targetType = MovementTarget.PRODUCT;
      }

      movementRecords.push({
        userId,
        action,
        targetType,
        targetId,
        referrer,
        sessionId,
        ipAddress,
        userAgent,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        metadata: meta as any,
      });
    }

    // Persist movements batch to database
    if (movementRecords.length > 0) {
      await prisma.userMovement.createMany({
        data: movementRecords,
        skipDuplicates: true,
      });
    }

    // Atomically increment product analytics counters asynchronously
    for (const pId of productViewIncrements) {
      prisma.productAnalytics.upsert({
        where: { productId: pId },
        create: { productId: pId, totalViews: 1 },
        update: { totalViews: { increment: 1 } },
      }).catch(() => {});
    }

    for (const pId of productCartIncrements) {
      prisma.productAnalytics.upsert({
        where: { productId: pId },
        create: { productId: pId, totalCartAdds: 1 },
        update: { totalCartAdds: { increment: 1 } },
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, count: movementRecords.length });
  } catch (err) {
    console.error("Telemetry collection error:", err);
    return NextResponse.json({ success: false, error: "Ingestion failed" }, { status: 500 });
  }
}
