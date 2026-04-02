
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listProfessionalTypes() {
  try {
    const types = await prisma.professionalType.findMany();
    console.log('Professional Types in System:');
    console.log(JSON.stringify(types, null, 2));
  } catch (err) {
    console.error('Error fetching professional types:', err);
  } finally {
    await prisma.$disconnect();
  }
}

listProfessionalTypes();
