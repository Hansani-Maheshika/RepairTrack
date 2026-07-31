import type { NextFunction, Request, Response } from "express";
import { createDevice, getDevice, listDevices, updateDevice } from "../services/device.service.js";
import {
  createDeviceSchema, deviceQuerySchema, updateDeviceSchema, uuidParamsSchema,
} from "../validators/repair.validator.js";

export async function listDevicesController(req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ success: true, message: "Devices retrieved successfully",
      data: await listDevices(deviceQuerySchema.parse(req.query)) });
  } catch (error) { next(error); }
}
export async function updateDeviceController(req: Request, res: Response, next: NextFunction) {
  try { const { id } = uuidParamsSchema.parse(req.params);
    const device = await updateDevice(id, updateDeviceSchema.parse(req.body));
    res.json({ success: true, message: "Device updated successfully", data: { device } }); }
  catch (error) { next(error); }
}
export async function getDeviceController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = uuidParamsSchema.parse(req.params);
    res.json({ success: true, message: "Device retrieved successfully",
      data: { device: await getDevice(id) } });
  } catch (error) { next(error); }
}
export async function createDeviceController(req: Request, res: Response, next: NextFunction) {
  try {
    const device = await createDevice(createDeviceSchema.parse(req.body));
    res.status(201).json({ success: true, message: "Device registered successfully",
      data: { device } });
  } catch (error) { next(error); }
}
