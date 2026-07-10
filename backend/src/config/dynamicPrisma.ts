import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { databaseService } from "../services/database.service";

const clientCache = new Map<string, PrismaClient>();

export function createPrismaClient(databaseUrl: string): PrismaClient {
  const adapter = new PrismaPg(databaseUrl);
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export async function getUserPrisma(userId: string): Promise<PrismaClient> {
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

export function getMasterPrisma(): PrismaClient {
  const { prisma } = require("./prisma");
  return prisma;
}