import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as dotenv from "dotenv";

dotenv.config();

const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

const DEFAULT_TIERS = [
  {
    name: "BASIC",
    description: "Perfect for getting started - Weekly subscription",
    monthlyPrice: 0,
    yearlyPrice: 0,
    weeklyPrice: 1500, // $15/week
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
    description: "For growing businesses - Monthly subscription",
    monthlyPrice: 9999, // $99.99/month
    yearlyPrice: 0,
    weeklyPrice: 0,
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
    description: "For established professionals - Yearly subscription",
    monthlyPrice: 0,
    yearlyPrice: 199990, // $1,999.90/year
    weeklyPrice: 0,
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
    console.log("��� Seeding subscription tiers...");

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
