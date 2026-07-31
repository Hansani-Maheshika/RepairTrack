import type {
  CookieOptions,
  NextFunction,
  Request,
  Response,
} from "express";

import { env } from "../config/env.js";
import {
  getCurrentStaff,
  changeStaffPassword,
  loginStaff,
  logoutStaff,
  refreshStaffSession,
} from "../services/auth.service.js";
import { AppError } from "../utils/AppError.js";
import { loginSchema } from "../validators/auth.validator.js";
import { changePasswordSchema } from "../validators/auth.validator.js";

const refreshCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/api/v1/auth",
};

export async function loginController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = loginSchema.parse(request.body);
    const session = await loginStaff(input);

    response.cookie(
      "refreshToken",
      session.refreshToken,
      {
        ...refreshCookieOptions,
        expires: session.refreshTokenExpiresAt,
      },
    );

    response.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: session.user,
        accessToken: session.accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function refreshController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const refreshToken =
      request.cookies?.refreshToken;

    if (
      typeof refreshToken !== "string" ||
      refreshToken.length === 0
    ) {
      throw new AppError(
        "Refresh token is required",
        401,
      );
    }

    const session =
      await refreshStaffSession(refreshToken);

    response.cookie(
      "refreshToken",
      session.refreshToken,
      {
        ...refreshCookieOptions,
        expires: session.refreshTokenExpiresAt,
      },
    );

    response.status(200).json({
      success: true,
      message: "Session refreshed successfully",
      data: {
        user: session.user,
        accessToken: session.accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function meController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!request.user) {
      throw new AppError(
        "Authentication is required",
        401,
      );
    }

    const user = await getCurrentStaff(
      request.user.id,
    );

    response.status(200).json({
      success: true,
      message: "Staff profile retrieved successfully",
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function logoutController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const refreshToken =
      request.cookies?.refreshToken;

    await logoutStaff(
      typeof refreshToken === "string"
        ? refreshToken
        : undefined,
    );

    response.clearCookie(
      "refreshToken",
      refreshCookieOptions,
    );

    response.status(200).json({
      success: true,
      message: "Logout successful",
      data: null,
    });
  } catch (error) {
    next(error);
  }
}

export async function changePasswordController(
  request: Request, response: Response, next: NextFunction,
): Promise<void> {
  try {
    if (!request.user) throw new AppError("Authentication is required", 401);
    await changeStaffPassword(request.user.id, changePasswordSchema.parse(request.body));
    response.clearCookie("refreshToken", refreshCookieOptions);
    response.json({ success: true, message: "Password changed successfully. Please log in again.", data: null });
  } catch (error) { next(error); }
}
