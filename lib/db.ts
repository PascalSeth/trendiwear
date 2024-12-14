import { PrismaClient } from '@prisma/client';

// Singleton function to initialize the Prisma client
const prismaClientSingleton = () => {
  return new PrismaClient();
};

// Extend the TypeScript globalThis type to include prismaGlobal
declare global {
  var prismaGlobal: PrismaClient | undefined;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}

export default prisma;
