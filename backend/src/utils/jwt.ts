import jwt, {
  type JwtPayload,
  type SignOptions,
} from "jsonwebtoken";

import { env } from "../config/env.js";
import { AppError } from "./AppError.js";

export type UserRole =
  | "ADMIN"
  | "RECEPTIONIST"
  | "TECHNICIAN";

export interface VerifiedToken {
  userId: string;
  role: UserRole;
  tokenType: "access" | "refresh";
  tokenId?: string;
}

function isUserRole(value: unknown): value is UserRole {
  return (
    value === "ADMIN" ||
    value === "RECEPTIONIST" ||
    value === "TECHNICIAN"
  );
}

function verifyToken(
  token: string,
  secret: string,
  expectedType: "access" | "refresh",
): VerifiedToken {
  try {
    const decoded = jwt.verify(token, secret);

    if (
      typeof decoded === "string" ||
      !decoded.sub ||
      !isUserRole(decoded.role) ||
      decoded.tokenType !== expectedType
    ) {
      throw new AppError("Invalid authentication token", 401);
    }

    return {
      userId: decoded.sub,
      role: decoded.role,
      tokenType: decoded.tokenType,
      tokenId:
        typeof decoded.jti === "string"
          ? decoded.jti
          : undefined,
    };
  } catch {
    throw new AppError(
      "Authentication token is invalid or expired",
      401,
    );
  }
}

export function createAccessToken(
  userId: string,
  role: UserRole,
): string {
  return jwt.sign(
    {
      role,
      tokenType: "access",
    },
    env.JWT_ACCESS_SECRET,
    {
      subject: userId,
      expiresIn:
        env.ACCESS_TOKEN_EXPIRES_IN as SignOptions["expiresIn"],
    },
  );
}

export function createRefreshToken(
  userId: string,
  role: UserRole,
  tokenId: string,
): string {
  return jwt.sign(
    {
      role,
      tokenType: "refresh",
    },
    env.JWT_REFRESH_SECRET,
    {
      subject: userId,
      jwtid: tokenId,
      expiresIn:
        env.REFRESH_TOKEN_EXPIRES_IN as SignOptions["expiresIn"],
    },
  );
}

export function verifyAccessToken(
  token: string,
): VerifiedToken {
  return verifyToken(
    token,
    env.JWT_ACCESS_SECRET,
    "access",
  );
}

export function verifyRefreshToken(
  token: string,
): VerifiedToken {
  return verifyToken(
    token,
    env.JWT_REFRESH_SECRET,
    "refresh",
  );
}

export function getTokenExpiry(token: string): Date {
  const decoded = jwt.decode(token) as JwtPayload | null;

  if (!decoded?.exp) {
    throw new AppError(
      "Could not determine token expiry",
      500,
    );
  }

  return new Date(decoded.exp * 1000);
}