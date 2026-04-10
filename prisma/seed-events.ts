import "dotenv/config";
import { PrismaClient, Season } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;

const createPrismaClient = () => {
  const pool = new Pool({ 
    connectionString,
    max: 10, 
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
};

const prisma = createPrismaClient();

const eventsData = [
  {
    name: "Traditional",
    description: "Cultural milestones and family ceremonies featuring ancestral regalia and hand-woven heritage.",
    dressCodes: ["Kente", "Agbada", "Smock", "Fugu", "Traditional", "Regalia"],
    searchKeywords: ["knocking", "introduction", "dowry", "customary", "bride price", "cultural pride", "naming ceremony", "outdooring"],
    seasonality: [Season.ALL_SEASON],
  },
  {
    name: "Wedding",
    description: "Sacred unions and nuptial glamour, from grand altar moments to elegant receptions.",
    dressCodes: ["Bridal", "Bridesmaid", "Groom", "Tuxedo", "Gown"],
    searchKeywords: ["veils", "trains", "aso ebi", "matching lace", "vows", "bridal retinue", "matrimony", "reception"],
    seasonality: [Season.ALL_SEASON],
  },
  {
    name: "Funeral",
    description: "Solemn observations and final obsequies honoring legacy with grace and ancestry.",
    dressCodes: ["Red and Black", "Black and White", "Mourning Cloth"],
    searchKeywords: ["one-week observation", "thanksgiving service", "solemn", "memorial", "transition", "ancestor"],
    seasonality: [Season.ALL_SEASON],
  },
  {
    name: "Owambe",
    description: "High-society celebrations, spraying ceremonies, and milestone birthdays filled with glamour.",
    dressCodes: ["Lace Extravaganza", "Gele Masterclass", "Sequin", "Heavy Lace"],
    searchKeywords: ["spraying", "money spraying", "rich auntie vibes", "50th birthday", "glitz", "saturday party"],
    seasonality: [Season.ALL_SEASON],
  },
  {
    name: "Festival",
    description: "Mainstage cultural celebrations and vibrant street raves, from Chale Wote to Detty December.",
    dressCodes: ["Trendy", "Streetwear", "Avant-Garde", "Vibrant"],
    searchKeywords: ["durbar", "homowo", "odwira", "chale wote", "afrochella", "beach rave", "concert", "detty december"],
    seasonality: [Season.ALL_SEASON, Season.SUMMER],
  },
  {
    name: "Street",
    description: "Urban expression and sneakerhead culture, featuring grails, hypebeast essentials, and industrial cuts.",
    dressCodes: ["Sneakerhead", "Skater", "Urban", "Hypebeast"],
    searchKeywords: ["drop", "grail", "graphic tee", "cargo", "oversized", "hype", "distressed", "buckets hat"],
    seasonality: [Season.ALL_SEASON],
  },
  {
    name: "Y2K",
    description: "Nostalgic Gen-Z aesthetics, chunky boots, and metallic cyber-trends.",
    dressCodes: ["Y2K", "Alt", "Grunge", "Cyber"],
    searchKeywords: ["tiktok trend", "brat aesthetic", "low-rise", "baby tee", "crop", "chunky boots", "metallic"],
    seasonality: [Season.ALL_SEASON],
  },
  {
    name: "Casual",
    description: "Effortless off-duty looks for weekend getaways, house parties, and relaxed game nights.",
    dressCodes: ["Casual", "Friday Wear", "Denim", "Basics"],
    searchKeywords: ["road trip", "mall hangout", "house party", "essentials", "bbq", "effortless", "off-duty"],
    seasonality: [Season.ALL_SEASON],
  },
  {
    name: "Campus",
    description: "Youthful university life, from hall weeks and pageants to trendy formal SRC dinners.",
    dressCodes: ["Youthful", "Trendy Formal", "Varsity"],
    searchKeywords: ["hall week", "src awards", "prom", "pageant", "corset", "satin", "university", "freshman"],
    seasonality: [Season.ALL_SEASON],
  },
  {
    name: "Social",
    description: "Elite soirée and garden parties, all-white cruises and sophisticated highlife evenings.",
    dressCodes: ["All-White", "Smart Casual", "Cocktail"],
    searchKeywords: ["day party", "boat cruise", "yacht", "garden party", "highlife", "live band", "sundowner", "picnic"],
    seasonality: [Season.SUMMER, Season.SPRING],
  },
  {
    name: "Brunch",
    description: "Al-fresco midday glam, Prosecco-fueled chic, and sun-drenched floral aesthetics.",
    dressCodes: ["Chic", "Pastel", "Linen", "Flowy"],
    searchKeywords: ["bottomless brunch", "mimosa", "sunglasses", "loafers", "prosecco", "midday", "shades"],
    seasonality: [Season.SUMMER, Season.SPRING],
  },
  {
    name: "Nightlife",
    description: "Electric after-hours style, strobe-ready sequins, and VIP lounge authority.",
    dressCodes: ["Edgy", "Flashy", "Bodycon"],
    searchKeywords: ["clubbing", "vip lounge", "bottle service", "amapiano night", "after-hours", "electric", "dj set"],
    seasonality: [Season.ALL_SEASON],
  },
  {
    name: "Date",
    description: "Sultry intimacy and romantic rendezvous, from candlelight dinners to rooftop anniversaries.",
    dressCodes: ["Romantic", "Soft", "Tailored"],
    searchKeywords: ["candlelight dinner", "anniversary", "rooftop", "dinner", "slip dress", "cologne", "intimacy"],
    seasonality: [Season.ALL_SEASON],
  },
  {
    name: "Professional",
    description: "Modern professional disruption, tech mixers, and high-impact startup networking.",
    dressCodes: ["Business Casual", "Smart Casual", "Techwear"],
    searchKeywords: ["tech mixer", "networking", "startup pitch", "product launch", "innovation", "disruption"],
    seasonality: [Season.ALL_SEASON],
  },
  {
    name: "Corporate",
    description: "Executive presence and tailored precision for the boardroom and the bank.",
    dressCodes: ["Boardroom", "Skirt Suit", "Pant Suit"],
    searchKeywords: ["interview", "law firm", "bank", "tie", "blazer", "briefcase", "office", "polished authority"],
    seasonality: [Season.ALL_SEASON],
  },
  {
    name: "Academic",
    description: "Scholarly excellence and dean's list pride for graduations and alumni dinners.",
    dressCodes: ["Academic", "Robe", "Formal"],
    searchKeywords: ["graduation", "convocation", "matriculation", "alumni dinner", "sash", "laurels", "proud"],
    seasonality: [Season.ALL_SEASON],
  },
  {
    name: "Formal",
    description: "Timeless grandeur and red-carpet ready looks for awards galas and corporate banquets.",
    dressCodes: ["Black Tie", "Gown", "Tuxedo"],
    searchKeywords: ["awards gala", "corporate banquet", "red carpet", "floor-length", "velvet", "grandeur"],
    seasonality: [Season.ALL_SEASON],
  },
  {
    name: "Active",
    description: "High-intensity performance wear for the gym, the track, and the workout grind.",
    dressCodes: ["Activewear", "Performance", "Dri-Fit"],
    searchKeywords: ["gym", "workout", "lifting", "cardio", "running", "spandex", "sports bra"],
    seasonality: [Season.ALL_SEASON],
  },
  {
    name: "Wellness",
    description: "Serenity-focused athleisure for Pilates, Zen retreats, and mindful meditation.",
    dressCodes: ["Seamless", "Breathable", "Earth Tones"],
    searchKeywords: ["pilates", "meditation", "retreat", "athleisure", "yoga", "mindfulness", "zen", "serenity"],
    seasonality: [Season.ALL_SEASON],
  },
  {
    name: "Sports",
    description: "Match day fanaticism and sideline chic, from stadium jerseys to sports bar energy.",
    dressCodes: ["Jersey", "Fanatic", "Team Colors"],
    searchKeywords: ["match day", "stadium", "sports bar", "cap", "denim", "spectator", "sideline chic"],
    seasonality: [Season.ALL_SEASON],
  },
  {
    name: "Resort",
    description: "Jet-set vacation looks and island-hopping luxury for poolside lounging and tropical escapes.",
    dressCodes: ["Resort Wear", "Luxe Vacation", "Kaftan"],
    searchKeywords: ["pool party", "labadi", "kokrobite", "tropical", "vacation", "straw hat", "island hopping"],
    seasonality: [Season.SUMMER],
  },
  {
    name: "Beach",
    description: "Coastal shoreline essentials for sunbathing, coastal walks, and seaside fun.",
    dressCodes: ["Swimwear", "Bikini", "Trunks"],
    searchKeywords: ["sand", "sunbathing", "flip flops", "seaside", "coast", "salty hair", "shoreline"],
    seasonality: [Season.SUMMER],
  },
  {
    name: "Church",
    description: "Sunday best and polished sanctuary style for worship and thanksgiving services.",
    dressCodes: ["Sunday Best", "Fascinator", "Tailored Suit"],
    searchKeywords: ["thanksgiving", "sunday service", "elegant", "choir", "salvation", "sanctuary", "polished"],
    seasonality: [Season.ALL_SEASON],
  },
  {
    name: "Modest",
    description: "Elegant modesty and divine style for Salah, Eid, and sacred observations.",
    dressCodes: ["Abaya", "Hijab", "Jalabiya", "Kaftan"],
    searchKeywords: ["salah", "eid", "jummah", "conservative", "covered", "kufi", "graceful cover"],
    seasonality: [Season.ALL_SEASON],
  },
  {
    name: "Travel",
    description: "First-class wanderlust and terminal chic, highlighting wanderlust comfort for long-haul journeys.",
    dressCodes: ["Tracksuit", "Terminal Chic", "Cozy"],
    searchKeywords: ["airport fit", "long haul", "transit", "oversized", "comfort", "carry-on", "wanderlust"],
    seasonality: [Season.ALL_SEASON],
  },
  {
    name: "Lounge",
    description: "Cozy-core essentials and intimate self-care for silk-set nights and fleece-lined lazy days.",
    dressCodes: ["Loungewear", "Silk Set", "Pajamas"],
    searchKeywords: ["night in", "sleepover", "robe", "fleece", "slippers", "intimate", "self-care", "cozy core"],
    seasonality: [Season.ALL_SEASON],
  },
  {
    name: "Creative",
    description: "Avant-garde curation and poetic expression for gallery openings and eccentric poetry nights.",
    dressCodes: ["Avant-Garde", "Eccentric", "Bohemian"],
    searchKeywords: ["gallery opening", "indie", "creative mixer", "poetry night", "abstract", "minimalist", "exhibition", "curated"],
    seasonality: [Season.ALL_SEASON],
  }
];

async function main() {
  console.log("🚀 Seeding 27 High-Fidelity Events...");
  console.log("⚠️  Images are NOT included. Manual upload required in dashboard.");

  for (const event of eventsData) {
    console.log(`- Scaling Event: ${event.name}...`);
    await prisma.event.upsert({
      where: { name: event.name },
      update: {
        description: event.description,
        dressCodes: event.dressCodes,
        searchKeywords: event.searchKeywords,
        seasonality: event.seasonality,
        isActive: true,
      },
      create: {
        name: event.name,
        description: event.description,
        dressCodes: event.dressCodes,
        searchKeywords: event.searchKeywords,
        seasonality: event.seasonality,
        imageUrl: null, 
        isActive: true,
      },
    });
  }

  console.log("✨ 27 Events seeded successfully!");
  console.log("👉 Run: npx tsx prisma/seed-events.ts");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
