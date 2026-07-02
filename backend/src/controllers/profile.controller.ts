import type { NextFunction, Request, Response } from "express";
import { getProfile, upsertProfile } from "../services/profile.service";

export async function getMyProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const profile = await getProfile(req.user?.userId ?? "");

    res.json({
      success: true,
      profile,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateMyProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const profile = await upsertProfile(req.user?.userId ?? "", req.body);

    res.json({
      success: true,
      profile,
    });
  } catch (error) {
    next(error);
  }
}
