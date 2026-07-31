import type { NextFunction, Request, Response } from "express";
import { createUser, getUser, listUsers, resetUserPassword, updateUser } from "../services/user.service.js";
import { AppError } from "../utils/AppError.js";
import { createUserSchema, resetPasswordSchema, updateUserSchema, userIdSchema, userQuerySchema } from "../validators/user.validator.js";

export async function listUsersController(req: Request, res: Response, next: NextFunction) {
  try { res.json({ success: true, message: "Staff retrieved successfully",
    data: await listUsers(userQuerySchema.parse(req.query)) }); } catch (error) { next(error); }
}
export async function listTechniciansController(req: Request, res: Response, next: NextFunction) {
  try { res.json({ success: true, message: "Technicians retrieved successfully",
    data: await listUsers(userQuerySchema.parse({ ...req.query, role: "TECHNICIAN", isActive: "true" })) }); }
  catch (error) { next(error); }
}
export async function getUserController(req: Request, res: Response, next: NextFunction) {
  try { const { id } = userIdSchema.parse(req.params); res.json({ success: true,
    message: "Staff account retrieved successfully", data: { user: await getUser(id) } }); }
  catch (error) { next(error); }
}
export async function createUserController(req: Request, res: Response, next: NextFunction) {
  try { const user = await createUser(createUserSchema.parse(req.body)); res.status(201).json({
    success: true, message: "Staff account created successfully", data: { user } }); }
  catch (error) { next(error); }
}
export async function updateUserController(req: Request, res: Response, next: NextFunction) {
  try { if (!req.user) throw new AppError("Authentication is required", 401);
    const { id } = userIdSchema.parse(req.params); const user = await updateUser(id,
      updateUserSchema.parse(req.body), req.user.id); res.json({ success: true,
      message: "Staff account updated successfully", data: { user } }); }
  catch (error) { next(error); }
}
export async function resetPasswordController(req: Request, res: Response, next: NextFunction) {
  try { const { id } = userIdSchema.parse(req.params); const { password } = resetPasswordSchema.parse(req.body);
    await resetUserPassword(id, password); res.json({ success: true,
      message: "Staff password reset successfully", data: null }); } catch (error) { next(error); }
}
