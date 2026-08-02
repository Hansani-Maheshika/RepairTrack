import type { NextFunction, Request, Response } from "express";
import {
  assignRepair, createRepair, getRepair, listRepairs, trackRepair,
  updateInspection, updateRepair, updateRepairStatus,
} from "../services/repair.service.js";
import { AppError } from "../utils/AppError.js";
import {
  assignRepairSchema, createRepairSchema, inspectionSchema, publicTrackingSchema,
  repairQuerySchema, updateRepairSchema, updateStatusSchema, uuidParamsSchema,
} from "../validators/repair.validator.js";

function actor(req: Request) {
  if (!req.user) throw new AppError("Authentication is required", 401);
  return { id: req.user.id, role: req.user.role };
}
export async function updateRepairController(req: Request, res: Response, next: NextFunction) {
  try { const { id } = uuidParamsSchema.parse(req.params);
    const repair = await updateRepair(id, updateRepairSchema.parse(req.body));
    res.json({ success: true, message: "Repair updated successfully", data: { repair } }); }
  catch (error) { next(error); }
}
export async function listRepairsController(req: Request, res: Response, next: NextFunction) {
  try { res.json({ success: true, message: "Repairs retrieved successfully",
    data: await listRepairs(repairQuerySchema.parse(req.query), actor(req)) }); }
  catch (error) { next(error); }
}
export async function getRepairController(req: Request, res: Response, next: NextFunction) {
  try { const { id } = uuidParamsSchema.parse(req.params);
    res.json({ success: true, message: "Repair retrieved successfully",
      data: { repair: await getRepair(id, actor(req)) } }); }
  catch (error) { next(error); }
}
export async function createRepairController(req: Request, res: Response, next: NextFunction) {
  try { const repair = await createRepair(createRepairSchema.parse(req.body), actor(req));
    res.status(201).json({ success: true, message: "Repair created successfully",
      data: { repair } }); }
  catch (error) { next(error); }
}
export async function assignRepairController(req: Request, res: Response, next: NextFunction) {
  try { const { id } = uuidParamsSchema.parse(req.params);
    res.json({ success: true, message: "Technician assignment updated successfully",
      data: { repair: await assignRepair(id, assignRepairSchema.parse(req.body), actor(req).id) } }); }
  catch (error) { next(error); }
}
export async function inspectionController(req: Request, res: Response, next: NextFunction) {
  try { const { id } = uuidParamsSchema.parse(req.params);
    res.json({ success: true, message: "Inspection updated successfully",
      data: { repair: await updateInspection(id, inspectionSchema.parse(req.body), actor(req)) } }); }
  catch (error) { next(error); }
}
export async function statusController(req: Request, res: Response, next: NextFunction) {
  try { const { id } = uuidParamsSchema.parse(req.params);
    res.json({ success: true, message: "Repair status updated successfully",
      data: { repair: await updateRepairStatus(id, updateStatusSchema.parse(req.body), actor(req)) } }); }
  catch (error) { next(error); }
}
export async function trackRepairController(req: Request, res: Response, next: NextFunction) {
  try { res.json({ success: true, message: "Repair tracking retrieved successfully",
    data: { repair: await trackRepair(publicTrackingSchema.parse(req.body)) } }); }
  catch (error) { next(error); }
}
