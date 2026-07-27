import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";

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

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { 
      imageUrl, 
      targetColor = "Ruby Red", 
      targetBackground = "Luxury Lagos Boutique Studio", 
      stylePreset = "",
      customInstruction = "",
      provider = "ai",
      customApiKey = ""
    } = body;

    if (!imageUrl) {
      return NextResponse.json({ error: "Product image URL is required" }, { status: 400 });
    }

    // Determine if user selected the Free AI Engine
    const isFreeEngine = provider === "ai" || provider === "pollinations";

    // Check professional profile & credit balance
    const profile = await prisma.professionalProfile.findUnique({
      where: { userId: user.id },
    });

    const isSystemAdmin = ["ADMIN", "SUPER_ADMIN"].includes(user.role);
    const rawProfile = profile as Record<string, unknown> | null;
    const availableCredits = (rawProfile?.aiCreditsBalance as number) ?? 10;

    // Reject only if user selected a PRO engine AND has 0 credits
    if (!isFreeEngine && !isSystemAdmin && availableCredits <= 0) {
      return NextResponse.json({ 
        error: "You have 0 AI Studio Credits remaining for Pro engines. Please switch to the Free AI Engine or upgrade your plan.",
        remainingCredits: 0
      }, { status: 402 });
    }

    const openaiKey = customApiKey || process.env.OPENAI_API_KEY;
    const replicateToken = customApiKey || process.env.REPLICATE_API_TOKEN;
    let transformedImageUrl = "";
    let actualProviderUsed = "High-Speed Free AI Engine";

    const isColorChanged = targetColor && !["no color change", "none", "keep original"].includes(targetColor.toLowerCase());
    const isStyleChanged = stylePreset && !["none", "no preset"].includes(stylePreset.toLowerCase());

    let colorDirective = "";
    if (isColorChanged) {
      colorDirective = `recolored in rich, high-saturation ${targetColor} fabric, with pristine color consistency and natural texture shading`;
    } else {
      colorDirective = "preserving the exact original garment colors and fabric texture";
    }

    let styleDirective = "";
    if (stylePreset === "traditional") {
      styleDirective = "styled in majestic African royalty aesthetic, with regal ceremonial embroidery, rich Aso-Ebi / Agbada tailoring, coral bead accents, and gold thread craftsmanship";
    } else if (stylePreset === "streetwear") {
      styleDirective = "styled in modern Lagos Afro-streetwear Y2K aesthetic, with an urban hypebeast silhouette, metallic hardware accents, and edgy streetwear editorial energy";
    } else if (stylePreset === "gala") {
      styleDirective = "styled in a high-fashion red carpet gala gown, floor-length luxury silhouette, opulent gold accents, and evening glamour tailoring";
    } else if (stylePreset === "corporate") {
      styleDirective = "styled in an executive corporate power suit, with a crisp tailored blazer, sharp clean lapels, and modern professional luxury tailoring";
    } else if (stylePreset === "resort") {
      styleDirective = "styled in a coastal resort summer linen kaftan, with a breezy relaxed silhouette and sunlit vacation aesthetic";
    } else if (isStyleChanged) {
      styleDirective = `styled in high-fashion ${stylePreset} aesthetic`;
    } else {
      styleDirective = "maintaining the original garment silhouette, tailoring, and cut";
    }

    let bgDirective = "";
    const bgLower = (targetBackground || "").toLowerCase();
    if (bgLower.includes("no background") || bgLower.includes("transparent") || bgLower.includes("cutout")) {
      bgDirective = "isolated on a clean, seamless, solid white cyclorama studio backdrop, with soft contact shadow underneath";
    } else if (bgLower.includes("boutique")) {
      bgDirective = "set inside an opulent modern fashion boutique studio, with marble flooring, warm ambient spotlighting, architectural arches, and high-end retail aesthetic";
    } else if (bgLower.includes("beach") || bgLower.includes("sunset")) {
      bgDirective = "set on a sunlit Accra coastal beach at golden hour, with warm golden sunset light, soft ocean bokeh in the background, and natural rim lighting";
    } else if (bgLower.includes("gallery")) {
      bgDirective = "set inside a luxury mahogany and gold-leaf art gallery, with velvet drapery and warm crystal chandelier lighting";
    } else if (bgLower.includes("runway")) {
      bgDirective = "set walking a high-contrast Paris Fashion Week runway, with intense studio spotlights, dark cat-walk backdrop, and dynamic runway editorial mood";
    } else {
      bgDirective = `set against ${targetBackground} backdrop with professional studio softbox lighting`;
    }

    const customDirective = customInstruction ? `with custom details: ${customInstruction}` : "";

    // World-class commercial fashion photoshoot prompt
    const promptText = `A high-end commercial fashion photoshoot of a model wearing a luxury garment, ${colorDirective}, ${styleDirective}, ${bgDirective}, ${customDirective}. Shot on Hasselblad H6D-100c camera, 85mm f/1.4 lens, crisp 8k resolution, razor-sharp focus, flawless fabric texture, professional color grading, magazine cover editorial quality.`;

    // --- PROVIDER 1: OPENAI DALL-E 3 ---
    let lastProviderError = "";

    if (provider === "dalle3" && openaiKey) {
      try {
        const res = await fetch("https://api.openai.com/v1/images/generations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openaiKey.trim()}`,
          },
          body: JSON.stringify({
            model: "dall-e-3",
            prompt: promptText,
            n: 1,
            size: "1024x1024",
            quality: customApiKey ? "hd" : "standard",
          }),
        });

        const data = await res.json();
        if (res.ok) {
          transformedImageUrl = data.data?.[0]?.url || "";
          if (transformedImageUrl) actualProviderUsed = "Ultra HD Commercial Studio";
        } else {
          lastProviderError = data.error?.message || "Commercial Studio Engine request failed";
          console.error("[AI Product Transform] Engine error:", data);
        }
      } catch (err: unknown) {
        const errObj = err as { message?: string };
        lastProviderError = errObj.message || "Studio Engine error";
        console.error("[AI Product Transform] Engine error:", err);
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
              prompt: promptText,
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
          // Tune prompt strength based on whether user requested color or style modifications
          const img2imgStrength = (isColorChanged || isStyleChanged || customInstruction) ? 0.65 : 0.45;
          transformedImageUrl = await runReplicatePrediction(
            "stability-ai/sdxl",
            {
              image: imageUrl,
              prompt: promptText,
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

    // --- PROVIDER 4: HIGH-SPEED STUDIO ENGINE ---
    if (!transformedImageUrl) {
      if (!isFreeEngine && lastProviderError) {
        // If user specifically picked a Pro engine and it failed, throw or report the exact error
        return NextResponse.json({
          error: `Failed generating image: ${lastProviderError}. Please verify your API Key or try the High-Speed Studio Engine.`,
          details: lastProviderError,
        }, { status: 400 });
      }

      const cleanPrompt = promptText.replace(/[^a-zA-Z0-9\s,]/g, ' ').replace(/\s+/g, ' ').trim();
      const seed = Math.floor(Math.random() * 999999) + 42;
      transformedImageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt)}?width=1000&height=1000&seed=${seed}&nologo=true&model=flux`;
      actualProviderUsed = isFreeEngine ? "High-Speed Studio Engine" : `High-Speed Studio (Fallback)`;
    }

    // Deduct 1 credit ONLY IF generation was with a PRO engine and successful
    let newBalance = availableCredits;
    if (!isFreeEngine && profile && !isSystemAdmin && transformedImageUrl) {
      newBalance = Math.max(0, availableCredits - 1);
      await prisma.professionalProfile.update({
        where: { id: profile.id },
        data: {
          aiCreditsBalance: newBalance,
          aiCreditsUsedThisMonth: ((rawProfile?.aiCreditsUsedThisMonth as number) || 0) + 1,
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
