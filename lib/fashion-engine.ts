import { StylePreference } from "@prisma/client";

export const FASHION_DICTIONARY = {
  // --- 1. CORE GARMENT CATEGORIES ---
  items: {
    tops: [
      "t-shirt", "tee", "blouse", "button-down", "button-up", "crop top", "halter", "tube top",
      "camisole", "cami", "tank top", "tunic", "peplum", "smock", "corset", "bustier", "polo",
      "turtleneck", "mock neck", "henley", "sweater", "cardigan", "pullover", "hoodie",
      "sweatshirt", "fleece", "thermal", "shacket", "jersey", "rash guard", "dashiki",
      "buba", "kaftan", "agbada", "tunic", "chemise", "batik shirt"
    ],
    bottoms: [
      "jeans", "trousers", "pants", "slacks", "chinos", "khakis", "sweatpants", "joggers",
      "leggings", "tights", "shorts", "bermuda", "board shorts", "biker shorts", "capris",
      "culottes", "skirt", "mini skirt", "midi skirt", "maxi skirt", "pencil skirt", "a-line",
      "pleated skirt", "skort", "cargo", "flare", "bootcut", "straight leg", "wide leg",
      "iro", "wrapper", "sokoto", "harem pants"
    ],
    dresses_jumpsuits: [
      "slip dress", "wrap dress", "bodycon", "shift", "sheath", "a-line", "maxi", "midi",
      "mini", "gown", "sundress", "pinafore", "halter dress", "ballgown", "shirt dress",
      "sweater dress", "t-shirt dress", "jumpsuit", "romper", "playsuit", "overalls", "boiler suit",
      "kaftan", "boubou", "djellaba", "abaya", "dirac", "rich auntie dress"
    ],
    outerwear: [
      "jacket", "coat", "blazer", "trench coat", "peacoat", "overcoat", "anorak", "parka",
      "puffer", "windbreaker", "bomber", "varsity", "denim jacket", "leather jacket",
      "biker jacket", "moto", "vest", "gilet", "poncho", "cape", "duster", "raincoat"
    ],
    footwear: [
      "sneakers", "trainers", "kicks", "running shoes", "cleats", "boots", "ankle boots",
      "chelsea boots", "combat boots", "snow boots", "heels", "pumps", "stilettos", "wedges",
      "platforms", "sandals", "slides", "flip flops", "mules", "loafers", "oxfords",
      "brogues", "derby", "boat shoes", "espadrilles", "flats", "ballet flats", "slippers", "clogs"
    ],
    accessories: [
      "bag", "handbag", "tote", "backpack", "clutch", "crossbody", "shoulder bag", "messenger",
      "satchel", "fanny pack", "belt", "suspenders", "scarf", "bandana", "shawl", "hat",
      "baseball cap", "beanie", "fedora", "bucket hat", "beret", "visor", "sunglasses",
      "glasses", "shades", "jewelry", "necklace", "earrings", "ring", "bracelet", "watch",
      "gloves", "mittens", "tie", "bowtie", "pocket square", "wallet", "umbrella", "hair tie", "scrunchie",
      "gele", "fila", "kufi", "turbin", "fascinator", "coral beads", "statement necklace"
    ],
    intimates_sleep: [
      "bra", "sports bra", "bralette", "panties", "thong", "briefs", "boxers", "trunks",
      "lingerie", "bodysuit", "shapewear", "garter", "stockings", "socks", "pajamas", "pjs",
      "nightgown", "robe", "onesie", "loungewear", "underwear"
    ],
    swimwear: [
      "swimsuit", "bikini", "one-piece", "two-piece", "swim trunks", "wetsuit", "cover-up", "sarong"
    ],
    kids_baby: [
      "onesie", "romper", "bib", "playwear", "uniform", "mittens", "booties", "newborn set"
    ]
  },

  // --- 2. MATERIALS & FABRICS ---
  materials: {
    natural: [
      "cotton", "linen", "silk", "wool", "cashmere", "mohair", "alpaca", "angora",
      "hemp", "bamboo", "jute", "shearling", "down", "feathers"
    ],
    synthetic: [
      "polyester", "nylon", "acrylic", "spandex", "elastane", "lycra", "rayon", "viscose",
      "modal", "lyocell", "tencel", "acetate", "neoprene", "pvc", "latex"
    ],
    leather_exotic: [
      "leather", "suede", "faux leather", "pu leather", "vegan leather", "patent leather",
      "pleather", "snakeskin", "crocodile", "alligator"
    ],
    woven_textured: [
      "denim", "chambray", "corduroy", "velvet", "velour", "chiffon", "georgette", "organza",
      "tulle", "lace", "satin", "twill", "canvas", "flannel", "tweed", "boucle", "jacquard",
      "brocade", "terry", "mesh", "fleece", "knit", "crochet", "ribbed", "seersucker"
    ],
    cultural_heritage: [
      "ankara", "kente", "adire", "aso oke", "bogolan", "mudcloth", "batik", "dashiki print", "shweshwe", "kita", "george fabric", "lace fabric"
    ]
  },

  // --- 3. PATTERNS & PRINTS ---
  patterns: [
    "solid", "striped", "floral", "polka dot", "plaid", "tartan", "checkered", "gingham",
    "houndstooth", "animal print", "leopard", "zebra", "cheetah", "tiger", "camouflage", "camo",
    "geometric", "abstract", "tie-dye", "paisley", "argyle", "chevron", "fair isle",
    "ombre", "gradient", "pinstripe", "colorblock", "graphic", "logo", "monogram", "batik",
    "african print", "tribal", "ethnic", "wax print", "damask"
  ],

  // --- 4. DETAILS, CUTS & HARDWARE ---
  details: {
    necklines: ["crew", "v-neck", "scoop", "boat", "square", "sweetheart", "halter", "off-shoulder", "one-shoulder", "strapless", "cowl", "collared", "lapel", "plunge"],
    hardware_accents: ["zipper", "zip", "button", "snap", "lace-up", "drawstring", "buckle", "sash", "bow", "ruffle", "frill", "fringe", "tassel", "pleat", "ruching", "smocking", "embroidery", "applique", "patch", "rivet", "stud", "rhinestone", "sequin", "bead", "pocket", "cutout", "slit"]
  },

  // --- 5. THE 27 HIGH-FIDELITY EVENTS ---
  aesthetics: [
    {
      id: "traditional",
      styles: [StylePreference.TRADITIONAL, StylePreference.CULTURAL],
      keywords: ["knocking", "introduction", "dowry", "customary", "bride price", "regalia", "ancestral", "clan colors", "hand-woven", "heritage", "kente", "agbada", "smock", "fugu", "naming ceremony", "outdooring"],
    },
    {
      id: "wedding",
      styles: [StylePreference.FORMAL, StylePreference.ROMANTIC],
      keywords: ["bridal", "bridesmaid", "groom", "nuptials", "veil", "train", "matrimony", "aso ebi", "matching lace", "ring", "vows", "bridal retinue", "altar", "reception"],
    },
    {
      id: "funeral",
      styles: [StylePreference.TRADITIONAL, StylePreference.CLASSIC],
      keywords: ["one-week observation", "final obsequies", "thanksgiving service", "red and black", "black and white", "mourning", "solemn", "cloth", "legacy", "ancestor", "memorial"],
    },
    {
      id: "owambe",
      styles: [StylePreference.TRENDY, StylePreference.FORMAL],
      keywords: ["spraying", "money spraying", "milestone birthday", "50th birthday", "glamour", "sequin", "heavy lace", "gele", "extravaganza", "rich auntie vibes", "saturday party"],
    },
    {
      id: "festival",
      styles: [StylePreference.TRENDY, StylePreference.STREETWEAR],
      keywords: ["durbar", "homowo", "odwira", "chale wote", "afrochella", "afro future", "detty december", "beach rave", "concert", "mainstage", "glitter", "rave"],
    },
    {
      id: "street",
      styles: [StylePreference.STREETWEAR, StylePreference.EDGY],
      keywords: ["sneakerhead", "kicks", "drop", "grail", "urban", "skater", "graphic tee", "cargo", "oversized", "hype", "distressed", "industrial", "chains"],
    },
    {
      id: "y2k",
      styles: [StylePreference.TRENDY, StylePreference.EDGY],
      keywords: ["y2k", "tiktok trend", "brat aesthetic", "nostalgia", "alt", "grunge", "low-rise", "baby tee", "crop", "chunky boots", "cyber", "metallic", "gen-z"],
    },
    {
      id: "casual",
      styles: [StylePreference.CASUAL, StylePreference.MINIMALIST],
      keywords: ["road trip", "weekend getaway", "mall hangout", "house party", "game night", "essentials", "friday wear", "bbq", "denim", "basics", "off-duty", "effortless"],
    },
    {
      id: "campus",
      styles: [StylePreference.STREETWEAR, StylePreference.TRENDY],
      keywords: ["hall week", "src awards", "prom", "pageant", "youthful", "trendy formal", "corset", "satin", "university", "varsity", "uni life", "freshman"],
    },
    {
      id: "social",
      styles: [StylePreference.TRENDY, StylePreference.CLASSIC],
      keywords: ["day party", "boat cruise", "yacht", "garden party", "highlife", "live band", "sundowner", "all-white party", "picnic", "soirée", "mingling", "elite"],
    },
    {
      id: "brunch",
      styles: [StylePreference.MINIMALIST, StylePreference.CLASSIC],
      keywords: ["bottomless brunch", "mimosa", "chic", "pastel", "flowy", "linen", "sunglasses", "loafers", "midday", "prosecco", "al-fresco", "shades"],
    },
    {
      id: "nightlife",
      styles: [StylePreference.EDGY, StylePreference.TRENDY],
      keywords: ["clubbing", "vip lounge", "bottle service", "amapiano night", "edgy", "flashy", "bodycon", "night out", "dj set", "after-hours", "electric"],
    },
    {
      id: "date",
      styles: [StylePreference.ROMANTIC, StylePreference.CLASSIC],
      keywords: ["candlelight dinner", "anniversary", "rooftop", "dinner", "romantic", "soft", "slip dress", "tailored shirt", "cologne", "intimacy", "attraction", "sultry"],
    },
    {
      id: "professional",
      styles: [StylePreference.BUSINESS, StylePreference.MINIMALIST],
      keywords: ["tech mixer", "networking", "startup pitch", "product launch", "seminar", "conference", "corporate ankara", "smart casual", "innovation", "disruption"],
    },
    {
      id: "corporate",
      styles: [StylePreference.BUSINESS, StylePreference.CLASSIC],
      keywords: ["boardroom", "interview", "law firm", "bank", "tie", "blazer", "skirt suit", "pant suit", "briefcase", "office", "executive", "tailored precision"],
    },
    {
      id: "academic",
      styles: [StylePreference.CLASSIC, StylePreference.FORMAL],
      keywords: ["graduation", "convocation", "matriculation", "alumni dinner", "robe", "sash", "proud", "scholar", "laurels", "dean's list"],
    },
    {
      id: "formal",
      styles: [StylePreference.FORMAL, StylePreference.CLASSIC],
      keywords: ["awards gala", "corporate banquet", "red carpet", "black tie", "gown", "tuxedo", "floor-length", "velvet", "timeless grandeur"],
    },
    {
      id: "active",
      styles: [StylePreference.CASUAL, StylePreference.WELLNESS],
      keywords: ["gym", "workout", "lifting", "cardio", "running", "activewear", "spandex", "dri-fit", "sports bra", "leggings", "performance"],
    },
    {
      id: "wellness",
      styles: [StylePreference.WELLNESS, StylePreference.CASUAL],
      keywords: ["pilates", "meditation", "retreat", "athleisure", "seamless", "breathable", "earth tones", "stretch", "yoga", "mindfulness", "zen", "serenity"],
    },
    {
      id: "sports",
      styles: [StylePreference.CASUAL, StylePreference.STREETWEAR],
      keywords: ["match day", "stadium", "sports bar", "jersey", "team colors", "face paint", "cap", "denim", "spectator", "fanatic", "sideline chic"],
    },
    {
      id: "resort",
      styles: [StylePreference.BOHEMIAN, StylePreference.CASUAL],
      keywords: ["pool party", "labadi", "kokrobite", "resort", "tropical", "vacation", "cover-up", "straw hat", "linen", "jet-set", "island hopping"],
    },
    {
      id: "beach",
      styles: [StylePreference.BOHEMIAN, StylePreference.CASUAL],
      keywords: ["swimwear", "bikini", "trunks", "sand", "sunbathing", "flip flops", "seaside", "coast", "salty hair", "shoreline"],
    },
    {
      id: "church",
      styles: [StylePreference.CLASSIC, StylePreference.MODEST],
      keywords: ["thanksgiving", "sunday service", "sunday best", "elegant", "fascinator", "tailored suit", "polished", "choir", "salvation", "sanctuary"],
    },
    {
      id: "modest",
      styles: [StylePreference.MODEST, StylePreference.CULTURAL],
      keywords: ["salah", "eid", "jummah", "abaya", "hijab", "conservative", "jalabiya", "kaftan", "covered", "kufi", "graceful cover", "divine style"],
    },
    {
      id: "travel",
      styles: [StylePreference.CASUAL, StylePreference.STREETWEAR],
      keywords: ["airport fit", "long haul", "transit", "tracksuit", "cozy", "oversized", "comfort", "carry-on", "journey", "wanderlust", "globetrotter", "terminal chic"],
    },
    {
      id: "lounge",
      styles: [StylePreference.CASUAL, StylePreference.MINIMALIST],
      keywords: ["night in", "sleepover", "pajamas", "robe", "silk set", "fleece", "slippers", "intimate", "loungewear", "self-care", "cozy core"],
    },
    {
      id: "creative",
      styles: [StylePreference.VINTAGE, StylePreference.TRENDY],
      keywords: ["gallery opening", "indie", "creative mixer", "poetry night", "avant-garde", "bohemian", "abstract", "minimalist", "exhibition", "curated", "eccentric", "poetic"],
    }
  ]
};

/**
 * Suggests tags and styles based on product text.
 * Enhanced to handle the 27 high-fidelity events with semantic weighting.
 */
export function suggestTags(name: string, description: string | null = "") {
  const text = `${name} ${description || ""}`.toLowerCase();
  const detectedStyles = new Set<StylePreference>();
  const detectedKeywords = new Set<string>();

  // 1. Scan Aesthetics / Events (Primary Mapping)
  FASHION_DICTIONARY.aesthetics.forEach((category) => {
    // Check if the category ID itself or any of its keywords match
    const isDirectMatch = text.includes(category.id.replace(/_/g, " "));
    const matchedKeywords = category.keywords.filter((word) => text.includes(word.toLowerCase()));

    if (isDirectMatch || matchedKeywords.length > 0) {
      category.styles.forEach((style) => detectedStyles.add(style));
      
      // Add the matched event as a primary keyword
      const eventName = category.id.charAt(0).toUpperCase() + category.id.slice(1).replace(/_/g, " ");
      detectedKeywords.add(eventName);
      
      // Add up to 3 specific matched keywords for depth
      matchedKeywords.slice(0, 3).forEach(k => detectedKeywords.add(k.charAt(0).toUpperCase() + k.slice(1)));
    }
  });

  // 2. Scan Core Items, Materials, and Patterns for deeper tagging
  const scanSection = (section: string[] | Record<string, string[] | Record<string, string[]>>) => {
    if (Array.isArray(section)) {
      section.forEach(word => {
        if (text.includes(word.toLowerCase())) {
          detectedKeywords.add(word.charAt(0).toUpperCase() + word.slice(1));
        }
      });
    } else if (typeof section === 'object') {
      Object.values(section).forEach(subSection => scanSection(subSection));
    }
  };

  scanSection(FASHION_DICTIONARY.items);
  scanSection(FASHION_DICTIONARY.materials);
  scanSection(FASHION_DICTIONARY.patterns);

  return {
    styles: Array.from(detectedStyles),
    keywords: Array.from(detectedKeywords).slice(0, 10), // Quality over quantity
  };
}

/**
 * Calculates a match score (0-100) between a product and an event.
 * Uses semantic overlap and style preference alignment.
 */
export function calculateMatchScore(product: Record<string, string | string[] | number | boolean | null | undefined>, event: Record<string, string | string[] | number | boolean | null | undefined>): number {
  if (!event.searchKeywords || !Array.isArray(event.searchKeywords) || event.searchKeywords.length === 0) return 0;
  
  const productText = `${product.name} ${product.description || ""} ${Array.isArray(product.keywords) ? product.keywords.join(" ") : ""}`.toLowerCase();
  const eventKeywords = (event.searchKeywords as string[]).map((k: string) => k.toLowerCase());
  
  let matchCount = 0;
  eventKeywords.forEach((keyword: string) => {
    // Exact word match check to avoid partial character overlap noise
    const regex = new RegExp(`\\b${keyword}\\b`, "i");
    if (regex.test(productText)) {
      matchCount += 1.5; // High confidence match
    } else if (productText.includes(keyword)) {
      matchCount += 0.8; // Partial or sub-word match
    }
  });

  // Normalize score
  const score = (matchCount / (eventKeywords.length || 1)) * 100;
  
  // Cap and round
  return Math.min(Math.round(score), 100);
}