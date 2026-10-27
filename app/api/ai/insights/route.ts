// app/api/ai/insights/route.ts
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { 
  getBusinessContext, 
  getSalesMetrics, 
  getInventoryMetrics, 
  getOrderRiskMetrics, 
  getCustomerMetrics 
} from "@/lib/ai/deterministic-analytics";
import { generateBusinessInsights } from "@/lib/ai/insights-engine";
import { generateText } from "@/lib/ai/provider";

export async function GET() {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [context, sales, inventory, orderRisks, customers, insights] = await Promise.all([
      getBusinessContext(user.id),
      getSalesMetrics(user.id, 30),
      getInventoryMetrics(user.id),
      getOrderRiskMetrics(user.id),
      getCustomerMetrics(user.id),
      generateBusinessInsights(user.id),
    ]);

    const businessName = context?.businessName || "Designer";

    // Formulate a strictly grounded daily business brief
    let brief = "";
    if (sales.hasSufficientData) {
      const direction = sales.revenueChangePercent >= 0 ? "up" : "down";
      const changeStr = Math.abs(sales.revenueChangePercent);
      const topCat = sales.categoryBreakdown[0]?.name || "ready-to-wear";
      const overdue = orderRisks.filter((o) => o.isOverdue).length;

      brief = `Sales are ${direction} ${changeStr}% this month, with ${topCat} contributing the largest volume. `;
      if (overdue > 0) {
        brief += `However, ${overdue} order${overdue > 1 ? "s are" : " is"} currently overdue for delivery and require priority attention today.`;
      } else if (inventory.stockoutRiskCount > 0) {
        brief += `Your production turnaround is healthy, but ${inventory.stockoutRiskCount} product${inventory.stockoutRiskCount > 1 ? "s are" : " is"} at risk of running out of stock.`;
      } else {
        brief += `Your production timelines and inventory are both in healthy standing.`;
      }
    } else {
      brief = `Welcome to TrendiZip AI. Your business profile is active. Once you record your first sales transactions, this brief will highlight your revenue trends, top garments, and production deadlines.`;
    }

    return NextResponse.json({
      success: true,
      businessName,
      lastUpdated: new Date().toISOString(),
      summaryCards: {
        revenue: {
          current: sales.currentRevenue,
          previous: sales.previousRevenue,
          changePercent: sales.revenueChangePercent,
        },
        orders: {
          activeCount: orderRisks.length,
          overdueCount: orderRisks.filter((o) => o.isOverdue).length,
          atRiskCount: orderRisks.filter((o) => o.isAtRisk && !o.isOverdue).length,
        },
        customers: {
          totalCount: customers.length,
          vipCount: customers.filter((c) => c.segment === "VIP").length,
          inactiveCount: customers.filter((c) => c.segment === "INACTIVE").length,
        },
        inventory: {
          totalSkus: inventory.totalSkus,
          stockoutRiskCount: inventory.stockoutRiskCount,
          lowStockCount: inventory.lowStockCount,
        },
      },
      brief,
      insights,
    });
  } catch (error) {
    console.error("Failed to load business insights:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
