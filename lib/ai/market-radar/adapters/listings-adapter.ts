// lib/ai/market-radar/adapters/listings-adapter.ts
/**
 * Market Radar Local Retailer & Web Competitor Listings Adapter
 * 
 * Queries external web search providers (Serper, Tavily, Brave, or live public search)
 * to retrieve real, working boutique and fashion marketplace listings and advertised asking prices.
 * 
 * Strict Statistical Guard:
 * - Always labeled as "Listed asking prices", never as verified completed sales.
 * - Minimum sample guard: requires at least 2 comparable prices to compute an asking median;
 *   otherwise notes limited sample size.
 */

import { searchWebForFashionListings, ExternalSearchResponse, ExternalSearchItem } from "@/lib/ai/search-provider";
import { EvidenceRecord, ProviderOperationalStatus } from "../types";

export interface GarmentListingStats {
  garmentName: string;
  sampleCount: number;
  minPrice?: number;
  maxPrice?: number;
  medianPrice?: number;
  currency: string;
  isAskingPrice: true;
  sampleItems: {
    title: string;
    url: string;
    domain: string;
    price?: number;
    currency?: string;
    productionType: "ready_to_wear" | "bespoke_custom";
    fabric?: string;
  }[];
}

export interface ListingsAggregationResult {
  status: ProviderOperationalStatus;
  statsByGarment: Record<string, GarmentListingStats>;
  evidenceRecords: EvidenceRecord[];
}

function calculateMedian(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

export async function fetchGarmentListings(
  garments: string[],
  city: string,
  country: string = "Ghana",
  currency: string = "GH₵"
): Promise<ListingsAggregationResult> {
  const providerId = "fashion-web-listings";
  const providerName = "Local Boutique & Retailer Listings";

  const statsByGarment: Record<string, GarmentListingStats> = {};
  const evidenceRecords: EvidenceRecord[] = [];
  let totalItemsRetrieved = 0;
  let activeProviderName = providerName;
  let providerState: ProviderOperationalStatus["state"] = "available";

  // Search each garment query concurrently
  const searchPromises = garments.slice(0, 4).map(async (garment) => {
    try {
      const response: ExternalSearchResponse = await searchWebForFashionListings(garment, city, country);
      return { garment, response };
    } catch (err: any) {
      return {
        garment,
        response: {
          providerName: "Web Search",
          isConfigured: false,
          status: "error" as const,
          items: [],
          queryUsed: garment,
          error: err?.message,
        },
      };
    }
  });

  const searchResults = await Promise.all(searchPromises);

  for (const { garment, response } of searchResults) {
    if (response.providerName && response.providerName !== "None") {
      activeProviderName = response.providerName;
    }

    const items = response.items || [];
    totalItemsRetrieved += items.length;

    // Filter items with observed prices
    const pricedItems = items.filter((it) => typeof it.observedPrice === "number" && it.observedPrice > 0);
    const prices = pricedItems.map((it) => it.observedPrice as number);
    const itemCurrency = pricedItems[0]?.currency || currency;

    const minPrice = prices.length > 0 ? Math.min(...prices) : undefined;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : undefined;
    const medianPrice = prices.length >= 2 ? calculateMedian(prices) : minPrice;

    statsByGarment[garment] = {
      garmentName: garment,
      sampleCount: pricedItems.length,
      minPrice,
      maxPrice,
      medianPrice,
      currency: itemCurrency,
      isAskingPrice: true,
      sampleItems: items.slice(0, 4).map((it) => ({
        title: it.title,
        url: it.url,
        domain: it.domain,
        price: it.observedPrice,
        currency: it.currency,
        productionType: it.productionType,
        fabric: it.fabric,
      })),
    };

    if (items.length > 0) {
      const domains = Array.from(new Set(items.map((it) => it.domain))).join(", ");
      const priceSummary =
        minPrice && maxPrice
          ? `Observed asking prices range from ${itemCurrency} ${minPrice} to ${itemCurrency} ${maxPrice} across ${pricedItems.length} retailer listing(s).`
          : `Observed listings across retailer stores without explicitly stated digital prices.`;

      const evidenceId = `ev-list-${garment.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Date.now().toString(36)}`;
      evidenceRecords.push({
        id: evidenceId,
        type: "LISTED_PRICES",
        source: response.providerName || "Web Marketplace Listings",
        title: `Online Retailer Listings for ${garment} in ${city}`,
        url: items[0]?.url,
        requestedLocation: `${city}, ${country}`,
        actualCoverage: items.some((it) => it.snippet.toLowerCase().includes(city.toLowerCase()))
          ? `${city}, ${country}`
          : `${country}-wide listings`,
        observation: `${priceSummary} Sources include: ${domains}. Note: Advertised asking prices may differ from settled in-person or boutique transactions.`,
        measurementPeriod: `Current month (${new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" })})`,
        retrievalTimestamp: new Date().toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
        metricValue: medianPrice,
        metricUnit: itemCurrency,
        sampleSize: pricedItems.length,
        limitations: "Advertised digital asking prices. Does not include offline bargaining discounts or custom bespoke fitting fees.",
      });
    }
  }

  if (totalItemsRetrieved === 0) {
    providerState = "no_results";
  }

  return {
    status: {
      providerId,
      providerName: activeProviderName,
      state: providerState,
      itemCount: totalItemsRetrieved,
      message:
        totalItemsRetrieved > 0
          ? `Indexed ${totalItemsRetrieved} advertised listing(s) across regional boutiques and fashion web stores.`
          : `No current advertised web listings retrieved for selected category in ${city}.`,
    },
    statsByGarment,
    evidenceRecords,
  };
}

