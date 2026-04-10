import "dotenv/config";
import { PrismaClient } from "@prisma/client";
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

function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

const categoryData = [
  {
    name: "Men",
    description: "Men's Clothing",
    subcategories: [
      { name: "Tops", description: "T-shirts, tanks and casual tops for everyday wear." },
      { name: "Bottoms", description: "Jeans, trousers and shorts for every occasion." },
      { name: "Suits", description: "Complete suit sets and blazers for formal occasions." },
      { name: "Shirts", description: "Casual and formal shirts and polo tees." },
      { name: "Jackets", description: "Warm jackets and coats for cold weather." },
      { name: "Activewear", description: "Gym and sports clothing for active lifestyles." },
      { name: "Underwear", description: "Everyday underwear, briefs and socks." },
      { name: "Sleepwear", description: "Comfortable pyjamas and robes for bedtime." },
      { name: "Swimwear", description: "Trunks and boardshorts for the beach and pool." },
      { name: "Footwear", description: "Casual and formal shoes and sneakers for men." },
      { name: "Traditional", description: "Dashikis, kaftans and African print styles." },
    ],
  },
  {
    name: "Women",
    description: "Women's Clothing",
    subcategories: [
      { name: "Blouses", description: "Light tops, blouses and shirts for everyday wear." },
      { name: "Dresses", description: "Day and evening dresses for every occasion." },
      { name: "Skirts", description: "Mini, midi and maxi skirts for all styles." },
      { name: "Trousers", description: "Smart trousers, wide legs and everyday denim." },
      { name: "Blazers", description: "Tailored blazers and full suit sets for women." },
      { name: "Coats", description: "Trenchcoats, puffers and jackets for all seasons." },
      { name: "Sportswear", description: "Leggings, sports bras and workout sets." },
      { name: "Lingerie", description: "Everyday and special occasion bras and underwear." },
      { name: "Loungewear", description: "Pyjama sets and relaxed pieces for staying in." },
      { name: "Swimwear", description: "Bikinis, one-pieces and beach cover-ups." },
      { name: "Heels", description: "Heels, flats and sandals for women." },
      { name: "Kaftans", description: "Kaftans, ankara styles and cultural dresses." },
    ],
  },
  {
    name: "Accessories",
    description: "Elevated essentials for the modern wardrobe.",
    subcategories: [
      { name: "Watches", description: "Wristwatches for men and women." },
      { name: "Sunglasses", description: "UV-protective eyewear for sunny days." },
      { name: "Belts", description: "Leather and fabric belts for trousers and dresses." },
      { name: "Hats", description: "Caps, beanies and sun hats for every season." },
      { name: "Scarves", description: "Neck and head wraps for warmth and style." },
      { name: "Jewellery", description: "Rings, necklaces, earrings and bracelets." },
      { name: "Wallets", description: "Card and cash holders for men and women." },
      { name: "Ties", description: "Neckties, bow ties and pocket squares for formal wear." },
      { name: "Hairwear", description: "Clips, pins, scrunchies and headbands." },
      { name: "Gloves", description: "Hand coverings for cold weather and fashion." },
    ],
  },
  {
    name: "Kids & Baby",
    description: "Clothing designed with little ones in mind.",
    subcategories: [
      { name: "Newborns", description: "Soft essentials for babies aged 0–3 months." },
      { name: "Rompers", description: "One-piece outfits for babies and toddlers." },
      { name: "Onesies", description: "Snap-button bodysuits for babies up to 24 months." },
      { name: "Playwear", description: "Durable everyday outfits for toddlers aged 2–5 years." },
      { name: "Uniforms", description: "School uniforms for boys and girls aged 6–12 years." },
      { name: "Streetwear", description: "Trendy casual outfits for teens aged 13–17 years." },
      { name: "Sneakers", description: "Everyday shoes for kids of all ages." },
      { name: "Sandals", description: "Open-toe shoes for warm weather and play." },
      { name: "Mittens", description: "Hand warmers and gloves for little ones." },
      { name: "Bibs", description: "Feeding and drool bibs for babies." },
    ],
  },
  {
    name: "Bags & Luggage",
    description: "Form meets function in our curated carryall collection.",
    subcategories: [
      { name: "Handbags", description: "Everyday carry bags and statement pieces for women." },
      { name: "Backpacks", description: "Bags worn on the back for school, work and travel." },
      { name: "Totes", description: "Large open bags for shopping and daily use." },
      { name: "Clutches", description: "Small handheld bags for evenings and events." },
      { name: "Crossbodies", description: "Small bags worn across the body for hands-free use." },
      { name: "Luggage", description: "Suitcases and travel bags for trips." },
      { name: "Duffels", description: "Large holdall bags for the gym and weekend trips." },
      { name: "Briefcases", description: "Work bags for laptops and documents." },
      { name: "Pouches", description: "Small zip bags for toiletries and accessories." },
      { name: "Cardholders", description: "Slim holders for cards and cash." },
    ],
  },
];

async function main() {
  console.log("Starting Refined Product Category Seeding...");

  for (let i = 0; i < categoryData.length; i++) {
    const parent = categoryData[i];
    const parentSlug = slugify(parent.name);

    console.log(`Seeding Parent: ${parent.name}...`);

    const createdParent = await prisma.category.upsert({
      where: { slug: parentSlug },
      update: {
        name: parent.name,
        description: parent.description,
        level: 0,
        order: i,
        isActive: true,
      },
      create: {
        name: parent.name,
        description: parent.description,
        slug: parentSlug,
        level: 0,
        order: i,
        isActive: true,
      },
    });

    for (let j = 0; j < parent.subcategories.length; j++) {
      const sub = parent.subcategories[j];
      const subSlug = slugify(`${parent.name}-${sub.name}`);

      console.log(`  - Seeding Subcategory: ${sub.name} (Slug: ${subSlug})...`);

      await prisma.category.upsert({
        where: { slug: subSlug },
        update: {
          name: sub.name,
          parentId: createdParent.id,
          description: sub.description,
          level: 1,
          order: j,
          isActive: true,
        },
        create: {
          name: sub.name,
          slug: subSlug,
          parentId: createdParent.id,
          description: sub.description,
          level: 1,
          order: j,
          isActive: true,
        },
      });
    }
  }

  console.log("Product categories seeded successfully with duplicate name support!");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
