// lib/ai/types.ts
import { z } from "zod";

/**
 * Verified Business Context passed to the AI Layer
 */
export interface BusinessProfileContext {
  id: string;
  businessName: string;
  specialization: string;
  location: string | null;
  experienceYears: number;
  rating: number;
  totalReviews: number;
  activeProductsCount: number;
  completedOrdersCount: number;
  brandVoice?: string;
  targetAudience?: string;
}

/**
 * Deterministic Sales Analytics Data
 */
export interface SalesAnalyticsData {
  periodDays: number;
  currentRevenue: number;
  previousRevenue: number;
  revenueChangePercent: number;
  currentOrderCount: number;
  previousOrderCount: number;
  averageOrderValue: number;
  topSellingProducts: Array<{
    id: string;
    name: string;
    price: number;
    unitsSold: number;
    revenue: number;
    imageUrl?: string;
  }>;
  decliningProducts: Array<{
    id: string;
    name: string;
    price: number;
    unitsSold: number;
    dropPercent: number;
  }>;
  categoryBreakdown: Array<{
    name: string;
    unitsSold: number;
    revenue: number;
    sharePercent: number;
  }>;
  hasSufficientData: boolean;
}

/**
 * Inventory Intelligence Data
 */
export interface InventoryRiskItem {
  id: string;
  name: string;
  currentStock: number;
  soldLast30Days: number;
  dailyVelocity: number;
  estimatedDaysRemaining: number | null; // null if velocity is 0
  riskLevel: "CRITICAL" | "HIGH" | "MODERATE" | "HEALTHY" | "SLOW_MOVING";
  recommendedRestockUnits: number;
  imageUrl?: string;
}

export interface InventoryAnalyticsData {
  totalSkus: number;
  lowStockCount: number;
  stockoutRiskCount: number;
  slowMovingCount: number;
  items: InventoryRiskItem[];
}

/**
 * Order Production Risk Data
 */
export interface OrderRiskItem {
  orderItemId: string;
  orderId: string;
  productName: string;
  customerName: string;
  price: number;
  createdAt: string;
  status: string;
  estimatedDeliveryDays: number;
  daysInProduction: number;
  isOverdue: boolean;
  isAtRisk: boolean;
  riskReason: string;
}

/**
 * Customer CRM Analytics
 */
export interface CustomerSegmentItem {
  id: string;
  name: string;
  email: string;
  totalSpent: number;
  orderCount: number;
  lastOrderDate: string;
  daysSinceLastOrder: number;
  segment: "VIP" | "REGULAR" | "NEW" | "AT_RISK" | "INACTIVE";
  preferredCategories: string[];
  suggestedAction?: string;
}

/**
 * Unified Business Insight Object
 */
export interface AIInsight {
  id: string;
  type: "SALES" | "INVENTORY" | "ORDER_RISK" | "CUSTOMER" | "PRICING" | "MARKETING";
  severity: "CRITICAL" | "WARNING" | "OPPORTUNITY" | "INFO";
  title: string;
  explanation: string;
  supportingMetrics?: Record<string, string | number>;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  confidenceReason: string;
  recommendedAction: string;
  actionHref?: string;
  actionLabel?: string;
}

/**
 * Pricing Stack Input & Calculation
 */
export interface PricingInput {
  fabricCost: number;
  laborHours: number;
  hourlyRate: number;
  notionsAndTrimsCost: number;
  overheadCost: number;
  packagingCost: number;
  deliveryFee: number;
  targetMarginPercent: number; // e.g., 40 for 40%
  platformFeePercent?: number; // default 5%
  complexityMultiplier?: number; // 1.0 to 1.5
  rushFee?: number;
}

export interface PricingResult {
  totalDirectCost: number;
  totalOverheadAndDelivery: number;
  breakEvenCost: number;
  platformFeeAmount: number;
  recommendedPrice: number;
  premiumPrice: number;
  minimumViablePrice: number;
  estimatedGrossProfit: number;
  estimatedNetProfit: number;
  actualMarginPercent: number;
  explanation: string;
}

/**
 * Campaign Builder Structures
 */
export interface CampaignStrategy {
  campaignName: string;
  theme: string;
  targetAudience: string;
  primaryAngle: string;
  recommendedBudgetGHS?: number;
  timelineDays: number;
  channels: {
    instagram: {
      postFeedCaption: string;
      storyHook: string;
      reelScriptPrompt: string;
      hashtags: string[];
    };
    tiktok: {
      hook: string;
      creativeConcept: string;
      scriptOutline: string;
      soundVibe: string;
      hashtags: string[];
    };
    facebook: {
      primaryText: string;
      headline: string;
      description: string;
      callToAction: string;
    };
    whatsapp: {
      broadcastMessage: string;
      statusUpdateText: string;
    };
  };
}

/**
 * Vision / Creative Quality Assessment Schema
 */
export const CreativeAnalysisSchema = z.object({
  creativeQualityScore: z.number().min(0).max(100),
  breakdown: z.object({
    productProminence: z.number().min(0).max(100),
    lightingQuality: z.number().min(0).max(100),
    composition: z.number().min(0).max(100),
    backgroundSuitability: z.number().min(0).max(100),
    adReadiness: z.number().min(0).max(100),
  }),
  dominantColors: z.array(z.string()),
  garmentIdentified: z.string(),
  recommendation: z.enum(["USE_AS_IS", "IMPROVE_LIGHTING", "CLEAN_BACKGROUND", "REGENERATE_EDITORIAL"]),
  actionableTips: z.array(z.string()),
});

export type CreativeAnalysis = z.infer<typeof CreativeAnalysisSchema>;

/**
 * Customer Behavioral & Fashion Friction Types
 */
export type BehavioralQuadrant = "CURIOUS_HESITATOR" | "HIDDEN_GEM" | "CASH_COW" | "DEAD_WEIGHT";

export interface BehavioralProductItem {
  id: string;
  name: string;
  price: number;
  slug?: string;
  imageUrl?: string;
  views: number;
  uniqueInspectors: number;
  avgDwellSeconds: number;
  sizeGuideOpens: number;
  bespokeToggles: number;
  cartAdds: number;
  orders: number;
  revenueGhs: number;
  cartAbandonmentRate: number; // 0 to 100%
  conversionRate: number; // 0 to 100%
  quadrant: BehavioralQuadrant;
  primaryFrictionReason?: string;
  prescribedAction: {
    label: string;
    actionType: "PRICE_ADJUST" | "ADD_RTW_SIZING" | "PIN_TO_HERO" | "PROMO_DISCOUNT" | "PHOTO_REFRESH";
    href: string;
  };
}

export interface BehavioralMatrix {
  curiousHesitators: BehavioralProductItem[];
  hiddenGems: BehavioralProductItem[];
  cashCows: BehavioralProductItem[];
  deadWeight: BehavioralProductItem[];
}

export interface FashionFrictionMetrics {
  measurementAnxietyDropPercent: number; // % who left after opening size guide / measurements
  productionTurnaroundDropPercent: number; // % who left at checkout turnaround step
  priceShockDropPercent: number; // % who viewed high-ticket items but never carted
  estimatedLostRevenueGhs: number; // calculated potential revenue left on the table
}

export interface PhantomDemandItem {
  query: string;
  searchCount: number;
  category?: string;
  lastSearchedAt: string;
}

export interface CustomerBehaviorAnalyticsData {
  periodDays: number;
  totalViews: number;
  totalCartAdds: number;
  totalPurchases: number;
  storewideConversionRate: number;
  estimatedLostRevenueGhs: number;
  frictionMetrics: FashionFrictionMetrics;
  matrix: BehavioralMatrix;
  phantomDemand: PhantomDemandItem[];
  hasSufficientData: boolean;
}

export { type MarketSuggestion } from "./market-suggestions";
