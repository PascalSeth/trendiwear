import { Prisma } from "@prisma/client";

async function main() {
  const modelFields = Prisma.dmmf.datamodel.models.find(m => m.name === "ServiceCategory")?.fields;
  console.log(JSON.stringify(modelFields, null, 2));
}

main().catch(console.error);
