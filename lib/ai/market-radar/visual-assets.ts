// lib/ai/market-radar/visual-assets.ts
/**
 * Visual Assets & Aesthetic Palette Provider for Market Radar
 * 
 * Provides high-resolution editorial fashion photography, authentic color swatches,
 * and mood vibes tailored to West African and international contemporary fashion styles.
 */

export interface GarmentVisualProfile {
  thumbnailUrl: string;
  moodVibe: string;
  colorPalette: Array<{ name: string; hex: string; role: string }>;
}

export const VISUAL_PROFILES: Record<string, GarmentVisualProfile> = {
  corset: {
    thumbnailUrl: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=900&q=80",
    moodVibe: "Gala Glamour & Sculpted Couture",
    colorPalette: [
      { name: "Emerald Green", hex: "#0b4d3c", role: "Primary Silk" },
      { name: "Champagne Gold", hex: "#dfb15b", role: "Accent Boning" },
      { name: "Rich Burgundy", hex: "#671326", role: "Evening Luxe" },
      { name: "Onyx Black", hex: "#191919", role: "Classic Base" },
    ],
  },
  boubou: {
    thumbnailUrl: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=900&q=80",
    moodVibe: "Rich Auntie Chic & Flowing Majesty",
    colorPalette: [
      { name: "Royal Purple", hex: "#4c1d95", role: "Raw Silk" },
      { name: "Sunset Gold", hex: "#eab308", role: "Embroidery" },
      { name: "Chiffon Teal", hex: "#0f766e", role: "Resort Flow" },
      { name: "Warm Cream", hex: "#fef3c7", role: "Subtle Trim" },
    ],
  },
  kente: {
    thumbnailUrl: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=900&q=80",
    moodVibe: "Heritage Royalty & Celebratory Splendor",
    colorPalette: [
      { name: "Imperial Gold", hex: "#d97706", role: "Woven Weft" },
      { name: "Cerulean Blue", hex: "#1d4ed8", role: "Heritage Warp" },
      { name: "Crimson Red", hex: "#b91c1c", role: "Symbolic Stripe" },
      { name: "Forest Green", hex: "#15803d", role: "Growth Thread" },
    ],
  },
  linen: {
    thumbnailUrl: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=900&q=80",
    moodVibe: "Effortless Resort Luxury & Tropics Ease",
    colorPalette: [
      { name: "Desert Sand", hex: "#c4a482", role: "Pure Flax" },
      { name: "Sage Olive", hex: "#556b2f", role: "Earth Tone" },
      { name: "Terracotta", hex: "#c25438", role: "Warm Clay" },
      { name: "Raw Off-White", hex: "#faf7f2", role: "Unbleached Linen" },
    ],
  },
  kaftan: {
    thumbnailUrl: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=900&q=80",
    moodVibe: "Dapper Pan-African Modernity",
    colorPalette: [
      { name: "Midnight Navy", hex: "#0f172a", role: "Crisp Wool-Blend" },
      { name: "Platinum Grey", hex: "#94a3b8", role: "Geometric Thread" },
      { name: "Burnt Copper", hex: "#9a3412", role: "Collar Piping" },
      { name: "Pearl White", hex: "#f8fafc", role: "Friday Wear" },
    ],
  },
  agbada: {
    thumbnailUrl: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=900&q=80",
    moodVibe: "Monarch Agbada & High Table Presence",
    colorPalette: [
      { name: "Deep Indigo", hex: "#1e1b4b", role: "Guinea Brocade" },
      { name: "Burnished Bronze", hex: "#78350f", role: "Silk Embroidery" },
      { name: "Pristine White", hex: "#ffffff", role: "Ceremonial Base" },
      { name: "Sky Azure", hex: "#38bdf8", role: "Accent Trim" },
    ],
  },
  tee: {
    thumbnailUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80",
    moodVibe: "Afro-Futurist Streetwear & Festival Sound",
    colorPalette: [
      { name: "Vintage Charcoal", hex: "#262626", role: "Heavyweight 280GSM" },
      { name: "Bone White", hex: "#f5f5f4", role: "Boxy Cut Base" },
      { name: "Electric Cobalt", hex: "#2563eb", role: "Screenprint Graphic" },
      { name: "Acid Lime", hex: "#84cc16", role: "Typography Pop" },
    ],
  },
  ankara: {
    thumbnailUrl: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=900&q=80",
    moodVibe: "Contemporary Print Precision & Ready-to-Wear",
    colorPalette: [
      { name: "Saffron Orange", hex: "#ea580c", role: "Wax Print Motif" },
      { name: "Ocean Teal", hex: "#0e7490", role: "Contrast Swirl" },
      { name: "Sun Yellow", hex: "#facc15", role: "Floral Center" },
      { name: "Dark Jet", hex: "#171717", role: "Structured Border" },
    ],
  },
};

export function resolveVisualProfile(garmentName: string): GarmentVisualProfile {
  const lower = garmentName.toLowerCase();

  if (lower.includes("corset") || lower.includes("dress") || lower.includes("gown")) {
    return VISUAL_PROFILES.corset;
  }
  if (lower.includes("boubou") || lower.includes("bubu")) {
    return VISUAL_PROFILES.boubou;
  }
  if (lower.includes("kente")) {
    return VISUAL_PROFILES.kente;
  }
  if (lower.includes("linen") || lower.includes("resort") || lower.includes("co-ord")) {
    return VISUAL_PROFILES.linen;
  }
  if (lower.includes("agbada")) {
    return VISUAL_PROFILES.agbada;
  }
  if (lower.includes("kaftan") || lower.includes("caftan") || lower.includes("men")) {
    return VISUAL_PROFILES.kaftan;
  }
  if (lower.includes("tee") || lower.includes("shirt") || lower.includes("street")) {
    return VISUAL_PROFILES.tee;
  }
  if (lower.includes("ankara") || lower.includes("wax")) {
    return VISUAL_PROFILES.ankara;
  }

  // Fallback balanced visual profile
  return {
    thumbnailUrl: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=900&q=80",
    moodVibe: "Contemporary African RTW Elegance",
    colorPalette: [
      { name: "Warm Amber", hex: "#b45309", role: "Primary Textile" },
      { name: "Ivory Sheen", hex: "#fffbeb", role: "Lining / Trim" },
      { name: "Forest Emerald", hex: "#065f46", role: "Contrast Stitch" },
      { name: "Obsidian", hex: "#1f2937", role: "Base Tone" },
    ],
  };
}

