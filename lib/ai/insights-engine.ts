// lib/ai/insights-engine.ts
import { 
  getSalesMetrics, 
  getInventoryMetrics, 
  getOrderRiskMetrics, 
  getCustomerMetrics 
} from "./deterministic-analytics";
import type { AIInsight } from "./types";

/**
 * Scans verified business data to generate grounded, explainable insights with direct actions.
 */
export async function generateBusinessInsights(userId: string): Promise<AIInsight[]> {
  const [sales, inventory, orderRisks, customers] = await Promise.all([
    getSalesMetrics(userId, 30),
    getInventoryMetrics(userId),
    getOrderRiskMetrics(userId),
    getCustomerMetrics(userId),
  ]);

  const insights: AIInsight[] = [];

  // 1. Order Delay Risks (CRITICAL / WARNING)
  const overdueOrders = orderRisks.filter((o) => o.isOverdue);
  const atRiskOrders = orderRisks.filter((o) => o.isAtRisk && !o.isOverdue);

  if (overdueOrders.length > 0) {
    insights.push({
      id: "order-overdue-alert",
      type: "ORDER_RISK",
      severity: "CRITICAL",
      title: `${overdueOrders.length} order${overdueOrders.length > 1 ? "s" : ""} past delivery deadline`,
      explanation: `Orders for ${overdueOrders.map((o) => o.customerName).slice(0, 2).join(", ")}${overdueOrders.length > 2 ? ` and ${overdueOrders.length - 2} more` : ""} have exceeded their estimated delivery turnaround. Immediate customer update recommended.`,
      supportingMetrics: {
        overdueCount: overdueOrders.length,
        longestDelayDays: Math.max(...overdueOrders.map((o) => o.daysInProduction - o.estimatedDeliveryDays)),
      },
      confidence: "HIGH",
      confidenceReason: "Calculated directly from order creation dates and production targets.",
      recommendedAction: "Review orders, contact customers, and prioritize cutting/sewing queue.",
      actionHref: "/dashboard/orders",
      actionLabel: "View Overdue Orders",
    });
  } else if (atRiskOrders.length > 0) {
    insights.push({
      id: "order-at-risk-alert",
      type: "ORDER_RISK",
      severity: "WARNING",
      title: `${atRiskOrders.length} order${atRiskOrders.length > 1 ? "s" : ""} nearing delivery deadline`,
      explanation: `${atRiskOrders.length} active order${atRiskOrders.length > 1 ? "s are" : " is"} past 70% of estimated production duration but not yet marked ready for dispatch.`,
      supportingMetrics: {
        atRiskCount: atRiskOrders.length,
      },
      confidence: "HIGH",
      confidenceReason: "Production duration monitored against target turnaround.",
      recommendedAction: "Verify completion status with tailors or advance to final pressing.",
      actionHref: "/dashboard/orders",
      actionLabel: "Check Production Board",
    });
  }

  // 2. Inventory Stockout Alerts (CRITICAL / WARNING)
  const criticalStock = inventory.items.filter((i) => i.riskLevel === "CRITICAL");
  if (criticalStock.length > 0) {
    const topCritical = criticalStock[0];
    insights.push({
      id: "inventory-critical-stockout",
      type: "INVENTORY",
      severity: "CRITICAL",
      title: `Stockout Risk: ${topCritical.name}`,
      explanation: `${topCritical.name} has only ${topCritical.currentStock} units remaining with a velocity of ${topCritical.dailyVelocity} units/day. Estimated ${topCritical.estimatedDaysRemaining !== null ? topCritical.estimatedDaysRemaining : "<3"} days of stock left.`,
      supportingMetrics: {
        unitsRemaining: topCritical.currentStock,
        dailyVelocity: topCritical.dailyVelocity,
        suggestedRestock: topCritical.recommendedRestockUnits,
      },
      confidence: "HIGH",
      confidenceReason: "Calculated from 30-day verified sales run rate and current inventory.",
      recommendedAction: `Source fabric and queue ${topCritical.recommendedRestockUnits} units for restock.`,
      actionHref: "/dashboard/ai/inventory",
      actionLabel: "Review Inventory Advisor",
    });
  }

  // 3. Sales Momentum & Growth (OPPORTUNITY / WARNING)
  if (sales.hasSufficientData) {
    if (sales.revenueChangePercent > 15) {
      insights.push({
        id: "sales-positive-momentum",
        type: "SALES",
        severity: "OPPORTUNITY",
        title: `Sales up ${sales.revenueChangePercent}% vs prior period`,
        explanation: `Gross revenue reached GH₵${sales.currentRevenue.toLocaleString()} over the last 30 days (up from GH₵${sales.previousRevenue.toLocaleString()}). AOV is currently GH₵${sales.averageOrderValue}.`,
        supportingMetrics: {
          currentRevenue: `GH₵${sales.currentRevenue.toLocaleString()}`,
          orderCount: sales.currentOrderCount,
          averageOrderValue: `GH₵${sales.averageOrderValue}`,
        },
        confidence: "HIGH",
        confidenceReason: "Calculated from completed Paystack order transactions.",
        recommendedAction: "Amplify current best-sellers with a dedicated social campaign.",
        actionHref: "/dashboard/ai/launch-planner",
        actionLabel: "Launch Campaign",
      });
    } else if (sales.revenueChangePercent < -15 && sales.previousRevenue > 0) {
      insights.push({
        id: "sales-dip-alert",
        type: "SALES",
        severity: "WARNING",
        title: `Sales down ${Math.abs(sales.revenueChangePercent)}% compared to last month`,
        explanation: `Revenue dropped from GH₵${sales.previousRevenue.toLocaleString()} to GH₵${sales.currentRevenue.toLocaleString()}. Consider re-engaging past customers or testing new creative formats.`,
        supportingMetrics: {
          currentRevenue: `GH₵${sales.currentRevenue.toLocaleString()}`,
          previousRevenue: `GH₵${sales.previousRevenue.toLocaleString()}`,
        },
        confidence: "HIGH",
        confidenceReason: "Comparison between current 30-day and prior 30-day completed order volumes.",
        recommendedAction: "Send tailored re-engagement offers to inactive VIP clients.",
        actionHref: "/dashboard/customers",
        actionLabel: "View Customers",
      });
    }
  } else {
    // New seller empty-data onboarding insight
    insights.push({
      id: "sales-new-business",
      type: "SALES",
      severity: "INFO",
      title: "Building your sales history",
      explanation: "TrendiZip AI needs verified completed orders to forecast sales trends. Add products and share your storefront link to initiate analytics.",
      confidence: "LOW",
      confidenceReason: "Awaiting first 5 completed transactions for statistical significance.",
      recommendedAction: "Ensure your catalogue is published and promote on WhatsApp.",
      actionHref: "/dashboard/catalogue",
      actionLabel: "Manage Catalogue",
    });
  }

  // 4. Customer Retention & VIP Inactivity (OPPORTUNITY)
  const inactiveVips = customers.filter((c) => c.segment === "VIP" && c.daysSinceLastOrder > 60);
  if (inactiveVips.length > 0) {
    const topVip = inactiveVips[0];
    insights.push({
      id: "customer-vip-reactivation",
      type: "CUSTOMER",
      severity: "OPPORTUNITY",
      title: `VIP Client Follow-up: ${topVip.name}`,
      explanation: `${topVip.name} has spent GH₵${topVip.totalSpent.toLocaleString()} across ${topVip.orderCount} orders, but hasn't ordered in ${topVip.daysSinceLastOrder} days.`,
      supportingMetrics: {
        clientTotalSpent: `GH₵${topVip.totalSpent.toLocaleString()}`,
        daysInactive: topVip.daysSinceLastOrder,
      },
      confidence: "HIGH",
      confidenceReason: "Derived from client purchase history and last transaction date.",
      recommendedAction: "Send a personalized preview of your upcoming collection.",
      actionHref: "/dashboard/customers",
      actionLabel: "Draft Follow-Up",
    });
  }

  return insights;
}
