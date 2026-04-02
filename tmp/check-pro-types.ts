import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const types = await prisma.professionalType.findMany();
  console.log(JSON.stringify(types, null, 2));
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
