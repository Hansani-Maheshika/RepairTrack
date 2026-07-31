import {
  findCustomerById, findCustomers, insertCustomer, nextCustomerCode, patchCustomer,
} from "../repositories/customer.repository.js";
import { AppError } from "../utils/AppError.js";
import type {
  CreateCustomerInput, CustomerQuery, UpdateCustomerInput,
} from "../validators/customer.validator.js";

export async function listCustomers(query: CustomerQuery) {
  const result = await findCustomers(query);
  return {
    customers: result.items,
    pagination: {
      page: query.page,
      limit: query.limit,
      total: result.total,
      pages: Math.ceil(result.total / query.limit),
    },
  };
}

export async function getCustomer(id: string) {
  const customer = await findCustomerById(id);
  if (!customer) throw new AppError("Customer was not found", 404);
  return customer;
}

export async function createCustomer(input: CreateCustomerInput) {
  return insertCustomer(input, await nextCustomerCode());
}

export async function updateCustomer(id: string, input: UpdateCustomerInput) {
  await getCustomer(id);
  return patchCustomer(id, input);
}
