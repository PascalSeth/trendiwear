import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Starting Category Migration...')

  // Find all products that have a categoryId but no categories connected
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
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
