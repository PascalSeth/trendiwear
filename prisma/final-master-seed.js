const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

const RoleIds = {
  "Model": "6a9f5b93-0d8f-4fd5-856e-476729b1ac78",
  "Fashion Photographer": "9f70d549-a8db-40a4-a4a9-c347f6c4775a",
  "Vendor": "c6938ed8-1b90-4883-b499-f984274f7060",
  "Fashion Designer": "e76a8e78-4cca-4948-8b95-a9f092c0336f",
};

const categories = [
  { name: "Custom Tailoring", proRoles: ["Fashion Designer"] },
  { name: "Alterations & Repairs", proRoles: ["Fashion Designer"] },
  { name: "Bridal & Formal Wear", proRoles: ["Fashion Designer"] },
  { name: "Modeling & Branding", proRoles: ["Model"] },
  { name: "Styling & Consulting", proRoles: ["Model", "Fashion Designer"] },
  { name: "Fabric Sourcing", proRoles: ["Vendor"] },
  { name: "Apparel Customization", proRoles: ["Vendor", "Fashion Designer"] },
  { name: "Fashion Photography", proRoles: ["Fashion Photographer"] },
];

async function finalSeed() {
  const client = await pool.connect();
  console.log("Connected to DB. Starting Master Seed...");

  try {
    await client.query('BEGIN');

    for (const cat of categories) {
      const catId = uuidv4();
      const slug = cat.name.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-');
      
      console.log(`- Creating: ${cat.name}`);

      // 1. Insert Category (using raw SQL)
      await client.query(`
        INSERT INTO "ServiceCategory" (id, name, "isActive", "createdAt", "updatedAt")
        VALUES ($1, $2, true, NOW(), NOW())
        ON CONFLICT (name) DO UPDATE SET "updatedAt" = NOW()
        RETURNING id
      `, [catId, cat.name]);

      // Get the actual ID (either the new one or existing one)
      const res = await client.query('SELECT id FROM "ServiceCategory" WHERE name = $1', [cat.name]);
      const activeCatId = res.rows[0].id;

      // 2. Link Roles
      for (const roleName of cat.proRoles) {
        const roleId = RoleIds[roleName];
        if (roleId) {
          await client.query(`
            INSERT INTO "_ProfessionalTypeToServiceCategory" ("A", "B")
            VALUES ($1, $2)
            ON CONFLICT DO NOTHING
          `, [activeCatId, roleId]);
          console.log(`  + Linked to: ${roleName}`);
        }
      }
    }

    await client.query('COMMIT');
    console.log("\nMASTER SEED SUCCESSFUL!");
  } catch (e) {
    await client.query('ROLLBACK');
    console.error("MASTER SEED FAILED:", e);
  } finally {
    client.release();
    await pool.end();
  }
}

finalSeed();
