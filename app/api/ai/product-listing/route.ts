// app/api/ai/product-listing/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { generateJSON } from "@/lib/ai/provider";

interface ProductListingResult {
  title: string;
  description: string;
  shortDescription: string;
  tags: string[];
  careInstructions: string;
  seoKeywords: string[];
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const garmentHint = String(body.garmentHint || "African Print Dress / Suit").trim();
    const material = String(body.material || "Wax Print / Linen / Silk / Velvet").trim();
    const occasion = String(body.occasion || "Celebration, Wedding, Formal, Casual Chic").trim();
    const brandTone = String(body.brandTone || "Contemporary African Luxury, refined, authentic").trim();

    const prompt = `
Generate a high-converting e-commerce product listing for an African fashion garment with these details:
- Garment / Concept: ${garmentHint}
- Material / Fabric: ${material}
- Intended Occasion: ${occasion}
- Brand Voice: ${brandTone}

Return a valid JSON object matching this structure:
{
  "title": "Polished, evocative product title (e.g. Royal Kente Evening Gown)",
  "description": "Clear 2-3 paragraph product description highlighting the style, fit, fabric quality, how to wear it, and quality tailoring.",
  "shortDescription": "1-2 sentence punchy summary for mobile product preview cards.",
  "tags": ["Tag1", "Tag2", "Tag3", "Tag4", "Tag5"],
  "careInstructions": "Practical garment care advice (e.g. Dry clean recommended / Hand wash cold).",
  "seoKeywords": ["keyword1", "keyword2", "keyword3", "keyword4"]
}
`;

    const generated = await generateJSON<ProductListingResult>(
      prompt,
      "You are an experienced fashion catalog writer who explains outfits in simple, appealing English."
    );

    if (!generated) {
      // Deterministic fallback
      const fallback: ProductListingResult = {
        title: garmentHint,
        description: `Experience the best of African fashion with this handcrafted piece. Made with quality ${material}, this outfit offers a comfortable fit tailored for ${occasion}. Every seam is finished to high tailoring standards, ensuring great style and lasting durability.`,
        shortDescription: `Handcrafted ${garmentHint} tailored from quality ${material} for ${occasion}.`,
        tags: ["Handmade", "CustomTailored", "AfricanFashion", "TrendiZip", "Quality"],
        careInstructions: "Dry clean only or delicate hand wash cold. Do not bleach. Cool iron inside out.",
        seoKeywords: ["african fashion", "custom tailor", "tailored clothing", "ghana fashion"],
      };

      return NextResponse.json({ success: true, data: fallback });
    }

    return NextResponse.json({ success: true, data: generated });
  } catch (error) {
    console.error("Product Listing AI Error:", error);
    return NextResponse.json({ error: "Failed to generate listing" }, { status: 500 });
  }
}
