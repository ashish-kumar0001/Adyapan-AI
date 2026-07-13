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

  // Dynamic self-healing migration guard: ensure database contains user tables
  try {
    await client.userQuestionProgress.findFirst().catch(async (err: any) => {
      if (err?.code === "P2021" || err?.message?.includes("does not exist")) {
        console.log(`[dynamicPrisma] User tables missing for ${userId}. Initializing schema user tables...`);
        const { execSync } = require("child_process");
        execSync(`npx prisma db push --config=prisma/prisma.config.user.ts --accept-data-loss`, {
          env: { ...process.env, USER_DATABASE_URL: dbUrl },
          stdio: "ignore"
        });
        console.log(`[dynamicPrisma] Schema user tables initialized successfully for ${userId}.`);
      } else {
        throw err;
      }
    });
  } catch (err: any) {
    console.error(`[dynamicPrisma] Migration guard check failed for user ${userId}:`, err.message || err);
  }

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
