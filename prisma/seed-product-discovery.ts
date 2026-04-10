import { PrismaClient } from "@prisma/client";
import { suggestTags } from "../lib/fashion-engine";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Starting discovery engine migration...");

  const products = await prisma.product.findMany({
    where: {
      OR: [
        { keywords: { equals: [] } },
        { styleTags: { equals: [] } }
      ]
    }
  });

  console.log(`🔍 Found ${products.length} products to re-tag.`);

  for (const product of products) {
    const { styles, keywords } = suggestTags(product.name, product.description);
    
    if (styles.length > 0 || keywords.length > 0) {
      await prisma.product.update({
        where: { id: product.id },
        data: {
          styleTags: styles,
          keywords: keywords,
        },
      });
      console.log(`✅ Tagged: ${product.name} -> [${keywords.join(", ")}]`);
    }
  }

  // Update events with default search keywords if empty
  const events = await prisma.event.findMany({
    where: { searchKeywords: { equals: [] } }
  });

  for (const event of events) {
    // Default search keywords to the event name split by spaces
    const defaultKeywords = event.name.toLowerCase().split(' ').filter(word => word.length > 3);
    
    await prisma.event.update({
      where: { id: event.id },
      data: {
        searchKeywords: defaultKeywords
      }
    });
    console.log(`✅ Event updated: ${event.name} -> keywords: [${defaultKeywords.join(", ")}]`);
  }

  console.log("✨ Migration complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
