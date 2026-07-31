import type { NextFunction, Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";

export async function requireRepairAccess(
  request: Request, _response: Response, next: NextFunction,
): Promise<void> {
  try {
    if (!request.user) throw new AppError("Authentication is required", 401);
    if (request.user.role !== "TECHNICIAN") return next();
    const repairId = request.params.id;
    if (typeof repairId !== "string") throw new AppError("Repair ID is required", 400);
    const repair = await prisma.repairJob.findUnique({
      where: { id: repairId }, select: { assignedTechnicianId: true },
    });
    if (!repair) throw new AppError("Repair job was not found", 404);
    if (repair.assignedTechnicianId !== request.user.id) {
      throw new AppError("You can only access repairs assigned to you", 403);
    }
    next();
  } catch (error) { next(error); }
}
