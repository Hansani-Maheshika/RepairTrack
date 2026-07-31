import type {
  NextFunction,
  Request,
  Response,
} from "express";
import { ZodError } from "zod";
import { Prisma } from "../generated/prisma/client.js";

import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

export function errorHandler(
  error: unknown,
  _request: Request,
  response: Response,
  next: NextFunction,
): void {
  if (response.headersSent) {
    next(error);
    return;
  }

  if (error instanceof ZodError) {
    response.status(400).json({
      success: false,
      message: "Validation failed",
      errors: error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });

    return;
  }

  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      success: false,
      message: error.message,
      errors: error.errors,
    });

    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const status = error.code === "P2002" ? 409 : error.code === "P2025" ? 404 : 400;
    response.status(status).json({
      success: false,
      message: error.code === "P2002"
        ? "A record with the same unique value already exists"
        : error.code === "P2025"
          ? "The requested record was not found"
          : "The database rejected the request",
      errors: [],
    });
    return;
  }

  if (env.NODE_ENV !== "production") {
    console.error(error);
  }

  response.status(500).json({
    success: false,
    message:
      env.NODE_ENV === "production"
        ? "Internal server error"
        : error instanceof Error
          ? error.message
          : "An unexpected error occurred",
    errors: [],
  });
}
