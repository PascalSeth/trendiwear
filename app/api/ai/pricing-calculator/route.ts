// app/api/ai/pricing-calculator/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { calculatePricingMath } from "@/lib/ai/deterministic-analytics";
import type { PricingInput } from "@/lib/ai/types";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const input: PricingInput = {
      fabricCost: Number(body.fabricCost) || 0,
      laborHours: Number(body.laborHours) || 0,
      hourlyRate: Number(body.hourlyRate) || 30, // standard default 30 GHS/hr
      notionsAndTrimsCost: Number(body.notionsAndTrimsCost) || 0,
      overheadCost: Number(body.overheadCost) || 0,
      packagingCost: Number(body.packagingCost) || 0,
      deliveryFee: Number(body.deliveryFee) || 0,
      targetMarginPercent: Number(body.targetMarginPercent) || 40,
      complexityMultiplier: Number(body.complexityMultiplier) || 1.0,
      rushFee: Number(body.rushFee) || 0,
      platformFeePercent: 5,
    };

    const calculation = calculatePricingMath(input);

    return NextResponse.json({
      success: true,
      data: calculation,
      marketBenchmarkStatus: "External live market benchmarks currently unavailable. Calculations derived strictly from your verified direct cost and target margin inputs.",
    });
  } catch (error) {
    console.error("Pricing Calculator Error:", error);
    return NextResponse.json({ error: "Failed to calculate pricing" }, { status: 500 });
  }
}
