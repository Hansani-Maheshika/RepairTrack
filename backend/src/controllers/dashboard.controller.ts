import type { NextFunction, Request, Response } from "express";
import { getDashboardSummary } from "../services/dashboard.service.js";

export async function dashboardSummaryController(
  _request: Request, response: Response, next: NextFunction,
): Promise<void> {
  try {
    response.json({
      success: true,
      message: "Dashboard summary retrieved successfully",
      data: await getDashboardSummary(),
    });
  } catch (error) {
    next(error);
  }
}
