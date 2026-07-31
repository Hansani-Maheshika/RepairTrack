import type { NextFunction, Request, Response } from "express";
import {
  createCustomer, getCustomer, listCustomers, updateCustomer,
} from "../services/customer.service.js";
import {
  createCustomerSchema, customerIdSchema, customerQuerySchema, updateCustomerSchema,
} from "../validators/customer.validator.js";

export async function listCustomersController(req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ success: true, message: "Customers retrieved successfully",
      data: await listCustomers(customerQuerySchema.parse(req.query)) });
  } catch (error) { next(error); }
}

export async function getCustomerController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = customerIdSchema.parse(req.params);
    res.json({ success: true, message: "Customer retrieved successfully",
      data: { customer: await getCustomer(id) } });
  } catch (error) { next(error); }
}

export async function createCustomerController(req: Request, res: Response, next: NextFunction) {
  try {
    const customer = await createCustomer(createCustomerSchema.parse(req.body));
    res.status(201).json({ success: true, message: "Customer created successfully",
      data: { customer } });
  } catch (error) { next(error); }
}

export async function updateCustomerController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = customerIdSchema.parse(req.params);
    const customer = await updateCustomer(id, updateCustomerSchema.parse(req.body));
    res.json({ success: true, message: "Customer updated successfully", data: { customer } });
  } catch (error) { next(error); }
}
