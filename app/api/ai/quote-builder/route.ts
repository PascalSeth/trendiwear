// app/api/ai/quote-builder/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { calculatePricingMath } from "@/lib/ai/deterministic-analytics";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const customerName = String(body.customerName || "Valued Client").trim();
    const garmentTitle = String(body.garmentTitle || "Custom Tailored Garment").trim();
    const fabricDetails = String(body.fabricDetails || "Customer provided / Standard Fabric").trim();
    const estimatedDays = Number(body.estimatedDays) || 7;

    const pricing = calculatePricingMath({
      fabricCost: Number(body.fabricCost) || 0,
      laborHours: Number(body.laborHours) || 0,
      hourlyRate: Number(body.hourlyRate) || 35,
      notionsAndTrimsCost: Number(body.notionsAndTrimsCost) || 0,
      overheadCost: Number(body.overheadCost) || 0,
      packagingCost: Number(body.packagingCost) || 15,
      deliveryFee: Number(body.deliveryFee) || 0,
      targetMarginPercent: Number(body.targetMarginPercent) || 35,
      complexityMultiplier: Number(body.complexityMultiplier) || 1.0,
      rushFee: Number(body.rushFee) || 0,
      platformFeePercent: 5,
    });

    const quoteMessage = `Hello ${customerName}! ✨\n\nHere is your official custom tailoring quote for *${garmentTitle}*:\n\n` +
      `🧵 *Garment:* ${garmentTitle}\n` +
      `✨ *Fabric / Spec:* ${fabricDetails}\n` +
      `⏱️ *Estimated Production:* ${estimatedDays} business days\n` +
      `💰 *Total Price:* GH₵${pricing.recommendedPrice.toLocaleString()}\n\n` +
      `Your order includes handcrafted precision tailoring, verified fitting, and secure escrow protection through TrendiZip.\n\n` +
      `Please let me know if you would like to confirm so we can lock in your fabric cutting slot!`;

    return NextResponse.json({
      success: true,
      quote: {
        customerName,
        garmentTitle,
        fabricDetails,
        estimatedDays,
        pricing,
        formattedProposalMessage: quoteMessage,
      },
    });
  } catch (error) {
    console.error("Quote Builder Error:", error);
    return NextResponse.json({ error: "Failed to build quote" }, { status: 500 });
  }
}
