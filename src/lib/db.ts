import "server-only";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

/**
 * Singleton Prisma client.
 *
 * Prisma 7 uses the WASM query compiler plus a driver adapter. We use the
 * libSQL adapter, which works for both local `file:` SQLite databases and
 * remote Turso/libSQL databases. For PostgreSQL in production, swap this for
 * `@prisma/adapter-pg` and change the datasource provider.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient() {
  const url = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
  const authToken = process.env.DATABASE_AUTH_TOKEN ?? process.env.TURSO_AUTH_TOKEN;
  const adapter = new PrismaLibSql({ url, ...(authToken ? { authToken } : {}) });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
