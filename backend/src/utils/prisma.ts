import type { Request } from "express";
import { getUserPrisma } from "../config/dynamicPrisma";
import { prisma } from "../config/prisma";

export async function getUserPrismaFromRequest(req: Request) {
  const userId = (req as any).user?.userId;
  if (!userId) {
    throw new Error("User not authenticated");
  }
  return getUserPrisma(userId);
}

export { prisma as masterPrisma };