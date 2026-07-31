import { z } from "zod";

export const deviceTypes = [
  "LAPTOP", "DESKTOP", "MOBILE_PHONE", "TABLET", "PRINTER", "OTHER",
] as const;
export const priorities = ["LOW", "NORMAL", "HIGH", "URGENT"] as const;
export const repairStatuses = [
  "DEVICE_RECEIVED", "UNDER_INSPECTION",
  "WAITING_FOR_CUSTOMER_APPROVAL", "REPAIR_APPROVED", "REPAIR_REJECTED",
  "WAITING_FOR_SPARE_PARTS", "REPAIR_IN_PROGRESS", "TESTING",
  "READY_FOR_COLLECTION", "COMPLETED", "COLLECTED", "CANCELLED",
] as const;

export const uuidParamsSchema = z.object({ id: z.string().uuid("Invalid ID") });

export const deviceQuerySchema = z.object({
  search: z.string().trim().max(100).default(""),
  customerId: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const createDeviceSchema = z.object({
  customerId: z.string().uuid(),
  deviceType: z.enum(deviceTypes),
  brand: z.string().trim().min(1).max(80),
  model: z.string().trim().min(1).max(100),
  serialNumber: z.string().trim().max(120).optional().nullable(),
  colour: z.string().trim().max(50).optional().nullable(),
  condition: z.string().trim().max(500).optional().nullable(),
  accessories: z.array(z.string().trim().min(1).max(100)).max(30).default([]),
});

export const updateDeviceSchema = createDeviceSchema.omit({ customerId: true }).partial()
  .refine((value) => Object.keys(value).length > 0, "At least one field must be supplied");

export const repairQuerySchema = z.object({
  search: z.string().trim().max(100).default(""),
  status: z.enum(repairStatuses).optional(),
  priority: z.enum(priorities).optional(),
  technicianId: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const createRepairSchema = z.object({
  customerId: z.string().uuid(),
  deviceId: z.string().uuid(),
  assignedTechnicianId: z.string().uuid().optional().nullable(),
  reportedProblem: z.string().trim().min(3).max(2000),
  priority: z.enum(priorities).default("NORMAL"),
});

export const updateRepairSchema = z.object({
  reportedProblem: z.string().trim().min(3).max(2000).optional(),
  priority: z.enum(priorities).optional(),
}).refine((value) => Object.keys(value).length > 0, "At least one field must be supplied");

export const assignRepairSchema = z.object({
  technicianId: z.string().uuid().nullable(),
});

export const inspectionSchema = z.object({
  inspectionFindings: z.string().trim().min(1).max(5000),
  internalNotes: z.string().trim().max(5000).optional().nullable(),
  estimatedCost: z.coerce.number().nonnegative().max(9999999999).optional().nullable(),
  estimatedCompletionDate: z.coerce.date().optional().nullable(),
});

export const updateStatusSchema = z.object({
  status: z.enum(repairStatuses),
  publicNote: z.string().trim().max(1000).optional().nullable(),
  internalNote: z.string().trim().max(2000).optional().nullable(),
});

export const publicTrackingSchema = z.object({
  repairNumber: z.string().trim().toUpperCase().regex(/^REP-\d{4}-\d{4,}$/),
  phone: z.string().trim().min(7).max(20),
});

export type DeviceQuery = z.infer<typeof deviceQuerySchema>;
export type CreateDeviceInput = z.infer<typeof createDeviceSchema>;
export type UpdateDeviceInput = z.infer<typeof updateDeviceSchema>;
export type RepairQuery = z.infer<typeof repairQuerySchema>;
export type CreateRepairInput = z.infer<typeof createRepairSchema>;
export type UpdateRepairInput = z.infer<typeof updateRepairSchema>;
export type AssignRepairInput = z.infer<typeof assignRepairSchema>;
export type InspectionInput = z.infer<typeof inspectionSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
export type PublicTrackingInput = z.infer<typeof publicTrackingSchema>;
