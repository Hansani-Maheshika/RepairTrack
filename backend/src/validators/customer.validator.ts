import { z } from "zod";

const optionalText = (maximum: number) =>
  z.string().trim().max(maximum).optional().nullable();

export const customerIdSchema = z.object({
  id: z.string().uuid("Invalid customer ID"),
});

export const customerQuerySchema = z.object({
  search: z.string().trim().max(100).default(""),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const createCustomerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(7).max(20),
  email: z.string().trim().email().max(254).optional().nullable(),
  address: optionalText(500),
});

export const updateCustomerSchema = createCustomerSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be supplied",
  });

export type CustomerQuery = z.infer<typeof customerQuerySchema>;
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
