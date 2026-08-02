import { prisma } from "../config/prisma.js";
import { nextCode } from "../utils/codeSequence.js";
import type {
  CreateCustomerInput, CustomerQuery, UpdateCustomerInput,
} from "../validators/customer.validator.js";

export async function findCustomers(query: CustomerQuery) {
  const where = query.search
    ? {
        OR: [
          { name: { contains: query.search, mode: "insensitive" as const } },
          { phone: { contains: query.search } },
          { customerCode: { contains: query.search, mode: "insensitive" as const } },
        ],
      }
    : {};
  const [items, total] = await prisma.$transaction([
    prisma.customer.findMany({
      where,
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { devices: true, repairJobs: true } } },
    }),
    prisma.customer.count({ where }),
  ]);
  return { items, total };
}

export function findCustomerById(id: string) {
  return prisma.customer.findUnique({
    where: { id },
    include: {
      devices: { orderBy: { createdAt: "desc" } },
      repairJobs: {
        orderBy: { createdAt: "desc" },
        include: { device: true, assignedTechnician: {
          select: { id: true, staffCode: true, fullName: true },
        } },
      },
    },
  });
}

export async function nextCustomerCode(): Promise<string> {
  return nextCode(prisma, "customer", "CUS-");
}

export function insertCustomer(input: CreateCustomerInput, customerCode: string) {
  const { privacyConsent: _privacyConsent, ...customer } = input;
  return prisma.customer.create({
    data: { ...customer, customerCode, privacyConsentAt: new Date() },
  });
}

export function patchCustomer(id: string, input: UpdateCustomerInput) {
  return prisma.customer.update({ where: { id }, data: input });
}
