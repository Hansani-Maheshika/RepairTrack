import type {
  RepairPriority,
  RepairStatus,
} from "../generated/prisma/client.js";
import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";
import type { UserRole } from "../utils/jwt.js";
import { generateRepairNumber } from "../utils/repairNumber.js";
import { canTransition } from "../utils/statusTransitions.js";
import { audit, notifyRole, notifyUser } from "./notification.service.js";
import type {
  AssignRepairInput,
  CreateRepairInput,
  InspectionInput,
  PublicTrackingInput,
  RepairQuery,
  UpdateRepairInput,
  UpdateStatusInput,
} from "../validators/repair.validator.js";

interface Actor {
  id: string;
  role: UserRole;
}

const repairInclude = {
  customer: {
    select: {
      id: true,
      customerCode: true,
      name: true,
      phone: true,
      email: true,
    },
  },
  device: true,
  createdBy: { select: { id: true, staffCode: true, fullName: true } },
  assignedTechnician: { select: { id: true, staffCode: true, fullName: true } },
  statusHistory: {
    orderBy: { createdAt: "asc" as const },
    include: {
      updatedBy: { select: { id: true, staffCode: true, fullName: true } },
    },
  },
};

export async function listRepairs(query: RepairQuery, actor: Actor) {
  const where = {
    ...(actor.role === "TECHNICIAN" ? { assignedTechnicianId: actor.id } : {}),
    ...(query.technicianId ? { assignedTechnicianId: query.technicianId } : {}),
    ...(query.status ? { status: query.status as RepairStatus } : {}),
    ...(query.priority ? { priority: query.priority as RepairPriority } : {}),
    ...(query.search
      ? {
          OR: [
            {
              repairNumber: {
                contains: query.search,
                mode: "insensitive" as const,
              },
            },
            {
              reportedProblem: {
                contains: query.search,
                mode: "insensitive" as const,
              },
            },
            {
              customer: {
                name: { contains: query.search, mode: "insensitive" as const },
              },
            },
            {
              device: {
                brand: { contains: query.search, mode: "insensitive" as const },
              },
            },
          ],
        }
      : {}),
  };
  const [repairs, total] = await prisma.$transaction([
    prisma.repairJob.findMany({
      where,
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { customerCode: true, name: true, phone: true } },
        device: {
          select: {
            deviceCode: true,
            deviceType: true,
            brand: true,
            model: true,
          },
        },
        assignedTechnician: {
          select: { id: true, staffCode: true, fullName: true },
        },
      },
    }),
    prisma.repairJob.count({ where }),
  ]);
  return {
    repairs,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      pages: Math.ceil(total / query.limit),
    },
  };
}

export async function getRepair(id: string, actor: Actor) {
  const repair = await prisma.repairJob.findUnique({
    where: { id },
    include: repairInclude,
  });
  if (!repair) throw new AppError("Repair job was not found", 404);
  if (actor.role === "TECHNICIAN" && repair.assignedTechnicianId !== actor.id) {
    throw new AppError("You can only access repairs assigned to you", 403);
  }
  return repair;
}

export async function createRepair(input: CreateRepairInput, actor: Actor) {
  const device = await prisma.device.findUnique({
    where: { id: input.deviceId },
    select: { id: true, customerId: true },
  });
  if (!device) throw new AppError("Device was not found", 404);
  if (device.customerId !== input.customerId) {
    throw new AppError("Device does not belong to the selected customer", 400);
  }
  if (actor.role !== "ADMIN" && input.assignedTechnicianId) {
    throw new AppError("Only an administrator can assign a technician", 403);
  }
  if (input.assignedTechnicianId)
    await validateTechnician(input.assignedTechnicianId);

  const repair = await prisma.$transaction(async (tx) => {
    const repairNumber = await generateRepairNumber(tx);
    const repair = await tx.repairJob.create({
      data: {
        repairNumber,
        customerId: input.customerId,
        deviceId: input.deviceId,
        createdById: actor.id,
        assignedTechnicianId: input.assignedTechnicianId,
        reportedProblem: input.reportedProblem,
        priority: input.priority,
      },
    });
    await tx.repairStatusHistory.create({
      data: {
        repairJobId: repair.id,
        status: "DEVICE_RECEIVED",
        updatedById: actor.id,
        publicNote: "Device received by the repair centre",
      },
    });
    return repair;
  });
  await notifyRole(
    "ADMIN",
    "New repair requires assignment",
    `${repair.repairNumber} was registered and needs a technician.`,
    repair.id,
  );
  await audit(actor.id, "REPAIR_CREATED", "RepairJob", repair.id, {
    repairNumber: repair.repairNumber,
  });
  return repair;
}

async function validateTechnician(id: string) {
  const technician = await prisma.user.findFirst({
    where: { id, role: "TECHNICIAN", isActive: true },
    select: { id: true },
  });
  if (!technician) throw new AppError("Active technician was not found", 400);
}

export async function assignRepair(
  id: string,
  input: AssignRepairInput,
  actorId?: string,
) {
  const exists = await prisma.repairJob.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!exists) throw new AppError("Repair job was not found", 404);
  if (input.technicianId) await validateTechnician(input.technicianId);
  const repair = await prisma.repairJob.update({
    where: { id },
    data: { assignedTechnicianId: input.technicianId },
    include: {
      assignedTechnician: {
        select: { id: true, staffCode: true, fullName: true },
      },
    },
  });
  if (input.technicianId)
    await notifyUser(
      input.technicianId,
      "Repair assigned",
      `${repair.repairNumber} has been assigned to you.`,
      id,
    );
  await audit(actorId, "TECHNICIAN_ASSIGNED", "RepairJob", id, {
    technicianId: input.technicianId,
  });
  return repair;
}

export async function updateRepair(id: string, input: UpdateRepairInput) {
  const exists = await prisma.repairJob.findUnique({
    where: { id },
    select: { id: true, status: true },
  });
  if (!exists) throw new AppError("Repair job was not found", 404);
  if (["COLLECTED", "CANCELLED"].includes(exists.status)) {
    throw new AppError("A terminal repair cannot be edited", 409);
  }
  return prisma.repairJob.update({ where: { id }, data: input });
}

export async function updateInspection(
  id: string,
  input: InspectionInput,
  actor: Actor,
) {
  await getRepair(id, actor);
  return prisma.repairJob.update({ where: { id }, data: input });
}

export async function updateRepairStatus(
  id: string,
  input: UpdateStatusInput,
  actor: Actor,
) {
  const repair = await getRepair(id, actor);
  const nextStatus = input.status as RepairStatus;
  const technicianStatuses: RepairStatus[] = [
    "DEVICE_RECEIVED",
    "WAITING_FOR_CUSTOMER_APPROVAL",
    "WAITING_FOR_SPARE_PARTS",
    "REPAIR_IN_PROGRESS",
    "COMPLETED",
    "CANCELLED",
  ];
  if (
    actor.role === "TECHNICIAN" &&
    repair.status === "WAITING_FOR_CUSTOMER_APPROVAL" &&
    ["REPAIR_APPROVED", "REPAIR_REJECTED"].includes(nextStatus)
  ) {
    throw new AppError(
      "Only the customer quotation response can approve or reject the repair",
      403,
    );
  }
  const technicianSelection =
    actor.role === "TECHNICIAN" && technicianStatuses.includes(nextStatus);
  if (!technicianSelection && !canTransition(repair.status, nextStatus)) {
    throw new AppError(
      `Status cannot change from ${repair.status} to ${nextStatus}`,
      409,
    );
  }
  if (nextStatus === "COLLECTED") {
    if (actor.role !== "RECEPTIONIST") {
      throw new AppError(
        "Only a receptionist can hand over and mark a device collected",
        403,
      );
    }
    const invoice = await prisma.invoice.findUnique({
      where: { repairJobId: id },
      select: { status: true, balance: true },
    });
    if (!invoice || invoice.status !== "PAID" || Number(invoice.balance) !== 0) {
      throw new AppError(
        "The invoice must be fully paid before the device can be collected",
        409,
      );
    }
  }
  if (
    actor.role === "RECEPTIONIST" &&
    !["CANCELLED", "COLLECTED"].includes(nextStatus)
  ) {
    throw new AppError("Receptionists cannot apply this repair status", 403);
  }
  const now = new Date();
  const updated = await prisma.$transaction(async (tx) => {
    const updated = await tx.repairJob.update({
      where: { id },
      data: {
        status: nextStatus,
        ...(nextStatus === "COMPLETED" ? { completedAt: now } : {}),
        ...(nextStatus === "COLLECTED"
          ? { collectedAt: now, completedAt: repair.completedAt ?? now }
          : {}),
      },
    });
    await tx.repairStatusHistory.create({
      data: {
        repairJobId: id,
        status: nextStatus,
        updatedById: actor.id,
        publicNote: input.publicNote,
        internalNote: input.internalNote,
      },
    });
    return updated;
  });
  await audit(actor.id, "REPAIR_STATUS_CHANGED", "RepairJob", id, {
    from: repair.status,
    to: nextStatus,
  });
  if (nextStatus === "WAITING_FOR_CUSTOMER_APPROVAL") {
    await notifyRole(
      "RECEPTIONIST",
      "Quotation required",
      `${repair.repairNumber} was inspected and needs a quotation sent to the customer.`,
      id,
    );
  }
  if (nextStatus === "COMPLETED") {
    await notifyRole(
      "RECEPTIONIST",
      "Repair completed — create invoice",
      `${repair.repairNumber} is completed. Create and send the final invoice to the customer.`,
      id,
    );
  }
  return updated;
}

export async function trackRepair(input: PublicTrackingInput) {
  const repair = await prisma.repairJob.findFirst({
    where: {
      repairNumber: input.repairNumber,
      customer: { phone: input.phone },
    },
    select: {
      repairNumber: true,
      status: true,
      priority: true,
      receivedAt: true,
      estimatedCompletionDate: true,
      completedAt: true,
      collectedAt: true,
      device: { select: { deviceType: true, brand: true, model: true } },
      statusHistory: {
        orderBy: { createdAt: "asc" },
        select: { status: true, publicNote: true, createdAt: true },
      },
      attachments: {
        where: { mimeType: { startsWith: "image/" } },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          fileName: true,
          mimeType: true,
          url: true,
          createdAt: true,
        },
      },
      quotations: {
        where: { status: { in: ["SENT", "APPROVED", "REJECTED"] } },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          quotationNumber: true,
          status: true,
          subtotal: true,
          tax: true,
          total: true,
          notes: true,
          validUntil: true,
          items: {
            select: {
              id: true,
              description: true,
              quantity: true,
              unitPrice: true,
              lineTotal: true,
            },
          },
        },
      },
      invoice: {
        select: {
          id: true,
          invoiceNumber: true,
          status: true,
          subtotal: true,
          tax: true,
          total: true,
          paidAmount: true,
          balance: true,
          createdAt: true,
          payments: {
            where: { status: "COMPLETED" },
            orderBy: { createdAt: "asc" },
            select: {
              id: true,
              amount: true,
              method: true,
              paidAt: true,
            },
          },
        },
      },
    },
  });
  if (!repair)
    throw new AppError("No repair was found for the supplied details", 404);
  return repair;
}
