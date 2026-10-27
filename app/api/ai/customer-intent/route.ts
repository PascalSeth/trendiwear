// app/api/ai/customer-intent/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getCustomerBehaviorMetrics } from "@/lib/ai/behavioral-engine";
import { getBusinessContext } from "@/lib/ai/deterministic-analytics";
import { generateText } from "@/lib/ai/provider";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = Math.max(7, Math.min(90, parseInt(searchParams.get("days") || "30", 10)));

    const [behavioral, context] = await Promise.all([
      getCustomerBehaviorMetrics(user.id, days),
      getBusinessContext(user.id),
    ]);

    const businessName = context?.businessName || "Your Studio";

    // Formulate deterministic grounded commentary
    let aiBriefing = "";
    if (behavioral.hasSufficientData) {
      const hesitatorCount = behavioral.matrix.curiousHesitators.length;
      const gemCount = behavioral.matrix.hiddenGems.length;
      const lostRevenue = behavioral.estimatedLostRevenueGhs.toLocaleString();

      aiBriefing = `Across the last ${days} days, shoppers showed strong interest with ${behavioral.totalViews} product inspections and ${behavioral.totalCartAdds} cart additions. `;

      if (hesitatorCount > 0) {
        const topHesitator = behavioral.matrix.curiousHesitators[0];
        const reason = (topHesitator.primaryFrictionReason || "measurement or checkout friction").toLowerCase();
        aiBriefing += `Your biggest revenue leak is ${hesitatorCount} high-interest piece${hesitatorCount > 1 ? "s" : ""} (led by "${topHesitator.name}") where shoppers added to cart but dropped off due to ${reason}. `;
      }

      if (gemCount > 0) {
        const topGem = behavioral.matrix.hiddenGems[0];
        aiBriefing += `Conversely, "${topGem.name}" has an extraordinary ${topGem.conversionRate}% conversion rate when seen, but suffers from low visibility. `;
      }

      aiBriefing += `An estimated GH₵${lostRevenue} in potential revenue was left on the table this month.`;
    } else {
      aiBriefing = `Welcome to TrendiZip Behavioral Intelligence. As visitors browse your storefront, inspect fabrics, toggle between bespoke measurements and ready-to-wear, and add items to their cart, this AI cockpit will diagnose why shoppers hesitate and prescribe immediate fixes.`;
    }

    // Optional LLM enhancement for strategic refinement if API key exists
    try {
      if (process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY) {
        const prompt = `You are TrendiZip's Chief Fashion E-Commerce Strategist for ${businessName}.
Given the following verified behavioral telemetry over ${days} days:
- Total Store Views: ${behavioral.totalViews}
- Total Cart Additions: ${behavioral.totalCartAdds}
- Completed Purchases: ${behavioral.totalPurchases}
- Estimated Lost Revenue to Friction: GH₵${behavioral.estimatedLostRevenueGhs}
- Measurement Hesitation Drop-off: ${behavioral.frictionMetrics.measurementAnxietyDropPercent}%
- Turnaround/Shipping Drop-off: ${behavioral.frictionMetrics.productionTurnaroundDropPercent}%
- Curious Hesitators (High intent, low conversion): ${behavioral.matrix.curiousHesitators.map((p) => `"${p.name}" (Cart Abandonment: ${p.cartAbandonmentRate}%)`).join(", ") || "None"}
- Hidden Gems (Low views, high conversion): ${behavioral.matrix.hiddenGems.map((p) => `"${p.name}" (Conversion: ${p.conversionRate}%)`).join(", ") || "None"}

Write a concise, 2-to-3 sentence executive diagnosis explaining exactly WHY shoppers are hesitating on this specific catalogue and what the designer should do this week to recover lost revenue. Keep it strictly grounded, professional, and punchy. No generic fluff.`;

        const llmCommentary = await generateText(prompt);
        if (llmCommentary && llmCommentary.trim().length > 20) {
          aiBriefing = llmCommentary.trim();
        }
      }
    } catch {
      // Deterministic fallback already populated
    }

    return NextResponse.json({
      success: true,
      businessName,
      data: behavioral,
      aiBriefing,
    });
  } catch (error) {
    console.error("Customer Intent API Error:", error);
    return NextResponse.json({ error: "Failed to load customer intent analytics" }, { status: 500 });
  }
}
