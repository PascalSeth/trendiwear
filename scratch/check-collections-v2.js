const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: 'c:/Users/pasca/OneDrive/Desktop/trendiwear/.env' });

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function main() {
  try {
    const count = await prisma.collection.count();
    console.log('Total Collections:', count);
    
    if (count > 0) {
      const allCollections = await prisma.collection.findMany({
        select: { id: true, name: true, isActive: true, isFeatured: true }
      });
      console.log('Collections List:', JSON.stringify(allCollections, null, 2));
    }
    
    const activeAndFeatured = await prisma.collection.count({
      where: { isActive: true, isFeatured: true }
    });
    console.log('Active and Featured Collections:', activeAndFeatured);

  } catch (e) {
    console.error('Error details:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
