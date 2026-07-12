import { PrismaClient } from "@prisma/user-client";
import { PrismaPg } from "@prisma/adapter-pg";
import { databaseService } from "../services/database.service";

type ExtendedUserClient = any;
const clientCache = new Map<string, ExtendedUserClient>();

export function createPrismaClient(databaseUrl: string): any {
  const adapter = new PrismaPg(databaseUrl);
  const base = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

  // Prisma v5+ uses $extends instead of removed $use()
  return base.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const start = Date.now();
          const result = await query(args);
          const duration = Date.now() - start;
          try {
            const { PerformanceMonitor } = require("../utils/monitoring");
            PerformanceMonitor.record("db", `user_db:${model || "generic"}.${operation}`, duration);
          } catch {}
          return result;
        },
      },
    },
  }) as any;
}

export async function getUserPrisma(userId: string): Promise<any> {
  if (clientCache.has(userId)) {
    return clientCache.get(userId)!;
  }

  const dbUrl = await databaseService.getDatabaseUrlForUser(userId);
  const client = createPrismaClient(dbUrl);
  clientCache.set(userId, client);
  return client;
}

export function clearUserPrismaCache(userId?: string): void {
  if (userId) {
    const client = clientCache.get(userId);
    if (client) {
      client.$disconnect();
      clientCache.delete(userId);
    }
  } else {
    for (const [key, client] of clientCache) {
      client.$disconnect();
      clientCache.delete(key);
    }
  }
}

export function getMasterPrisma(): any {
  const { prisma } = require("./prisma");
  return prisma;
}
