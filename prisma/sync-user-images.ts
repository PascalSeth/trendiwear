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

async function main() {
  console.log("Starting User Image Synchronization...");

  const users = await prisma.user.findMany({
    select: {
      id: true,
      image: true,
      profileImage: true,
      email: true
    }
  });

  console.log(`Found ${users.length} users. Checking for image drift...`);

  let updatedCount = 0;

  for (const user of users) {
    const finalImage = user.profileImage || user.image;

    if (finalImage && (user.image !== finalImage || user.profileImage !== finalImage)) {
      console.log(`  Updating User: ${user.email}...`);
      await prisma.user.update({
        where: { id: user.id },
        data: {
          image: finalImage,
          profileImage: finalImage
        }
      });
      updatedCount++;
    }
  }

  console.log(`Synchronization complete! Adjusted ${updatedCount} users.`);
}

main()
  .catch((e) => {
    console.error("Sync failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
