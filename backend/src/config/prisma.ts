import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "./env";

const adapter = new PrismaPg(env.databaseUrl);

const baseClient = new PrismaClient({
  adapter,
  log: env.nodeEnv === "development" ? ["error", "warn"] : ["error"],
});

// Prisma v5+ uses $extends instead of the removed $use() middleware
export const prisma = baseClient.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const start = Date.now();
        const result = await query(args);
        const duration = Date.now() - start;
        try {
          const { PerformanceMonitor } = require("../utils/monitoring");
          PerformanceMonitor.record("db", `${model || "generic"}.${operation}`, duration);
        } catch {}
        return result;
      },
    },
  },
}) as any;

