import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "./env";

const adapter = new PrismaPg(env.databaseUrl);

export const prisma = new PrismaClient({
  adapter,
  log: env.nodeEnv === "development" ? ["error", "warn"] : ["error"],
});

(prisma as any).$use(async (params: any, next: any) => {
  const start = Date.now();
  const result = await next(params);
  const duration = Date.now() - start;

  try {
    const { PerformanceMonitor } = require("../utils/monitoring");
    PerformanceMonitor.record("db", `${params.model || "generic"}.${params.action}`, duration);
  } catch {}

  return result;
});
