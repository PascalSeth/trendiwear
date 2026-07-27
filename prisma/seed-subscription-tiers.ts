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
  console.log('Seeding Ghanaian Subscription Tiers with AI Credit Limits...')

  const tiers = [
    {
      name: 'Free Artisan',
      description: 'Free starter plan for emerging tailors & small boutique sellers.',
      weeklyPrice: 0,
      monthlyPrice: 0,
      yearlyPrice: 0,
      features: [
        '15 Product & Service Listings',
        '10 Monthly AI Studio Credits',
        'Escrow Wallet & MoMo Payout Access',
        'Standard Merchant Storefront Profile',
        'Direct Customer Orders & Bookings'
      ],
      storageLimit: 2000,
      monthlyListings: 15,
      aiCreditsLimit: 10,
      analyticsAccess: false,
      prioritySupport: false,
      featuredBadge: false,
      order: 1,
    },
    {
      name: 'Ohene Royal Merchant',
      description: 'For established fashion brands & busy tailoring houses.',
      weeklyPrice: 45,
      monthlyPrice: 150,
      yearlyPrice: 1500,
      features: [
        'Unlimited Products & Service Listings',
        '40 Monthly AI Studio Credits',
        'Verified Merchant Royalty Badge',
        'Full Revenue Analytics & Store Intel',
        'Priority Search Ranking in Marketplace',
        'Unlimited Outfit Inspiration Lookbooks'
      ],
      storageLimit: 10000,
      monthlyListings: 10000,
      aiCreditsLimit: 40,
      analyticsAccess: true,
      prioritySupport: false,
      featuredBadge: true,
      order: 2,
    },
    {
      name: 'Legend Empire',
      description: 'For iconic fashion houses, master tailors & top boutiques.',
      weeklyPrice: 95,
      monthlyPrice: 320,
      yearlyPrice: 3200,
      features: [
        'Everything in Ohene Royal Merchant',
        '120 Monthly AI Studio Credits',
        'Homepage & Spotlight Banner Placement',
        'Service Package Bundles & Add-ons',
        'Priority MoMo Payout Approvals',
        'Dedicated VIP Account Support'
      ],
      storageLimit: 50000,
      monthlyListings: 100000,
      aiCreditsLimit: 120,
      analyticsAccess: true,
      prioritySupport: true,
      featuredBadge: true,
      order: 3,
    },
  ]

  // Clear inactive subscription ties and delete legacy tiers
  const newNames = tiers.map(t => t.name)
  
  const legacyTiers = await prisma.subscriptionTier.findMany({
    where: { name: { notIn: newNames } },
    select: { id: true }
  })
  const legacyIds = legacyTiers.map(t => t.id)

  if (legacyIds.length > 0) {
    await prisma.subscription.deleteMany({
      where: { tierId: { in: legacyIds } }
    }).catch(() => {})
    
    await prisma.subscriptionTier.deleteMany({
      where: { id: { in: legacyIds } }
    }).catch(() => {})
  }

  for (const tierData of tiers) {
    await prisma.subscriptionTier.upsert({
      where: { name: tierData.name },
      update: tierData,
      create: tierData,
    })
    console.log(`Upserted tier: ${tierData.name}`)
  }

  console.log('Subscription Tiers reset & seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
