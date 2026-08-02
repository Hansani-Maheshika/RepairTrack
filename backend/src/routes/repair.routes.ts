import { Router } from "express";
import {
  assignRepairController,
  createRepairController,
  getRepairController,
  inspectionController,
  listRepairsController,
  statusController,
  updateRepairController,
} from "../controllers/repair.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorizeRoles } from "../middleware/authorizeRoles.js";

export const repairRouter = Router();

repairRouter.use(authenticate);
repairRouter.get("/", listRepairsController);
repairRouter.get(
  "/my-assigned",
  authorizeRoles("TECHNICIAN"),
  listRepairsController,
);
repairRouter.post("/", authorizeRoles("RECEPTIONIST"), createRepairController);
repairRouter.get("/:id", getRepairController);
repairRouter.patch(
  "/:id",
  authorizeRoles("RECEPTIONIST"),
  updateRepairController,
);
repairRouter.patch(
  "/:id/assign",
  authorizeRoles("ADMIN"),
  assignRepairController,
);
repairRouter.patch(
  "/:id/inspection",
  authorizeRoles("TECHNICIAN"),
  inspectionController,
);
repairRouter.patch(
  "/:id/status",
  authorizeRoles("TECHNICIAN", "RECEPTIONIST"),
  statusController,
);
