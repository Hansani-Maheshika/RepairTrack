import { Router } from "express";
import rateLimit from "express-rate-limit";

import {
  loginController,
  changePasswordController,
  logoutController,
  meController,
  refreshController,
} from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/authenticate.js";

export const authRouter = Router();

const authenticationRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,

  message: {
    success: false,
    message:
      "Too many authentication requests. Please try again later.",
    errors: [],
  },
});

authRouter.post(
  "/login",
  authenticationRateLimiter,
  loginController,
);

authRouter.post(
  "/refresh",
  authenticationRateLimiter,
  refreshController,
);

authRouter.get(
  "/me",
  authenticate,
  meController,
);

authRouter.post(
  "/logout",
  logoutController,
);

authRouter.patch("/password", authenticate, changePasswordController);
