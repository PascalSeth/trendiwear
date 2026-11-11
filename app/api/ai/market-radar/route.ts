// app/api/ai/market-radar/route.ts
/**
 * Market Radar Dedicated API Endpoint
 * 
 * Supports GET and POST with:
 * - city, region, country
 * - category (all, womenswear, menswear, tshirts, occasionwear, streetwear, childrenswear)
 * - viewMode (sell-now, prepare-next, explore-month)
 * - month (1-12) & year
 * - customerSegment, priceBand
 * - customQuestion
 * - bypassCache
 */

import { type NextRequest, NextResponse } from "next/server";
import { executeMarketRadar } from "@/lib/ai/market-radar/engine";
import { MarketRadarRequestParams } from "@/lib/ai/market-radar/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const params: MarketRadarRequestParams = {
      city: searchParams.get("city") || undefined,
      region: searchParams.get("region") || undefined,
      country: searchParams.get("country") || undefined,
      category: searchParams.get("category") || undefined,
      viewMode: (searchParams.get("viewMode") as any) || undefined,
      month: searchParams.get("month") ? Number(searchParams.get("month")) : undefined,
      year: searchParams.get("year") ? Number(searchParams.get("year")) : undefined,
      customerSegment: (searchParams.get("customerSegment") as any) || undefined,
      priceBand: (searchParams.get("priceBand") as any) || undefined,
      customQuestion: searchParams.get("customQuestion") || undefined,
    };

    const bypassCache = searchParams.get("bypassCache") === "true";
    const result = await executeMarketRadar(params, bypassCache);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[Market Radar API GET Error]:", error);
    return NextResponse.json(
      { error: "Failed to generate market radar intelligence", message: error?.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const bypassCache = Boolean(body.bypassCache);

    const params: MarketRadarRequestParams = {
      city: body.city || body.cityLocation,
      region: body.region,
      country: body.country,
      category: body.category,
      viewMode: body.viewMode,
      month: body.month ? Number(body.month) : undefined,
      year: body.year ? Number(body.year) : undefined,
      customerSegment: body.customerSegment,
      priceBand: body.priceBand,
      customQuestion: body.customQuestion || body.query,
      attachedFileBase64: body.attachedFileBase64,
      attachedFileName: body.attachedFileName,
    };

    const result = await executeMarketRadar(params, bypassCache);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[Market Radar API POST Error]:", error);
    return NextResponse.json(
      { error: "Failed to execute market radar", message: error?.message },
      { status: 500 }
    );
  }
}

