import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

const DEFAULT_TIERS = [
  {
    name: "BASIC",
    description: "Perfect for getting started",
    monthlyPrice: 4999,
    yearlyPrice: 49990,
    weeklyPrice: 1500,
    features: [
      "Up to 10 products",
      "Basic analytics",
      "Standard support",
    ],
    monthlyListings: 10,
    storageLimit: 500,
    analyticsAccess: true,
    prioritySupport: false,
    featuredBadge: false,
  },
  {
    name: "PRO",
    description: "For growing businesses",
    monthlyPrice: 9999,
    yearlyPrice: 99990,
    weeklyPrice: 3000,
    features: [
      "Up to 50 products",
      "Advanced analytics",
      "Priority support",
      "Custom branding",
    ],
    monthlyListings: 50,
    storageLimit: 2000,
    analyticsAccess: true,
    prioritySupport: true,
    featuredBadge: true,
  },
  {
    name: "PREMIUM",
    description: "For established professionals",
    monthlyPrice: 19999,
    yearlyPrice: 199990,
    weeklyPrice: 6000,
    features: [
      "Unlimited products",
      "Full analytics suite",
      "24/7 dedicated support",
      "Custom branding",
      "API access",
      "Advanced integrations",
    ],
    monthlyListings: 1000,
    storageLimit: 10000,
    analyticsAccess: true,
    prioritySupport: true,
    featuredBadge: true,
  },
];

async function seed() {
  try {
    console.log("🌱 Seeding subscription tiers...");

    for (const tier of DEFAULT_TIERS) {
      const existing = await prisma.subscriptionTier.findUnique({
        where: { name: tier.name },
      });

      if (existing) {
        console.log(`✅ Tier ${tier.name} already exists`);
        continue;
      }

      await prisma.subscriptionTier.create({
        data: tier,
      });

      console.log(`✅ Created tier: ${tier.name}`);
    }

    console.log("✅ Seeding completed successfully!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
