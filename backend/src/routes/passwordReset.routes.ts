import { createHash, randomInt } from "node:crypto";
import bcrypt from "bcryptjs";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import { sendCustomerMessage } from "../services/notification.service.js";
import { AppError } from "../utils/AppError.js";
import rateLimit from "express-rate-limit";

export const passwordResetRouter = Router();
const passwordResetRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many password recovery attempts. Please try again later.",
    errors: [],
  },
});
passwordResetRouter.use(passwordResetRateLimiter);
const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
const emailSchema = z
  .string()
  .trim()
  .email()
  .transform((value) => value.toLowerCase());

passwordResetRouter.post("/forgot-password", async (req, res, next) => {
  try {
    if (!env.RESEND_API_KEY)
      throw new AppError(
        "Email password recovery is not available. Please contact an administrator.",
        503,
      );
    const { email } = z.object({ email: emailSchema }).parse(req.body);
    const user = await prisma.user.findUnique({ where: { email } });
    let developmentCode: string | undefined;
    if (user?.isActive) {
      const code = randomInt(100000, 1000000).toString();
      await prisma.$transaction([
        prisma.passwordResetToken.deleteMany({
          where: { userId: user.id, usedAt: null },
        }),
        prisma.passwordResetToken.create({
          data: {
            userId: user.id,
            tokenHash: hash(`${email}:${code}`),
            expiresAt: new Date(Date.now() + 10 * 60000),
          },
        }),
      ]);
      await sendCustomerMessage({
        email: user.email,
        title: "RepairTrack password verification code",
        message: `Your RepairTrack verification code is ${code}. It expires in 10 minutes. Do not share it with anyone.`,
      });
      if (env.NODE_ENV === "development" && !env.RESEND_API_KEY)
        developmentCode = code;
    }
    res.json({
      success: true,
      message: "If that account exists, a verification code has been sent",
      data: { developmentCode },
    });
  } catch (error) {
    next(error);
  }
});

passwordResetRouter.post("/reset-password", async (req, res, next) => {
  try {
    const input = z
      .object({
        email: emailSchema,
        code: z.string().regex(/^\d{6}$/, "Enter the six-digit code"),
        password: z.string().min(8).max(128),
      })
      .parse(req.body);
    const stored = await prisma.passwordResetToken.findUnique({
      where: { tokenHash: hash(`${input.email}:${input.code}`) },
      include: { user: { select: { email: true } } },
    });
    if (
      !stored ||
      stored.user.email !== input.email ||
      stored.usedAt ||
      stored.expiresAt <= new Date()
    )
      throw new AppError("Verification code is invalid or expired", 400);
    const passwordHash = await bcrypt.hash(input.password, 12);
    await prisma.$transaction([
      prisma.user.update({
        where: { id: stored.userId },
        data: { passwordHash, mustChangePassword: false },
      }),
      prisma.passwordResetToken.update({
        where: { id: stored.id },
        data: { usedAt: new Date() },
      }),
      prisma.refreshToken.updateMany({
        where: { userId: stored.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
    res.json({
      success: true,
      message: "Password reset successfully",
      data: null,
    });
  } catch (error) {
    next(error);
  }
});
