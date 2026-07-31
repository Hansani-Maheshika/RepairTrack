import type {
  NextFunction,
  Request,
  Response,
} from "express";

import { AppError } from "../utils/AppError.js";
import type { UserRole } from "../utils/jwt.js";

export function authorizeRoles(
  ...allowedRoles: UserRole[]
) {
  return (
    request: Request,
    _response: Response,
    next: NextFunction,
  ): void => {
    if (!request.user) {
      next(
        new AppError(
          "Authentication is required",
          401,
        ),
      );

      return;
    }

    if (!allowedRoles.includes(request.user.role)) {
      next(
        new AppError(
          "This account is not allowed to perform this action",
          403,
        ),
      );

      return;
    }

    next();
  };
}