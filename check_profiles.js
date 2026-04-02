
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;

const pool = new Pool({ 
  connectionString,
  max: 2, 
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const userCount = await prisma.user.count();
  console.log('Total users in DB:', userCount);

  const users = await prisma.user.findMany({
    take: 10,
    select: {
        id: true,
        email: true,
        role: true,
        firstName: true
    }
  });
  console.log('--- Sample Users ---');
  console.log(users);

  const roles = await prisma.user.groupBy({
      by: ['role'],
      _count: true
  });
  console.log('--- User Roles ---');
  console.log(roles);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
      await prisma.$disconnect();
      await pool.end();
  });
