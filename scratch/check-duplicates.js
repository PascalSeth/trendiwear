const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Checking for duplicate MoMo numbers...");
  const profiles = await prisma.professionalProfile.findMany({
    where: {
      momoNumber: {
        not: null,
        not: ""
      }
    },
    select: {
      id: true,
      businessName: true,
      momoNumber: true
    }
  });

  console.log(`Searching through ${profiles.length} profiles with MoMo numbers...`);

  const numMap = new Map();
  const duplicates = [];

  for (const profile of profiles) {
    if (numMap.has(profile.momoNumber)) {
      duplicates.push({
        number: profile.momoNumber,
        original: numMap.get(profile.momoNumber),
        duplicate: profile
      });
    } else {
      numMap.set(profile.momoNumber, profile);
    }
  }

  if (duplicates.length > 0) {
    console.log("\n❌ Found duplicate MoMo numbers:");
    duplicates.forEach(d => {
      console.log(`- Number: ${d.number}`);
      console.log(`  * First occurrence: ${d.original.businessName} (ID: ${d.original.id})`);
      console.log(`  * Duplicate occurrence: ${d.duplicate.businessName} (ID: ${d.duplicate.id})`);
    });
  } else {
    console.log("\n✅ No duplicate MoMo numbers found. Safe to apply unique constraint.");
  }
}

main()
  .catch(e => {
    console.error("Script failed:", e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
