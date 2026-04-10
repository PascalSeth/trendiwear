const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const { Pool } = require('pg')
require('dotenv').config()

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL

async function main() {
  console.log('🚀 Starting Category Migration...')
  console.log('🔗 Connection String available:', !!connectionString)

  const pool = new Pool({ connectionString })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })

  try {
    const legacyProducts = await prisma.product.findMany({
      where: {
        categoryId: { not: null },
        categories: { none: {} }
      }
    })

    console.log(`📦 Found ${legacyProducts.length} legacy products to migrate.`)

    for (const product of legacyProducts) {
      if (product.categoryId) {
        await prisma.product.update({
          where: { id: product.id },
          data: {
            categories: {
              connect: { id: product.categoryId }
            }
          }
        })
        console.log(`✅ Migrated Product: ${product.name} (${product.id})`)
      }
    }

    console.log('🎉 Migration Complete!')
  } catch (err) {
    console.error('❌ Migration Failed:', err)
  } finally {
    await prisma.$disconnect()
    await pool.end()
  }
}

main()
