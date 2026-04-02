const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

const professionalTypes = [
  {"id":"6a9f5b93-0d8f-4fd5-856e-476729b1ac78","name":"Model"},
  {"id":"9f70d549-a8db-40a4-a4a9-c347f6c4775a","name":"Fashion Photographer"},
  {"id":"c6938ed8-1b90-4883-b499-f984274f7060","name":"Vendor"},
  {"id":"e76a8e78-4cca-4948-8b95-a9f092c0336f","name":"Fashion Designer"}
];

const categoriesToCreate = [
  { name: "Custom Tailoring", proNames: ["Fashion Designer"] },
  { name: "Alterations & Repairs", proNames: ["Fashion Designer"] },
  { name: "Bridal & Formal Wear", proNames: ["Fashion Designer"] },
  { name: "Modeling & Branding", proNames: ["Model"] },
  { name: "Styling & Consulting", proNames: ["Model", "Fashion Designer"] },
  { name: "Fabric Sourcing", proNames: ["Vendor"] },
  { name: "Apparel Customization", proNames: ["Vendor", "Fashion Designer"] },
  { name: "Fashion Photography", proNames: ["Fashion Photographer"] },
];

async function seed() {
  await client.connect();
  console.log("Connected to DB. Seeding with your EXACT professional types...");

  try {
    await client.query('BEGIN');

    for (const cat of categoriesToCreate) {
      // 1. Ensure Category exists
      const catRes = await client.query(`
        INSERT INTO "ServiceCategory" (id, name, "isActive", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), $1, true, NOW(), NOW())
        ON CONFLICT (name) DO UPDATE SET "updatedAt" = NOW()
        RETURNING id
      `, [cat.name]);
      
      const catId = catRes.rows[0].id;
      console.log(`- Category: ${cat.name}`);

      // 2. Link Roles
      for (const proName of cat.proNames) {
        const pro = professionalTypes.find(p => p.name === proName);
        if (pro) {
          await client.query(`
            INSERT INTO "_ProfessionalTypeToServiceCategory" ("A", "B")
            VALUES ($1, $2)
            ON CONFLICT DO NOTHING
          `, [catId, pro.id]);
          console.log(`  + Linked to: ${proName} (${pro.id})`);
        }
      }
    }

    await client.query('COMMIT');
    console.log("\nSEED COMPLETE!");
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("SEED FAILED:", err.message);
  } finally {
    await client.end();
  }
}

seed();
