import { createHash, randomBytes } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorizeRoles } from "../middleware/authorizeRoles.js";
import { AppError } from "../utils/AppError.js";
import { nextCode } from "../utils/codeSequence.js";
import {
  audit,
  notifyRole,
  notifyUser,
  sendCustomerMessage,
} from "../services/notification.service.js";
import { env } from "../config/env.js";

export const businessRouter = Router();
const id = z.string().uuid();
const money = z.coerce.number().nonnegative().max(999999999);
const quoteBody = z.object({
  items: z
    .array(
      z.object({
        description: z.string().trim().min(1).max(300),
        quantity: z.coerce.number().int().positive(),
        unitPrice: money,
      }),
    )
    .min(1),
  tax: money.default(0),
  notes: z.string().max(2000).optional().nullable(),
  validUntil: z.coerce.date().optional().nullable(),
});
const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
const token = () => randomBytes(32).toString("hex");

businessRouter.use(authenticate);
businessRouter.get(
  "/repairs/:id/quotations",
  authorizeRoles("RECEPTIONIST"),
  async (req, res, next) => {
    try {
      const repairId = id.parse(req.params.id);
      const quotations = await prisma.quotation.findMany({
        where: { repairJobId: repairId },
        include: { items: true },
        orderBy: { createdAt: "desc" },
      });
      res.json({
        success: true,
        message: "Quotations retrieved",
        data: { quotations },
      });
    } catch (e) {
      next(e);
    }
  },
);
businessRouter.post(
  "/repairs/:id/quotations",
  authorizeRoles("RECEPTIONIST"),
  async (req, res, next) => {
    try {
      if (!req.user) throw new AppError("Authentication required", 401);
      const repairJobId = id.parse(req.params.id);
      const input = quoteBody.parse(req.body);
      const repair = await prisma.repairJob.findUnique({
        where: { id: repairJobId },
        include: { customer: true },
      });
      if (!repair) throw new AppError("Repair not found", 404);
      if (repair.status !== "WAITING_FOR_CUSTOMER_APPROVAL")
        throw new AppError(
          "Quotation can be created only after technician inspection requests customer approval",
          409,
        );
      const subtotal = input.items.reduce(
        (s, x) => s + x.quantity * x.unitPrice,
        0,
      );
      const quotationNumber = await nextCode(prisma, "quotation", "QUO-");
      const quotation = await prisma.quotation.create({
        data: {
          quotationNumber,
          repairJobId,
          customerId: repair.customerId,
          subtotal,
          tax: input.tax,
          total: subtotal + input.tax,
          notes: input.notes,
          validUntil: input.validUntil,
          items: {
            create: input.items.map((x) => ({
              ...x,
              lineTotal: x.quantity * x.unitPrice,
            })),
          },
        },
        include: { items: true },
      });
      await audit(req.user.id, "QUOTATION_CREATED", "Quotation", quotation.id);
      res.status(201).json({
        success: true,
        message: "Quotation created",
        data: { quotation },
      });
    } catch (e) {
      next(e);
    }
  },
);
businessRouter.post(
  "/quotations/:id/send",
  authorizeRoles("RECEPTIONIST"),
  async (req, res, next) => {
    try {
      if (!req.user) throw new AppError("Authentication required", 401);
      const quotationId = id.parse(req.params.id);
      const publicToken = token();
      const expires = new Date(Date.now() + 7 * 86400000);
      const quotation = await prisma.quotation.update({
        where: { id: quotationId },
        data: {
          status: "SENT",
          sentAt: new Date(),
          publicTokenHash: hash(publicToken),
          publicTokenExpiresAt: expires,
        },
        include: { customer: true, repairJob: true },
      });
      const link = `${env.CLIENT_URL}/quotation/${publicToken}`;
      await sendCustomerMessage({
        email: quotation.customer.email,
        phone: quotation.customer.phone,
        title: `Quotation ${quotation.quotationNumber}`,
        message: `Your repair quotation is LKR ${quotation.total}. Review it here: ${link}`,
        repairJobId: quotation.repairJobId,
      });
      await notifyRole(
        "RECEPTIONIST",
        "Quotation sent",
        `${quotation.quotationNumber} was sent to ${quotation.customer.name}.`,
        quotation.repairJobId,
      );
      await audit(req.user.id, "QUOTATION_SENT", "Quotation", quotation.id);
      res.json({
        success: true,
        message: "Quotation sent",
        data: {
          quotation,
          developmentLink: env.NODE_ENV === "development" ? link : undefined,
        },
      });
    } catch (e) {
      next(e);
    }
  },
);

const partBody = z.object({
  sku: z.string().trim().toUpperCase().min(2).max(50),
  name: z.string().trim().min(2).max(150),
  description: z.string().max(500).optional().nullable(),
  quantity: z.coerce.number().int().nonnegative(),
  reorderLevel: z.coerce.number().int().nonnegative(),
  unitCost: money,
  sellingPrice: money,
});
businessRouter.get(
  "/inventory",
  authorizeRoles("ADMIN", "RECEPTIONIST", "TECHNICIAN"),
  async (_req, res, next) => {
    try {
      const parts = await prisma.sparePart.findMany({
        orderBy: { name: "asc" },
      });
      res.json({
        success: true,
        message: "Inventory retrieved",
        data: { parts },
      });
    } catch (e) {
      next(e);
    }
  },
);
businessRouter.post(
  "/inventory",
  authorizeRoles("ADMIN"),
  async (req, res, next) => {
    try {
      if (!req.user) throw new AppError("Authentication required", 401);
      const input = partBody.parse(req.body);
      const part = await prisma.$transaction(async (tx) => {
        const created = await tx.sparePart.create({ data: input });
        if (input.quantity)
          await tx.stockMovement.create({
            data: {
              sparePartId: created.id,
              type: "PURCHASE",
              quantity: input.quantity,
              note: "Opening stock",
            },
          });
        return created;
      });
      await audit(req.user.id, "SPARE_PART_CREATED", "SparePart", part.id);
      res
        .status(201)
        .json({ success: true, message: "Spare part created", data: { part } });
    } catch (e) {
      next(e);
    }
  },
);
businessRouter.post(
  "/inventory/:id/adjust",
  authorizeRoles("ADMIN"),
  async (req, res, next) => {
    try {
      if (!req.user) throw new AppError("Authentication required", 401);
      const partId = id.parse(req.params.id);
      const input = z
        .object({
          quantity: z.coerce.number().int(),
          note: z.string().min(2).max(500),
        })
        .parse(req.body);
      const part = await prisma.$transaction(async (tx) => {
        const current = await tx.sparePart.findUnique({
          where: { id: partId },
        });
        if (!current || current.quantity + input.quantity < 0)
          throw new AppError("Invalid stock adjustment", 409);
        const updated = await tx.sparePart.update({
          where: { id: partId },
          data: { quantity: { increment: input.quantity } },
        });
        await tx.stockMovement.create({
          data: {
            sparePartId: partId,
            type: "ADJUSTMENT",
            quantity: input.quantity,
            note: input.note,
          },
        });
        return updated;
      });
      await audit(req.user.id, "STOCK_ADJUSTED", "SparePart", partId, {
        quantity: input.quantity,
      });
      res.json({ success: true, message: "Stock adjusted", data: { part } });
    } catch (e) {
      next(e);
    }
  },
);
businessRouter.post(
  "/repairs/:id/parts",
  authorizeRoles("TECHNICIAN"),
  async (req, res, next) => {
    try {
      if (!req.user) throw new AppError("Authentication required", 401);
      const actorId = req.user.id;
      const repairJobId = id.parse(req.params.id);
      const input = z
        .object({
          sparePartId: id,
          quantity: z.coerce.number().int().positive(),
        })
        .parse(req.body);
      const repair = await prisma.repairJob.findUnique({
        where: { id: repairJobId },
      });
      if (!repair || repair.assignedTechnicianId !== req.user.id)
        throw new AppError("Only the assigned technician can use parts", 403);
      const usage = await prisma.$transaction(async (tx) => {
        const part = await tx.sparePart.findUnique({
          where: { id: input.sparePartId },
        });
        if (!part || part.quantity < input.quantity)
          throw new AppError("Insufficient stock", 409);
        await tx.sparePart.update({
          where: { id: part.id },
          data: { quantity: { decrement: input.quantity } },
        });
        await tx.stockMovement.create({
          data: {
            sparePartId: part.id,
            type: "USAGE",
            quantity: -input.quantity,
            note: `Used on ${repair.repairNumber}`,
          },
        });
        return tx.repairPartUsage.create({
          data: {
            repairJobId,
            sparePartId: part.id,
            quantity: input.quantity,
            unitPrice: part.sellingPrice,
            usedById: actorId,
          },
          include: { sparePart: true },
        });
      });
      await audit(req.user.id, "PART_USED", "RepairJob", repairJobId, {
        sparePartId: input.sparePartId,
        quantity: input.quantity,
      });
      if (usage.sparePart.quantity <= usage.sparePart.reorderLevel) {
        await notifyRole(
          "ADMIN",
          "Spare-part stock is low",
          `${usage.sparePart.name} has ${usage.sparePart.quantity} item(s) remaining.`,
          repairJobId,
        );
      }
      res.status(201).json({
        success: true,
        message: "Part usage recorded",
        data: { usage },
      });
    } catch (e) {
      next(e);
    }
  },
);

businessRouter.get(
  "/part-requests",
  authorizeRoles("ADMIN", "TECHNICIAN"),
  async (req, res, next) => {
    try {
      if (!req.user) throw new AppError("Authentication required", 401);
      const requests = await prisma.sparePartRequest.findMany({
        where:
          req.user.role === "TECHNICIAN"
            ? { requestedById: req.user.id }
            : undefined,
        include: {
          repairJob: { select: { id: true, repairNumber: true, status: true } },
          requestedBy: {
            select: { id: true, fullName: true, staffCode: true },
          },
          sparePart: {
            select: { id: true, sku: true, name: true, quantity: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });
      res.json({
        success: true,
        message: "Part requests retrieved",
        data: { requests },
      });
    } catch (error) {
      next(error);
    }
  },
);

businessRouter.post(
  "/repairs/:id/part-requests",
  authorizeRoles("TECHNICIAN"),
  async (req, res, next) => {
    try {
      if (!req.user) throw new AppError("Authentication required", 401);
      const repairJobId = id.parse(req.params.id);
      const input = z
        .object({
          sparePartId: id.optional().nullable(),
          partName: z.string().trim().min(2).max(150).optional(),
          quantity: z.coerce.number().int().positive().max(1000),
          note: z.string().trim().max(500).optional().nullable(),
        })
        .refine((value) => value.sparePartId || value.partName, {
          message: "Select an existing part or enter the required part name",
        })
        .parse(req.body);
      const repair = await prisma.repairJob.findUnique({
        where: { id: repairJobId },
      });
      if (!repair || repair.assignedTechnicianId !== req.user.id)
        throw new AppError(
          "Only the assigned technician can request parts",
          403,
        );
      const sparePart = input.sparePartId
        ? await prisma.sparePart.findUnique({
            where: { id: input.sparePartId },
          })
        : null;
      if (input.sparePartId && !sparePart)
        throw new AppError("Spare part not found", 404);
      const request = await prisma.sparePartRequest.create({
        data: {
          repairJobId,
          requestedById: req.user.id,
          sparePartId: sparePart?.id,
          partName: sparePart?.name ?? input.partName!,
          quantity: input.quantity,
          note: input.note,
        },
      });
      await notifyRole(
        "ADMIN",
        "Spare part requested",
        `${repair.repairNumber}: ${input.quantity} × ${request.partName} requested by a technician.`,
        repairJobId,
      );
      await audit(
        req.user.id,
        "SPARE_PART_REQUESTED",
        "SparePartRequest",
        request.id,
      );
      res.status(201).json({
        success: true,
        message: "Spare-part request sent to admin",
        data: { request },
      });
    } catch (error) {
      next(error);
    }
  },
);

businessRouter.patch(
  "/part-requests/:id",
  authorizeRoles("ADMIN"),
  async (req, res, next) => {
    try {
      if (!req.user) throw new AppError("Authentication required", 401);
      const requestId = id.parse(req.params.id);
      const input = z
        .object({
          status: z.enum(["FULFILLED", "REJECTED"]),
          sparePartId: id.optional().nullable(),
        })
        .parse(req.body);
      const existing = await prisma.sparePartRequest.findUnique({
        where: { id: requestId },
        include: { repairJob: true },
      });
      if (!existing || existing.status !== "PENDING")
        throw new AppError("Pending part request not found", 404);
      const selectedPartId = input.sparePartId ?? existing.sparePartId;
      if (input.status === "FULFILLED") {
        if (!selectedPartId)
          throw new AppError(
            "Add the part to inventory and select it before fulfilling",
            409,
          );
        const part = await prisma.sparePart.findUnique({
          where: { id: selectedPartId },
        });
        if (!part || part.quantity < existing.quantity)
          throw new AppError(
            "Add enough stock before fulfilling this request",
            409,
          );
      }
      const request = await prisma.sparePartRequest.update({
        where: { id: requestId },
        data: {
          status: input.status,
          sparePartId: selectedPartId,
          resolvedById: req.user.id,
          resolvedAt: new Date(),
        },
      });
      await notifyUser(
        existing.requestedById,
        `Spare-part request ${input.status.toLowerCase()}`,
        `${existing.quantity} × ${existing.partName} for ${existing.repairJob.repairNumber} was ${input.status.toLowerCase()}.`,
        existing.repairJobId,
      );
      await audit(
        req.user.id,
        `SPARE_PART_REQUEST_${input.status}`,
        "SparePartRequest",
        request.id,
      );
      res.json({
        success: true,
        message: `Part request ${input.status.toLowerCase()}`,
        data: { request },
      });
    } catch (error) {
      next(error);
    }
  },
);

businessRouter.post(
  "/quotations/:id/invoice",
  authorizeRoles("RECEPTIONIST"),
  async (req, res, next) => {
    try {
      if (!req.user) throw new AppError("Authentication required", 401);
      const quotationId = id.parse(req.params.id);
      const quote = await prisma.quotation.findUnique({
        where: { id: quotationId },
        include: { customer: true, repairJob: true, invoice: true },
      });
      if (!quote || quote.status !== "APPROVED")
        throw new AppError("Only an approved quotation can be invoiced", 409);
      if (quote.repairJob.status !== "COMPLETED")
        throw new AppError(
          "Final invoice can be created only after the technician marks the repair completed",
          409,
        );
      if (quote.invoice)
        throw new AppError("Invoice already exists for this quotation", 409);
      const invoiceNumber = await nextCode(prisma, "invoice", "INV-");
      const publicToken = token();
      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber,
          repairJobId: quote.repairJobId,
          customerId: quote.customerId,
          quotationId: quote.id,
          subtotal: quote.subtotal,
          tax: quote.tax,
          total: quote.total,
          balance: quote.total,
          publicTokenHash: hash(publicToken),
          publicTokenExpiresAt: new Date(Date.now() + 30 * 86400000),
        },
      });
      const invoiceLink = `${env.CLIENT_URL}/invoice/${publicToken}`;
      await sendCustomerMessage({
        email: quote.customer.email,
        phone: quote.customer.phone,
        title: `Invoice ${invoice.invoiceNumber}`,
        message: `Your invoice total is LKR ${invoice.total}. View or pay: ${invoiceLink}`,
        repairJobId: quote.repairJobId,
      });
      await audit(req.user.id, "INVOICE_CREATED", "Invoice", invoice.id);
      res.status(201).json({
        success: true,
        message: "Invoice created",
        data: {
          invoice,
          developmentLink:
            env.NODE_ENV === "development" ? invoiceLink : undefined,
        },
      });
    } catch (e) {
      next(e);
    }
  },
);
businessRouter.get(
  "/invoices",
  authorizeRoles("ADMIN", "RECEPTIONIST"),
  async (_req, res, next) => {
    try {
      const invoices = await prisma.invoice.findMany({
        include: { customer: true, repairJob: true, payments: true },
        orderBy: { createdAt: "desc" },
      });
      res.json({
        success: true,
        message: "Invoices retrieved",
        data: { invoices },
      });
    } catch (e) {
      next(e);
    }
  },
);
businessRouter.post(
  "/invoices/:id/payments",
  authorizeRoles("RECEPTIONIST"),
  async (req, res, next) => {
    try {
      if (!req.user) throw new AppError("Authentication required", 401);
      const invoiceId = id.parse(req.params.id);
      const input = z
        .object({
          amount: money.positive(),
          method: z.enum(["CASH", "CARD", "BANK_TRANSFER"]),
          note: z.string().max(500).optional(),
        })
        .parse(req.body);
      const payment = await prisma.$transaction(async (tx) => {
        const invoice = await tx.invoice.findUnique({
          where: { id: invoiceId },
        });
        if (!invoice || Number(invoice.balance) < input.amount)
          throw new AppError("Payment exceeds invoice balance", 409);
        const paidAmount = Number(invoice.paidAmount) + input.amount;
        const balance = Number(invoice.total) - paidAmount;
        const created = await tx.payment.create({
          data: {
            invoiceId,
            amount: input.amount,
            method: input.method,
            status: "COMPLETED",
            paidAt: new Date(),
            note: input.note,
          },
        });
        await tx.invoice.update({
          where: { id: invoiceId },
          data: {
            paidAmount,
            balance,
            status: balance === 0 ? "PAID" : "PARTIALLY_PAID",
          },
        });
        return created;
      });
      await audit(req.user.id, "PAYMENT_RECORDED", "Invoice", invoiceId, {
        amount: input.amount,
        method: input.method,
      });
      res.status(201).json({
        success: true,
        message: "Payment recorded",
        data: { payment },
      });
    } catch (e) {
      next(e);
    }
  },
);
businessRouter.get(
  "/audit-logs",
  authorizeRoles("ADMIN"),
  async (_req, res, next) => {
    try {
      const logs = await prisma.auditLog.findMany({
        take: 100,
        orderBy: { createdAt: "desc" },
        include: { actor: { select: { fullName: true, staffCode: true } } },
      });
      res.json({
        success: true,
        message: "Audit logs retrieved",
        data: { logs },
      });
    } catch (e) {
      next(e);
    }
  },
);
