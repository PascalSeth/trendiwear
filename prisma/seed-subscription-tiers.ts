import { PrismaClient } from '@prisma/client'
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding Ghanaian Subscription Tiers...')

  const tiers = [
    {
      name: 'Chop Life',
      description: 'For the emerging artisan starting to see success.',
      weeklyPrice: 20,
      monthlyPrice: 70,
      yearlyPrice: 700,
      features: [
        'Up to 12 Product Listings',
        'Standard Boutique Profile',
        'WhatsApp Direct Buy Button',
        'Standard Community Access'
      ],
      storageLimit: 1000,
      monthlyListings: 12,
      analyticsAccess: false,
      prioritySupport: false,
      featuredBadge: false,
      order: 1,
    },
    {
      name: 'Obaahemaa / Ohene',
      description: "The 'Queen' or 'King' of their craft. For established boutiques.",
      weeklyPrice: 50,
      monthlyPrice: 180,
      yearlyPrice: 1800,
      features: [
        'Unlimited Product Listings',
        'Verified Royalty Badge',
        'Basic Sales Analytics',
        'Priority Search Ranking',
        'Direct Checkout Integration'
      ],
      storageLimit: 5000,
      monthlyListings: 10000,
      analyticsAccess: true,
      prioritySupport: false,
      featuredBadge: true,
      order: 2,
    },
    {
      name: 'Legend',
      description: 'For the masters and iconic fashion houses in the industry.',
      weeklyPrice: 120,
      monthlyPrice: 450,
      yearlyPrice: 4500,
      features: [
        'Everything in Professional',
        'Advanced Market Trends & Analytics',
        'Top Slot Search Placement',
        'Featured Gallery Backgrounds',
        'Dedicated Support'
      ],
      storageLimit: 50000,
      monthlyListings: 100000,
      analyticsAccess: true,
      prioritySupport: true,
      featuredBadge: true,
      order: 3,
    },
  ]

  for (const tierData of tiers) {
    await prisma.subscriptionTier.upsert({
      where: { name: tierData.name },
      update: tierData,
      create: tierData,
    })
    console.log(`Upserted tier: ${tierData.name}`)
  }

  console.log('Subscription Tiers seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
