import { StylePreference } from "@prisma/client";

/**
 * A dictionary that maps fashion-related keywords to styles and aesthetics.
 * This is the core "Free AI" that allows the system to categorize products automatically.
 */
export const FASHION_LEXICON: Record<string, { styles: StylePreference[]; keywords: string[] }> = {
  // Occasions / Themes
  wedding: {
    styles: [StylePreference.FORMAL, StylePreference.CLASSIC, StylePreference.ROMANTIC],
    keywords: ["bridal", "bridesmaid", "gown", "cocktail", "lace", "tuxedo", "ceremony"],
  },
  gala: {
    styles: [StylePreference.FORMAL, StylePreference.EDGY],
    keywords: ["evening", "sequin", "floor-length", "glamour", "red carpet", "black tie"],
  },
  party: {
    styles: [StylePreference.TRENDY, StylePreference.EDGY],
    keywords: ["club", "disco", "mini dress", "sparkle", "glitter", "night out"],
  },
  office: {
    styles: [StylePreference.BUSINESS, StylePreference.MINIMALIST, StylePreference.CLASSIC],
    keywords: ["blazer", "trousers", "professional", "skirt suit", "corporate", "smart casual"],
  },
  beach: {
    styles: [StylePreference.BOHEMIAN, StylePreference.CASUAL],
    keywords: ["swimwear", "sarong", "linen", "sun hat", "vacation", "resort", "tropical"],
  },
  workout: {
    styles: [StylePreference.STREETWEAR, StylePreference.CASUAL],
    keywords: ["leggings", "gym", "activewear", "sports bra", "running", "performance"],
  },
  
  // Aesthetics
  vintage: {
    styles: [StylePreference.VINTAGE, StylePreference.CLASSIC],
    keywords: ["retro", "70s", "80s", "90s", "thrifted", "antique", "classic silhouette"],
  },
  minimalist: {
    styles: [StylePreference.MINIMALIST, StylePreference.CLASSIC],
    keywords: ["clean", "basic", "neutral", "simple", "monochrome", "wardrobe staple"],
  },
  streetwear: {
    styles: [StylePreference.STREETWEAR, StylePreference.EDGY, StylePreference.TRENDY],
    keywords: ["hoodie", "sneakers", "oversized", "graphic", "urban", "skate"],
  },
  preppy: {
    styles: [StylePreference.PREPPY, StylePreference.CLASSIC],
    keywords: ["polo", "pleated", "cardigan", "academic", "loafer", "argyle"],
  },
  bohemian: {
    styles: [StylePreference.BOHEMIAN, StylePreference.ROMANTIC],
    keywords: ["maxi", "floral", "fringe", "hippie", "festival", "earthy"],
  },
};

/**
 * Suggests tags and styles based on product text.
 */
export function suggestTags(name: string, description: string | null = "") {
  const text = `${name} ${description || ""}`.toLowerCase();
  const detectedStyles = new Set<StylePreference>();
  const detectedKeywords = new Set<string>();

  for (const [key, category] of Object.entries(FASHION_LEXICON)) {
    // Check if the category key itself or any of its keywords match
    const matches = category.keywords.some((word) => text.includes(word.toLowerCase())) || text.includes(key.toLowerCase());

    if (matches) {
      category.styles.forEach((style) => detectedStyles.add(style));
      // Add the matched key as a core keyword
      detectedKeywords.add(key.charAt(0).toUpperCase() + key.slice(1));
    }
  }

  return {
    styles: Array.from(detectedStyles),
    keywords: Array.from(detectedKeywords),
  };
}

/**
 * Calculates a match score (0-100) between a product and an event.
 */
export function calculateMatchScore(product: any, event: any): number {
  if (!event.searchKeywords || event.searchKeywords.length === 0) return 0;
  
  const productText = `${product.name} ${product.description || ""} ${product.keywords?.join(" ") || ""}`.toLowerCase();
  const eventKeywords = event.searchKeywords.map((k: string) => k.toLowerCase());
  
  let matchCount = 0;
  eventKeywords.forEach((keyword: string) => {
    if (productText.includes(keyword)) {
      matchCount++;
    }
  });

  // Calculate percentage match based on event keywords
  const score = (matchCount / eventKeywords.length) * 100;
  
  // Bonus score for price point if applicable? Or category match?
  // For now, simple keyword overlap is best for discovery.
  return Math.min(score, 100);
}
