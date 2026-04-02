require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function listUserCart(userId) {
  try {
    console.log(`Listing CartItems for user: ${userId}`);
    const items = await prisma.cartItem.findMany({
      where: { userId },
      include: {
        product: { select: { name: true, id: true } }
      }
    });

    console.log(`Found ${items.length} items.`);
    items.forEach(i => {
      console.log(`Item ID: ${i.id} | Product ID: ${i.productId} | Product Name: ${i.product.name}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listUserCart('d4f8afb0-475b-4ef1-8660-302f7e622291');
