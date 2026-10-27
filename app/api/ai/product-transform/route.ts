import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase";
import sharp from "sharp";

async function runReplicatePrediction(
  modelPath: string,
  inputParams: Record<string, unknown>,
  token: string
): Promise<string> {
  const cleanToken = token.trim();
  const url = modelPath.startsWith("http")
    ? modelPath
    : `https://api.replicate.com/v1/models/${modelPath}/predictions`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cleanToken}`,
      Prefer: "wait=30",
    },
    body: JSON.stringify({ input: inputParams }),
  });

  const responseText = await res.text();
  if (!res.ok) {
    console.error(`[Replicate API Error] Status ${res.status}:`, responseText);
    let errMsg = `HTTP ${res.status} error from Replicate`;
    try {
      const parsed = JSON.parse(responseText);
      errMsg = parsed.detail || parsed.error || responseText;
    } catch {
      // Ignore JSON parse error
    }
    throw new Error(errMsg);
  }

  let data = JSON.parse(responseText);
  let outputUrl = Array.isArray(data.output)
    ? data.output[0]
    : typeof data.output === "string"
    ? data.output
    : "";

  let attempts = 0;
  while (
    !outputUrl &&
    data.urls?.get &&
    attempts < 10 &&
    (data.status === "starting" || data.status === "processing")
  ) {
    await new Promise((r) => setTimeout(r, 2000));
    attempts++;
    const pollRes = await fetch(data.urls.get, {
      headers: { Authorization: `Bearer ${cleanToken}` },
    });
    if (pollRes.ok) {
      data = await pollRes.json();
      outputUrl = Array.isArray(data.output)
        ? data.output[0]
        : typeof data.output === "string"
        ? data.output
        : "";
      if (data.status === "failed" || data.status === "canceled") {
        throw new Error(`Prediction ${data.status}: ${data.error || "Unknown error"}`);
      }
    }
  }

  if (!outputUrl) {
    throw new Error("Replicate prediction completed but returned no output image URL.");
  }

  return outputUrl;
}

/**
 * In-memory cache for garment vision descriptions.
 * Key = imageUrl, Value = { desc, expiresAt }
 * Prevents calling GPT-4o-mini vision on every generation of the same product.
 */
interface GarmentVisionInfo {
  summary: string;
  hasPerson: boolean;
  personDescription: string;
  exactText: string;
  graphicDetails: string;
}

/**
 * In-memory cache for garment vision analysis.
 * Key = imageUrl, Value = { data: GarmentVisionInfo, expiresAt }
 */
const garmentDescCache = new Map<string, { data: GarmentVisionInfo; expiresAt: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Analyze garment with GPT-4o-mini to transcribe exact text on shirt,
 * detect graphics/logos, and identify apparel characteristics.
 * Uses safe fashion catalog phrasing so OpenAI safety filters never trigger refusals.
 */
async function analyzeGarmentForEdit(imageUrl: string, apiKey: string): Promise<GarmentVisionInfo> {
  const cached = garmentDescCache.get(imageUrl);
  if (cached && cached.expiresAt > Date.now()) {
    console.log("[Vision] Garment description cache HIT");
    return cached.data;
  }

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `You are an expert fashion catalog computer vision model. Inspect this apparel product photo with extreme precision:

1. MODEL: Is a real person or human model wearing or presenting the garment? (Describe their posture, pose, and overall presentation without assessing biometric identity).
2. PRINTED TEXT: Quote every single word or lettering on the apparel in "quotes" (e.g. text: "VALHALLA", font style, placement). If none, write None.
3. GRAPHICS & ARTWORK: Detail every illustration, logo, emblem, symbol, or pattern (e.g. wings, warrior, eagle, compass, sleeve filigree). If none, write None.
4. GARMENT CUT & COLOR: Garment type (t-shirt, hoodie, etc.), neckline (V-neck, crewneck), collar trim, sleeve style, exact base fabric color, accent colors.

Format output strictly as:
MODEL: <details or None>
TEXT: <exact quoted words or None>
GRAPHIC: <details or None>
GARMENT: <details>`,
              },
              {
                type: "image_url",
                image_url: { url: imageUrl, detail: "high" },
              },
            ],
          },
        ],
        max_tokens: 600,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content?.trim() || "";

      if (content && !content.toLowerCase().includes("unable to help")) {
        const modelMatch = content.match(/MODEL:\s*([^\n]+(?:\n(?!TEXT:|GRAPHIC:|GARMENT:)[^\n]+)*)/i);
        const textMatch = content.match(/TEXT:\s*([^\n]+(?:\n(?!GRAPHIC:|GARMENT:|MODEL:)[^\n]+)*)/i);
        const graphicMatch = content.match(/GRAPHIC:\s*([^\n]+(?:\n(?!GARMENT:|MODEL:|TEXT:)[^\n]+)*)/i);
        const garmentMatch = content.match(/GARMENT:\s*([^\n]+(?:\n(?!MODEL:|TEXT:|GRAPHIC:)[^\n]+)*)/i);

        const modelRaw = modelMatch ? modelMatch[1].trim() : "";
        const textRaw = textMatch ? textMatch[1].trim() : "";
        const graphicRaw = graphicMatch ? graphicMatch[1].trim() : "";
        const garmentRaw = garmentMatch ? garmentMatch[1].trim() : content;

        const hasPerson = Boolean(
          modelRaw &&
          !modelRaw.toLowerCase().includes("no person") &&
          !modelRaw.toLowerCase().includes("none") &&
          !modelRaw.toLowerCase().includes("mannequin") &&
          !modelRaw.toLowerCase().includes("hanger")
        );
        const hasText = Boolean(textRaw && !textRaw.toLowerCase().includes("none") && !textRaw.toLowerCase().includes("no text"));
        const hasGraphic = Boolean(graphicRaw && !graphicRaw.toLowerCase().includes("none") && !graphicRaw.toLowerCase().includes("no graphic"));

        const result: GarmentVisionInfo = {
          summary: garmentRaw,
          hasPerson,
          personDescription: hasPerson ? modelRaw : "",
          exactText: hasText ? textRaw : "",
          graphicDetails: hasGraphic ? graphicRaw : "",
        };

        garmentDescCache.set(imageUrl, { data: result, expiresAt: Date.now() + CACHE_TTL_MS });
        return result;
      }
    }
  } catch (err) {
    console.warn("[Vision] Garment analysis failed, skipping:", err);
  }

  return {
    summary: "Garment piece from product photo",
    hasPerson: false,
    personDescription: "",
    exactText: "",
    graphicDetails: "",
  };
}

/**
 * Helper to download/parse an image and normalize it with sharp to a clean PNG buffer.
 * Ensures image dimensions and size are ideal for OpenAI v1/images/edits.
 */
async function prepareImageForEdits(imageUrl: string): Promise<{ buffer: Buffer; mimeType: string }> {
  let rawBuf: Buffer;
  let rawMime = "image/png";

  if (imageUrl.startsWith("data:")) {
    const matches = imageUrl.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    if (matches) {
      rawMime = matches[1] || "image/png";
      rawBuf = Buffer.from(matches[2], "base64");
    } else {
      rawBuf = Buffer.from(imageUrl.replace(/^data:[^;]+;base64,/, ""), "base64");
    }
  } else {
    const res = await fetch(imageUrl);
    if (!res.ok) throw new Error(`Could not download image (HTTP ${res.status})`);
    const arrayBuffer = await res.arrayBuffer();
    rawBuf = Buffer.from(arrayBuffer);
    const ct = res.headers.get("content-type");
    if (ct) rawMime = ct.split(";")[0].trim();
  }

  try {
    let pipeline = sharp(rawBuf);
    const meta = await pipeline.metadata();

    // Downscale if unusually large (> 1536px) to stay comfortably under 4MB limit
    if (meta.width && meta.height && (meta.width > 1536 || meta.height > 1536)) {
      pipeline = pipeline.resize({
        width: 1536,
        height: 1536,
        fit: "inside",
        withoutEnlargement: true,
      });
    }

    // Pure lossless PNG encoding with maximum compression effort and zero palette loss
    const pngBuf = await pipeline
      .png({ compressionLevel: 6, adaptiveFiltering: true })
      .toBuffer();
    return { buffer: pngBuf, mimeType: "image/png" };
  } catch (sharpErr) {
    console.warn("[AI Product Transform] sharp normalization fallback:", sharpErr);
    return { buffer: rawBuf, mimeType: rawMime };
  }
}

/**
 * Generate commercial-grade visual using OpenAI's image engine.
 * PRIMARY: v1/images/edits with the actual input image (Image-to-Image editing),
 * ensuring the person's face, skin tone, hair, and the shirt's exact cuts,
 * seams, print graphics, and typography are directly preserved from the pixels!
 *
 * FALLBACK: v1/images/generations (Text-to-Image) if edits endpoint errors.
 */
async function runOpenAIGeneration(
  imageUrl: string,
  prompt: string,
  tier: "exclusive" | "pro" | string,
  apiKey: string,
  userId: string
): Promise<{ imageUrl: string; engineUsed: string; error?: string }> {
  const cleanKey = apiKey.trim();

  // Exclusive uses gpt-image-2.5-sunburst for supreme aesthetic fidelity & accuracy (with gpt-image-2 fallback)
  // Pro uses gpt-image-1 with input_fidelity: "low" (saving 4,160+ tokens) for cost-effective commercial rendering
  const models = tier === "exclusive"
    ? ["gpt-image-2.5-sunburst", "gpt-image-2", "gpt-image-1"]
    : ["gpt-image-1", "gpt-image-2.5-sunburst"];

  let lastErr = "";

  // 1. PRIMARY STRATEGY: v1/images/edits with the ACTUAL image
  try {
    const { buffer: imgBuf, mimeType } = await prepareImageForEdits(imageUrl);
    const ext = mimeType.includes("jpeg") || mimeType.includes("jpg") ? "jpg" : "png";

    for (const model of models) {
      try {
        const formData = new FormData();
        const blob = new Blob([imgBuf], { type: mimeType });
        formData.append("image", blob, `garment-source.${ext}`);
        formData.append("prompt", prompt);
        formData.append("model", model);
        formData.append("size", "1024x1024");
        formData.append("quality", "high");
        if (model === "gpt-image-1") {
          formData.append("input_fidelity", "low");
        }

        const res = await fetch("https://api.openai.com/v1/images/edits", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${cleanKey}`,
          },
          body: formData,
          signal: AbortSignal.timeout(90000),
        });

        const data = await res.json();
        if (res.ok && data.data?.[0]) {
          const item = data.data[0];
          let outputUrl = item.url || "";

          if (item.b64_json) {
            let buf = Buffer.from(item.b64_json, "base64");

            // Micro-sharpening pass using sharp: enhances micro-contrast, fabric weave,
            // crisp graphic lines and eye/hair clarity to eliminate any neural softness/blur.
            try {
              buf = await sharp(buf)
                .sharpen({ sigma: 1.0, m1: 0.6, m2: 2.5 })
                .png({ compressionLevel: 6 })
                .toBuffer();
            } catch (sharpErr) {
              console.warn("[Post-process Sharpening Warning]", sharpErr);
            }

            let publicUrl = `data:image/png;base64,${buf.toString("base64")}`;
            if (supabaseAdmin) {
              try {
                const storagePath = `ai-transforms/${userId}/${Date.now()}.png`;
                const { error: upErr } = await supabaseAdmin.storage
                  .from("images")
                  .upload(storagePath, buf, { contentType: "image/png", upsert: true });
                if (!upErr) {
                  const { data: pd } = supabaseAdmin.storage.from("images").getPublicUrl(storagePath);
                  if (pd?.publicUrl) publicUrl = pd.publicUrl;
                }
              } catch (storageErr) {
                console.warn("[Supabase Upload Warning]", storageErr);
              }
            }
            outputUrl = publicUrl;
          }

          if (outputUrl) {
            const label = tier === "exclusive" ? "Ultra Editorial" : "Studio Catalog";
            return { imageUrl: outputUrl, engineUsed: label };
          }
        } else {
          lastErr = data.error?.message || `OpenAI edits ${model} failed`;
          console.warn(`[AI Product Transform] edits ${model} error:`, lastErr);
        }
      } catch (err: unknown) {
        const e = err as { message?: string };
        lastErr = e.message || `OpenAI edits ${model} exception`;
        console.warn(`[AI Product Transform] edits ${model} exception:`, lastErr);
      }
    }
  } catch (imgPrepErr: unknown) {
    const e = imgPrepErr as { message?: string };
    console.warn("[AI Product Transform] prepareImageForEdits error:", e.message);
  }

  // 2. FALLBACK STRATEGY: v1/images/generations (text-to-image fallback)
  for (const model of models) {
    try {
      const res = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cleanKey}`,
        },
        body: JSON.stringify({
          model,
          prompt,
          n: 1,
          size: "1024x1024",
        }),
        signal: AbortSignal.timeout(90000),
      });

      const data = await res.json();
      if (res.ok && data.data?.[0]) {
        const item = data.data[0];
        let outputUrl = item.url || "";
        if (item.b64_json) {
          let buf = Buffer.from(item.b64_json, "base64");
          try {
            buf = await sharp(buf)
              .sharpen({ sigma: 1.0, m1: 0.6, m2: 2.5 })
              .png({ compressionLevel: 6 })
              .toBuffer();
          } catch (sharpErr) {
            console.warn("[Post-process Sharpening Warning]", sharpErr);
          }

          let publicUrl = `data:image/png;base64,${buf.toString("base64")}`;
          if (supabaseAdmin) {
            try {
              const storagePath = `ai-transforms/${userId}/${Date.now()}.png`;
              const { error: upErr } = await supabaseAdmin.storage
                .from("images")
                .upload(storagePath, buf, { contentType: "image/png", upsert: true });
              if (!upErr) {
                const { data: pd } = supabaseAdmin.storage.from("images").getPublicUrl(storagePath);
                if (pd?.publicUrl) publicUrl = pd.publicUrl;
              }
            } catch (storageErr) {
              console.warn("[Supabase Upload Warning]", storageErr);
            }
          }
          outputUrl = publicUrl;
        }

        if (outputUrl) {
          const label = tier === "exclusive" ? "Ultra Editorial" : "Studio Catalog";
          return { imageUrl: outputUrl, engineUsed: label };
        }
      } else {
        lastErr = data.error?.message || `OpenAI generations ${model} failed`;
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      lastErr = e.message || "OpenAI generations exception";
    }
  }

  return { imageUrl: "", engineUsed: "OpenAI", error: lastErr };
}



export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { 
      imageUrl, 
      productId = "",
      targetColor = "none",
      targetBackground = "none",
      stylePreset = "",
      customInstruction = "",
      // presentationMode: "shirt_only" = product only / ghost mannequin, "from_photo" = keep original, "imagined" / "female" / "male" = add model
      presentationMode = "shirt_only",
      modelDirective: rawModelDirective = "none",
      modelEthnicity = "any",
      provider = "ai",
      customApiKey = "",
      garmentText = "",
      preservePerson = false,
      preservePrint = true,
      preserveShirtDesign = true,
    } = body;

    if (!imageUrl) {
      return NextResponse.json({ error: "Product image URL is required" }, { status: 400 });
    }

    // Load actual product from database if productId or imageUrl is available
    let dbProduct: {
      id: string;
      name: string;
      description: string | null;
      material: string | null;
      colors: string[];
    } | null = null;

    try {
      if (productId) {
        dbProduct = await prisma.product.findUnique({
          where: { id: productId },
          select: {
            id: true,
            name: true,
            description: true,
            material: true,
            colors: true,
          },
        });
      } else if (imageUrl) {
        dbProduct = await prisma.product.findFirst({
          where: {
            images: { has: imageUrl },
            isDeleted: false,
          },
          select: {
            id: true,
            name: true,
            description: true,
            material: true,
            colors: true,
          },
        });
      }
    } catch (dbErr) {
      console.warn("[product-transform] DB lookup error:", dbErr);
    }

    // Determine engine tier: "free" (0 cr), "pro" (1 cr), "exclusive" (2 cr)
    const isExclusiveEngine = provider === "exclusive";
    const isProEngine = provider === "pro" || provider === "dalle3";
    const isFreeEngine = provider === "ai" || provider === "pollinations" || (!isExclusiveEngine && !isProEngine);
    const creditsRequired = isExclusiveEngine ? 2 : isProEngine ? 1 : 0;

    // Check professional profile & credit balance
    const profile = await prisma.professionalProfile.findUnique({
      where: { userId: user.id },
    });

    const isSystemAdmin = ["ADMIN", "SUPER_ADMIN"].includes(user.role);
    const rawProfile = profile as Record<string, unknown> | null;
    const availableCredits = (rawProfile?.aiCreditsBalance as number) ?? 10;

    // Reject only if user selected a PRO / EXCLUSIVE engine AND has insufficient credits
    if (creditsRequired > 0 && !isSystemAdmin && availableCredits < creditsRequired) {
      return NextResponse.json({ 
        error: `You need ${creditsRequired} credit${creditsRequired > 1 ? "s" : ""} for ${isExclusiveEngine ? "Ultra Editorial (2 Credits)" : "Studio Catalog (1 Credit)"}. You have ${availableCredits} credits remaining. Switch to Quick Preview or top up credits.`,
        remainingCredits: availableCredits
      }, { status: 402 });
    }

    const openaiKey = customApiKey || process.env.OPENAI_API_KEY;
    const replicateToken = customApiKey || process.env.REPLICATE_API_TOKEN;
    let transformedImageUrl = "";
    let actualProviderUsed = "High-Speed Free AI Engine";

    const isColorChanged = targetColor && !["no color change", "none", "keep original", ""].includes(targetColor.toLowerCase());
    const isStyleChanged = stylePreset && !["none", "no preset", ""].includes(stylePreset.toLowerCase());
    const bgKey = (targetBackground || "").toLowerCase().trim();
    const isCutout = bgKey === "cutout" || bgKey === "transparent" || bgKey.includes("cutout") || bgKey.includes("isolated");
    const keepOriginalBg = !targetBackground || ["original", "keep original", "none", ""].includes(bgKey) && !isCutout;

    // --- VISION ANALYSIS (RUN FOR ALL ENGINES TO ANCHOR TEXT, PERSON & SHIRT DESIGN) ---
    let vision: GarmentVisionInfo = {
      summary: dbProduct?.name ? `${dbProduct.name} apparel item` : "Garment piece from product photo",
      hasPerson: false,
      personDescription: "",
      exactText: "",
      graphicDetails: "",
    };

    if (openaiKey) {
      vision = await analyzeGarmentForEdit(imageUrl, openaiKey);
    }

    // 0. STRICT SHIRT DESIGN LOCK (PREVENTS SHIRT DESIGN FROM BEING ALTERED)
    const prodName = dbProduct?.name ? `"${dbProduct.name}"` : "garment";
    const prodMat = dbProduct?.material ? ` in ${dbProduct.material}` : "";
    let garmentDesignDirective = "";
    if (preserveShirtDesign && (!stylePreset || stylePreset === "none")) {
      garmentDesignDirective = `GARMENT SILHOUETTE & DESIGN LOCK: Preserve the exact ${prodName}${prodMat} construction, neckline cut, sleeve length, cuffs, and tailoring from the photo. Do NOT redesign or recut the garment.`;
    }

    // 1. TEXT ON SHIRT / TYPOGRAPHY DIRECTIVE
    const effectiveText = garmentText?.trim() || vision.exactText;
    let textDirective = "";
    if (effectiveText && preservePrint) {
      textDirective = `EXACT TYPOGRAPHY & LETTERING: The garment prominently features "${effectiveText}". Preserve this exact text with 100% exact spelling, typography font style, color, and placement. Absolutely do NOT scramble, blur, misspell, or alter words.`;
    }

    // 2. GRAPHIC / LOGO DIRECTIVE (DYNAMIC FROM DB & VISION, NOT HARDCODED)
    let graphicDirective = "";
    if (preservePrint) {
      const detectedArtwork = vision.graphicDetails || (dbProduct?.description ? `artwork described as: ${dbProduct.description}` : "artwork, logos, and printed graphics on the garment");
      graphicDirective = `EXACT ARTWORK & GRAPHICS: Preserve all illustrations, logos, emblems, and graphic prints (${detectedArtwork}) exactly as shown in the source photo with sharp crisp detail. Do NOT omit or alter any graphics.`;
    }

    // 3. PERSON / MODEL PRESENTATION DIRECTIVE
    const isProductOnly = presentationMode === "shirt_only" || presentationMode === "ghost" || presentationMode === "product_only";
    const isFromPhoto = presentationMode === "from_photo" || (presentationMode === "original" && preservePerson);
    const isImagined = presentationMode === "imagined" || presentationMode === "female" || presentationMode === "male" || presentationMode === "model";

    let personDirective = "";
    if (isProductOnly) {
      personDirective = `STRICT PRODUCT-ONLY PRESENTATION: Do NOT generate or include any human model, person, face, head, hair, skin, arms, hands, legs, or human body. Display ONLY the garment product cleanly on an invisible 3D ghost mannequin form or clean studio flat-lay presentation. The entire visual must focus 100% on the isolated garment with pristine tailoring and clean crisp borders.`;
    } else if (isFromPhoto) {
      personDirective = `STRICT REAL MODEL PRESERVATION: Keep the EXACT same person wearing the garment from the uploaded photo. Retain their identical face, facial features, eyes, nose, lips, natural skin tone, hair, facial expression, and body shape without alteration. Do NOT replace or swap the person.`;
    } else if (isImagined) {
      const gender = (presentationMode === "male" || rawModelDirective?.toLowerCase().includes("male")) ? "male" : "female";
      const ethnicityDesc =
        modelEthnicity === "black" ? "Black African / Afro-descendant" :
        modelEthnicity === "white" ? "Caucasian / White" :
        modelEthnicity === "asian" ? "East Asian" :
        modelEthnicity === "south_asian" ? "South Asian / Desi" :
        modelEthnicity === "latino" ? "Hispanic / Latino" :
        modelEthnicity === "middle_eastern" ? "Middle Eastern" : "";

      let modelDesc = rawModelDirective && rawModelDirective !== "none" ? rawModelDirective : "";
      if (!modelDesc) {
        modelDesc = `professional ${ethnicityDesc ? ethnicityDesc + " " : ""}${gender} fashion model in an upright natural standing posture`;
      } else if (ethnicityDesc && !modelDesc.toLowerCase().includes(ethnicityDesc.toLowerCase())) {
        modelDesc = `${ethnicityDesc} ${modelDesc}`;
      }

      personDirective = `FASHION MODEL PRESENTATION: Place the garment on an attractive, stylish ${modelDesc} with natural skin tones and runway composure. Commercial editorial catalog photoshoot, highlighting garment fit, tailoring, and natural fabric drape.`;
    } else {
      personDirective = `Keep garment presentation exactly as shown in the source photo. Clean commercial composition.`;
    }

    // 4. COLOR DIRECTIVE (DYNAMIC FROM DB & VISION, NOT HARDCODED)
    const dbColorsDesc = dbProduct?.colors && dbProduct.colors.length > 0 ? `(${dbProduct.colors.join(", ")})` : "";
    const colorDirective = isColorChanged
      ? `Recolor ONLY the base fabric of the garment to ${targetColor}. Maintain all graphics, typography, and accent trims in their original colors and positions.`
      : dbColorsDesc
      ? `STRICT COLOR INTEGRITY: Keep the exact authentic original garment colors ${dbColorsDesc} from the source photo. Do NOT shift, discolor, or tint the fabric.`
      : `STRICT COLOR INTEGRITY: Keep the exact original fabric colors from the uploaded photo. Do NOT shift, tint, or discolor the fabric.`;

    // 5. STYLE DIRECTIVE
    let styleDirective = "";
    if (stylePreset === "traditional" || stylePreset.toLowerCase().includes("traditional") || stylePreset.toLowerCase().includes("african")) {
      styleDirective = "Restyle with majestic African royalty aesthetic: add regal ceremonial embroidery, Aso-Ebi / Agbada tailoring, coral bead accents, and gold thread craftsmanship";
    } else if (stylePreset === "streetwear" || stylePreset.toLowerCase().includes("streetwear")) {
      styleDirective = "Restyle with modern Lagos Afro-streetwear Y2K aesthetic: urban hypebeast silhouette, metallic hardware accents, edgy streetwear editorial energy";
    } else if (stylePreset === "gala" || stylePreset.toLowerCase().includes("gala")) {
      styleDirective = "Restyle as a high-fashion red carpet gala gown: floor-length luxury silhouette, opulent gold accents, evening glamour tailoring";
    } else if (stylePreset === "corporate" || stylePreset.toLowerCase().includes("corporate") || stylePreset.toLowerCase().includes("power suit")) {
      styleDirective = "Restyle as an executive corporate power suit: crisp tailored blazer, sharp clean lapels, modern professional luxury tailoring";
    } else if (stylePreset === "resort" || stylePreset.toLowerCase().includes("resort")) {
      styleDirective = "Restyle as a coastal resort summer kaftan: breezy relaxed silhouette, sunlit vacation aesthetic";
    } else if (isStyleChanged) {
      styleDirective = `Restyle in high-fashion ${stylePreset} aesthetic`;
    } else {
      styleDirective = `Do NOT change the garment silhouette, tailoring, or cut in any way`;
    }

    // 6. BACKGROUND DIRECTIVE
    let bgDirective = "";
    if (keepOriginalBg) {
      bgDirective = "ENVIRONMENT & LIGHTING: Do NOT replace or change the background. Preserve the exact original photo background and environment, with razor-sharp lighting and high-contrast commercial clarity";
    } else if (isCutout) {
      bgDirective = "Replace the background with a clean seamless solid white cyclorama studio backdrop with crisp contact shadow underneath";
    } else {
      const bgLower = (targetBackground || "").toLowerCase();
      if (bgLower.includes("cyclorama") || bgLower.includes("white")) {
        bgDirective = "Replace the background with a commercial photography studio, seamless neutral white cyclorama backdrop, soft diffused softbox lighting with gentle contact shadow";
      } else if (bgLower.includes("boutique") || bgLower.includes("lagos")) {
        bgDirective = "Replace the background with an opulent modern fashion boutique studio interior: marble flooring, warm ambient spotlighting, architectural arches, high-end retail aesthetic";
      } else if (bgLower.includes("beach") || bgLower.includes("sunset")) {
        bgDirective = "Replace the background with a sunlit coastal beach at golden hour: warm golden sunset light, soft ocean bokeh, natural rim lighting";
      } else if (bgLower.includes("gallery")) {
        bgDirective = "Replace the background with a luxury mahogany and gold-leaf art gallery interior: velvet drapery, warm crystal chandelier lighting";
      } else if (bgLower.includes("runway")) {
        bgDirective = "Replace the background with a high-contrast Paris Fashion Week runway: intense studio spotlights, dark catwalk backdrop, dynamic editorial mood";
      } else {
        bgDirective = `Replace the background with: ${targetBackground} — professional studio-quality lighting`;
      }
    }

    const customDirective = customInstruction ? `Additional instruction: ${customInstruction}.` : "";

    // Build the master preservation-first edit prompt for v1/images/edits
    const editPrompt = [
      `Commercial fashion lookbook photoshoot editing instruction:`,
      `STRICT EDITING MANDATE: Edit the provided image while maintaining 100% photographic identity and garment continuity.`,
      personDirective,
      garmentDesignDirective,
      textDirective,
      graphicDirective,
      colorDirective,
      styleDirective ? styleDirective + "." : "",
      bgDirective ? bgDirective + "." : "",
      customDirective,
      `CLARITY & SHARPNESS MANDATE: Razor-sharp focus, crystal-clear 8K UHD clarity, macro-detailed fabric weave, razor-sharp focus with zero blur or softness, pristine typography edges, studio strobe lighting.`,
      `EXECUTION RULES: ${
        isProductOnly
          ? "CRITICAL MANDATE: Do NOT generate any human model, face, or human body parts. Display ONLY the garment product cleanly."
          : isImagined
          ? "Feature the garment professionally on the fashion model."
          : "Do NOT replace the person. Do NOT alter facial structure or hair if a person is present."
      } Do NOT redesign the shirt cut, collar, sleeves, or seams. Keep every logo, emblem, symbol, and printed text sharp and 100% true to the source photo. Magazine-grade luxury commercial lighting and 8K clarity.`,
    ].filter(Boolean).join(" ");

    // Fallback prompt for free engine (Pollinations)
    const freeEngineSafePrompt = [
      `Product fashion photoshoot of: ${vision.summary}.`,
      garmentDesignDirective,
      textDirective,
      graphicDirective,
      personDirective,
      isColorChanged ? `Garment recolored to ${targetColor}.` : "Same original garment colors.",
      styleDirective ? styleDirective + "." : "",
      bgDirective + ".",
      customDirective,
      "High-end commercial photography, razor-sharp focus, premium lighting, magazine quality.",
    ].filter(Boolean).join(" ");

    // --- PROVIDER 1: OPENAI ULTRA HD ENGINE (PRO OR EXCLUSIVE TIER) ---
    let lastProviderError = "";
    const isOpenAIRequested = isExclusiveEngine || isProEngine || Boolean(customApiKey);

    if (isOpenAIRequested && openaiKey) {
      const requestedTier = isExclusiveEngine ? "exclusive" : "pro";
      const openAiResult = await runOpenAIGeneration(imageUrl, editPrompt, requestedTier, openaiKey, user.id);
      if (openAiResult.imageUrl) {
        transformedImageUrl = openAiResult.imageUrl;
        actualProviderUsed = openAiResult.engineUsed;
      } else {
        lastProviderError = openAiResult.error || "OpenAI image generation failed";
        console.error("[AI Product Transform] OpenAI error:", lastProviderError);
      }
    }

    // --- PROVIDER 2: PHOTOREALISTIC FABRIC STUDIO ---
    if (!transformedImageUrl && provider === "replicate") {
      if (!replicateToken) {
        lastProviderError = "Studio API token is missing. Please set token in .env or enter it in API Settings.";
      } else {
        try {
          transformedImageUrl = await runReplicatePrediction(
            "black-forest-labs/flux-1.1-pro",
            {
              prompt: editPrompt,
              image_prompt: imageUrl,
              aspect_ratio: "1:1",
              output_format: "webp",
              output_quality: 90,
            },
            replicateToken
          );
          if (transformedImageUrl) actualProviderUsed = "Photorealistic Fabric Studio";
        } catch (err: unknown) {
          console.error("[AI Product Transform] Fabric Engine error:", err);
          const errObj = err as { message?: string };
          lastProviderError = errObj.message || "Photorealistic Fabric Engine request failed";
        }
      }
    }

    // --- PROVIDER 3: EDITORIAL LOOKBOOK STUDIO ---
    if (!transformedImageUrl && provider === "sdxl") {
      if (!replicateToken) {
        lastProviderError = "Studio API token is missing. Please set token in .env or enter it in API Settings.";
      } else {
        try {
          const img2imgStrength = (isColorChanged || isStyleChanged || customInstruction) ? 0.65 : 0.45;
          transformedImageUrl = await runReplicatePrediction(
            "stability-ai/sdxl",
            {
              image: imageUrl,
              prompt: editPrompt,
              prompt_strength: img2imgStrength,
              num_inference_steps: 35,
            },
            replicateToken
          );
          if (transformedImageUrl) actualProviderUsed = "Editorial Lookbook Studio";
        } catch (err: unknown) {
          console.error("[AI Product Transform] Lookbook Engine error:", err);
          const errObj = err as { message?: string };
          lastProviderError = errObj.message || "Editorial Lookbook Engine request failed";
        }
      }
    }

    // --- PROVIDER 4: HIGH-SPEED STUDIO ENGINE (FREE FALLBACK) ---
    if (!transformedImageUrl) {
      if (!isFreeEngine && lastProviderError) {
        return NextResponse.json({
          error: `Failed generating image: ${lastProviderError}. Please try the Quick Preview tier or check your settings.`,
          details: lastProviderError,
        }, { status: 400 });
      }

      const cleanPrompt = freeEngineSafePrompt.replace(/[^a-zA-Z0-9\s,.']/g, ' ').replace(/\s+/g, ' ').trim();
      const seed = Math.floor(Math.random() * 999999) + 42;
      transformedImageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt)}?width=1000&height=1000&seed=${seed}&nologo=true&model=flux`;
      actualProviderUsed = isFreeEngine ? "Quick Preview" : "Quick Preview (Fallback)";
    }

    // Deduct credits based on tier (Exclusive = 2, Pro = 1, Free = 0)
    let newBalance = availableCredits;
    if (creditsRequired > 0 && profile && !isSystemAdmin && transformedImageUrl) {
      newBalance = Math.max(0, availableCredits - creditsRequired);
      await prisma.professionalProfile.update({
        where: { id: profile.id },
        data: {
          aiCreditsBalance: newBalance,
          aiCreditsUsedThisMonth: ((rawProfile?.aiCreditsUsedThisMonth as number) || 0) + creditsRequired,
        }
      }).catch(err => console.error("Failed to deduct AI credit:", err));
    }

    return NextResponse.json({
      success: true,
      transformedImageUrl,
      originalImageUrl: imageUrl,
      targetColor,
      stylePreset,
      targetBackground,
      customInstruction,
      remainingCredits: newBalance,
      isFreeEngine,
      providerUsed: actualProviderUsed,
    });
  } catch (error: unknown) {
    console.error("[AI Product Transform Error]", error);
    const errObj = error as { message?: string };
    return NextResponse.json(
      { error: errObj?.message || "Failed to transform product image" },
      { status: 500 }
    );
  }
}
