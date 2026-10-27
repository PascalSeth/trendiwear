// app/api/ai/copilot/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { 
  getBusinessContext, 
  getSalesMetrics, 
  getInventoryMetrics, 
  getOrderRiskMetrics, 
  getCustomerMetrics 
} from "@/lib/ai/deterministic-analytics";
import { generateText } from "@/lib/ai/provider";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const question = String(body.question || "").trim();

    if (!question) {
      return NextResponse.json({ error: "Question is required" }, { status: 400 });
    }

    const qLower = question.toLowerCase();

    // 1. Identify Intent & Retrieve Verified Database Telemetry
    let intent: "SALES" | "INVENTORY" | "ORDERS" | "CUSTOMERS" | "GENERAL" = "GENERAL";
    if (qLower.includes("sale") || qLower.includes("revenue") || qLower.includes("selling") || qLower.includes("money") || qLower.includes("earn")) {
      intent = "SALES";
    } else if (qLower.includes("stock") || qLower.includes("inventory") || qLower.includes("restock") || qLower.includes("velocity")) {
      intent = "INVENTORY";
    } else if (qLower.includes("order") || qLower.includes("late") || qLower.includes("delay") || qLower.includes("deadline") || qLower.includes("production")) {
      intent = "ORDERS";
    } else if (qLower.includes("customer") || qLower.includes("client") || qLower.includes("vip") || qLower.includes("follow up") || qLower.includes("repeat")) {
      intent = "CUSTOMERS";
    }

    const [context, sales, inventory, orders, customers] = await Promise.all([
      getBusinessContext(user.id),
      getSalesMetrics(user.id, 30),
      getInventoryMetrics(user.id),
      getOrderRiskMetrics(user.id),
      getCustomerMetrics(user.id),
    ]);

    let answer = "";
    let verifiedData: Record<string, unknown> = {};
    let reasoning = "";
    let recommendation = "";
    let suggestedAction = { label: "View Details", href: "/dashboard" };

    if (intent === "SALES") {
      verifiedData = {
        current30DayRevenue: `GH₵${sales.currentRevenue.toLocaleString()}`,
        previous30DayRevenue: `GH₵${sales.previousRevenue.toLocaleString()}`,
        revenueChangePercent: `${sales.revenueChangePercent >= 0 ? "+" : ""}${sales.revenueChangePercent}%`,
        averageOrderValue: `GH₵${sales.averageOrderValue}`,
        completedOrders: sales.currentOrderCount,
        topSellingProduct: sales.topSellingProducts[0]?.name || "No sales recorded yet",
      };

      if (!sales.hasSufficientData) {
        answer = "You haven't recorded enough completed sales in this period to show statistical shifts.";
        reasoning = "TrendiZip AI requires verified orders to analyze revenue trends.";
        recommendation = "Publish products to your storefront and share links to drive your first orders.";
        suggestedAction = { label: "Add Products", href: "/dashboard/catalogue" };
      } else if (sales.revenueChangePercent >= 0) {
        answer = `Your revenue is up ${sales.revenueChangePercent}% over the last 30 days, totaling GH₵${sales.currentRevenue.toLocaleString()}.`;
        reasoning = `Top performance was driven by ${sales.topSellingProducts[0]?.name || "your primary pieces"}, with an average order value of GH₵${sales.averageOrderValue}.`;
        recommendation = "Create a targeted social campaign for your top-performing pieces to maintain momentum.";
        suggestedAction = { label: "Launch Campaign", href: "/dashboard/ai/launch-planner" };
      } else {
        answer = `Revenue declined by ${Math.abs(sales.revenueChangePercent)}% compared to the previous 30 days.`;
        reasoning = `Revenue decreased from GH₵${sales.previousRevenue.toLocaleString()} to GH₵${sales.currentRevenue.toLocaleString()}.`;
        recommendation = "Engage your VIP and past customers with tailored occasion-wear offers.";
        suggestedAction = { label: "Review Customers", href: "/dashboard/customers" };
      }
    } else if (intent === "INVENTORY") {
      const atRisk = inventory.items.filter((i) => i.riskLevel === "CRITICAL" || i.riskLevel === "HIGH");
      verifiedData = {
        totalSkus: inventory.totalSkus,
        lowStockItems: inventory.lowStockCount,
        criticalStockouts: inventory.stockoutRiskCount,
        itemsNeedingRestock: atRisk.map((i) => `${i.name} (${i.currentStock} units left)`),
      };

      if (atRisk.length > 0) {
        answer = `${atRisk.length} product${atRisk.length > 1 ? "s" : ""} require immediate restock attention.`;
        reasoning = `${atRisk[0].name} has only ${atRisk[0].currentStock} units remaining based on current daily sales velocity.`;
        recommendation = `Restock ${atRisk[0].recommendedRestockUnits} units of ${atRisk[0].name} to prevent stockout.`;
        suggestedAction = { label: "Open Inventory Advisor", href: "/dashboard/ai/inventory" };
      } else {
        answer = "Your inventory levels are currently in a healthy state across all active products.";
        reasoning = "No SKUs currently show a risk of stocking out within the next 14 days.";
        recommendation = "Review slower-moving items or plan your next seasonal collection drop.";
        suggestedAction = { label: "View Catalogue", href: "/dashboard/catalogue" };
      }
    } else if (intent === "ORDERS") {
      const overdue = orders.filter((o) => o.isOverdue);
      const atRisk = orders.filter((o) => o.isAtRisk && !o.isOverdue);
      verifiedData = {
        activeOrders: orders.length,
        overdueOrders: overdue.length,
        atRiskOrders: atRisk.length,
      };

      if (overdue.length > 0) {
        answer = `You have ${overdue.length} order${overdue.length > 1 ? "s" : ""} past the estimated delivery turnaround.`;
        reasoning = `Orders for ${overdue.map((o) => o.customerName).slice(0, 2).join(", ")} exceed their turnaround window.`;
        recommendation = "Contact these customers immediately with an updated completion timeline.";
        suggestedAction = { label: "Prioritize Orders", href: "/dashboard/orders" };
      } else if (atRisk.length > 0) {
        answer = `${atRisk.length} order${atRisk.length > 1 ? "s are" : " is"} approaching the delivery deadline.`;
        reasoning = "These orders have consumed over 70% of their estimated production window.";
        recommendation = "Confirm final fitting and dispatch readiness.";
        suggestedAction = { label: "Check Orders", href: "/dashboard/orders" };
      } else {
        answer = `All ${orders.length} active order${orders.length !== 1 ? "s" : ""} are progressing on schedule.`;
        reasoning = "Current production timelines are well within estimated delivery windows.";
        recommendation = "Maintain your current sewing queue and prepare dispatch riders in advance.";
        suggestedAction = { label: "View Orders", href: "/dashboard/orders" };
      }
    } else if (intent === "CUSTOMERS") {
      const vips = customers.filter((c) => c.segment === "VIP");
      const inactive = customers.filter((c) => c.segment === "INACTIVE");
      verifiedData = {
        totalCustomers: customers.length,
        vipClients: vips.length,
        inactiveClients: inactive.length,
        topClient: customers[0]?.name || "None yet",
        topClientSpend: customers[0] ? `GH₵${customers[0].totalSpent.toLocaleString()}` : "GH₵0",
      };

      if (inactive.length > 0) {
        answer = `You have ${inactive.length} client${inactive.length > 1 ? "s" : ""} who haven't made a purchase in over 75 days.`;
        reasoning = "Client re-engagement is 5× more cost-effective than acquiring new customers.";
        recommendation = "Send a personal note or custom quote for the upcoming fashion season.";
        suggestedAction = { label: "Open CRM", href: "/dashboard/customers" };
      } else {
        answer = `You have ${customers.length} total customer profiles in your database.`;
        reasoning = `Your top customer is ${customers[0]?.name || "N/A"} with GH₵${customers[0]?.totalSpent.toLocaleString() || "0"} in lifetime spend.`;
        recommendation = "Continue delivering high quality tailoring and service to get more repeat orders.";
        suggestedAction = { label: "Manage Clients", href: "/dashboard/customers" };
      }
    } else {
      // General question: synthesize overall business standing
      answer = `Here is your current operational overview for ${context?.businessName || "your business"}.`;
      verifiedData = {
        revenue30Days: `GH₵${sales.currentRevenue.toLocaleString()}`,
        activeOrders: orders.length,
        totalSkus: inventory.totalSkus,
        registeredClients: customers.length,
      };
      reasoning = "Based on your verified real-time database records.";
      recommendation = orders.some((o) => o.isOverdue) 
        ? "Address overdue orders as your highest priority today."
        : "Check low-stock products or launch a campaign to drive new orders.";
      suggestedAction = { label: "Open AI Studio", href: "/dashboard/ai-studio" };
    }

    return NextResponse.json({
      success: true,
      question,
      intent,
      answer,
      verifiedData,
      reasoning,
      recommendation,
      suggestedAction,
    });
  } catch (error) {
    console.error("AI Copilot Error:", error);
    return NextResponse.json({ error: "Failed to process query" }, { status: 500 });
  }
}
