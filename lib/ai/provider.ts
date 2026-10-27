// lib/ai/provider.ts
/**
 * Production AI Provider Abstraction
 * - Research, reasoning, analysis & text: DEEPSEEK (deepseek-chat / deepseek-reasoner)
 * - Image generation & visual transformations: OPENAI (dall-e-3)
 * - Fallbacks: OpenAI (gpt-4o-mini), Gemini (gemini-1.5-flash), and deterministic telemetry
 */

import { supabaseAdmin } from "@/lib/supabase";

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface VisionAnalysisInput {
  imageUrl: string;
  garmentName?: string;
  category?: string;
}

/**
 * Clean JSON parser that strips markdown code blocks like ```json ... ```
 */
export function extractJSON<T>(text: string): T | null {
  try {
    const cleaned = text
      .replace(/^```json\s*/im, "")
      .replace(/^```\s*/im, "")
      .replace(/\s*```$/m, "")
      .trim();
    return JSON.parse(cleaned) as T;
  } catch {
    // Attempt relaxed regex extraction
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]) as T;
      } catch {
        return null;
      }
    }
    return null;
  }
}

/**
 * Universal text generation & research engine
 * PRIORITY: DeepSeek (deepseek-chat / deepseek-reasoner) -> OpenAI (gpt-4o-mini) -> Gemini -> Deterministic fallback
 */
export async function generateText(
  prompt: string, 
  systemPrompt?: string, 
  options?: { isResearch?: boolean; maxTokens?: number; temperature?: number }
): Promise<string> {
  const deepseekKey = process.env.DEEPSEEK_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  const maxTokens = options?.maxTokens ?? 2000;
  const temperature = options?.temperature ?? 0.3;

  // 1. PRIMARY: DeepSeek for all research, analysis, and reasoning
  if (deepseekKey) {
    try {
      const model = options?.isResearch ? "deepseek-reasoner" : "deepseek-chat";
      const res = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${deepseekKey.trim()}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
            { role: "user", content: prompt },
          ],
          temperature,
          max_tokens: maxTokens,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (content && typeof content === "string" && content.trim()) {
          return content.trim();
        }
      } else {
        console.warn("DeepSeek API returned error status:", res.status, await res.text().catch(() => ""));
      }
    } catch (err) {
      console.warn("DeepSeek API call failed, attempting OpenAI fallback:", err);
    }
  }

  // 2. SECONDARY: OpenAI (gpt-4o-mini)
  if (openaiKey) {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey.trim()}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
            { role: "user", content: prompt },
          ],
          temperature,
          max_tokens: maxTokens,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (content && typeof content === "string" && content.trim()) {
          return content.trim();
        }
      }
    } catch (err) {
      console.warn("OpenAI API call failed, attempting Gemini fallback:", err);
    }
  }

  // 3. TERTIARY: Google Gemini
  if (geminiKey) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              ...(systemPrompt ? [{ role: "user", parts: [{ text: `SYSTEM INSTRUCTION: ${systemPrompt}` }] }] : []),
              { role: "user", parts: [{ text: prompt }] },
            ],
            generationConfig: {
              temperature,
              maxOutputTokens: maxTokens,
            },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidate) return candidate.trim();
      }
    } catch (err) {
      console.warn("Gemini API call failed:", err);
    }
  }

  // Graceful deterministic response if no external provider is configured
  return "AI intelligence engine is running with deterministic database telemetry.";
}

/**
 * Universal JSON generator with schema extraction
 */
export async function generateJSON<T>(
  prompt: string, 
  systemPrompt?: string,
  options?: { isResearch?: boolean }
): Promise<T | null> {
  const fullSystem = `${systemPrompt || ""}\n\nIMPORTANT: You must respond ONLY with a valid JSON object. Do not include introductory text, markdown fences, or closing commentary.`;
  const raw = await generateText(prompt, fullSystem, { isResearch: options?.isResearch, temperature: 0.2 });
  return extractJSON<T>(raw);
}

/**
 * Production Image Generation via OPENAI (GPT-Image Series)
 */
export async function generateImageWithOpenAI(
  prompt: string,
  options?: {
    size?: "1024x1024" | "1024x1536" | "1536x1024" | "1024x1792" | "1792x1024" | string;
    quality?: "standard" | "hd" | "low" | "medium" | "high" | "auto";
    model?: string;
    customApiKey?: string;
    userId?: string;
  }
): Promise<{ url: string | null; engine: string; error?: string }> {
  const apiKey = options?.customApiKey || process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return {
      url: null,
      engine: "None",
      error: "OpenAI API Key is missing. Please set OPENAI_API_KEY in .env.",
    };
  }

  // Map legacy DALL-E 3 requests to modern GPT-Image models
  let requestedModel = options?.model;
  if (!requestedModel || requestedModel === "dall-e-3" || requestedModel === "dalle3") {
    requestedModel = "gpt-image-1";
  }

  const modelCandidates = [requestedModel];
  if (requestedModel !== "gpt-image-1-mini") {
    modelCandidates.push("gpt-image-1-mini");
  }

  // Size mapping (1024x1792 is legacy DALL-E 3, gpt-image uses 1024x1536)
  let targetSize = options?.size || "1024x1024";
  if (targetSize === "1024x1792") targetSize = "1024x1536";
  if (targetSize === "1792x1024") targetSize = "1536x1024";

  let lastError = "";

  for (const modelCandidate of modelCandidates) {
    const isGptImage = modelCandidate.startsWith("gpt-image") || modelCandidate.includes("chatgpt");
    let targetQuality: string;
    if (isGptImage) {
      targetQuality = options?.quality === "standard" ? "medium" : "high";
    } else {
      targetQuality = options?.quality === "high" || options?.quality === "hd" ? "hd" : "standard";
    }

    try {
      const res = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({
          model: modelCandidate,
          prompt,
          n: 1,
          size: targetSize,
          quality: targetQuality,
        }),
      });

      const data = await res.json();
      if (res.ok && data.data?.[0]) {
        const item = data.data[0];
        const format = data.output_format || "png";
        let finalUrl = item.url || null;

        if (item.b64_json) {
          finalUrl = `data:image/${format};base64,${item.b64_json}`;

          // Persist directly to Supabase Storage if configured
          if (supabaseAdmin) {
            try {
              const buffer = Buffer.from(item.b64_json, "base64");
              const userFolder = options?.userId || "system";
              const fileName = `ai-transforms/${userFolder}/${Date.now()}.${format}`;
              const { error: uploadError } = await supabaseAdmin.storage
                .from("images")
                .upload(fileName, buffer, {
                  contentType: `image/${format}`,
                  upsert: true,
                });

              if (!uploadError) {
                const { data: publicData } = supabaseAdmin.storage
                  .from("images")
                  .getPublicUrl(fileName);
                if (publicData?.publicUrl) {
                  finalUrl = publicData.publicUrl;
                }
              }
            } catch (storageErr) {
              console.warn("Supabase upload in generateImageWithOpenAI skipped:", storageErr);
            }
          }
        }

        const engineLabel = modelCandidate === "gpt-image-1-mini"
          ? "OpenAI GPT-Image Mini"
          : modelCandidate === "gpt-image-1"
          ? "OpenAI GPT-Image 1 (Ultra HD)"
          : `OpenAI ${modelCandidate}`;

        return {
          url: finalUrl,
          engine: engineLabel,
        };
      } else {
        lastError = data.error?.message || `Failed to generate image with OpenAI (${modelCandidate})`;
      }
    } catch (err: unknown) {
      const errObj = err as { message?: string };
      lastError = errObj.message || "Network error generating image with OpenAI";
    }
  }

  return {
    url: null,
    engine: "OpenAI",
    error: lastError,
  };
}

export interface GarmentVisionOutput {
  suggestedTitle: string;
  enhancedDescription: string;
  suggestedMaterial: string;
  suggestedColors: string[];
  suggestedTags: string[];
  suggestedCare: string;
  suggestedCategory?: string;
  headline?: string;
  engineUsed: string;
  garmentType: "dress" | "top" | "bottom" | "jumpsuit" | "two_piece_set" | "outerwear" | "footwear" | "accessory";
  silhouette?: string;
  neckline?: string;
  sleeves?: string;
  fabricTexture?: string;
  keyAccents?: string[];
  topColor?: string;
  bottomColor?: string;
  isTwoTone?: boolean;
  hasSeparateTopAndBottom?: boolean;
  topShape?: string;
  bottomShape?: string;
  overallLook?: string;
}

/**
 * Multimodal Garment Vision Engine
 * PRIORITY: DeepSeek Flash (deepseek-flash) -> OpenAI Vision (gpt-4o-mini) -> Gemini 1.5 Flash -> Fallback
 */
export async function analyzeGarmentVision(params: {
  images: string[];
  productName?: string;
  categoryName?: string;
  notes?: string;
  customApiKey?: string;
}): Promise<GarmentVisionOutput> {
  const { images, productName = "", categoryName = "", notes = "", customApiKey } = params;

  const deepseekKey = customApiKey || process.env.DEEPSEEK_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  const systemPrompt = `You are an elite haute-couture fashion director and master garment cataloguer for TrendiZip, an authentic global fashion marketplace.
You possess deep expertise in garment architecture, African diaspora fashion (Ankara, Aso-Ebi, Kente, Boubou/Bubu, Kaftans, Agbada), streetwear, and global runway designs.

CRITICAL INTELLIGENCE RULE - BE SMART ABOUT TOP VS. DOWN:
Garments are NOT always divided into "top" and "down"! Do NOT force artificial top/down splits where they do not exist:

1. STANDALONE TOP / UPPER GARMENT ONLY:
   (T-shirts, shirts, blouses, hoodies, sweaters, blazers, jackets, crop tops, tank tops, cardigans, Agbada tops)
   * garmentType: "top" or "outerwear"
   * hasSeparateTopAndBottom: false
   * topColor: primary color/pattern of the top
   * topShape: cut and fit of the torso (e.g. "Boxy oversized fit with drop shoulders", "Fitted ribbed crop cut")
   * bottomColor: null (CRITICAL: NEVER fabricate a bottom color or skirt/pants!)
   * bottomShape: null (CRITICAL: leave null!)
   * neckline: specify neckline (e.g. "Ribbed Crew Neck", "Notched Lapel Collar", "Deep V-Neck")
   * sleeves: specify sleeves (e.g. "Short Sleeves", "Long Cuffed Sleeves", "Sleeveless")
   * suggestedCategory: "Tops & T-Shirts", "Shirts", "Jackets & Blazers", or "Hoodies & Sweatshirts"

2. STANDALONE BOTTOM / LOWER GARMENT ONLY:
   (Trousers, jeans, denim shorts, cargo pants, pleated skirts, pencil skirts, joggers, sweatpants, leggings)
   * garmentType: "bottom"
   * hasSeparateTopAndBottom: false
   * bottomColor: primary color or wash (e.g. "Raw Indigo Wash", "Washed Charcoal Grey")
   * bottomShape: waist rise and leg cut (e.g. "High-waisted wide-leg drape with puddle hem", "Mid-rise tapered cargo fit")
   * topColor: null (CRITICAL: NEVER fabricate a top/bodice color!)
   * topShape: null (CRITICAL: leave null!)
   * neckline: null (leave null!)
   * sleeves: null (leave null!)
   * suggestedCategory: "Trousers & Jeans", "Skirts", or "Shorts"

3. UNIFIED ONE-PIECE DRESS / KAFTAN / JUMPSUIT / GOWN (Continuous Silhouette):
   (Slip dresses, bodycon dresses, maxi gowns, boubous, kaftans, jumpsuits, rompers)
   * If the garment is a continuous single-fabric / monochrome design:
     - garmentType: "dress" or "jumpsuit"
     - hasSeparateTopAndBottom: false
     - isTwoTone: false
     - topColor: primary unified color
     - bottomColor: null (DO NOT repeat the same color for top and bottom!)
     - Focus on the continuous silhouette, fluid drape from shoulder to hem, neckline, and sleeves.
     - suggestedCategory: "Dresses" or "Jumpsuits & Playsuits"
   * If the dress has genuine TWO-TONE or CONTRAST-BODICE blocking (e.g. Black corset bodice + White silk skirt):
     - garmentType: "dress"
     - hasSeparateTopAndBottom: true
     - isTwoTone: true
     - topColor: bodice color
     - bottomColor: skirt color
     - topShape: bodice cut
     - bottomShape: skirt silhouette

4. TWO-PIECE CO-ORD SET / SUIT:
   (Matching top + skirt, blazer + tailored trousers, two-piece Ankara co-ord)
   * garmentType: "two_piece_set"
   * hasSeparateTopAndBottom: true
   * topColor: upper piece color
   * bottomColor: lower piece color
   * topShape: upper piece cut
   * bottomShape: lower piece cut
   * suggestedCategory: "Co-ords & Sets"

5. FOOTWEAR OR ACCESSORIES:
   (Sneakers, heels, boots, handbags, hats, jewelry)
   * garmentType: "footwear" or "accessory"
   * hasSeparateTopAndBottom: false
   * topColor: null, bottomColor: null, topShape: null, bottomShape: null
   * suggestedCategory: "Shoes" or "Accessories"

CRITICAL: Return ONLY a valid JSON object matching this schema without markdown code fences:
{
  "garmentType": "dress | top | bottom | jumpsuit | two_piece_set | outerwear | footwear | accessory",
  "hasSeparateTopAndBottom": false,
  "suggestedTitle": "Precise, authentic boutique product title matching the actual garment type",
  "topColor": "Color of upper body (or null if bottom/shoes/accessories)",
  "bottomColor": "Color of lower body (or null if top/shoes/accessories or unified single-color dress)",
  "isTwoTone": false,
  "topShape": "Shape & cut of upper body (or null if bottom)",
  "bottomShape": "Shape & cut of lower body (or null if top)",
  "silhouette": "Overall garment silhouette (e.g. Flowing Maxi Dress, Boxy Oversized Tee, High-Waist Wide-Leg Trousers)",
  "overallLook": "Evocative summary of aesthetic mood, fabric drape, and style",
  "neckline": "Exact neckline (or null if bottom/accessory)",
  "sleeves": "Exact sleeve style (or null if bottom/accessory)",
  "fabricTexture": "Observed fabric texture (e.g. Heavyweight Combed Cotton, Liquid Silk Satin, Authentic Ankara Wax)",
  "keyAccents": ["Array of distinct accents e.g. High Thigh Slit, Ribbed Collar, Pleated Waistband, Corset Boning"],
  "enhancedDescription": "Practical, engaging 130-200 word e-commerce copy strictly matching the specific garment type and fit.",
  "suggestedMaterial": "Realistic textile composition (e.g. 100% Combed Cotton or Silk Satin)",
  "suggestedColors": ["Array of clean primary & accent color names"],
  "suggestedTags": ["6 to 9 specific fashion discovery keywords"],
  "suggestedCare": "Practical garment care instruction",
  "suggestedCategory": "Accurate category name matching the garment type",
  "headline": "Punchy 3-5 word marketing headline"
}`;

  const userTextPrompt = `Please analyze the attached garment image(s).
${productName ? `Initial Merchant Product Name: ${productName}` : "Merchant has not specified a title yet. Visually deduce what garment is shown."}
${categoryName ? `Selected Category: ${categoryName}` : ""}
${notes ? `Merchant Notes / Details: ${notes}` : ""}
Determine if this is a top-only, bottom-only, unified dress, two-piece set, footwear, or accessory. Be smart: do not assume phantom pieces or top/down splits where none exist.`;

  // Helper to sanitize vision output and enforce strict top/down smartness
  const sanitizeOutput = (parsed: Partial<GarmentVisionOutput>, engineName: string): GarmentVisionOutput => {
    const rawCat = (parsed.suggestedCategory || categoryName || "").toLowerCase();
    const rawTitle = (parsed.suggestedTitle || productName || "").toLowerCase();

    // Auto-resolve garmentType if not explicitly provided
    let detectedType: GarmentVisionOutput["garmentType"] = parsed.garmentType || "dress";
    if (!parsed.garmentType) {
      if (rawCat.includes("pant") || rawCat.includes("jean") || rawCat.includes("skirt") || rawCat.includes("short") || rawTitle.includes("pant") || rawTitle.includes("jean") || rawTitle.includes("trouser") || rawTitle.includes("skirt")) {
        detectedType = "bottom";
      } else if (rawCat.includes("tee") || rawCat.includes("top") || rawCat.includes("shirt") || rawCat.includes("hoodie") || rawCat.includes("blazer") || rawCat.includes("jacket") || rawTitle.includes("tee") || rawTitle.includes("shirt") || rawTitle.includes("hoodie") || rawTitle.includes("blazer")) {
        detectedType = "top";
      } else if (rawCat.includes("shoe") || rawCat.includes("footwear") || rawTitle.includes("sneaker") || rawTitle.includes("heel") || rawTitle.includes("boot") || rawTitle.includes("loafer")) {
        detectedType = "footwear";
      } else if (rawCat.includes("accessory") || rawCat.includes("bag") || rawTitle.includes("bag") || rawTitle.includes("hat") || rawTitle.includes("tote")) {
        detectedType = "accessory";
      } else if (rawCat.includes("set") || rawCat.includes("co-ord") || rawCat.includes("suit") || rawTitle.includes("co-ord") || rawTitle.includes("two-piece") || rawTitle.includes("set")) {
        detectedType = "two_piece_set";
      } else {
        detectedType = "dress";
      }
    }

    // Determine if there is truly a separate top and bottom
    const isSeparate = parsed.hasSeparateTopAndBottom ?? (
      detectedType === "two_piece_set" ||
      Boolean(parsed.isTwoTone) ||
      (Boolean(parsed.topColor && parsed.bottomColor) && parsed.topColor?.toLowerCase().trim() !== parsed.bottomColor?.toLowerCase().trim())
    );

    let topColor = parsed.topColor || undefined;
    let bottomColor = parsed.bottomColor || undefined;
    let topShape = parsed.topShape || undefined;
    let bottomShape = parsed.bottomShape || undefined;
    let neckline = parsed.neckline;
    let sleeves = parsed.sleeves;

    // Strict sanitation per garment type
    if (detectedType === "top" || detectedType === "outerwear") {
      bottomColor = undefined;
      bottomShape = undefined;
    } else if (detectedType === "bottom") {
      topColor = undefined;
      topShape = undefined;
      neckline = undefined;
      sleeves = undefined;
    } else if (detectedType === "footwear" || detectedType === "accessory") {
      topColor = undefined;
      bottomColor = undefined;
      topShape = undefined;
      bottomShape = undefined;
      neckline = undefined;
      sleeves = undefined;
    } else if ((detectedType === "dress" || detectedType === "jumpsuit") && !isSeparate) {
      // For unified dresses, avoid redundant duplicate colors
      if (topColor && bottomColor && topColor.toLowerCase().trim() === bottomColor.toLowerCase().trim()) {
        bottomColor = undefined;
      }
    }

    return {
      suggestedTitle: parsed.suggestedTitle || productName || "Premium Fashion Garment",
      enhancedDescription: parsed.enhancedDescription || "Expertly crafted clothing piece tailored for daily style and comfortable fit.",
      suggestedMaterial: parsed.suggestedMaterial || "100% Premium Fabric Blend",
      suggestedColors: Array.isArray(parsed.suggestedColors) ? parsed.suggestedColors : [],
      suggestedTags: Array.isArray(parsed.suggestedTags) ? parsed.suggestedTags : ["Fashion Essential"],
      suggestedCare: parsed.suggestedCare || "Machine wash cold inside out with similar colors. Line dry.",
      suggestedCategory: parsed.suggestedCategory || categoryName || "Clothing",
      headline: parsed.headline || "Essential Wardrobe Piece",
      engineUsed: engineName,
      garmentType: detectedType,
      hasSeparateTopAndBottom: isSeparate,
      silhouette: parsed.silhouette,
      neckline,
      sleeves,
      fabricTexture: parsed.fabricTexture,
      keyAccents: Array.isArray(parsed.keyAccents) ? parsed.keyAccents : [],
      topColor,
      bottomColor,
      isTwoTone: Boolean(parsed.isTwoTone),
      topShape,
      bottomShape,
      overallLook: parsed.overallLook || undefined,
    };
  };

  // 1. PRIMARY: DeepSeek Flash Multimodal Vision
  if (deepseekKey) {
    try {
      const contentPayload: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
        { type: "text", text: userTextPrompt }
      ];

      for (const img of images.slice(0, 3)) {
        if (img && (img.startsWith("http") || img.startsWith("data:image/"))) {
          contentPayload.push({
            type: "image_url",
            image_url: { url: img }
          });
        }
      }

      const res = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${deepseekKey.trim()}`,
        },
        body: JSON.stringify({
          model: "deepseek-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: contentPayload },
          ],
          temperature: 0.2,
          max_tokens: 1500,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (content && typeof content === "string") {
          const parsed = extractJSON<Partial<GarmentVisionOutput>>(content);
          if (parsed && (parsed.suggestedTitle || parsed.enhancedDescription)) {
            return sanitizeOutput(parsed, "DeepSeek Flash Vision");
          }
        }
      } else {
        console.warn("DeepSeek Vision API response not ok:", res.status, await res.text().catch(() => ""));
      }
    } catch (err) {
      console.warn("DeepSeek Vision API error, falling back to OpenAI:", err);
    }
  }

  // 2. SECONDARY: OpenAI Vision (gpt-4o-mini)
  if (openaiKey) {
    try {
      const contentPayload: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
        { type: "text", text: userTextPrompt }
      ];

      for (const img of images.slice(0, 3)) {
        if (img && (img.startsWith("http") || img.startsWith("data:image/"))) {
          contentPayload.push({
            type: "image_url",
            image_url: { url: img }
          });
        }
      }

      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey.trim()}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: contentPayload },
          ],
          temperature: 0.2,
          max_tokens: 1500,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (content && typeof content === "string") {
          const parsed = extractJSON<Partial<GarmentVisionOutput>>(content);
          if (parsed && (parsed.suggestedTitle || parsed.enhancedDescription)) {
            return sanitizeOutput(parsed, "OpenAI Vision Engine");
          }
        }
      }
    } catch (err) {
      console.warn("OpenAI Vision error, falling back to Gemini:", err);
    }
  }

  // 3. TERTIARY: Gemini 1.5 Flash Vision
  if (geminiKey) {
    try {
      const parts: Array<{ text?: string; inline_data?: { mime_type: string; data: string } }> = [
        { text: `${systemPrompt}\n\n${userTextPrompt}` }
      ];

      for (const img of images.slice(0, 3)) {
        if (img) {
          if (img.startsWith("data:image/")) {
            const matches = img.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
            if (matches) {
              parts.push({
                inline_data: {
                  mime_type: matches[1],
                  data: matches[2]
                }
              });
            }
          }
        }
      }

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 1500 }
          })
        }
      );

      if (res.ok) {
        const data = await res.json();
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (content && typeof content === "string") {
          const parsed = extractJSON<Partial<GarmentVisionOutput>>(content);
          if (parsed && (parsed.suggestedTitle || parsed.enhancedDescription)) {
            return sanitizeOutput(parsed, "Gemini Vision Engine");
          }
        }
      }
    } catch (err) {
      console.warn("Gemini Vision error:", err);
    }
  }

  // 4. Smart deterministic fallback
  const isLowerCategory = categoryName?.toLowerCase() || "";
  const isTopItem = isLowerCategory.includes("tee") || isLowerCategory.includes("shirt") || isLowerCategory.includes("top") || isLowerCategory.includes("hoodie");
  const isBottomItem = isLowerCategory.includes("pant") || isLowerCategory.includes("jean") || isLowerCategory.includes("skirt") || isLowerCategory.includes("short");

  if (isTopItem) {
    return {
      suggestedTitle: productName || "Everyday Premium Cotton Crewneck Tee",
      enhancedDescription: "Crafted from 100% ultra-soft combed cotton for everyday breathability and effortless style. Designed with a classic crew neck and a comfortable modern fit.",
      suggestedMaterial: "100% Ultra-Soft Combed Cotton",
      suggestedColors: ["Classic Black", "Pure White"],
      suggestedTags: ["Cotton Tee", "Casual Top", "Everyday Wear", "TrendiZip"],
      suggestedCare: "Machine wash cold inside-out with like colors. Line dry.",
      suggestedCategory: categoryName || "Tops & T-Shirts",
      headline: "Essential Daily Style",
      engineUsed: "Trendi Smart Garment Telemetry",
      garmentType: "top",
      silhouette: "Modern Regular Fit",
      neckline: "Classic Crew Neck",
      sleeves: "Short Sleeves",
      fabricTexture: "Soft Breathable Jersey Knit",
      topColor: "Classic Tone",
      topShape: "Regular Fit Torso",
      overallLook: "Clean everyday essential casualwear",
    };
  }

  if (isBottomItem) {
    return {
      suggestedTitle: productName || "Tailored Wide-Leg Comfort Bottoms",
      enhancedDescription: "Cut for a clean profile with just the right amount of stretch for natural movement. Features reinforced seams and a comfortable modern waistband.",
      suggestedMaterial: "Stretch Cotton Twill & Denim Blend",
      suggestedColors: ["Midnight Black", "Indigo Blue"],
      suggestedTags: ["Comfort Bottoms", "Modern Fit", "Everyday Wear", "TrendiZip"],
      suggestedCare: "Machine wash cold inside-out. Line dry.",
      suggestedCategory: categoryName || "Trousers & Jeans",
      headline: "Tailored Comfort Fit",
      engineUsed: "Trendi Smart Garment Telemetry",
      garmentType: "bottom",
      silhouette: "Tailored Wide-Leg Silhouette",
      fabricTexture: "Durable Cotton Twill",
      bottomColor: "Neutral Tone",
      bottomShape: "Comfort Rise Straight/Wide Leg",
      overallLook: "Sharp versatile daily bottoms",
    };
  }

  return {
    suggestedTitle: productName || "Tailored Elegant Silhouette Dress",
    enhancedDescription: "Designed with a flattering drape, feminine silhouette, and fluid movement. Crafted with breathable, high-grade fabric that keeps its shape from afternoon outings to evening dinners.",
    suggestedMaterial: "Satin Silk & Lightweight Fluid Crepe",
    suggestedColors: ["Emerald Green", "Classic Black"],
    suggestedTags: ["Maxi Dress", "Evening Gown", "Chic Silhouette", "Flattering Fit", "TrendiZip"],
    suggestedCare: "Hand wash cold or dry clean. Line dry in shade. Cool iron on reverse.",
    suggestedCategory: categoryName || "Dresses",
    headline: "Flattering Evening Silhouette",
    engineUsed: "Trendi Smart Garment Telemetry",
    garmentType: "dress",
    silhouette: "Flattering Midi/Maxi Cut",
    neckline: "Classic Flattering Neckline",
    sleeves: "Versatile Cut",
    fabricTexture: "Fluid Crepe / Satin",
    keyAccents: ["Flattering Drape", "Feminine Silhouette"],
    topColor: "Classic Tone",
    bottomColor: "Matching Tone",
    isTwoTone: false,
    topShape: "Fitted Bodice",
    bottomShape: "Fluid Draped Skirt",
    overallLook: "Refined everyday or evening elegance",
  };
}
