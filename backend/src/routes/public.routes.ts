import { Router } from "express";
import rateLimit from "express-rate-limit";
import { trackRepairController } from "../controllers/repair.controller.js";

export const publicRouter = Router();

const trackingRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many tracking requests. Please try again later.",
    errors: [],
  },
});

publicRouter.post("/repairs/track", trackingRateLimiter, trackRepairController);
