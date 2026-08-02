import { Readable } from "node:stream";
import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { basename, resolve } from "node:path";
import { Router } from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorizeRoles } from "../middleware/authorizeRoles.js";
import { AppError } from "../utils/AppError.js";
import { audit } from "../services/notification.service.js";
import type { UserRole } from "../utils/jwt.js";

export const attachmentRouter = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  // Keep multipart requests below Vercel's serverless request-body limit.
  limits: { fileSize: 4 * 1024 * 1024 },
  fileFilter: (_req, file, cb) =>
    cb(
      null,
      ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype),
    ),
});

function hasValidSignature(file: Express.Multer.File): boolean {
  const bytes = file.buffer;
  if (file.mimetype === "image/jpeg")
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (file.mimetype === "image/png")
    return bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (file.mimetype === "image/webp")
    return bytes.subarray(0, 4).toString("ascii") === "RIFF" &&
      bytes.subarray(8, 12).toString("ascii") === "WEBP";
  return false;
}

async function accessibleRepair(
  repairId: string,
  user: { id: string; role: UserRole },
) {
  const repair = await prisma.repairJob.findUnique({ where: { id: repairId } });
  if (!repair) throw new AppError("Repair not found", 404);
  if (user.role === "TECHNICIAN" && repair.assignedTechnicianId !== user.id)
    throw new AppError("You can only access attachments for your assigned repairs", 403);
  return repair;
}
attachmentRouter.use(authenticate);
attachmentRouter.get("/repairs/:id/attachments", async (req, res, next) => {
  try {
    if (!req.user) throw new AppError("Authentication required", 401);
    await accessibleRepair(String(req.params.id), req.user);
    const attachments = await prisma.repairAttachment.findMany({
      where: { repairJobId: req.params.id },
      orderBy: { createdAt: "desc" },
    });
    res.json({
      success: true,
      message: "Attachments retrieved",
      data: { attachments },
    });
  } catch (e) {
    next(e);
  }
});
attachmentRouter.post(
  "/repairs/:id/attachments",
  authorizeRoles("TECHNICIAN"),
  upload.single("file"),
  async (req, res, next) => {
    try {
      if (!req.user) throw new AppError("Authentication required", 401);
      if (!req.file)
        throw new AppError("A JPEG, PNG or WebP image is required", 400);
      if (!hasValidSignature(req.file))
        throw new AppError("The uploaded file content is not a valid image", 400);
      const repair = await accessibleRepair(String(req.params.id), req.user);
      let fileUrl: string;
      let storageKey: string;
      if (
        env.CLOUDINARY_CLOUD_NAME &&
        env.CLOUDINARY_API_KEY &&
        env.CLOUDINARY_API_SECRET
      ) {
        cloudinary.config({
          cloud_name: env.CLOUDINARY_CLOUD_NAME,
          api_key: env.CLOUDINARY_API_KEY,
          api_secret: env.CLOUDINARY_API_SECRET,
        });
        const result = await new Promise<{
          secure_url: string;
          public_id: string;
        }>((resolveUpload, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: `repairtrack/${repair.repairNumber}`,
              resource_type: "image",
              allowed_formats: ["jpg", "jpeg", "png", "webp"],
              type: "upload",
              transformation: [
                {
                  width: 4096,
                  height: 4096,
                  crop: "limit",
                  quality: "auto",
                  flags: "strip_profile",
                },
              ],
            },
            (error, value) =>
              error || !value
                ? reject(error ?? new Error("Upload failed"))
                : resolveUpload(value),
          );
          Readable.from(req.file!.buffer).pipe(stream);
        });
        fileUrl = result.secure_url;
        storageKey = result.public_id;
      } else {
        const extension: Record<string, string> = {
          "image/jpeg": "jpg",
          "image/png": "png",
          "image/webp": "webp",
        };
        const fileName = `${randomUUID()}.${extension[req.file.mimetype]}`;
        const uploadDirectory = resolve(process.cwd(), "uploads");
        await mkdir(uploadDirectory, { recursive: true });
        await writeFile(resolve(uploadDirectory, fileName), req.file.buffer);
        fileUrl = `${env.PUBLIC_API_URL.replace(/\/api\/v1$/, "")}/uploads/${fileName}`;
        storageKey = `local:${fileName}`;
      }
      const attachment = await prisma.repairAttachment.create({
        data: {
          repairJobId: repair.id,
          uploadedById: req.user.id,
          fileName: basename(req.file.originalname)
            .replace(/[\u0000-\u001f\u007f]/g, "")
            .slice(0, 180),
          mimeType: req.file.mimetype,
          size: req.file.size,
          url: fileUrl,
          storageKey,
        },
      });
      await audit(req.user.id, "ATTACHMENT_UPLOADED", "RepairJob", repair.id, {
        attachmentId: attachment.id,
      });
      res.status(201).json({
        success: true,
        message: "File uploaded",
        data: { attachment },
      });
    } catch (e) {
      next(e);
    }
  },
);
