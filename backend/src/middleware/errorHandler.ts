import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";

export function errorHandler(
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction,
): void {
  const message =
    error instanceof Error ? error.message : "An unexpected error occurred";

  if (env.NODE_ENV !== "production") {
    console.error(error);
  }

  response.status(500).json({
    success: false,
    message:
      env.NODE_ENV === "production"
        ? "Internal server error"
        : message,
    errors: [],
  });
}