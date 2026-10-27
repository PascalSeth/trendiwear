// app/api/ai/campaign-builder/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateJSON } from "@/lib/ai/provider";
import type { CampaignStrategy } from "@/lib/ai/types";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const productId = String(body.productId || "").trim();
    const brandTone = String(body.brandTone || "Modern African Luxury, sophisticated, vibrant").trim();
    const campaignGoal = String(body.campaignGoal || "Direct Sales & Orders").trim();

    if (!productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    // Verify ownership
    const product = await prisma.product.findFirst({
      where: { id: productId, professionalId: user.id, isDeleted: false },
      include: {
        categories: { select: { name: true } },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found in your catalogue" }, { status: 404 });
    }

    const categories = product.categories.map((c) => c.name).join(", ") || "Fashion";
    const priceText = `GH₵${product.price}`;

    const prompt = `
Create a complete, high-converting African fashion marketing campaign for the following verified product:
- Product Name: ${product.name}
- Price: ${priceText}
- Category: ${categories}
- Material/Fabric: ${product.material || "African Print / Luxury Fabric"}
- Colors: ${product.colors.join(", ") || "Multi-tone"}
- Brand Voice: ${brandTone}
- Campaign Objective: ${campaignGoal}

Return a valid JSON object matching this exact TypeScript structure:
{
  "campaignName": "Short punchy name for this campaign",
  "theme": "Core creative theme (e.g. Modern Regal Elegance)",
  "targetAudience": "Specific target customer profile",
  "primaryAngle": "Main value proposition or hook",
  "timelineDays": 7,
  "channels": {
    "instagram": {
      "postFeedCaption": "Ready-to-post Instagram caption highlighting the craftsmanship, price, and ordering CTA",
      "storyHook": "1-sentence hook for IG Story",
      "reelScriptPrompt": "Short visual concept for an IG Reel / styling video",
      "hashtags": ["#AfricanFashion", "#GhanaFashion", "#TrendiZip", "#CustomTailoring", "#AfricanStyle"]
    },
    "tiktok": {
      "hook": "Spoken 3-second hook for TikTok",
      "creativeConcept": "Quick transition or styling concept",
      "scriptOutline": "Brief script outline for 15-30s video",
      "soundVibe": "Suggested audio vibe (e.g. Afrobeats / Amapiano slow groove)",
      "hashtags": ["#africanfashiontiktok", "#ghanatiktok", "#fitcheck", "#fashiondesigner"]
    },
    "facebook": {
      "primaryText": "Persuasive Facebook post copy detailing fit, occasion, and delivery",
      "headline": "Punchy ad headline",
      "description": "Short subtext for the ad link",
      "callToAction": "Shop Now / Order Custom Fit"
    },
    "whatsapp": {
      "broadcastMessage": "Polite, personal message to send to VIP clients announcing this piece",
      "statusUpdateText": "Short status update line with emojis"
    }
  }
}
`;

    const campaign = await generateJSON<CampaignStrategy>(prompt, "You are a practical fashion marketing consultant who writes engaging, simple copy in everyday English.");

    if (!campaign) {
      // Deterministic fallback if external model fails
      const fallbackCampaign: CampaignStrategy = {
        campaignName: `${product.name} Spotlight`,
        theme: "Quality Tailoring & Everyday Style",
        targetAudience: "Fashion shoppers looking for stylish custom-made and ready-to-wear outfits",
        primaryAngle: `Step out in handcrafted elegance with ${product.name}`,
        timelineDays: 7,
        channels: {
          instagram: {
            postFeedCaption: `Upgrade your look with the ${product.name}. Handcrafted and tailored to fit you perfectly.\n\n✨ Price: ${priceText}\n📍 Custom fitting & nationwide delivery available.\n\nTap the link in bio to order now on TrendiZip. 🛍️`,
            storyHook: `Looking for your next standout outfit? The ${product.name} is now available.`,
            reelScriptPrompt: `Show close-up of fabric stitching, quick transition into full outfit styling with accessories.`,
            hashtags: ["#AfricanFashion", "#GhanaFashionDesigner", "#TrendiZip", "#ModernAfricanStyle", "#TailorShop"],
          },
          tiktok: {
            hook: `This is why you don't buy generic outfits when you can wear custom African design.`,
            creativeConcept: `Before and after: from fabric swatch on the cutting table to fully styled outfit on the street.`,
            scriptOutline: `Hook (0-3s) -> Showcase fit & movement (3-10s) -> Price & where to order on TrendiZip (10-15s).`,
            soundVibe: "Smooth Afrobeats instrumental",
            hashtags: ["#africanfashion", "#tailortok", "#ghanastyle", "#fitcheck"],
          },
          facebook: {
            primaryText: `Introducing the ${product.name} — crafted with premium materials and designed for both comfort and unmatched style. Available now for ${priceText}.`,
            headline: `Order the ${product.name} on TrendiZip`,
            description: `Handcrafted quality with secure escrow payment and fast delivery.`,
            callToAction: "Order Now",
          },
          whatsapp: {
            broadcastMessage: `Hello! ✨ We just dropped a fresh piece: the *${product.name}* (${priceText}). Tailored with precision and ready for your next event. Reply to reserve your size or order custom fitting!`,
            statusUpdateText: `New arrival alert: The ${product.name} is now live ✨ Tap to order.`,
          },
        },
      };

      return NextResponse.json({
        success: true,
        product: {
          id: product.id,
          name: product.name,
          price: product.price,
          imageUrl: product.images[0] || null,
        },
        campaign: fallbackCampaign,
      });
    }

    return NextResponse.json({
      success: true,
      product: {
        id: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.images[0] || null,
      },
      campaign,
    });
  } catch (error) {
    console.error("Campaign Builder Error:", error);
    return NextResponse.json({ error: "Failed to generate campaign" }, { status: 500 });
  }
}
