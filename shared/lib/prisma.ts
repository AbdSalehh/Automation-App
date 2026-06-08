import { PrismaClient } from "../../prisma/lib/generated/prisma";

/**
 * Singleton Prisma client. In dev, Next.js hot-reload would otherwise create
 * a new connection on every reload and exhaust the database pool.
 *
 * The client is generated into prisma/lib/generated/prisma/ to keep
 * generated code out of shared/ and node_modules/.
 *
 * Server-only module.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
