import { Router } from "express";
import { dashboardSummaryController } from "../controllers/dashboard.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorizeRoles } from "../middleware/authorizeRoles.js";

export const dashboardRouter = Router();

dashboardRouter.get(
  "/summary",
  authenticate,
  authorizeRoles("ADMIN"),
  dashboardSummaryController,
);
