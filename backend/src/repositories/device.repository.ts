import { prisma } from "../config/prisma.js";
import { nextCode } from "../utils/codeSequence.js";
import type { CreateDeviceInput, DeviceQuery, UpdateDeviceInput } from "../validators/repair.validator.js";

export async function findDevices(query: DeviceQuery) {
  const where = {
    ...(query.customerId ? { customerId: query.customerId } : {}),
    ...(query.search ? { OR: [
      { deviceCode: { contains: query.search, mode: "insensitive" as const } },
      { brand: { contains: query.search, mode: "insensitive" as const } },
      { model: { contains: query.search, mode: "insensitive" as const } },
      { serialNumber: { contains: query.search, mode: "insensitive" as const } },
    ] } : {}),
  };
  const [items, total] = await prisma.$transaction([
    prisma.device.findMany({
      where, skip: (query.page - 1) * query.limit, take: query.limit,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { id: true, customerCode: true, name: true, phone: true } },
        _count: { select: { repairJobs: true } },
      },
    }),
    prisma.device.count({ where }),
  ]);
  return { items, total };
}

export function findDeviceById(id: string) {
  return prisma.device.findUnique({
    where: { id },
    include: {
      customer: true,
      repairJobs: {
        orderBy: { createdAt: "desc" },
        include: { assignedTechnician: {
          select: { id: true, staffCode: true, fullName: true },
        } },
      },
    },
  });
}

export async function nextDeviceCode(): Promise<string> {
  return nextCode(prisma, "device", "DEV-");
}

export function insertDevice(input: CreateDeviceInput, deviceCode: string) {
  return prisma.device.create({ data: { ...input, deviceCode } });
}

export function patchDevice(id: string, input: UpdateDeviceInput) {
  return prisma.device.update({ where: { id }, data: input });
}
