// app/api/ai/inventory-advisor/route.ts
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getInventoryMetrics } from "@/lib/ai/deterministic-analytics";

export async function GET() {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const inventory = await getInventoryMetrics(user.id);

    return NextResponse.json({
      success: true,
      data: inventory,
    });
  } catch (error) {
    console.error("Inventory Advisor Error:", error);
    return NextResponse.json({ error: "Failed to fetch inventory metrics" }, { status: 500 });
  }
}
