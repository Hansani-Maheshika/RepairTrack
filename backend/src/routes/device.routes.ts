import { Router } from "express";
import {
  createDeviceController, getDeviceController, listDevicesController, updateDeviceController,
} from "../controllers/device.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorizeRoles } from "../middleware/authorizeRoles.js";

export const deviceRouter = Router();

deviceRouter.use(authenticate);
deviceRouter.get("/", authorizeRoles("ADMIN", "RECEPTIONIST"), listDevicesController);
deviceRouter.post("/", authorizeRoles("ADMIN", "RECEPTIONIST"), createDeviceController);
deviceRouter.get("/:id", authorizeRoles("ADMIN", "RECEPTIONIST"), getDeviceController);
deviceRouter.patch("/:id", authorizeRoles("ADMIN", "RECEPTIONIST"), updateDeviceController);
