// lib/ai/deterministic-analytics.ts
import { prisma } from "@/lib/prisma";
import type { 
  BusinessProfileContext, 
  SalesAnalyticsData, 
  InventoryAnalyticsData, 
  InventoryRiskItem, 
  OrderRiskItem, 
  CustomerSegmentItem, 
  PricingInput, 
  PricingResult 
} from "./types";

/**
 * 1. Resolves Verified Business Profile Context
 */
export async function getBusinessContext(userId: string): Promise<BusinessProfileContext | null> {
  const profile = await prisma.professionalProfile.findUnique({
    where: { userId },
    include: {
      specialization: true,
      store: true,
      user: {
        select: {
          name: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  if (!profile) return null;

  const [activeProductsCount, completedOrdersCount] = await Promise.all([
    prisma.product.count({
      where: { professionalId: userId, isDeleted: false, isActive: true },
    }),
    prisma.orderItem.count({
      where: { professionalId: userId, status: "DELIVERED" },
    }),
  ]);

  return {
    id: profile.id,
    businessName: profile.businessName || `${profile.user.firstName} ${profile.user.lastName}`,
    specialization: profile.specialization?.name || "Custom Tailoring & Design",
    location: profile.location || profile.store?.location || "Ghana",
    experienceYears: profile.experience || 1,
    rating: profile.rating || 5.0,
    totalReviews: profile.totalReviews || 0,
    activeProductsCount,
    completedOrdersCount,
  };
}

/**
 * 2. Deterministic Sales Analytics
 */
export async function getSalesMetrics(userId: string, periodDays: number = 30): Promise<SalesAnalyticsData> {
  const now = new Date();
  const currentStart = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);
  const previousStart = new Date(now.getTime() - periodDays * 2 * 24 * 60 * 60 * 1000);

  // Current period items
  const currentItems = await prisma.orderItem.findMany({
    where: {
      professionalId: userId,
      order: {
        createdAt: { gte: currentStart, lte: now },
      },
      status: { notIn: ["CANCELLED", "REFUNDED"] },
    },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          price: true,
          images: true,
          categories: { select: { name: true } },
        },
      },
    },
  });

  // Previous period items
  const previousItems = await prisma.orderItem.findMany({
    where: {
      professionalId: userId,
      order: {
        createdAt: { gte: previousStart, lt: currentStart },
      },
      status: { notIn: ["CANCELLED", "REFUNDED"] },
    },
  });

  const currentRevenue = currentItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const previousRevenue = previousItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const currentOrderIds = new Set(currentItems.map((i) => i.orderId));
  const previousOrderIds = new Set(previousItems.map((i) => i.orderId));

  const currentOrderCount = currentOrderIds.size;
  const previousOrderCount = previousOrderIds.size;

  const averageOrderValue = currentOrderCount > 0 ? Math.round(currentRevenue / currentOrderCount) : 0;

  let revenueChangePercent = 0;
  if (previousRevenue > 0) {
    revenueChangePercent = Math.round(((currentRevenue - previousRevenue) / previousRevenue) * 100);
  } else if (currentRevenue > 0) {
    revenueChangePercent = 100;
  }

  // Aggregate by product
  const productMap = new Map<string, { id: string; name: string; price: number; unitsSold: number; revenue: number; imageUrl?: string }>();
  const categoryMap = new Map<string, { unitsSold: number; revenue: number }>();

  for (const item of currentItems) {
    const pId = item.productId;
    const pName = item.product?.name || "Custom Item";
    const pPrice = item.price;
    const qty = item.quantity;
    const rev = pPrice * qty;

    // Product roll-up
    const existing = productMap.get(pId) || {
      id: pId,
      name: pName,
      price: pPrice,
      unitsSold: 0,
      revenue: 0,
      imageUrl: item.product?.images?.[0],
    };
    existing.unitsSold += qty;
    existing.revenue += rev;
    productMap.set(pId, existing);

    // Category roll-up
    const categories = item.product?.categories || [];
    const catName = categories.length > 0 ? categories[0].name : "Ready-to-Wear";
    const catExisting = categoryMap.get(catName) || { unitsSold: 0, revenue: 0 };
    catExisting.unitsSold += qty;
    catExisting.revenue += rev;
    categoryMap.set(catName, catExisting);
  }

  const topSellingProducts = Array.from(productMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const categoryBreakdown = Array.from(categoryMap.entries()).map(([name, data]) => ({
    name,
    unitsSold: data.unitsSold,
    revenue: data.revenue,
    sharePercent: currentRevenue > 0 ? Math.round((data.revenue / currentRevenue) * 100) : 0,
  }));

  return {
    periodDays,
    currentRevenue,
    previousRevenue,
    revenueChangePercent,
    currentOrderCount,
    previousOrderCount,
    averageOrderValue,
    topSellingProducts,
    decliningProducts: [], // empty unless comparative historical data is present
    categoryBreakdown,
    hasSufficientData: currentOrderCount > 0 || previousOrderCount > 0,
  };
}

/**
 * 3. Deterministic Inventory Velocity & Stockout Risk
 */
export async function getInventoryMetrics(userId: string): Promise<InventoryAnalyticsData> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Fetch all active products
  const products = await prisma.product.findMany({
    where: { professionalId: userId, isDeleted: false, isActive: true },
    select: {
      id: true,
      name: true,
      stockQuantity: true,
      images: true,
      price: true,
    },
  });

  // Fetch sales in the last 30 days for these products
  const recentSales = await prisma.orderItem.findMany({
    where: {
      professionalId: userId,
      order: { createdAt: { gte: thirtyDaysAgo } },
      status: { notIn: ["CANCELLED", "REFUNDED"] },
    },
    select: {
      productId: true,
      quantity: true,
    },
  });

  const salesMap = new Map<string, number>();
  for (const s of recentSales) {
    salesMap.set(s.productId, (salesMap.get(s.productId) || 0) + s.quantity);
  }

  let lowStockCount = 0;
  let stockoutRiskCount = 0;
  let slowMovingCount = 0;

  const items: InventoryRiskItem[] = products.map((p) => {
    const soldLast30Days = salesMap.get(p.id) || 0;
    const dailyVelocity = soldLast30Days / 30;
    const currentStock = p.stockQuantity;

    let estimatedDaysRemaining: number | null = null;
    let riskLevel: InventoryRiskItem["riskLevel"] = "HEALTHY";
    let recommendedRestockUnits = 0;

    if (dailyVelocity > 0) {
      estimatedDaysRemaining = Math.round(currentStock / dailyVelocity);
      if (estimatedDaysRemaining <= 5 || currentStock <= 2) {
        riskLevel = "CRITICAL";
        stockoutRiskCount++;
        recommendedRestockUnits = Math.ceil(dailyVelocity * 30) - currentStock;
      } else if (estimatedDaysRemaining <= 12) {
        riskLevel = "HIGH";
        lowStockCount++;
        recommendedRestockUnits = Math.ceil(dailyVelocity * 20);
      } else if (estimatedDaysRemaining <= 25) {
        riskLevel = "MODERATE";
      }
    } else {
      if (currentStock > 15) {
        riskLevel = "SLOW_MOVING";
        slowMovingCount++;
      } else if (currentStock <= 2) {
        riskLevel = "HIGH";
        lowStockCount++;
      }
    }

    return {
      id: p.id,
      name: p.name,
      currentStock,
      soldLast30Days,
      dailyVelocity: Number(dailyVelocity.toFixed(2)),
      estimatedDaysRemaining,
      riskLevel,
      recommendedRestockUnits: Math.max(0, recommendedRestockUnits),
      imageUrl: p.images?.[0],
    };
  });

  // Sort critical items first
  items.sort((a, b) => {
    const severityOrder = { CRITICAL: 0, HIGH: 1, MODERATE: 2, SLOW_MOVING: 3, HEALTHY: 4 };
    return severityOrder[a.riskLevel] - severityOrder[b.riskLevel];
  });

  return {
    totalSkus: products.length,
    lowStockCount,
    stockoutRiskCount,
    slowMovingCount,
    items,
  };
}

/**
 * 4. Deterministic Order Production Deadlines & Delay Risk
 */
export async function getOrderRiskMetrics(userId: string): Promise<OrderRiskItem[]> {
  const activeItems = await prisma.orderItem.findMany({
    where: {
      professionalId: userId,
      status: { in: ["CONFIRMED", "PROCESSING", "READY_FOR_DELIVERY"] },
    },
    include: {
      order: {
        select: {
          id: true,
          createdAt: true,
          customer: { select: { firstName: true, lastName: true } },
        },
      },
      product: {
        select: { name: true, estimatedDelivery: true },
      },
    },
    orderBy: { order: { createdAt: "asc" } },
  });

  const now = Date.now();

  return activeItems.map((item) => {
    const createdAtTime = new Date(item.order.createdAt).getTime();
    const daysInProduction = Math.max(1, Math.floor((now - createdAtTime) / (1000 * 60 * 60 * 24)));
    const estimatedDeliveryDays = item.estimatedDelivery || item.product?.estimatedDelivery || 7;

    const isOverdue = daysInProduction > estimatedDeliveryDays;
    const isAtRisk = !isOverdue && daysInProduction >= Math.floor(estimatedDeliveryDays * 0.7);

    let riskReason = "On schedule";
    if (isOverdue) {
      riskReason = `Overdue by ${daysInProduction - estimatedDeliveryDays} days beyond target turnaround (${estimatedDeliveryDays}d)`;
    } else if (isAtRisk) {
      riskReason = `At 70%+ of expected production window (${daysInProduction}/${estimatedDeliveryDays} days)`;
    }

    return {
      orderItemId: item.id,
      orderId: item.order.id,
      productName: item.product?.name || "Custom Tailored Garment",
      customerName: `${item.order.customer.firstName} ${item.order.customer.lastName}`,
      price: item.price * item.quantity,
      createdAt: item.order.createdAt.toISOString(),
      status: item.status,
      estimatedDeliveryDays,
      daysInProduction,
      isOverdue,
      isAtRisk: isAtRisk || isOverdue,
      riskReason,
    };
  });
}

/**
 * 5. Deterministic Customer CRM Segmentation
 */
export async function getCustomerMetrics(userId: string): Promise<CustomerSegmentItem[]> {
  const orderItems = await prisma.orderItem.findMany({
    where: {
      professionalId: userId,
      status: { notIn: ["CANCELLED", "REFUNDED"] },
    },
    include: {
      order: {
        select: {
          id: true,
          createdAt: true,
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      },
      product: {
        select: {
          categories: { select: { name: true } },
        },
      },
    },
  });

  const customerMap = new Map<string, {
    id: string;
    name: string;
    email: string;
    totalSpent: number;
    ordersSet: Set<string>;
    lastOrderDate: Date;
    categories: Set<string>;
  }>();

  for (const item of orderItems) {
    const c = item.order.customer;
    if (!c) continue;

    const existing = customerMap.get(c.id) || {
      id: c.id,
      name: `${c.firstName} ${c.lastName}`.trim(),
      email: c.email,
      totalSpent: 0,
      ordersSet: new Set<string>(),
      lastOrderDate: new Date(item.order.createdAt),
      categories: new Set<string>(),
    };

    existing.totalSpent += item.price * item.quantity;
    existing.ordersSet.add(item.order.id);
    if (new Date(item.order.createdAt) > existing.lastOrderDate) {
      existing.lastOrderDate = new Date(item.order.createdAt);
    }
    for (const cat of item.product?.categories || []) {
      existing.categories.add(cat.name);
    }

    customerMap.set(c.id, existing);
  }

  const now = Date.now();
  const result: CustomerSegmentItem[] = [];

  for (const c of customerMap.values()) {
    const daysSinceLastOrder = Math.floor((now - c.lastOrderDate.getTime()) / (1000 * 60 * 60 * 24));
    const orderCount = c.ordersSet.size;

    let segment: CustomerSegmentItem["segment"] = "REGULAR";
    let suggestedAction = "Follow up with new seasonal collection";

    if (c.totalSpent >= 2000 || orderCount >= 4) {
      segment = "VIP";
      suggestedAction = "Offer exclusive VIP preview or priority fitting";
    } else if (orderCount === 1 && daysSinceLastOrder <= 30) {
      segment = "NEW";
      suggestedAction = "Send welcome thank-you note and request fit feedback";
    } else if (daysSinceLastOrder > 75) {
      segment = "INACTIVE";
      suggestedAction = "Re-engage with tailored occasion-wear promotion";
    } else if (daysSinceLastOrder > 45) {
      segment = "AT_RISK";
      suggestedAction = "Reach out before customer transitions to inactive";
    }

    result.push({
      id: c.id,
      name: c.name,
      email: c.email,
      totalSpent: Math.round(c.totalSpent),
      orderCount,
      lastOrderDate: c.lastOrderDate.toISOString(),
      daysSinceLastOrder,
      segment,
      preferredCategories: Array.from(c.categories),
      suggestedAction,
    });
  }

  // Sort by total spend descending
  return result.sort((a, b) => b.totalSpent - a.totalSpent);
}

/**
 * 6. Deterministic Pricing Stack Calculator
 */
export function calculatePricingMath(input: PricingInput): PricingResult {
  const laborCost = input.laborHours * input.hourlyRate;
  const directMaterials = input.fabricCost + input.notionsAndTrimsCost;
  const totalDirectCost = directMaterials + laborCost;

  const totalOverheadAndDelivery = input.overheadCost + input.packagingCost + input.deliveryFee;
  const breakEvenCost = totalDirectCost + totalOverheadAndDelivery;

  const targetMargin = Math.min(80, Math.max(10, input.targetMarginPercent)) / 100;
  const multiplier = input.complexityMultiplier || 1.0;
  const rushFee = input.rushFee || 0;
  const platformFeeRate = (input.platformFeePercent || 5) / 100;

  // Recommended price to achieve target margin after platform fees
  // Margin = (Price - Cost - PlatformFee) / Price
  // Price * (1 - Margin - PlatformFeeRate) = Cost
  const divisor = Math.max(0.1, 1 - targetMargin - platformFeeRate);
  const baseRecommended = (breakEvenCost / divisor) * multiplier + rushFee;
  const recommendedPrice = Math.ceil(baseRecommended / 5) * 5; // round to neat 5s

  const minimumViablePrice = Math.ceil((breakEvenCost / (1 - 0.15 - platformFeeRate)) / 5) * 5;
  const premiumPrice = Math.ceil((recommendedPrice * 1.35) / 10) * 10;

  const platformFeeAmount = Math.round(recommendedPrice * platformFeeRate);
  const estimatedGrossProfit = Math.round(recommendedPrice - breakEvenCost);
  const estimatedNetProfit = Math.round(estimatedGrossProfit - platformFeeAmount);
  const actualMarginPercent = Math.round((estimatedNetProfit / recommendedPrice) * 100);

  const explanation = `At GH₵${recommendedPrice}, direct costs (materials GH₵${directMaterials}, labor GH₵${laborCost}) plus overhead & fees (GH₵${breakEvenCost - totalDirectCost + platformFeeAmount}) yield an estimated net profit of GH₵${estimatedNetProfit} (${actualMarginPercent}% net margin).`;

  return {
    totalDirectCost,
    totalOverheadAndDelivery,
    breakEvenCost,
    platformFeeAmount,
    recommendedPrice,
    premiumPrice,
    minimumViablePrice,
    estimatedGrossProfit,
    estimatedNetProfit,
    actualMarginPercent,
    explanation,
  };
}
