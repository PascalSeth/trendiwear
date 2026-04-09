const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
