import type {
  NextFunction,
  Request,
  Response,
} from "express";

import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";
import {
  type UserRole,
  verifyAccessToken,
} from "../utils/jwt.js";

export async function authenticate(
  request: Request,
  _response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authorizationHeader =
      request.headers.authorization;

    if (
      !authorizationHeader ||
      !authorizationHeader.startsWith("Bearer ")
    ) {
      throw new AppError(
        "Authentication token is required",
        401,
      );
    }

    const token = authorizationHeader.slice(7).trim();

    const payload = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: {
        id: payload.userId,
      },

      select: {
        id: true,
        staffCode: true,
        fullName: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      throw new AppError(
        "Staff account is unavailable",
        401,
      );
    }

    request.user = {
      id: user.id,
      staffCode: user.staffCode,
      fullName: user.fullName,
      email: user.email,
      role: user.role as UserRole,
    };

    next();
  } catch (error) {
    next(error);
  }
}