import { Router } from "express";
import { prisma } from "../config/prisma.js";

export const healthRouter = Router();

healthRouter.get("/health", (_request, response) => {
  response.status(200).json({
    success: true,
    message: "RepairTrack API is running",
    data: {
      environment: process.env.NODE_ENV ?? "development",
      timestamp: new Date().toISOString(),
    },
  });
});

healthRouter.get(
  "/health/database",
  async (_request, response, next) => {
    try {
      await prisma.$queryRaw`SELECT 1`;

      response.status(200).json({
        success: true,
        message: "RepairTrack database connection is healthy",
        data: null,
      });
    } catch (error) {
      next(error);
    }
  },
);