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

const categories = [
  {
    name: "Custom Tailoring",
    description: "Bespoke stitching for suits, dresses, and traditional wear.",
    imageUrl: "https://images.unsplash.com/photo-1598462047020-d9ac030a520c?auto=format&fit=crop&q=80&w=800",
    proRoles: ["Fashion Designer"],
  },
  {
    name: "Alterations & Repairs",
    description: "Professional resizing, mending, and garment restoration.",
    imageUrl: "https://images.unsplash.com/photo-1524311583145-d4193b216067?auto=format&fit=crop&q=80&w=800",
    proRoles: ["Fashion Designer"],
  },
  {
    name: "Bridal & Formal Wear",
    description: "Specialized design and tailoring for weddings and gala events.",
    imageUrl: "https://images.unsplash.com/photo-1594553924340-023a1a09d3b1?auto=format&fit=crop&q=80&w=800",
    proRoles: ["Fashion Designer"],
  },
  {
    name: "Modeling & Branding",
    description: "Professional modeling for photo shoots, runway, and campaigns.",
    imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800",
    proRoles: ["Model"],
  },
  {
    name: "Styling & Consulting",
    description: "Wardrobe styling, fashion direction, and image consulting.",
    imageUrl: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=800",
    proRoles: ["Model", "Fashion Designer"],
  },
  {
    name: "Fabric Sourcing",
    description: "Expert selection and procurement of fabrics and textiles.",
    imageUrl: "https://images.unsplash.com/photo-1554524419-5369c76503c2?auto=format&fit=crop&q=80&w=800",
    proRoles: ["Vendor"],
  },
  {
    name: "Apparel Customization",
    description: "Services like screen printing, embroidery, and fabric painting.",
    imageUrl: "https://images.unsplash.com/photo-1520004434532-668416a08753?auto=format&fit=crop&q=80&w=800",
    proRoles: ["Vendor", "Fashion Designer"],
  },
  {
    name: "Fashion Photography",
    description: "Professional photo sessions, lookbook shoots, and digital content.",
    imageUrl: "https://images.unsplash.com/photo-1542038783-0215c8295aef?auto=format&fit=crop&q=80&w=800",
    proRoles: ["Fashion Photographer"],
  },
];

async function runSeed() {
  const client = await pool.connect();
  console.log("Connected to DB via Pure PG. Seeding Service Categories...");

  try {
    // Start transaction
    await client.query('BEGIN');

    for (const cat of categories) {
      // 1. Upsert Category
      const catRes = await client.query(`
        INSERT INTO "ServiceCategory" (id, name, description, "imageUrl", "isActive", "updatedAt")
        VALUES (gen_random_uuid(), $1, $2, $3, true, NOW())
        ON CONFLICT (name) DO UPDATE 
        SET description = EXCLUDED.description, "imageUrl" = EXCLUDED."imageUrl"
        RETURNING id
      `, [cat.name, cat.description, cat.imageUrl]);

      const catId = catRes.rows[0].id;
      console.log(`- Category: ${cat.name} (${catId})`);

      // 2. Clear old links for this category
      await client.query(`DELETE FROM "_ProfessionalTypeToServiceCategory" WHERE "A" = $1`, [catId]);

      // 3. Link to Professional Types
      for (const role of cat.proRoles) {
        const roleId = RoleIds[role];
        if (roleId) {
          await client.query(`
            INSERT INTO "_ProfessionalTypeToServiceCategory" ("A", "B")
            VALUES ($1, $2)
            ON CONFLICT DO NOTHING
          `, [catId, roleId]);
          console.log(`  + Linked to: ${role}`);
        }
      }
    }

    await client.query('COMMIT');
    console.log("\nSeed finished successfully!");
  } catch (e) {
    await client.query('ROLLBACK');
    console.error("Seed FAILED:", e);
  } finally {
    client.release();
    await pool.end();
  }
}

runSeed();
