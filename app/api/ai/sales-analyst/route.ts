// app/api/ai/sales-analyst/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getSalesMetrics } from "@/lib/ai/deterministic-analytics";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = Math.max(7, Math.min(90, parseInt(searchParams.get("days") || "30", 10)));

    const sales = await getSalesMetrics(user.id, days);

    // Formulate deterministic commentary
    let commentary = "";
    if (sales.hasSufficientData) {
      if (sales.revenueChangePercent >= 0) {
        commentary = `Revenue grew by ${sales.revenueChangePercent}% compared with the prior ${days}-day window. Average order value is currently GH₵${sales.averageOrderValue}. ${sales.topSellingProducts[0]?.name || "Your lead product"} generated the highest sales volume.`;
      } else {
        commentary = `Revenue declined by ${Math.abs(sales.revenueChangePercent)}% compared with the prior ${days}-day window. Consider launching a promotional campaign for underperforming pieces or following up with previous buyers.`;
      }
    } else {
      commentary = "Not enough historical sales data in this timeframe to generate comparative insights. As orders complete, trend analytics will populate automatically.";
    }

    return NextResponse.json({
      success: true,
      data: sales,
      commentary,
    });
  } catch (error) {
    console.error("Sales Analyst Error:", error);
    return NextResponse.json({ error: "Failed to fetch sales analytics" }, { status: 500 });
  }
}
