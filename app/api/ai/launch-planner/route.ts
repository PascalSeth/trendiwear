import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateJSON } from "@/lib/ai/provider";

export interface LaunchHeroProduct {
  id: string;
  name: string;
  price: number;
  stockQuantity: number;
  isPreorder: boolean;
  imageUrl?: string;
  role: "LEAD_ANCHOR" | "PROFIT_DRIVER" | "VIRAL_HOOK" | "VOLUME_DRIVER";
  roleLabel: string;
  reasoning: string;
  stockStatus: "HEALTHY" | "LOW_STOCK" | "OUT_OF_STOCK" | "PREORDER_AVAILABLE";
  stockWarning?: string;
}

export interface LaunchContentCalendarItem {
  day: number;
  phase: "TEASE" | "CRAFT" | "DROP" | "MOMENTUM";
  channel: "INSTAGRAM_REEL" | "TIKTOK" | "INSTAGRAM_FEED" | "WHATSAPP_VIP" | "TRENDIZIP_SHOWCASE";
  contentType: string;
  hook: string;
  audioVibe?: string;
  creativeBrief: string;
  suggestedPostingTime: string;
}

export interface LaunchVideoBrief {
  title: string;
  channel: "TikTok" | "Instagram Reel" | "YouTube Shorts";
  hook3s: string;
  scenes: { sceneNumber: number; description: string; visualCue: string }[];
  audioVibe: string;
  callToAction: string;
}

export interface LaunchChecklistItem {
  id: string;
  phase: "Preparation" | "Creative Production" | "Launch Day" | "Post-Launch Push";
  task: string;
  isCompleted: boolean;
  tip?: string;
}

export interface LaunchDecisionRule {
  triggerMetric: string;
  observation: string;
  recommendedAction: string;
  urgency: "HIGH" | "MEDIUM" | "OPPORTUNITY";
}

export interface CollectionLaunchPlan {
  id: string;
  collectionName: string;
  mainGoal: string;
  targetLaunchDate: string;
  budgetGHS: number;
  revenueTargetGHS: number;
  channels: string[];

  strategy: {
    campaignTitle: string;
    theme: string;
    targetCustomerProfile: {
      demographic: string;
      styleAesthetic: string;
      lifestyleAndOccasion: string;
      buyingMotivation: string;
    };
    positioningStatement: string;
    pricingAndPromoAdvice: string;
    budgetAllocation: {
      creatorGiftingGHS: number;
      socialAdsGHS: number;
      showcaseAndMarketplaceGHS: number;
      packagingAndExperienceGHS: number;
    };
  };

  heroProducts: LaunchHeroProduct[];
  inventoryAudit: {
    totalPieces: number;
    totalCatalogueValueGHS: number;
    preorderEligibleCount: number;
    lowStockWarningsCount: number;
  };

  marketingAssets: {
    instagramCaption: string;
    tiktokHookScript: string;
    whatsappBroadcast: string;
    promotionalOfferAnnouncement: string;
    videoBriefs: LaunchVideoBrief[];
  };

  calendar: LaunchContentCalendarItem[];
  checklist: LaunchChecklistItem[];
  decisionMatrix: LaunchDecisionRule[];

  engineUsed?: string;
  generatedAt: string;
}

// GET: Fetch seller's products and collections for setup
export async function GET() {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const productWhere: any = { isDeleted: false };
    if (user.role === "PROFESSIONAL") {
      productWhere.professionalId = user.id;
    }

    const [products, collections, dbUser] = await Promise.all([
      prisma.product.findMany({
        where: productWhere,
        select: {
          id: true,
          name: true,
          price: true,
          stockQuantity: true,
          images: true,
          isPreorder: true,
          preorderLimit: true,
          categories: { select: { id: true, name: true } },
          _count: {
            select: {
              wishlistItems: true,
              cartItems: true,
              orderItems: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.collection.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          slug: true,
          imageUrl: true,
          _count: { select: { products: true } },
        },
        orderBy: { name: "asc" },
      }),
      prisma.user.findUnique({
        where: { id: user.id },
        select: {
          name: true,
          firstName: true,
          lastName: true,
          role: true,
          professionalProfile: {
            select: {
              businessName: true,
              businessImage: true,
              location: true,
            },
          },
        },
      }),
    ]);

    const brandName =
      dbUser?.professionalProfile?.businessName ||
      dbUser?.name ||
      `${dbUser?.firstName || ""} ${dbUser?.lastName || ""}`.trim() ||
      "Trendi Store";

    const brandHandle =
      brandName.toLowerCase().replace(/[^a-z0-9]/g, "") + ".gh";

    // Compute live store telemetry directly from real products
    const totalOrdersPlaced = products.reduce((acc, p) => acc + (p._count?.orderItems || 0), 0);
    const totalCartIntent = products.reduce((acc, p) => acc + (p._count?.cartItems || 0), 0);
    const totalWishlistSaves = products.reduce((acc, p) => acc + (p._count?.wishlistItems || 0), 0);
    const totalGrossRevenue = products.reduce((acc, p) => acc + (p.price * (p._count?.orderItems || 0)), 0);

    return NextResponse.json({
      products,
      collections,
      brandName,
      brandHandle,
      telemetry: {
        totalOrdersPlaced,
        totalCartIntent,
        totalWishlistSaves,
        totalGrossRevenue,
      },
    });
  } catch (error) {
    console.error("Failed to fetch launch planner assets:", error);
    return NextResponse.json({ error: "Failed to load seller catalog data" }, { status: 500 });
  }
}

// POST: Generate Collection Launch Strategy
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const {
      collectionName = "",
      collectionId = "",
      selectedProductIds = [],
      goal = "Sell as many products as possible",
      channels = ["TikTok & Instagram", "Trendizip storefront", "WhatsApp VIP Broadcast"],
      budgetTier = "GH₵500–1,500",
      launchWindow = "Within 14 Days",
      customSalesTarget = 0,
    } = body;

    // Numerical budget parser helper
    let estimatedBudgetGHS = 650;
    if (budgetTier.includes("Under GH₵500") || budgetTier.includes("350")) estimatedBudgetGHS = 350;
    else if (budgetTier.includes("GH₵500–1,500") || budgetTier.includes("650")) estimatedBudgetGHS = 650;
    else if (budgetTier.includes("GH₵1,500–5,000") || budgetTier.includes("1500")) estimatedBudgetGHS = 1500;
    else if (budgetTier.includes("No paid") || budgetTier.includes("0")) estimatedBudgetGHS = 0;

    // Fetch the actual selected products (or seller's top products if none provided)
    type TargetProductItem = {
      id: string;
      name: string;
      price: number;
      stockQuantity: number;
      isPreorder: boolean;
      images: string[];
      categories?: { name: string }[];
    };

    const prodWhere: any = { isDeleted: false };
    if (user.role === "PROFESSIONAL") {
      prodWhere.professionalId = user.id;
    }

    let targetProducts: TargetProductItem[] = [];
    if (Array.isArray(selectedProductIds) && selectedProductIds.length > 0) {
      targetProducts = await prisma.product.findMany({
        where: {
          ...prodWhere,
          id: { in: selectedProductIds },
        },
        include: {
          categories: { select: { name: true } },
        },
      });
    }

    // Fallback: load latest products from user if none explicitly selected
    if (targetProducts.length === 0) {
      targetProducts = await prisma.product.findMany({
        where: prodWhere,
        take: 8,
        orderBy: { createdAt: "desc" },
        include: {
          categories: { select: { name: true } },
        },
      });
    }

    if (targetProducts.length === 0) {
      return NextResponse.json(
        { error: "No products found in your inventory. Add products to your catalogue first." },
        { status: 400 }
      );
    }

    // Calculate catalogue stats
    const totalPieces = targetProducts.reduce((acc, p) => acc + (p.stockQuantity || 1), 0);
    const totalValue = targetProducts.reduce((acc, p) => acc + p.price * (p.stockQuantity || 1), 0);
    const preorderEligibleCount = targetProducts.filter(p => p.isPreorder).length;
    const lowStockCount = targetProducts.filter(p => !p.isPreorder && p.stockQuantity <= 3).length;
    const revenueTarget = customSalesTarget > 0 ? customSalesTarget : Math.max(1000, Math.round(totalValue * 0.75));

    // Dynamic collection name if user didn't provide one
    const resolvedCollectionName = collectionName.trim() ||
      (targetProducts[0]?.categories?.[0]?.name ? `${targetProducts[0].categories[0].name} Drop` : "Signature Drop");

    // Build product context summary for the AI prompt
    const productSummaries = targetProducts.map((p, idx) => ({
      id: p.id,
      index: idx + 1,
      name: p.name,
      price: `GH₵${p.price}`,
      stock: p.stockQuantity,
      isPreorder: p.isPreorder,
      category: p.categories?.map((c: { name: string }) => c.name).join(", ") || "Fashion Apparel",
      images: p.images || [],
    }));

    const systemPrompt = `You are Trendi, an elite AI Fashion Collection Launch Director & E-Commerce Strategist for TrendiZip—Ghana's premier fashion marketplace.
Your goal is not just to write marketing captions, but to build a complete, actionable, decision-driven Fashion Launch Plan.
You help sellers decide WHAT to feature first, WHO to target, HOW to allocate budget, WHAT content to shoot, and HOW to react when sales data arrives.

STRICT TONE & CONSTRAINTS:
1. Ground your advice in real-life Ghanaian and West African fashion commerce (Accra, Kumasi, Takoradi, diaspora buyers in UK/US/Canada).
2. Avoid pretentious buzzwords (Never use "sartorial cadence", "dichotomy", "connoisseur", "tapestry"). Write clean, vibrant, relatable, high-converting English.
3. Keep financial figures in Ghanaian Cedis (GH₵).
4. Recommend realistic promotions that protect seller profit margins without blind heavy discounting.
5. Identify hero products specifically from the provided product list.`;

    const userPrompt = `Build an end-to-end Collection Launch Command Center Plan with this metadata:
- Collection Name: "${resolvedCollectionName}"
- Primary Goal: "${goal}"
- Promotional Channels: ${JSON.stringify(channels)}
- Marketing Budget: GH₵ ${estimatedBudgetGHS} (Tier: "${budgetTier}")
- Launch Timeframe: "${launchWindow}"
- Target Revenue: GH₵ ${revenueTarget}
- Total Inventory Available: ${totalPieces} units across ${targetProducts.length} pieces (Total Value: GH₵ ${totalValue})

Products in this collection:
${JSON.stringify(productSummaries, null, 2)}

Return a valid JSON object matching this exact TypeScript structure:
{
  "strategy": {
    "campaignTitle": "Catchy, evocative campaign name",
    "theme": "Core creative aesthetic and styling theme",
    "targetCustomerProfile": {
      "demographic": "e.g. Women 22-38 in Accra, Lagos & diaspora professionals",
      "styleAesthetic": "e.g. Minimalist luxury meets vibrant African tailoring",
      "lifestyleAndOccasion": "e.g. Sunday brunches, high-profile weddings, corporate chic",
      "buyingMotivation": "e.g. Ready-to-wear convenience with custom tailor precision"
    },
    "positioningStatement": "Crisp 2-sentence value proposition",
    "pricingAndPromoAdvice": "Practical pricing & promotional advice to protect profit margins",
    "budgetAllocation": {
      "creatorGiftingGHS": number,
      "socialAdsGHS": number,
      "showcaseAndMarketplaceGHS": number,
      "packagingAndExperienceGHS": number
    }
  },
  "heroProducts": [
    {
      "productId": "id from provided list",
      "role": "LEAD_ANCHOR | PROFIT_DRIVER | VIRAL_HOOK | VOLUME_DRIVER",
      "roleLabel": "Short title like 'Lead Anchor Piece'",
      "reasoning": "Why this specific product should be featured prominently",
      "stockWarning": "Specific advice based on inventory count or preorder status"
    }
  ],
  "marketingAssets": {
    "instagramCaption": "Engaging, ready-to-post Instagram feed caption with hooks, item highlights, GH₵ prices, and CTA",
    "tiktokHookScript": "Spoken 3-second hook and 30-second video flow for TikTok/Reels",
    "whatsappBroadcast": "Polite, exclusive broadcast text for VIP clients announcing early access",
    "promotionalOfferAnnouncement": "Special launch incentive copy that preserves margin",
    "videoBriefs": [
      {
        "title": "Short title for video concept 1",
        "channel": "Instagram Reel | TikTok",
        "hook3s": "Catchy visual / audio hook for first 3 seconds",
        "scenes": [
          {"sceneNumber": 1, "description": "Scene details", "visualCue": "What camera captures"},
          {"sceneNumber": 2, "description": "Scene details", "visualCue": "Transition or styling"}
        ],
        "audioVibe": "e.g. Upbeat Amapiano / Smooth Afrobeats groove",
        "callToAction": "Clear CTA to tap link in bio or message"
      }
    ]
  },
  "calendar": [
    {
      "day": 1,
      "phase": "TEASE | CRAFT | DROP | MOMENTUM",
      "channel": "INSTAGRAM_REEL | TIKTOK | INSTAGRAM_FEED | WHATSAPP_VIP | TRENDIZIP_SHOWCASE",
      "contentType": "e.g. Behind the Scenes Fabric Sourcing",
      "hook": "Compelling headline hook",
      "audioVibe": "Audio suggestion",
      "creativeBrief": "Specific visual instructions for this post",
      "suggestedPostingTime": "e.g. 12:30 PM (Lunch break)"
    }
  ],
  "checklist": [
    {
      "id": "c1",
      "phase": "Preparation | Creative Production | Launch Day | Post-Launch Push",
      "task": "Actionable task string",
      "isCompleted": false,
      "tip": "Helpful pro-tip for execution"
    }
  ],
  "decisionMatrix": [
    {
      "triggerMetric": "e.g. High views but low cart additions",
      "observation": "What this usually means in African e-commerce",
      "recommendedAction": "Exact step to take",
      "urgency": "HIGH | MEDIUM | OPPORTUNITY"
    }
  ]
}`;

    const aiPlan = await generateJSON<any>(systemPrompt, userPrompt);

    // Build the final complete CollectionLaunchPlan
    let finalHeroProducts: LaunchHeroProduct[] = [];
    if (aiPlan?.heroProducts && Array.isArray(aiPlan.heroProducts)) {
      finalHeroProducts = aiPlan.heroProducts.map((h: any, idx: number) => {
        const matchingProd = targetProducts.find(p => p.id === h.productId) || targetProducts[idx % targetProducts.length];
        const stockQty = matchingProd?.stockQuantity || 1;
        const isPre = Boolean(matchingProd?.isPreorder);
        let stockStatus: LaunchHeroProduct["stockStatus"] = "HEALTHY";
        if (isPre) stockStatus = "PREORDER_AVAILABLE";
        else if (stockQty === 0) stockStatus = "OUT_OF_STOCK";
        else if (stockQty <= 3) stockStatus = "LOW_STOCK";

        return {
          id: matchingProd?.id || `hero-${idx}`,
          name: matchingProd?.name || `Featured Piece ${idx + 1}`,
          price: matchingProd?.price || 350,
          stockQuantity: stockQty,
          isPreorder: isPre,
          imageUrl: matchingProd?.images?.[0] || undefined,
          role: h.role || "LEAD_ANCHOR",
          roleLabel: h.roleLabel || "Lead Anchor Piece",
          reasoning: h.reasoning || "Chosen for its high visual appeal and strong buyer resonance.",
          stockStatus,
          stockWarning: h.stockWarning || (stockQty <= 3 ? "Low stock: promote as limited batch." : undefined),
        };
      });
    }

    // Default fallback hero products if AI didn't provide enough
    if (finalHeroProducts.length === 0) {
      finalHeroProducts = targetProducts.slice(0, 3).map((p, idx) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        stockQuantity: p.stockQuantity,
        isPreorder: p.isPreorder,
        imageUrl: p.images?.[0],
        role: idx === 0 ? "LEAD_ANCHOR" : idx === 1 ? "PROFIT_DRIVER" : "VIRAL_HOOK",
        roleLabel: idx === 0 ? "Lead Anchor Piece" : idx === 1 ? "Profit Driver" : "Viral Contender",
        reasoning: idx === 0
          ? "Signature silhouette that sets the mood of your collection."
          : idx === 1
          ? "Balanced price point with strong margins for repeat buying."
          : "Highly shareable styling piece ideal for short-form video hooks.",
        stockStatus: p.isPreorder ? "PREORDER_AVAILABLE" : p.stockQuantity <= 3 ? "LOW_STOCK" : "HEALTHY",
        stockWarning: p.stockQuantity <= 3 && !p.isPreorder ? "Only 3 units left—highlight rarity!" : undefined,
      }));
    }

    const defaultChecklist: LaunchChecklistItem[] = [
      { id: "chk-1", phase: "Preparation", task: "Confirm sizing matrix and stock quantities for all pieces", isCompleted: true, tip: "Add inch measurements to product descriptions" },
      { id: "chk-2", phase: "Preparation", task: "Upload high-res flat lay and mannequin photos to TrendiZip", isCompleted: true, tip: "Use natural sunlight for truest fabric colors" },
      { id: "chk-3", phase: "Creative Production", task: "Film 3 vertical video try-on clips showcasing drape and movement", isCompleted: false, tip: "Include a 3-second hook showing the final styled look first" },
      { id: "chk-4", phase: "Creative Production", task: "Draft WhatsApp VIP early-access announcement", isCompleted: false, tip: "Offer loyal clients 24-hour head start" },
      { id: "chk-5", phase: "Launch Day", task: "Publish TrendiZip collection and feature in Marketplace Showcase", isCompleted: false, tip: "Post initial launch reel at peak noon browsing hour" },
      { id: "chk-6", phase: "Launch Day", task: "Send VIP WhatsApp broadcast with direct checkout links", isCompleted: false, tip: "Direct them directly to checkout to minimize drop-off" },
      { id: "chk-7", phase: "Post-Launch Push", task: "Review first 48h view-to-order ratio and restock fast-selling sizes", isCompleted: false, tip: "Switch sellout items to pre-order if demand spikes" },
    ];

    const defaultDecisionRules: LaunchDecisionRule[] = [
      {
        triggerMetric: "High Views (>150), Low Cart Adds (<5%)",
        observation: "Shoppers love the aesthetic but hesitate on fit, sizing, or perceived price.",
        recommendedAction: "Add clear bust/waist measurement specs and state whether fabric stretches.",
        urgency: "HIGH",
      },
      {
        triggerMetric: "High Cart Adds (>20), Low Checkout (<30%)",
        observation: "Shoppers have purchase intent but drop off during delivery or final price review.",
        recommendedAction: "Offer a 24-hour flash delivery subsidy (e.g. Free delivery on orders over GH₵ 500).",
        urgency: "HIGH",
      },
      {
        triggerMetric: "Rapid Sellout (<48 hours) on specific size/color",
        observation: "High organic product-market fit with imminent stock-out risk.",
        recommendedAction: "Immediately toggle 'Pre-order Mode' with a 10-14 day lead time to capture remaining orders.",
        urgency: "OPPORTUNITY",
      },
      {
        triggerMetric: "Slow Momentum (<50 views in 72 hours)",
        observation: "Organic social reach is suppressed or hook is not grabbing attention.",
        recommendedAction: "Repackage the video hook into a styling dilemma: 'How to style X for a Saturday wedding'.",
        urgency: "MEDIUM",
      },
    ];

    const plan: CollectionLaunchPlan = {
      id: `launch-${Date.now()}`,
      collectionName: resolvedCollectionName,
      mainGoal: goal,
      targetLaunchDate: launchWindow,
      budgetGHS: estimatedBudgetGHS,
      revenueTargetGHS: revenueTarget,
      channels: Array.isArray(channels) ? channels : [channels],

      strategy: {
        campaignTitle: aiPlan?.strategy?.campaignTitle || `${resolvedCollectionName} Drop`,
        theme: aiPlan?.strategy?.theme || "Modern African Elegance & Timeless Tailoring",
        targetCustomerProfile: {
          demographic: aiPlan?.strategy?.targetCustomerProfile?.demographic || "Fashion-conscious women & men 22-38 in Accra, Kumasi, and diaspora",
          styleAesthetic: aiPlan?.strategy?.targetCustomerProfile?.styleAesthetic || "Clean, structured cuts with rich artisanal fabric accents",
          lifestyleAndOccasion: aiPlan?.strategy?.targetCustomerProfile?.lifestyleAndOccasion || "Weekend gatherings, celebratory events, and smart-casual workwear",
          buyingMotivation: aiPlan?.strategy?.targetCustomerProfile?.buyingMotivation || "High perceived quality, durable fabric, and immediate ready-to-wear styling",
        },
        positioningStatement: aiPlan?.strategy?.positioningStatement || `Effortless luxury tailored for the modern trendsetter, combining ready-to-wear comfort with bespoke finish.`,
        pricingAndPromoAdvice: aiPlan?.strategy?.pricingAndPromoAdvice || `Protect individual piece margins. Rather than flat percentage discounts on single items, introduce complimentary nationwide delivery for multi-item orders over GH₵ 600.`,
        budgetAllocation: {
          creatorGiftingGHS: aiPlan?.strategy?.budgetAllocation?.creatorGiftingGHS ?? Math.round(estimatedBudgetGHS * 0.4),
          socialAdsGHS: aiPlan?.strategy?.budgetAllocation?.socialAdsGHS ?? Math.round(estimatedBudgetGHS * 0.35),
          showcaseAndMarketplaceGHS: aiPlan?.strategy?.budgetAllocation?.showcaseAndMarketplaceGHS ?? Math.round(estimatedBudgetGHS * 0.15),
          packagingAndExperienceGHS: aiPlan?.strategy?.budgetAllocation?.packagingAndExperienceGHS ?? Math.round(estimatedBudgetGHS * 0.1),
        },
      },

      heroProducts: finalHeroProducts,
      inventoryAudit: {
        totalPieces,
        totalCatalogueValueGHS: totalValue,
        preorderEligibleCount,
        lowStockWarningsCount: lowStockCount,
      },

      marketingAssets: {
        instagramCaption: aiPlan?.marketingAssets?.instagramCaption || `The wait is over ✨ Introducing the **${resolvedCollectionName}**.\n\nEvery piece in this drop was crafted with premium breathable fabrics and clean silhouette tailoring—made to move with you from daytime casual to evening celebrations.\n\n🛍️ Handcrafted in limited batches\n📍 Nationwide delivery across Ghana & worldwide shipping\n\nTap the link in bio to shop your size on TrendiZip before pieces sell out! 👇\n\n#TrendiZip #GhanaFashion #AfricanLuxury #ReadyToWear #NewDrop`,
        tiktokHookScript: aiPlan?.marketingAssets?.tiktokHookScript || `[3-Second Hook]: "Stop scrolling if you’re tired of outfits that look good online but feel uncomfortable in person."\n\n[Visual]: Put on the lead collection piece in one smooth cut transition with bold jewelry.\n\n[Voiceover]: "This is our brand new ${resolvedCollectionName} drop. Notice the clean stitch lines and the way the fabric drapes without clinging. We only cut limited pieces per style so you never have to worry about bumping into someone wearing your same outfit."\n\n[CTA]: "Available right now on TrendiZip—link in bio!"`,
        whatsappBroadcast: aiPlan?.marketingAssets?.whatsappBroadcast || `Hello Gorgeous! ✨\n\nBecause you are one of our VIP clients, we’re giving you a **24-hour private head start** to shop our new **${resolvedCollectionName}** before the public announcement on Instagram tonight.\n\nPieces are limited to maintain exclusivity. View the private catalogue and order your size here: https://trendizip.com/storefront\n\nLet me know if you’d like any custom measurement adjustments! 💛`,
        promotionalOfferAnnouncement: aiPlan?.marketingAssets?.promotionalOfferAnnouncement || `Launch Week Perk: Enjoy Free Priority Delivery across Accra on all collection orders placed within the first 48 hours. No code needed.`,
        videoBriefs: aiPlan?.marketingAssets?.videoBriefs || [
          {
            title: "The 'Styling 1 Piece 3 Ways' Transition Reel",
            channel: "Instagram Reel",
            hook3s: "Show 3 completely different footwear pairs hitting the floor in 1 second.",
            scenes: [
              { sceneNumber: 1, description: "Style piece with white sneakers and woven tote for a Saturday market/brunch look", visualCue: "Natural sunlight, casual walk towards camera" },
              { sceneNumber: 2, description: "Quick snap transition to block heels and structured handbag for evening gala", visualCue: "Golden hour lighting, 360-degree twirl highlighting fabric drape" },
              { sceneNumber: 3, description: "Detail macro shot of neat seam finish and inner lining", visualCue: "Hands running across fabric texture" }
            ],
            audioVibe: "Warm upbeat Amapiano log-drum groove",
            callToAction: "Which look are you wearing? Drop 1, 2, or 3 below!"
          },
          {
            title: "Behind the Seams: Cutting & Sewing the Lead Garment",
            channel: "TikTok",
            hook3s: "Sound of tailor scissors cutting crisp linen fabric directly by the mic (ASMR).",
            scenes: [
              { sceneNumber: 1, description: "Close-up of pattern tracing and fabric chalk lines on the cutting table", visualCue: "Sharp focus on tailor hands" },
              { sceneNumber: 2, description: "Sewing machine running smooth stitch lines down the side seam", visualCue: "Satisfying rhythmic sewing sound" },
              { sceneNumber: 3, description: "Steaming the finished piece on the mannequin with steam billowing", visualCue: "Crisp transformation from flat to dimensional" }
            ],
            audioVibe: "Raw workshop ASMR with subtle lo-fi chill beat in background",
            callToAction: "Handcrafted right here in Ghana. Claim yours via link in bio."
          }
        ],
      },

      calendar: Array.isArray(aiPlan?.calendar) && aiPlan.calendar.length > 0 ? aiPlan.calendar : [
        {
          day: 1,
          phase: "TEASE",
          channel: "INSTAGRAM_REEL",
          contentType: "Fabric & Color Moodboard Teaser",
          hook: "Something special is dropping this week...",
          audioVibe: "Chill Afrobeats Instrumental",
          creativeBrief: "Show close-ups of fabric rolls, thread spools, and sketches. Never show full piece yet.",
          suggestedPostingTime: "12:30 PM",
        },
        {
          day: 3,
          phase: "TEASE",
          channel: "TIKTOK",
          contentType: "Behind the Seams Studio Vlog",
          hook: "How we crafted the lead piece for our new drop",
          audioVibe: "Trending TikTok Voiceover + Upbeat Lo-Fi",
          creativeBrief: "Document pattern cutting and garment press. End on fitting room mirror glimpse.",
          suggestedPostingTime: "7:00 PM",
        },
        {
          day: 5,
          phase: "DROP",
          channel: "WHATSAPP_VIP",
          contentType: "VIP 24-Hour Early Access Broadcast",
          hook: "Private Link for VIP Clients Only",
          creativeBrief: "Send lookbook photos with direct checkout links 24h before public drop.",
          suggestedPostingTime: "9:00 AM",
        },
        {
          day: 6,
          phase: "DROP",
          channel: "INSTAGRAM_FEED",
          contentType: "Official Collection Launch Announcement",
          hook: "The Collection is LIVE: Shop Your Size Now",
          creativeBrief: "Editorial carousel of top 4 looks with price tags and styling notes in caption.",
          suggestedPostingTime: "12:00 PM",
        },
        {
          day: 8,
          phase: "MOMENTUM",
          channel: "INSTAGRAM_REEL",
          contentType: "1 Piece Styled 3 Ways Transition",
          hook: "How to style the lead kaftan for brunch vs weddings",
          audioVibe: "Amapiano Dance Beat",
          creativeBrief: "Fast transition showing versatility for work, brunch, and night events.",
          suggestedPostingTime: "6:30 PM",
        },
        {
          day: 12,
          phase: "MOMENTUM",
          channel: "TIKTOK",
          contentType: "Stock Alert & Customer Unboxing",
          hook: "Only 3 pieces left in size Medium!",
          creativeBrief: "Real customer packaging box, ribbon tie, thank you card, and urgent stock notice.",
          suggestedPostingTime: "8:00 PM",
        },
      ],

      checklist: Array.isArray(aiPlan?.checklist) && aiPlan.checklist.length > 0 ? aiPlan.checklist : defaultChecklist,
      decisionMatrix: Array.isArray(aiPlan?.decisionMatrix) && aiPlan.decisionMatrix.length > 0 ? aiPlan.decisionMatrix : defaultDecisionRules,
      engineUsed: aiPlan?.engineUsed || "DeepSeek Flash Strategist",
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, plan });
  } catch (error) {
    console.error("Collection Launch Planner generation failed:", error);
    return NextResponse.json({ error: "Failed to generate collection launch plan" }, { status: 500 });
  }
}
