import { Router } from "express";
import {
  createCustomerController,
  getCustomerController,
  listCustomersController,
  updateCustomerController,
} from "../controllers/customer.controller.js";
import { listDevicesController } from "../controllers/device.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorizeRoles } from "../middleware/authorizeRoles.js";

export const customerRouter = Router();

customerRouter.use(authenticate);
customerRouter.get(
  "/",
  authorizeRoles("ADMIN", "RECEPTIONIST"),
  listCustomersController,
);
customerRouter.post(
  "/",
  authorizeRoles("RECEPTIONIST"),
  createCustomerController,
);
customerRouter.get(
  "/:id/devices",
  (req, _res, next) => {
    req.query.customerId = req.params.id;
    next();
  },
  authorizeRoles("ADMIN", "RECEPTIONIST"),
  listDevicesController,
);
customerRouter.get(
  "/:id",
  authorizeRoles("ADMIN", "RECEPTIONIST"),
  getCustomerController,
);
customerRouter.patch(
  "/:id",
  authorizeRoles("RECEPTIONIST"),
  updateCustomerController,
);
