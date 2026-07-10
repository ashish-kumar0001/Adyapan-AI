import { prisma } from "../config/prisma";
import { databaseService } from "./database.service";
import { createPrismaClient } from "../config/dynamicPrisma";
import { httpError } from "../utils/httpError";
import type { PrismaClient } from "@prisma/client";

interface DatabaseInfo {
  userId: string;
  dbName: string;
  createdAt: string;
}

interface UserStats {
  userId: string;
  email: string;
  name: string;
  databaseExists: boolean;
  databaseSize?: string;
}

class AdminDbService {
  async listUserDatabases(): Promise<DatabaseInfo[]> {
    const databases = await databaseService.listDatabases();
    return databases
      .filter((db) => db.name.startsWith("user_"))
      .map((db) => ({
        userId: db.name.replace("user_", ""),
        dbName: db.name,
        createdAt: db.created_at,
      }));
  }

  async getUserStats(): Promise<UserStats[]> {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true },
    });

    const databases = await databaseService.listDatabases();
    const dbNames = new Set(databases.map((db) => db.name));

    return users.map((user) => ({
      userId: user.id,
      email: user.email,
      name: user.name,
      databaseExists: dbNames.has(`user_${user.id}`),
    }));
  }

  async queryUserDatabase(userId: string, query: string): Promise<unknown> {
    const dbUrl = await databaseService.getDatabaseUrlForUser(userId);
    const userPrisma = createPrismaClient(dbUrl);
    
    try {
      const result = await userPrisma.$queryRawUnsafe(query);
      return result;
    } finally {
      await userPrisma.$disconnect();
    }
  }

  async deleteUserDatabase(userId: string): Promise<void> {
    const dbInfo = await databaseService.getUserDatabaseInfo(userId);
    if (!dbInfo) {
      throw httpError(404, "User database not found");
    }
    await databaseService.deleteDatabase(dbInfo.id);
  }

  async getAggregatedStats(): Promise<{
    totalUsers: number;
    totalDatabases: number;
    activeDatabases: number;
  }> {
    const totalUsers = await prisma.user.count();
    const databases = await databaseService.listDatabases();
    const userDbs = databases.filter((db) => db.name.startsWith("user_"));

    return {
      totalUsers,
      totalDatabases: userDbs.length,
      activeDatabases: userDbs.length,
    };
  }

  // ─── Cross-DB Aggregation Methods ──────────────────────────────

  private async getAllUserPrismaClients(): Promise<{ userId: string; prisma: PrismaClient }[]> {
    const dbInfos = await this.listUserDatabases();
    const clients: { userId: string; prisma: PrismaClient }[] = [];

    for (const db of dbInfos) {
      try {
        const dbUrl = await databaseService.getDatabaseUrlForUser(db.userId);
        const client = createPrismaClient(dbUrl);
        clients.push({ userId: db.userId, prisma: client });
      } catch {
        // Skip databases that can't be connected to
      }
    }

    return clients;
  }

  private async disconnectClients(clients: { userId: string; prisma: PrismaClient }[]): Promise<void> {
    for (const c of clients) {
      try { await c.prisma.$disconnect(); } catch { /* ignore */ }
    }
  }

  /**
   * Count rows in a table across all user databases.
   * Returns total count.
   */
  async countAcrossAllUserDbs(
    tableName: string,
    where?: Record<string, any>
  ): Promise<number> {
    const clients = await this.getAllUserPrismaClients();
    let total = 0;

    try {
      for (const { prisma: userPrisma } of clients) {
        try {
          const count = await (userPrisma as any)[tableName].count({ where: where || {} });
          total += count;
        } catch {
          // Table may not exist in this user's DB
        }
      }
    } finally {
      await this.disconnectClients(clients);
    }

    return total;
  }

  /**
   * Find recent rows across all user databases.
   * Returns merged + sorted + sliced results.
   */
  async findRecentAcrossAllUserDbs(
    tableName: string,
    options: {
      take?: number;
      orderBy?: Record<string, "asc" | "desc">;
      select?: Record<string, any>;
      include?: Record<string, any>;
    } = {}
  ): Promise<any[]> {
    const { take = 5, orderBy = { createdAt: "desc" }, select, include } = options;
    const clients = await this.getAllUserPrismaClients();
    const allItems: any[] = [];

    try {
      for (const { userId, prisma: userPrisma } of clients) {
        try {
          const items = await (userPrisma as any)[tableName].findMany({
            take,
            orderBy,
            select: select || undefined,
            include: include || undefined,
          });
          // Tag each item with userId for reference
          allItems.push(...items.map((item: any) => ({ ...item, _dbUserId: userId })));
        } catch {
          // Table may not exist in this user's DB
        }
      }
    } finally {
      await this.disconnectClients(clients);
    }

    return allItems.sort((a: any, b: any) => {
      const aTime = a.createdAt?.getTime?.() || 0;
      const bTime = b.createdAt?.getTime?.() || 0;
      return bTime - aTime;
    }).slice(0, take);
  }

  /**
   * Group by across all user databases for a given field.
   * Merges results from all user DBs.
   */
  async groupByAcrossAllUserDbs(
    tableName: string,
    groupByField: string
  ): Promise<{ [key: string]: number }> {
    const clients = await this.getAllUserPrismaClients();
    const merged: { [key: string]: number } = {};

    try {
      for (const { prisma: userPrisma } of clients) {
        try {
          const groups = await (userPrisma as any)[tableName].groupBy({
            by: [groupByField],
            _count: true,
          });
          for (const g of groups) {
            const key = g[groupByField] || "unknown";
            merged[key] = (merged[key] || 0) + g._count;
          }
        } catch {
          // Table may not exist
        }
      }
    } finally {
      await this.disconnectClients(clients);
    }

    return merged;
  }

  /**
   * Get per-user counts for specific tables.
   * Returns a map of userId → counts for each table.
   */
  async getPerUserCounts(
    tableNames: string[]
  ): Promise<Map<string, { [tableName: string]: number }>> {
    const clients = await this.getAllUserPrismaClients();
    const userCounts = new Map<string, { [tableName: string]: number }>();

    try {
      for (const { userId, prisma: userPrisma } of clients) {
        const counts: { [tableName: string]: number } = {};
        for (const table of tableNames) {
          try {
            counts[table] = await (userPrisma as any)[table].count();
          } catch {
            counts[table] = 0;
          }
        }
        userCounts.set(userId, counts);
      }
    } finally {
      await this.disconnectClients(clients);
    }

    return userCounts;
  }
}

export const adminDbService = new AdminDbService();