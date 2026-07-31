import { prisma } from "../config/prisma.js";
import {
  findDeviceById, findDevices, insertDevice, nextDeviceCode, patchDevice,
} from "../repositories/device.repository.js";
import { AppError } from "../utils/AppError.js";
import type { CreateDeviceInput, DeviceQuery, UpdateDeviceInput } from "../validators/repair.validator.js";

export async function listDevices(query: DeviceQuery) {
  const result = await findDevices(query);
  return { devices: result.items, pagination: {
    page: query.page, limit: query.limit, total: result.total,
    pages: Math.ceil(result.total / query.limit),
  } };
}

export async function getDevice(id: string) {
  const device = await findDeviceById(id);
  if (!device) throw new AppError("Device was not found", 404);
  return device;
}

export async function createDevice(input: CreateDeviceInput) {
  const customer = await prisma.customer.findUnique({
    where: { id: input.customerId }, select: { id: true },
  });
  if (!customer) throw new AppError("Customer was not found", 404);
  return insertDevice(input, await nextDeviceCode());
}

export async function updateDevice(id: string, input: UpdateDeviceInput) {
  await getDevice(id);
  return patchDevice(id, input);
}
