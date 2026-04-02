import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.$queryRaw`SELECT 1`;
  console.log("Connection successful:", result);
}

main()
  .catch((e) => console.error("Connection failed:", e))
  .finally(async () => await prisma.$disconnect());
