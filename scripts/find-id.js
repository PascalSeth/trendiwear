require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

// Use the existing prisma client instance if possible, or create a new one
const prisma = new PrismaClient();

async function findIdEverywhere(id) {
  try {
    console.log(`Searching for ID: ${id} across tables...`);
    
    // 1. Check CartItem
    const cartItem = await prisma.cartItem.findUnique({ where: { id } });
    if (cartItem) {
      console.log('--- FOUND IN CARTITEM ---');
      console.log(JSON.stringify(cartItem, null, 2));
    }

    // 2. Check Product
    const product = await prisma.product.findUnique({ where: { id } });
    if (product) {
      console.log('--- FOUND IN PRODUCT ---');
      console.log(JSON.stringify(product, null, 2));
    }

    // 3. Check User
    const user = await prisma.user.findUnique({ where: { id } });
    if (user) {
      console.log('--- FOUND IN USER ---');
      console.log(JSON.stringify(user, null, 2));
    }

    // 4. Check OrderItem
    const orderItem = await prisma.orderItem.findUnique({ where: { id } });
    if (orderItem) {
      console.log('--- FOUND IN ORDERITEM ---');
      console.log(JSON.stringify(orderItem, null, 2));
    }

    if (!cartItem && !product && !user && !orderItem) {
        console.log('ID NOT FOUND in CartItem, Product, User, or OrderItem.');
    }

  } catch (error) {
    console.error('Error during search:', error);
  } finally {
    await prisma.$disconnect();
  }
}

const idToFind = process.argv[2] || '37a55f00-98f6-4394-a3e7-2e6c3fba5840';
findIdEverywhere(idToFind);
