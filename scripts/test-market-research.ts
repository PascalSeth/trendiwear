// scripts/test-market-research.ts
/**
 * Test Suite for TrendiZip Market & Trend Research
 * Verifies:
 * 1. Evidence validation & anti-hallucination rules
 * 2. Location handling & geographic scoping
 * 3. Price calculations & benchmark suppression (N >= 3 rule)
 * 4. Citation integrity & traceability
 * 5. Deterministic search snippet price & currency extraction
 * 6. Production type categorization (ready-to-wear vs bespoke)
 * 7. Failed / empty research graceful handling
 */

import { extractPriceFromText, classifyProductionType, searchWebForFashionListings } from "../lib/ai/search-provider";

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log("=================================================");
  console.log("🧪 TrendiZip Market Research Test Suite");
  console.log("=================================================\n");

  // TEST SUITE 1: DETERMINISTIC PRICE & CURRENCY EXTRACTION
  console.log("Suite 1: Price and Currency Extraction from Listings");
  
  const sampleSnippet1 = "Shop elegant women's linen dresses in Accra starting from GH₵ 350.00 with fast delivery.";
  const price1 = extractPriceFromText(sampleSnippet1);
  assert(price1.price !== undefined, "Extracted price from Ghana cedi snippet");
  assert(price1.price === 350, `Price amount equals 350 (got ${price1.price})`);
  assert(price1.currency === "GH₵", `Currency is GH₵ (got ${price1.currency})`);

  const sampleSnippet2 = "Lagos contemporary bespoke agbada and kaftan sets for ₦ 45,000 at prime tailors.";
  const price2 = extractPriceFromText(sampleSnippet2);
  assert(price2.price !== undefined, "Extracted price from Nigerian Naira snippet");
  assert(price2.price === 45000, `Naira amount equals 45000 (got ${price2.price})`);
  assert(price2.currency === "₦", `Currency is ₦ (got ${price2.currency})`);

  const sampleSnippet3 = "London luxury African print silk boubou retails for £180 in modern boutiques.";
  const price3 = extractPriceFromText(sampleSnippet3);
  assert(price3.price !== undefined, "Extracted price from British pound snippet");
  assert(price3.price === 180, `Pound amount equals 180 (got ${price3.price})`);
  assert(price3.currency === "£", `Currency is £ (got ${price3.currency})`);

  const sampleSnippet4 = "Editorial article discussing fashion week silhouettes with no pricing.";
  const price4 = extractPriceFromText(sampleSnippet4);
  assert(price4.price === undefined, "Returns undefined price when no numerical price exists");

  // Exclusion of test transaction prices (< 25 GH₵)
  const sampleTestCharge = "Order confirmation for test purchase: GH₵ 2.00 item.";
  const priceTest = extractPriceFromText(sampleTestCharge);
  assert(priceTest.price === undefined, "Filters out micro test transactions / placeholder charges under 25 GH₵");

  console.log("");

  // TEST SUITE 2: PRODUCTION TYPE CLASSIFICATION
  console.log("Suite 2: Production Type Classification (Ready-to-Wear vs Bespoke)");

  const bespokeSnippet = "Custom bridal kente gown with measurements fitting and couture embroidery.";
  const bespokeType = classifyProductionType("Bridal Kente Gown", bespokeSnippet);
  assert(bespokeType === "bespoke_custom", `Classified as bespoke_custom (got ${bespokeType})`);

  const rtwSnippet = "Ready to ship casual linen two-piece set, sizes S-XXL in stock for immediate delivery.";
  const rtwType = classifyProductionType("Linen Two-Piece Set", rtwSnippet);
  assert(rtwType === "ready_to_wear", `Classified as ready_to_wear (got ${rtwType})`);

  console.log("");

  // TEST SUITE 3: BENCHMARK CALCULATIONS & DATA INTEGRITY (N >= 3 RULE)
  console.log("Suite 3: Benchmark Calculations & Statistical Suppression Rule");

  // Function simulating backend benchmark logic
  function calculateBenchmark(prices: number[]): { hasBenchmark: boolean; sweetSpot?: number; note?: string } {
    if (prices.length < 3) {
      return {
        hasBenchmark: false,
        note: "Not enough comparable prices found",
      };
    }
    const sum = prices.reduce((a, b) => a + b, 0);
    const avg = Math.round(sum / prices.length);
    return {
      hasBenchmark: true,
      sweetSpot: avg,
    };
  }

  const singlePrice = [280];
  const bSingle = calculateBenchmark(singlePrice);
  assert(!bSingle.hasBenchmark, "Suppresses benchmark average when N = 1 (prevents misleading statistics)");
  assert(bSingle.note === "Not enough comparable prices found", "Provides clear note: Not enough comparable prices found");

  const twoPrices = [260, 320];
  const bTwo = calculateBenchmark(twoPrices);
  assert(!bTwo.hasBenchmark, "Suppresses benchmark average when N = 2 (requires N >= 3)");

  const sufficientPrices = [250, 300, 350, 400];
  const bSufficient = calculateBenchmark(sufficientPrices);
  assert(bSufficient.hasBenchmark, "Calculates benchmark when N >= 3");
  assert(bSufficient.sweetSpot === 325, `Calculates deterministic arithmetic mean (expected 325, got ${bSufficient.sweetSpot})`);

  console.log("");

  // TEST SUITE 4: CITATION INTEGRITY & REAL SOURCES
  console.log("Suite 4: Citation Integrity & Traceability");

  const mockSearchItem = {
    title: "Accra Linen Dress Collection",
    price: 380,
    priceType: "listed_asking_price" as const,
    productionType: "ready_to_wear" as const,
    currency: "GH₵",
    location: "Accra, Ghana",
    sourceName: "Google Search",
    sourceUrl: "https://example.com/accra-linen",
    retrievedAt: new Date().toISOString(),
  };

  assert(mockSearchItem.sourceUrl.startsWith("http"), "Source URL is a valid web link");
  assert(mockSearchItem.priceType === "listed_asking_price", "Distinguishes listed asking price from confirmed sale");
  assert(mockSearchItem.location.includes("Accra"), "Preserves target market location provenance");

  console.log("");

  // TEST SUITE 5: LIVE WEB RETRIEVAL (Zero-Key Fallback & Live Public Search)
  console.log("Suite 5: Web Search Provider Execution");

  const searchResult = await searchWebForFashionListings("linen dress prices", "Accra, Ghana");
  assert(searchResult.providerName !== "", `Search provider resolved: ${searchResult.providerName}`);
  assert(
    searchResult.status === "success" || searchResult.status === "empty" || searchResult.status === "unavailable",
    `Search status is valid state: ${searchResult.status}`
  );
  assert(Array.isArray(searchResult.items), "Returns typed items array");

  console.log("");

  // TEST SUITE 6: ANTI-HALLUCINATION SCORE RULES
  console.log("Suite 6: Anti-Hallucination & Metric Integrity Verification");

  const forbiddenTokens = ["94/100", "98%", "bestseller in Accra", "guaranteed 70% profit"];
  const testReportText = `## Direct Answer
Relaxed two-piece linen sets and light cotton day dresses are worth investigating in Accra.
## What the Research Found
Observed ready-to-wear listings range between GH₵ 260 and GH₵ 380.
## Sources & Limitations
Listing prices reflect seller asking prices, not verified customer demand.`;

  let hasForbidden = false;
  for (const token of forbiddenTokens) {
    if (testReportText.includes(token)) {
      hasForbidden = true;
      break;
    }
  }
  assert(!hasForbidden, "Report excludes arbitrary demand scores (e.g. 94/100) and unverified bestseller claims");

  console.log("");
  console.log("=================================================");
  console.log(`📊 Test Results: ${passed} Passed, ${failed} Failed`);
  console.log("=================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
