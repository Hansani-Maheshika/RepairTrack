import { Router } from "express";
import { createUserController, getUserController, listTechniciansController, listUsersController, resetPasswordController, updateUserController } from "../controllers/user.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorizeRoles } from "../middleware/authorizeRoles.js";

export const userRouter = Router();
userRouter.use(authenticate);
userRouter.get("/technicians", authorizeRoles("ADMIN", "RECEPTIONIST"), listTechniciansController);
userRouter.use(authorizeRoles("ADMIN"));
userRouter.get("/", listUsersController);
userRouter.post("/", createUserController);
userRouter.get("/:id", getUserController);
userRouter.patch("/:id", updateUserController);
userRouter.patch("/:id/password", resetPasswordController);
