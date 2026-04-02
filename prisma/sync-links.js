const { Pool } = require('pg');

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

const categoryLinks = {
  "Custom Tailoring": ["Fashion Designer"],
  "Alterations & Repairs": ["Fashion Designer"],
  "Bridal & Formal Wear": ["Fashion Designer"],
  "Modeling & Branding": ["Model"],
  "Styling & Consulting": ["Model", "Fashion Designer"],
  "Fabric Sourcing": ["Vendor"],
  "Apparel Customization": ["Vendor", "Fashion Designer"],
  "Fashion Photography": ["Fashion Photographer"],
};

async function syncLinks() {
  const client = await pool.connect();
  console.log("Connected to DB. Starting Relational Sync...");

  try {
    await client.query('BEGIN');

    for (const [catName, roles] of Object.entries(categoryLinks)) {
      // 1. Get the category by name
      const res = await client.query('SELECT id FROM "ServiceCategory" WHERE name = $1', [catName]);
      
      if (res.rows.length === 0) {
        console.warn(`! Category NOT found: ${catName}. Skipping links.`);
        continue;
      }

      const catId = res.rows[0].id;
      console.log(`Linking ${catName} (${catId})...`);

      // 2. Clear old links for this category
      await client.query('DELETE FROM "_ProfessionalTypeToServiceCategory" WHERE "A" = $1', [catId]);

      // 3. Link each role
      for (const roleName of roles) {
        const roleId = RoleIds[roleName];
        if (roleId) {
          await client.query('INSERT INTO "_ProfessionalTypeToServiceCategory" ("A", "B") VALUES ($1, $2) ON CONFLICT DO NOTHING', [catId, roleId]);
          console.log(`  + Linked to: ${roleName}`);
        }
      }
    }

    await client.query('COMMIT');
    console.log("\nSync finished successfully!");
  } catch (e) {
    await client.query('ROLLBACK');
    console.error("Sync FAILED:", e);
  } finally {
    client.release();
    await pool.end();
  }
}

syncLinks();
