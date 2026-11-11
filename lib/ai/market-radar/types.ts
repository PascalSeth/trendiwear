// lib/ai/market-radar/types.ts
/**
 * Market Radar Type Definitions
 * Strict separation of evidence types, observations, estimates, and merchandising directives.
 */

export type RadarViewMode = "sell-now" | "prepare-next" | "explore-month";

export interface RadarLocation {
  city: string;
  region: string;
  country: string;
  countryCode: string;
  timezone: string;
  currency: string;
}

export interface RadarCategoryOption {
  id: string;
  label: string;
  slug?: string;
}

export type CustomerSegment = "all" | "local" | "diaspora" | "tourists" | "professionals";

export type PriceBand = "all" | "budget" | "mid" | "premium";

export type RadarEvidenceType =
  | "RECORDED_PURCHASES"
  | "SEARCH_INTEREST"
  | "SEARCH_VOLUME_ESTIMATE"
  | "LISTED_PRICES"
  | "CONFIRMED_EVENT"
  | "SUGGESTED_OPPORTUNITY";

export interface EvidenceRecord {
  id: string;
  type: RadarEvidenceType;
  source: string;
  title: string;
  url?: string;
  requestedLocation: string;
  actualCoverage: string; // e.g., "Accra, Ghana" or "Ghana-wide evidence"
  observation: string; // The verifiable fact
  measurementPeriod: string;
  retrievalTimestamp: string;
  timezone: string;
  metricValue?: number;
  metricUnit?: string;
  sampleSize?: number;
  limitations?: string;
}

export interface ChartDataPoint {
  period: string; // e.g. "Jan", "Feb", "2024-W44"
  value: number; // 0-100 relative index or exact count
  isEstimated?: boolean;
}

export interface OpportunityTiming {
  status: "sell_now" | "prepare_now" | "peak_demand" | "cooldown";
  label: string;
  demandWindow: string; // e.g. "Nov 15 – Jan 10"
  prepWindow?: string; // e.g. "Oct 15 – Nov 10"
}

export interface OpportunityMetrics {
  primary: {
    label: string;
    value: string;
    timeframe: string;
  };
  secondary?: {
    label: string;
    value: string;
    timeframe: string;
  };
  observedPriceRange?: {
    min: number;
    max: number;
    sweetSpot?: number;
    currency: string;
    sampleCount: number;
    isAskingPrice: boolean; // Always true for listings, false for recorded sales
  };
}

export interface Opportunity {
  id: string;
  title: string;
  category: string;
  thumbnailUrl?: string;
  whyNow: string; // 1 concise sentence
  evidenceType: RadarEvidenceType;
  evidenceLabel: string;
  timing: OpportunityTiming;
  metrics: OpportunityMetrics;
  geographicScope: {
    requested: string;
    actual: string;
    isBroaderScope: boolean;
  };
  evidenceIds: string[];
  sourceCount: number;
  confidence: "HIGH" | "MODERATE" | "LIMITED" | "EVENT_HYPOTHESIS";
  confidenceReason: string;
  chartData?: ChartDataPoint[];
  colorPalette?: Array<{ name: string; hex: string; role: string }>;
  moodVibe?: string;
  merchandisingDirectives: {
    recommendedFabrics: string[];
    targetSizes: string[];
    stylingTips: string;
    smallTestBatchRecommendation: string;
  };
  relatedOccasionIds?: string[];
  isFeatured?: boolean;
}

export interface RadarOccasion {
  id: string;
  name: string;
  category: "religious" | "national_holiday" | "festival" | "cultural" | "season";
  startDate: string;
  endDate: string;
  timingPhase: "upcoming_prep" | "happening_now" | "recently_ended";
  preparationDaysBefore: number;
  description: string;
  clothingImplications: string;
  sourceUrl?: string;
  evidenceId?: string;
  badgeAccent?: string;
}

export interface ProviderOperationalStatus {
  providerId: string;
  providerName: string;
  state: "available" | "not_configured" | "insufficient_data" | "no_results" | "stale" | "failed";
  itemCount: number;
  message?: string;
}

export interface MarketRadarContext {
  location: RadarLocation;
  category: string;
  customerSegment: CustomerSegment;
  priceBand: PriceBand;
  viewMode: RadarViewMode;
  analysisDate: string; // e.g., "Nov 10, 2026"
  targetPeriod: string; // e.g., "Current Week (Nov 2026)" or "October 2026"
  isHistorical: boolean;
  isFutureEstimate: boolean;
  timezone: string;
}

export interface MarketRadarResponse {
  context: MarketRadarContext;
  marketBrief: string; // 1-2 evidence-grounded sentences
  featuredOpportunity: Opportunity | null;
  opportunities: Opportunity[];
  occasions: RadarOccasion[];
  evidenceRegistry: Record<string, EvidenceRecord>;
  providerStatus: Record<string, ProviderOperationalStatus>;
  limitations: string[];
  cacheInfo: {
    cached: boolean;
    cachedAt?: string;
    expiresAt?: string;
  };
}

export interface MarketRadarRequestParams {
  city?: string;
  region?: string;
  country?: string;
  category?: string;
  viewMode?: RadarViewMode;
  customerSegment?: CustomerSegment;
  priceBand?: PriceBand;
  month?: number; // 1-12
  year?: number; // e.g. 2026
  customQuestion?: string;
  attachedFileBase64?: string;
  attachedFileName?: string;
}

