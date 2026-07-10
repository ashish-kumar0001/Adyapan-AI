import { Router } from "express";
import {
  getDashboardStats,
  getActivityFeed,
  getAdminUsers,
  updateUserPlan,
  getAiAnalytics,
  getRevenueAnalytics,
  getSystemHealth,
  getModuleAnalytics,
  getSecurityLogs,
} from "../controllers/admin.controller";
import { requireAuth, requireRole } from "../middleware/auth";
import {
  getUserDatabases,
  getUserDatabaseStats,
  queryUserDb,
  deleteUserDatabase,
  getAggregatedStats,
} from "../controllers/admin-db.controller";

export const adminRouter = Router();

const guard = [requireAuth, requireRole("ADMIN")];

adminRouter.get("/dashboard", ...guard, getDashboardStats);
adminRouter.get("/activity", ...guard, getActivityFeed);
adminRouter.get("/users", ...guard, getAdminUsers);
adminRouter.post("/users/:id/action", ...guard, updateUserPlan);
adminRouter.get("/analytics/ai", ...guard, getAiAnalytics);
adminRouter.get("/analytics/revenue", ...guard, getRevenueAnalytics);
adminRouter.get("/system-health", ...guard, getSystemHealth);
adminRouter.get("/modules", ...guard, getModuleAnalytics);
adminRouter.get("/security", ...guard, getSecurityLogs);

adminRouter.get("/databases", ...guard, getUserDatabases);
adminRouter.get("/databases/stats", ...guard, getUserDatabaseStats);
adminRouter.get("/databases/aggregated", ...guard, getAggregatedStats);
adminRouter.post("/databases/:userId/query", ...guard, queryUserDb);
adminRouter.delete("/databases/:userId", ...guard, deleteUserDatabase);
