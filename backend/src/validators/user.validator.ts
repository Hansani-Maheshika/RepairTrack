import { z } from "zod";

export const roles = ["ADMIN", "RECEPTIONIST", "TECHNICIAN"] as const;

export const userIdSchema = z.object({ id: z.string().uuid("Invalid staff ID") });

export const userQuerySchema = z.object({
  search: z.string().trim().max(100).default(""),
  role: z.enum(roles).optional(),
  isActive: z.enum(["true", "false"]).transform((value) => value === "true").optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const createUserSchema = z.object({
  staffCode: z.string().trim().toUpperCase().regex(/^STF-\d{4,}$/),
  fullName: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(128),
  role: z.enum(roles),
});

export const updateUserSchema = z.object({
  staffCode: z.string().trim().toUpperCase().regex(/^STF-\d{4,}$/).optional(),
  fullName: z.string().trim().min(2).max(100).optional(),
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()).optional(),
  role: z.enum(roles).optional(),
  isActive: z.boolean().optional(),
}).refine((value) => Object.keys(value).length > 0, "At least one field must be supplied");

export const resetPasswordSchema = z.object({ password: z.string().min(8).max(128) });

export type UserQuery = z.infer<typeof userQuerySchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

