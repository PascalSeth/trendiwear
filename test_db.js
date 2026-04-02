const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const profiles = await prisma.professionalProfile.findMany({
    select: {
      id: true,
      businessName: true,
      paystackSubaccountCode: true,
      momoProvider: true,
      momoNumber: true
    }
  });
  console.log("Profiles:", profiles);

  const orders = await prisma.order.findMany({
    where: { paymentStatus: 'PAID' },
    select: {
      id: true,
      paystackReference: true,
      platformFee: true,
      totalPrice: true,
      updatedAt: true
    }
  });
  console.log("Paid Orders:", orders);
}

check().catch(console.error).finally(() => prisma.$disconnect());
