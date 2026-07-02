import type { NextFunction, Request, Response } from "express";
import { prisma } from "../config/prisma";

export async function getAdminOverview(_req: Request, res: Response, next: NextFunction) {
  try {
    const [totalUsers, adminUsers, completedProfiles] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "ADMIN" } }),
      prisma.profile.count({
        where: {
          college: {
            not: null,
          },
        },
      }),
    ]);

    res.json({
      success: true,
      overview: {
        totalUsers,
        adminUsers,
        completedProfiles,
      },
    });
  } catch (error) {
    next(error);
  }
}
