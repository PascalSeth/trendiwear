import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

// Prioritize pooled transaction mode (DATABASE_URL on port 6543) over session mode (DIRECT_URL on port 5432).
// In serverless, session mode (port 5432) is capped at pool_size: 15, causing EMAXCONNSESSION errors.
// Transaction mode pooler (port 6543) allows high-concurrency connection multiplexing.
const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;

const createPrismaClient = (): PrismaClient => {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  const pool =
    globalForPrisma.pool ||
    new Pool({
      connectionString,
      ssl: connectionString?.includes("supabase") ? { rejectUnauthorized: false } : undefined,
      // In serverless environments, keep pool size small per container to prevent exhausting DB pooler limits
      max: process.env.NODE_ENV === "production" ? 2 : 5,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 10000,
      allowExitOnIdle: true,
    });

  // Always cache pool and client globally (including in production serverless containers)
  // to prevent connection leaks across repeated warm invocations.
  globalForPrisma.pool = pool;

  const adapter = new PrismaPg(pool);
  const client = new PrismaClient({ adapter });

  globalForPrisma.prisma = client;

  return client;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

export default prisma;
