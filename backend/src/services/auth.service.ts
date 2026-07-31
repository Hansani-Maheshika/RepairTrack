import { createHash, randomUUID } from "node:crypto";

import bcrypt from "bcryptjs";

import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";
import {
  createAccessToken,
  createRefreshToken,
  getTokenExpiry,
  type UserRole,
  verifyRefreshToken,
} from "../utils/jwt.js";
import type { ChangePasswordInput, LoginInput } from "../validators/auth.validator.js";

interface SafeUser {
  id: string;
  staffCode: string;
  fullName: string;
  email: string;
  role: UserRole;
}

interface AuthSession {
  user: SafeUser;
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}

function hashToken(token: string): string {
  return createHash("sha256")
    .update(token)
    .digest("hex");
}

function createSafeUser(user: {
  id: string;
  staffCode: string;
  fullName: string;
  email: string;
  role: string;
}): SafeUser {
  return {
    id: user.id,
    staffCode: user.staffCode,
    fullName: user.fullName,
    email: user.email,
    role: user.role as UserRole,
  };
}

async function createSession(user: SafeUser): Promise<AuthSession> {
  const refreshTokenId = randomUUID();

  const accessToken = createAccessToken(
    user.id,
    user.role,
  );

  const refreshToken = createRefreshToken(
    user.id,
    user.role,
    refreshTokenId,
  );

  const refreshTokenExpiresAt =
    getTokenExpiry(refreshToken);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: refreshTokenExpiresAt,
    },
  });

  return {
    user,
    accessToken,
    refreshToken,
    refreshTokenExpiresAt,
  };
}

export async function loginStaff(
  input: LoginInput,
): Promise<AuthSession> {
  const user = await prisma.user.findUnique({
    where: {
      email: input.email,
    },
  });

  const passwordMatches = user
    ? await bcrypt.compare(
        input.password,
        user.passwordHash,
      )
    : false;

  if (!user || !passwordMatches) {
    throw new AppError(
      "Invalid email or password",
      401,
    );
  }

  if (!user.isActive) {
    throw new AppError(
      "This staff account is inactive",
      403,
    );
  }

  return createSession(createSafeUser(user));
}

export async function refreshStaffSession(
  refreshToken: string,
): Promise<AuthSession> {
  const payload = verifyRefreshToken(refreshToken);
  const tokenHash = hashToken(refreshToken);

  const storedToken =
    await prisma.refreshToken.findUnique({
      where: {
        tokenHash,
      },

      include: {
        user: true,
      },
    });

  if (
    !storedToken ||
    storedToken.userId !== payload.userId ||
    storedToken.revokedAt ||
    storedToken.expiresAt <= new Date()
  ) {
    throw new AppError(
      "Refresh session is invalid or expired",
      401,
    );
  }

  if (!storedToken.user.isActive) {
    throw new AppError(
      "This staff account is inactive",
      403,
    );
  }

  const safeUser = createSafeUser(storedToken.user);
  const newRefreshTokenId = randomUUID();

  const newAccessToken = createAccessToken(
    safeUser.id,
    safeUser.role,
  );

  const newRefreshToken = createRefreshToken(
    safeUser.id,
    safeUser.role,
    newRefreshTokenId,
  );

  const newRefreshTokenExpiresAt =
    getTokenExpiry(newRefreshToken);

  await prisma.$transaction([
    prisma.refreshToken.update({
      where: {
        id: storedToken.id,
      },

      data: {
        revokedAt: new Date(),
      },
    }),

    prisma.refreshToken.create({
      data: {
        userId: safeUser.id,
        tokenHash: hashToken(newRefreshToken),
        expiresAt: newRefreshTokenExpiresAt,
      },
    }),
  ]);

  return {
    user: safeUser,
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    refreshTokenExpiresAt:
      newRefreshTokenExpiresAt,
  };
}

export async function logoutStaff(
  refreshToken?: string,
): Promise<void> {
  if (!refreshToken) {
    return;
  }

  await prisma.refreshToken.updateMany({
    where: {
      tokenHash: hashToken(refreshToken),
      revokedAt: null,
    },

    data: {
      revokedAt: new Date(),
    },
  });
}

export async function getCurrentStaff(
  userId: string,
): Promise<SafeUser> {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
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
      "Staff account was not found or is inactive",
      401,
    );
  }

  return createSafeUser(user);
}

export async function changeStaffPassword(userId: string, input: ChangePasswordInput): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.isActive) throw new AppError("Staff account is unavailable", 401);
  if (!(await bcrypt.compare(input.currentPassword, user.passwordHash))) {
    throw new AppError("Current password is incorrect", 401);
  }
  const passwordHash = await bcrypt.hash(input.newPassword, 12);
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { passwordHash } }),
    prisma.refreshToken.updateMany({ where: { userId, revokedAt: null },
      data: { revokedAt: new Date() } }),
  ]);
}

export async function deleteExpiredRefreshTokens(): Promise<number> {
  const result = await prisma.refreshToken.deleteMany({
    where: { OR: [{ expiresAt: { lt: new Date() } }, { revokedAt: { not: null } }] },
  });
  return result.count;
}
