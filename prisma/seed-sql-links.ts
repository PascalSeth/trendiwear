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

const RoleIds: Record<string, string> = {
  "Model": "6a9f5b93-0d8f-4fd5-856e-476729b1ac78",
  "Fashion Photographer": "9f70d549-a8db-40a4-a4a9-c347f6c4775a",
  "Vendor": "c6938ed8-1b90-4883-b499-f984274f7060",
  "Fashion Designer": "e76a8e78-4cca-4948-8b95-a9f092c0336f",
};

const categoryLinks: Record<string, string[]> = {
  "Custom Tailoring": ["Fashion Designer"],
  "Alterations & Repairs": ["Fashion Designer"],
  "Bridal & Formal Wear": ["Fashion Designer"],
  "Modeling & Branding": ["Model"],
  "Styling & Consulting": ["Model", "Fashion Designer"],
  "Fabric Sourcing": ["Vendor"],
  "Apparel Customization": ["Vendor", "Fashion Designer"],
  "Fashion Photography": ["Fashion Photographer"],
};

async function main() {
  console.log("Starting SQL-based Relational Seeding...");

  for (const [catName, roles] of Object.entries(categoryLinks)) {
    // 1. Get the category ID
    const category = await prisma.serviceCategory.findUnique({
      where: { name: catName }
    });

    if (!category) {
      console.warn(`! Category not found: ${catName}`);
      continue;
    }

    console.log(`Linking Category: ${catName} (${category.id})`);

    for (const roleName of roles) {
      const roleId = RoleIds[roleName];
      console.log(`  -> Role: ${roleName} (${roleId})`);

      try {
        // Direct SQL Insert into the join table
        // Relation name: ProfessionalTypeToServiceCategory
        // Table name: _ProfessionalTypeToServiceCategory
        // Columns: A (ServiceCategory ID), B (ProfessionalType ID)
        await prisma.$executeRawUnsafe(`
          INSERT INTO "_ProfessionalTypeToServiceCategory" ("A", "B")
          VALUES ('${category.id}', '${roleId}')
          ON CONFLICT DO NOTHING
        `);
        console.log(`    Successfully Linked.`);
      } catch (err) {
        console.error(`    FAILED to link ${roleName}:`, err);
      }
    }
  }

  console.log("SQL Seed finished successfully.");
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
