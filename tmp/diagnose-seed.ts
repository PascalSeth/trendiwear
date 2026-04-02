import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;

const createPrismaClient = () => {
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
};

const prisma = createPrismaClient();

async function main() {
  console.log("--- SEED DIAGNOSTICS ---");

  // 1. Check Service Categories
  const categories = await prisma.serviceCategory.findMany();
  console.log(`\nService Categories Found: ${categories.length}`);
  categories.forEach(cat => console.log(` - ${cat.name} (${cat.id})`));

  // 2. Check Professional Types
  const proTypes = await prisma.professionalType.findMany();
  console.log(`\nProfessional Types Found: ${proTypes.length}`);
  proTypes.forEach(pt => console.log(` - ${pt.name} (${pt.id})`));

  // 3. Check Join Table directly
  try {
    const links: any[] = await prisma.$queryRaw`SELECT * FROM "_ProfessionalTypeToServiceCategory"`;
    console.log(`\nRelational Links Found: ${links.length}`);
  } catch (err) {
    console.error("\n! Join table access failed. It might not exist yet.");
  }

  console.log("\n--- END DIAGNOSTICS ---");
}

main().catch(console.error).finally(() => prisma.$disconnect());
