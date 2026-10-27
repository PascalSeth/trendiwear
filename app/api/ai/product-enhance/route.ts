import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { analyzeGarmentVision } from "@/lib/ai/provider";

function generateSmartGarmentFallback(productName: string, material: string, categoryName: string) {
  const lower = (productName + " " + categoryName + " " + material).toLowerCase().replace(/[\s\-_]+/g, " ");

  let desc = "";
  let defaultMaterial = material || "100% Soft Combed Cotton";
  let defaultCare = "Machine wash cold inside-out with like colors. Tumble dry low or line dry. Cool iron on reverse.";
  let defaultTags = [productName.trim(), "Everyday Essential", "Cotton Tee", "Casualwear", "TrendiZip"];

  if (
    lower.includes("t shirt") ||
    lower.includes("tshirt") ||
    lower.includes("t shirt") ||
    lower.includes("tee") ||
    lower.includes("shirt") ||
    lower.includes("top") ||
    lower.includes("polo")
  ) {
    defaultMaterial = material || "100% Ultra-Soft Combed Cotton";
    desc = `Made from 100% ultra-soft combed cotton for everyday breathability and effortless style. Designed with a classic crew neck, reinforced collar stitching, and a comfortable modern fit that keeps its shape wash after wash. Pair easily with denim, cargo pants, or layer under a jacket.`;
    defaultTags = [productName.trim(), "Cotton Tee", "Casual Top", "Everyday Wear", "Soft Cotton"];
  } else if (
    lower.includes("hoodie") ||
    lower.includes("sweatshirt") ||
    lower.includes("sweater") ||
    lower.includes("fleece") ||
    lower.includes("jumper")
  ) {
    defaultMaterial = material || "Heavyweight Cotton Fleece Blend (350 GSM)";
    desc = `Cut from plush heavyweight fleece for supreme warmth and a relaxed, comfortable everyday fit. Features a double-lined hood, ribbed cuffs, and reinforced seams for durable cold-weather comfort.`;
    defaultCare = "Machine wash cold inside-out. Tumble dry low. Do not iron print directly.";
    defaultTags = [productName.trim(), "Heavyweight Hoodie", "Streetwear", "Cozy Fleece", "Layering Essential"];
  } else if (
    lower.includes("dress") ||
    lower.includes("gown") ||
    lower.includes("skirt") ||
    lower.includes("frock")
  ) {
    defaultMaterial = material || "Fluid Satin Silk & Lightweight Crepe";
    desc = `Designed with a flattering feminine fit and graceful style. Perfect for dates, parties, and weekend outings, offering an effortlessly polished look with comfortable movement.`;
    defaultCare = "Hand wash cold or dry clean. Line dry in shade. Cool iron.";
    defaultTags = [productName.trim(), "Chic Dress", "Flattering Fit", "Party Outfit", "Modern Style"];
  } else if (
    lower.includes("agbada") ||
    lower.includes("suit") ||
    lower.includes("blazer") ||
    lower.includes("kaftan") ||
    lower.includes("senator") ||
    lower.includes("tuxedo")
  ) {
    defaultMaterial = material || "Polished Cotton & Brocade";
    desc = `Tailored with sharp structural lines, clean lapels, and premium inner lining. Crafted for weddings, formal galas, and festive heritage celebrations where immaculate presentation is a must.`;
    defaultCare = "Dry clean only. Store on a wide suit hanger inside a breathable dust bag.";
    defaultTags = [productName.trim(), "Tailored Fit", "Formalwear", "Heritage Style", "Artisan Finish"];
  } else if (
    lower.includes("jean") ||
    lower.includes("pant") ||
    lower.includes("trouser") ||
    lower.includes("short") ||
    lower.includes("jogger")
  ) {
    defaultMaterial = material || "Stretch Cotton Denim & Twill";
    desc = `Cut for a clean profile with just the right amount of stretch for natural movement. Features reinforced pocketing, a sturdy waistband, and versatile styling to pair with any tee or sweater.`;
    defaultCare = "Machine wash cold inside-out to preserve color. Line dry.";
    defaultTags = [productName.trim(), "Comfort Fit Pants", "Durable Denim", "Everyday Bottoms", "Modern Fit"];
  } else {
    desc = `An essential wardrobe piece featuring soft, breathable fabric and a clean, comfortable fit. Designed for easy daily styling and long-lasting durability.`;
  }

  return {
    enhancedDescription: desc,
    suggestedTags: defaultTags,
    suggestedMaterial: defaultMaterial,
    suggestedCare: defaultCare,
    headline: `Essential ${productName}`,
    engineUsed: "Trendi AI Engine"
  };
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { 
      productName = "", 
      description = "", 
      categoryName = "", 
      material = "", 
      colors = [],
      images = [],
      customApiKey = ""
    } = body;

    const validImages = Array.isArray(images) 
      ? images.filter((img: unknown): img is string => typeof img === "string" && (img.startsWith("http") || img.startsWith("data:image/"))) 
      : [];

    if (!productName.trim() && validImages.length === 0) {
      return NextResponse.json({ error: "Please enter a product name or upload at least one garment image for AI analysis." }, { status: 400 });
    }

    // 1. If images are provided, prioritize DeepSeek Flash Multimodal Garment Vision
    if (validImages.length > 0) {
      try {
        const visionResult = await analyzeGarmentVision({
          images: validImages,
          productName,
          categoryName,
          notes: description,
          customApiKey,
        });

        if (visionResult && (visionResult.suggestedTitle || visionResult.enhancedDescription)) {
          const colorSet = new Set<string>();
          if (visionResult.topColor) colorSet.add(visionResult.topColor);
          if (visionResult.bottomColor) colorSet.add(visionResult.bottomColor);
          if (Array.isArray(visionResult.suggestedColors)) {
            visionResult.suggestedColors.forEach(c => { if (c) colorSet.add(c); });
          }

          return NextResponse.json({
            success: true,
            productName: visionResult.suggestedTitle,
            enhancedDescription: visionResult.enhancedDescription,
            suggestedMaterial: visionResult.suggestedMaterial,
            suggestedColors: Array.from(colorSet),
            suggestedTags: visionResult.suggestedTags,
            suggestedCare: visionResult.suggestedCare,
            suggestedCategory: visionResult.suggestedCategory,
            headline: visionResult.headline,
            engineUsed: visionResult.engineUsed,
            silhouette: visionResult.silhouette,
            neckline: visionResult.neckline,
            sleeves: visionResult.sleeves,
            fabricTexture: visionResult.fabricTexture,
            keyAccents: visionResult.keyAccents,
            topColor: visionResult.topColor,
            bottomColor: visionResult.bottomColor,
            isTwoTone: visionResult.isTwoTone,
            topShape: visionResult.topShape,
            bottomShape: visionResult.bottomShape,
            overallLook: visionResult.overallLook,
            garmentType: visionResult.garmentType,
            hasSeparateTopAndBottom: visionResult.hasSeparateTopAndBottom,
          });
        }
      } catch (vErr) {
        console.warn("Garment vision analysis error, attempting text fallback:", vErr);
      }
    }

    const deepseekKey = process.env.DEEPSEEK_API_KEY || "";
    const openaiKey = process.env.OPENAI_API_KEY || "";

    const systemPrompt = `You are a real-world e-commerce clothing copywriter for TrendiZip, an authentic fashion marketplace.
Your goal is to write practical, stylish, accurate, and appealing product descriptions tailored strictly to the specific garment type.

CRITICAL RULES:
1. MATCH THE ITEM DIRECTLY:
   - For T-shirts, tops, shirts, casualwear: write about soft cotton hand-feel, breathable comfort, daily fit, neck ribbing, easy daily styling with jeans or shorts. DO NOT write fake pretentious jargon like "evening galas", "bespoke couture", or "glorious statement piece" for a plain T-shirt or casual top!
   - For dresses, suits, agbadas: write about elegant drape, tailored fit, and celebration style.
2. Keep descriptions clear, attractive, practical, and engaging (150-250 words).
3. Provide realistic garment care advice and accurate material suggestions.

Return ONLY a valid JSON object matching this schema without markdown codeblocks:
{
  "enhancedDescription": "string (practical, natural, attractive clothing product description)",
  "suggestedTags": ["array of 5-8 accurate fashion keywords"],
  "suggestedMaterial": "string (realistic fabric e.g. 100% Soft Combed Cotton)",
  "suggestedCare": "string (practical garment care instructions)",
  "headline": "string (catchy 3-5 word clothing title)"
}`;

    const userPrompt = `Garment Name: ${productName}
User Notes / Draft: ${description || "None"}
Category: ${categoryName || "Clothing"}
Specified Material: ${material || "None"}
Colors: ${Array.isArray(colors) ? colors.join(", ") : "None"}

Write an authentic, realistic, high-converting e-commerce product description for this garment in JSON.`;

    let aiResult: Record<string, unknown> | null = null;

    // 1. DeepSeek AI Engine
    if (deepseekKey.trim()) {
      try {
        const res = await fetch("https://api.deepseek.com/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${deepseekKey.trim()}`,
          },
          body: JSON.stringify({
            model: "deepseek-chat",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            temperature: 0.6,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const rawText = data.choices?.[0]?.message?.content;
          if (rawText) {
            try {
              const cleaned = rawText.replace(/```json\n?|\n?```/g, "").trim();
              const parsed = JSON.parse(cleaned);
              aiResult = { ...parsed, engineUsed: "Trendi AI Engine" };
            } catch (pErr) {
              console.warn("AI JSON parse warning:", pErr);
            }
          }
        }
      } catch (err) {
        console.error("DeepSeek API error:", err);
      }
    }

    // 2. OpenAI GPT-4o Fallback
    if (!aiResult && openaiKey.trim()) {
      try {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openaiKey.trim()}`,
          },
          body: JSON.stringify({
            model: "gpt-4o",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            temperature: 0.6,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const rawText = data.choices?.[0]?.message?.content;
          if (rawText) {
            try {
              const cleaned = rawText.replace(/```json\n?|\n?```/g, "").trim();
              const parsed = JSON.parse(cleaned);
              aiResult = { ...parsed, engineUsed: "Trendi AI Engine" };
            } catch (pErr) {
              console.warn("OpenAI JSON parse warning:", pErr);
            }
          }
        }
      } catch (err) {
        console.error("OpenAI API error:", err);
      }
    }

    // 3. Garment-specific Smart Fallback
    if (!aiResult || !aiResult.enhancedDescription) {
      aiResult = generateSmartGarmentFallback(productName, material, categoryName);
    }

    return NextResponse.json({ success: true, ...aiResult });
  } catch (error: unknown) {
    console.error("Product enhancement failed:", error);
    const errObj = error as { message?: string };
    return NextResponse.json(
      { error: errObj.message || "Failed to generate AI product enhancements" },
      { status: 500 }
    );
  }
}
