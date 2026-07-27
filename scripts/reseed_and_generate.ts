import dotenv from "dotenv";
dotenv.config();
import { prisma } from "../lib/prisma";

const CURATED_EVENT_KEYWORD_MAP: Record<string, { searchKeywords: string[]; dressCodes: string[]; description?: string }> = {
  wedding: {
    searchKeywords: ["Nigerian Owambe AsoEbi", "Gele Silk Velvet Gown", "Kente Royalty Wedding Attire", "Traditional Wedding Guest Gown"],
    dressCodes: ["Traditional Glamour", "Aso-Ebi Velvet", "Regal Kente"],
    description: "Curated High-Fashion Owambe, Aso-Ebi, and Kente wedding guest looks for traditional African nuptials.",
  },
  owambe: {
    searchKeywords: ["Owambe Nigerian Party", "AsoEbi Lace Silk Gown", "Gele Headwrap Velvet", "Agbada Coral Beads Traditional"],
    dressCodes: ["Owambe Glamour", "Full Gele & Aso-Ebi", "Regal Agbada"],
    description: "Opulent Nigerian Owambe celebration attire featuring lace, velvet, coral beads, and statement Gele headwraps.",
  },
  traditional: {
    searchKeywords: ["Regal African Traditional Royalty", "Kente Ceremonial Robe", "Agbada Coral Beads", "Velvet AsoEbi Gown"],
    dressCodes: ["Ancestral Royalty", "Kente Silk", "Agbada Traditional"],
    description: "Regal traditional African ceremonial robes, royal Kente silks, and Agbada couture.",
  },
  church: {
    searchKeywords: ["Modest African Print Gown", "Silk Turban Headwrap", "White Church Attire", "Kente Ceremonial Dress"],
    dressCodes: ["Modest Elegance", "Church White", "Silk Turban"],
    description: "Graceful and modest African print dresses, silk turbans, and ceremonial church attire.",
  },
  street: {
    searchKeywords: ["Lagos Hypebeast Streetwear", "Accra Y2K Afro-Fusion Jacket", "Ankara Bomber Denim Cargo", "Afro-Futurism Street Style"],
    dressCodes: ["Afro-Y2K Streetwear", "Ankara Denim", "Urban Hypebeast"],
    description: "High-concept African streetwear, Y2K Lagos denim fits, Accra hypebeast jackets, and Ankara cargo pants.",
  },
  corporate: {
    searchKeywords: ["Ankara Corporate Power Suit", "Afro-Executive Blazer", "Bespoke Safari Linen Suit", "Tailored Professional Workwear"],
    dressCodes: ["Ankara Corporate", "Safari Linen", "Power Suit"],
    description: "Sharp tailored Ankara power suits, safari linen blazers, and executive African corporate attire.",
  },
  gala: {
    searchKeywords: ["Met Gala Afro-Couture", "Satin Gold Evening Gown", "Red Carpet High Fashion African Gown", "Cocktail Evening Glamour"],
    dressCodes: ["Afro-Couture", "Floor Length Satin Gown", "Black Tie Glamour"],
    description: "Met Gala style Afro-couture, floor-length silk gowns, and high-fashion red carpet evening wear.",
  },
  resort: {
    searchKeywords: ["African Print Kaftan Wrap", "Dashiki Summer Resort Beach", "Sunlit Afro Linen Wear", "Coastal Kaftan"],
    dressCodes: ["Resort Kaftan", "Linen Beachwear", "Dashiki Chill"],
    description: "Breezy African print kaftans, linen resort wear, and sunlit coastal getaway styles.",
  },
  beach: {
    searchKeywords: ["African Print Swimwear Kaftan", "Sunlit Coastal Linen Wrap", "Dashiki Beachwear", "Tropical Afro Resort"],
    dressCodes: ["Beach Kaftan", "Sunlit Linen", "Tropical Dashiki"],
    description: "Tropical African print swimwear, beach wraps, and sunlit coastal resort wear.",
  },
  funeral: {
    searchKeywords: ["Ghanaian Black and Red Funeral Kente", "Modest Ceremonial Funeral Dress", "Dark Silk Traditional Robe"],
    dressCodes: ["Black & Red Kente", "Traditional Mourning Silk", "Modest Ceremonial"],
    description: "Traditional Ghanaian black & red Kente mourning attire and dignified ceremonial memorial wear.",
  },
  sports: {
    searchKeywords: ["Afro-Athleisure Tracksuit", "Ankara Sportswear Fit", "Urban African Athleisure", "Cyber Sports Outerwear"],
    dressCodes: ["Afro-Athleisure", "Ankara Sportswear", "Urban Casual"],
    description: "Afro-fusion athleisure, Ankara print tracksuits, and active urban activewear.",
  },
  lounge: {
    searchKeywords: ["Silk Ankara Loungewear", "Afro-Chic Robe Set", "Linen Relaxation Outfit", "Casual Silk Kaftan"],
    dressCodes: ["Silk Loungewear", "Ankara Robe", "Linen Chill"],
    description: "Luxurious silk Ankara loungewear, chill kaftan sets, and relaxed weekend chic.",
  },
  creative: {
    searchKeywords: ["Avant-Garde African Couture", "Afro-Futurism High Fashion", "Artisanal Handwoven Textile", "Sculptural Ankara Dress"],
    dressCodes: ["Avant-Garde Afro", "Sculptural Couture", "Artisanal Textile"],
    description: "Avant-garde Afro-futurism high fashion, sculptural Ankara gowns, and creative editorial couture.",
  },
};

function findBestKeywordsForEvent(name: string) {
  const nameLower = name.toLowerCase();
  for (const [key, data] of Object.entries(CURATED_EVENT_KEYWORD_MAP)) {
    if (nameLower.includes(key)) {
      return data;
    }
  }
  return {
    searchKeywords: [`${name} African Fashion Model`, `${name} Afrocentric Attire`, `African ${name} Style`],
    dressCodes: ["African Chic", "Afrocentric Elegance", "Smart Casual"],
    description: `Curated high-fashion lookbook concepts and style trends for ${name}.`,
  };
}

function buildAIPromptForEvent(eventName: string, index: number): { prompt: string; title: string } {
  const nameLower = eventName.toLowerCase();
  
  if (nameLower.includes('wedding') || nameLower.includes('traditional') || nameLower.includes('owambe') || nameLower.includes('funeral') || nameLower.includes('church') || nameLower.includes('modest')) {
    const prompts = [
      `Photorealistic 8k editorial portrait of a Black fashion model wearing luxurious royal African Asoebi silk velvet gown with Gele headwrap`,
      `Photorealistic 8k full body portrait of an African male model in embroidered Agbada with coral neck beads, Kente ceremonial royal outfit`,
      `Photorealistic 8k fashion photography of a Black female model in emerald green velvet Aso-Ebi dress, elaborate headpiece`,
      `Photorealistic 8k portrait of an African bride wearing custom lace traditional wedding attire, coral bead crown`,
    ];
    return { prompt: prompts[index % prompts.length], title: `AI Regal ${eventName} Traditional` };
  }

  if (nameLower.includes('street') || nameLower.includes('hypebeast') || nameLower.includes('y2k') || nameLower.includes('campus') || nameLower.includes('sports')) {
    const prompts = [
      `Photorealistic 8k street style photo of a Black male model wearing Lagos hypebeast Y2K denim streetwear jacket`,
      `Photorealistic 8k street fashion portrait of a Black female model in Ankara print bomber jacket and cargo pants`,
      `Photorealistic 8k street fashion shot of an African model in Afro-fusion streetwear, Lagos urban street`,
    ];
    return { prompt: prompts[index % prompts.length], title: `AI ${eventName} Afro-Streetwear` };
  }

  if (nameLower.includes('corporate') || nameLower.includes('work') || nameLower.includes('academic') || nameLower.includes('professional') || nameLower.includes('office')) {
    const prompts = [
      `Photorealistic 8k portrait of a Black businesswoman wearing a sharp tailored Ankara corporate power suit`,
      `Photorealistic 8k portrait of an African male executive in a linen safari business suit, office background`,
    ];
    return { prompt: prompts[index % prompts.length], title: `AI ${eventName} Executive Suit` };
  }

  if (nameLower.includes('gala') || nameLower.includes('nightlife') || nameLower.includes('party') || nameLower.includes('cocktail') || nameLower.includes('brunch') || nameLower.includes('festival')) {
    const prompts = [
      `Photorealistic 8k red carpet fashion photo of a Black female model in a floor length satin gold embroidered gala gown`,
      `Photorealistic 8k portrait of a Black model in luxury evening haute couture dress with cape, paparazzi flash lighting`,
    ];
    return { prompt: prompts[index % prompts.length], title: `AI ${eventName} Gala Gown` };
  }

  const defaultPrompt = `Photorealistic 8k editorial fashion portrait of a Black fashion model wearing resort casual African print Kaftan, golden hour lighting`;
  return { prompt: defaultPrompt, title: `AI ${eventName} Resort Style` };
}

async function main() {
  console.log("=== STEP 1: RE-SEEDING ALL EVENT KEYWORDS IN POSTGRESQL ===");
  const events = await prisma.event.findMany();
  console.log(`Found ${events.length} events in database.`);

  for (const event of events) {
    const bestData = findBestKeywordsForEvent(event.name);
    await prisma.event.update({
      where: { id: event.id },
      data: {
        searchKeywords: bestData.searchKeywords,
        dressCodes: bestData.dressCodes,
        description: event.description || bestData.description,
      },
    });
    console.log(`[Re-Seeded] Event: "${event.name}" -> Keywords:`, bestData.searchKeywords);
  }

  console.log("\n=== STEP 2: GENERATING PHOTOREALISTIC AI LOOKBOOKS PER EVENT CATEGORY ===");
  
  const adminUser = await prisma.user.findFirst({
    where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
  });
  const stylistId = adminUser?.id || events[0]?.id;

  let totalCreated = 0;

  for (const event of events) {
    let createdForEvent = 0;
    for (let i = 0; i < 3; i++) {
      const { prompt, title } = buildAIPromptForEvent(event.name, i);
      const cleanPrompt = prompt.replace(/[^a-zA-Z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
      const seed = Math.floor(Math.random() * 999999) + (i * 137);
      const outfitImageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt)}?width=800&height=1200&seed=${seed}&nologo=true`;
      const fullTitle = `${title} #${i + 1}`;
      const description = `AI-generated high-fashion African model lookbook for ${event.name} • Prompt: ${prompt}`;

      const existing = await prisma.outfitInspiration.findFirst({
        where: {
          OR: [
            { outfitImageUrl },
            { title: fullTitle },
          ],
        },
      });

      if (!existing) {
        await prisma.outfitInspiration.create({
          data: {
            eventId: event.id,
            stylistId,
            title: fullTitle.slice(0, 150),
            description,
            outfitImageUrl,
            likes: Math.floor(Math.random() * 80) + 35,
            tags: [event.name, "AI-Generated", ...event.searchKeywords.slice(0, 2)],
            isActive: true,
            isFeatured: i === 0,
          },
        });
        createdForEvent++;
        totalCreated++;
      }
    }
    console.log(`[AI Generator] Created ${createdForEvent} AI lookbooks for category: "${event.name}"`);
  }

  console.log(`\n✅ COMPLETE! Successfully re-seeded all event keywords and generated ${totalCreated} new AI trend lookbooks across ${events.length} categories!`);
}

main()
  .catch((e) => {
    console.error("Error running script:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
