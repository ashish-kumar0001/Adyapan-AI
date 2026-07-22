import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { globalSearch } from "../controllers/search.controller";

export const searchRouter = Router();

searchRouter.get("/", requireAuth, globalSearch);
