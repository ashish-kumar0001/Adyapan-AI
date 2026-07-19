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
          let result;
          try {
            result = await query(args);
          } catch (err: any) {
            // P2021: "The table does not exist"
            if (err?.code === "P2021" || err?.message?.includes("does not exist")) {
              console.warn(`[dynamicPrisma] Table ${model} does not exist in user database. Triggering automatic sync push...`);
              try {
                const { execSync } = require("child_process");
                execSync(`npx prisma db push --config=prisma/prisma.config.user.ts --accept-data-loss`, {
                  env: { ...process.env, USER_DATABASE_URL: databaseUrl },
                  stdio: "ignore"
                });
                console.log(`[dynamicPrisma] Database sync completed. Retrying query for ${model}.${operation}...`);
                result = await query(args);
              } catch (migrateErr: any) {
                console.error(`[dynamicPrisma] Automatic database sync/retry failed:`, migrateErr.message || migrateErr);
                throw err;
              }
            } else {
              throw err;
            }
          }
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
    let needsRemigration = false;
    await client.uploadedResume.findFirst().catch((err: any) => {
      if (err?.code === "P2021" || err?.message?.includes("does not exist")) {
        needsRemigration = true;
      } else {
        throw err;
      }
    });

    if (needsRemigration) {
      const { execSync } = require("child_process");
      execSync(`npx prisma db push --config=prisma/prisma.config.user.ts --accept-data-loss`, {
        env: { ...process.env, USER_DATABASE_URL: dbUrl },
        stdio: "ignore"
      });
      // Create a fresh client after migration
      client.$disconnect();
      const freshClient = createPrismaClient(dbUrl);
      clientCache.set(userId, freshClient);
      return freshClient;
    }
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
