const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const professionalTypes = [
  {
    name: 'Bespoke Tailor',
    description: 'Specializes in custom-fit apparel and alterations. Primarily sells custom products with optional fitting services.'
  },
  {
    name: 'Fashion Designer',
    description: 'Designs and sells original brand collections. Focuses on ready-to-wear products and pre-orders.'
  },
  {
    name: 'Boutique Owner',
    description: 'Retailer selling a curated mix of finished apparel from various brands.'
  },
  {
    name: 'Personal Stylist',
    description: 'Offers curated style packs and accessory sets as products, with styling consultations as a plus.'
  },
  {
    name: 'Fabric & Lace Vendor',
    description: 'Supplier of raw materials, textiles, and lace bundles for designers and consumers.'
  },
  {
    name: 'Model',
    description: 'Showcases featured looks and lifestyle kits. primarily selling curated outfit selections.'
  },
  {
    name: 'Fashion Photographer',
    description: 'Sells digital content packs, presets, and offers professional shoot sessions as services.'
  }
];

async function seed() {
  console.log('Starting seed: Professional Types...');
  for (const type of professionalTypes) {
    await prisma.professionalType.upsert({
      where: { name: type.name },
      update: { description: type.description },
      create: type,
    });
    console.log(`Upserted: ${type.name}`);
  }
  console.log('Seed finished successfully.');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
