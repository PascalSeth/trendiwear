const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

const RoleIds = {
  "Fashion Designer": "e76a8e78-4cca-4948-8b95-a9f092c0336f",
  "Model": "6a9f5b93-0d8f-4fd5-856e-476729b1ac78",
};

async function diagnosticSeed() {
  await client.connect();
  console.log("Connected to DB. Starting Explicit Diagnostic Seed...");

  try {
    // 1. Create a category
    console.log("Step 1: Creating 'Custom Tailoring' category...");
    const catRes = await client.query(`
      INSERT INTO "ServiceCategory" (id, name, "isActive", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), 'Custom Tailoring', true, NOW(), NOW())
      ON CONFLICT (name) DO UPDATE SET "updatedAt" = NOW()
      RETURNING id
    `);
    
    const catId = catRes.rows[0].id;
    console.log(`- SUCCESS: Category ID is ${catId}`);

    // 2. Link to 'Fashion Designer' (e76a8e78-4cca-4948-8b95-a9f092c0336f)
    const roleId = RoleIds["Fashion Designer"];
    console.log(`Step 2: Linking Category ${catId} to Role ${roleId}...`);
    
    await client.query(`
      INSERT INTO "_ProfessionalTypeToServiceCategory" ("A", "B")
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
    `, [catId, roleId]);
    
    console.log("- SUCCESS: Link created.");

    // 3. Verify
    const verifyRes = await client.query(`
      SELECT COUNT(*) FROM "_ProfessionalTypeToServiceCategory" WHERE "A" = $1 AND "B" = $2
    `, [catId, roleId]);
    
    console.log(`Final Verification Count: ${verifyRes.rows[0].count}`);

  } catch (err) {
    console.error("DIAGNOSTIC SEED FAILED!");
    console.error("Message:", err.message);
    console.error("Detail:", err.detail);
    console.error("Hint:", err.hint);
  } finally {
    await client.end();
  }
}

diagnosticSeed();
