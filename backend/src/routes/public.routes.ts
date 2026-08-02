import { Router } from "express";
import rateLimit from "express-rate-limit";
import { trackRepairController } from "../controllers/repair.controller.js";
import { createHash } from "node:crypto";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";
import { notifyRole, notifyUser } from "../services/notification.service.js";

export const publicRouter = Router();

const trackingRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many tracking requests. Please try again later.",
    errors: [],
  },
});

publicRouter.post("/repairs/track", trackingRateLimiter, trackRepairController);

const sha = (v: string) => createHash("sha256").update(v).digest("hex");
publicRouter.get("/quotations/:token", async (req, res, next) => {
  try {
    const quotation = await prisma.quotation.findFirst({
      where: {
        publicTokenHash: sha(req.params.token),
        publicTokenExpiresAt: { gt: new Date() },
      },
      include: {
        items: true,
        customer: { select: { name: true } },
        repairJob: {
          select: {
            repairNumber: true,
            reportedProblem: true,
            device: { select: { brand: true, model: true } },
          },
        },
      },
    });
    if (!quotation)
      throw new AppError("Quotation link is invalid or expired", 404);
    res.json({
      success: true,
      message: "Quotation retrieved",
      data: { quotation },
    });
  } catch (e) {
    next(e);
  }
});
publicRouter.post("/quotations/:token/respond", async (req, res, next) => {
  try {
    const input = z
      .object({
        decision: z.enum(["APPROVED", "REJECTED"]),
        note: z.string().max(1000).optional(),
      })
      .parse(req.body);
    const quotation = await prisma.quotation.findFirst({
      where: {
        publicTokenHash: sha(req.params.token),
        publicTokenExpiresAt: { gt: new Date() },
        status: "SENT",
      },
      include: { repairJob: true },
    });
    if (!quotation)
      throw new AppError("Quotation is unavailable or already answered", 409);
    const updated = await prisma.$transaction(async (tx) => {
      const q = await tx.quotation.update({
        where: { id: quotation.id },
        data: {
          status: input.decision,
          respondedAt: new Date(),
          customerResponseNote: input.note,
          publicTokenHash: null,
          publicTokenExpiresAt: null,
        },
      });
      await tx.repairJob.update({
        where: { id: quotation.repairJobId },
        data: {
          status:
            input.decision === "APPROVED"
              ? "REPAIR_APPROVED"
              : "REPAIR_REJECTED",
        },
      });
      await tx.repairStatusHistory.create({
        data: {
          repairJobId: quotation.repairJobId,
          status:
            input.decision === "APPROVED"
              ? "REPAIR_APPROVED"
              : "REPAIR_REJECTED",
          updatedById: quotation.repairJob.createdById,
          publicNote: `Customer ${input.decision.toLowerCase()} the quotation`,
          internalNote: input.note,
        },
      });
      return q;
    });
    if (quotation.repairJob.assignedTechnicianId)
      await notifyUser(
        quotation.repairJob.assignedTechnicianId,
        "Customer quotation response",
        `${quotation.quotationNumber} was ${input.decision.toLowerCase()}.`,
        quotation.repairJobId,
      );
    await notifyRole(
      "RECEPTIONIST",
      "Customer quotation response",
      `${quotation.quotationNumber} was ${input.decision.toLowerCase()}.`,
      quotation.repairJobId,
    );
    res.json({
      success: true,
      message: `Quotation ${input.decision.toLowerCase()}`,
      data: { quotation: updated },
    });
  } catch (e) {
    next(e);
  }
});
publicRouter.post(
  "/quotations/respond-by-repair",
  trackingRateLimiter,
  async (req, res, next) => {
    try {
      const input = z
        .object({
          repairNumber: z.string().trim().min(1).max(50),
          phone: z.string().trim().min(5).max(30),
          quotationId: z.string().uuid(),
          decision: z.enum(["APPROVED", "REJECTED"]),
          note: z.string().trim().max(1000).optional(),
        })
        .parse(req.body);
      const quotation = await prisma.quotation.findFirst({
        where: {
          id: input.quotationId,
          status: "SENT",
          repairJob: {
            repairNumber: input.repairNumber,
            customer: { phone: input.phone },
          },
        },
        include: { repairJob: true },
      });
      if (!quotation)
        throw new AppError("Quotation is unavailable or already answered", 409);

      const updated = await prisma.$transaction(async (tx) => {
        const q = await tx.quotation.update({
          where: { id: quotation.id },
          data: {
            status: input.decision,
            respondedAt: new Date(),
            customerResponseNote: input.note,
            publicTokenHash: null,
            publicTokenExpiresAt: null,
          },
        });
        const status =
          input.decision === "APPROVED"
            ? "REPAIR_APPROVED"
            : "REPAIR_REJECTED";
        await tx.repairJob.update({
          where: { id: quotation.repairJobId },
          data: { status },
        });
        await tx.repairStatusHistory.create({
          data: {
            repairJobId: quotation.repairJobId,
            status,
            updatedById: quotation.repairJob.createdById,
            publicNote: `Customer ${input.decision.toLowerCase()} the quotation`,
            internalNote: input.note,
          },
        });
        return q;
      });
      if (quotation.repairJob.assignedTechnicianId)
        await notifyUser(
          quotation.repairJob.assignedTechnicianId,
          "Customer quotation response",
          `${quotation.quotationNumber} was ${input.decision.toLowerCase()}.`,
          quotation.repairJobId,
        );
      await notifyRole(
        "RECEPTIONIST",
        "Customer quotation response",
        `${quotation.quotationNumber} was ${input.decision.toLowerCase()}.`,
        quotation.repairJobId,
      );
      res.json({
        success: true,
        message: `Quotation ${input.decision.toLowerCase()}`,
        data: { quotation: updated },
      });
    } catch (e) {
      next(e);
    }
  },
);
publicRouter.get("/invoices/:token", async (req, res, next) => {
  try {
    const invoice = await prisma.invoice.findFirst({
      where: {
        publicTokenHash: sha(req.params.token),
        publicTokenExpiresAt: { gt: new Date() },
      },
      include: {
        customer: { select: { name: true, email: true, phone: true } },
        repairJob: { select: { repairNumber: true, reportedProblem: true } },
        payments: {
          where: { status: "COMPLETED" },
          orderBy: { createdAt: "asc" },
        },
      },
    });
    if (!invoice) throw new AppError("Invoice link is invalid or expired", 404);
    res.json({
      success: true,
      message: "Invoice retrieved",
      data: { invoice },
    });
  } catch (e) {
    next(e);
  }
});
