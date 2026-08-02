import "dotenv/config";
import { z } from "zod";

const environmentSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  PORT: z.coerce.number().int().positive().default(5000),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  JWT_ACCESS_SECRET: z
    .string()
    .min(32, "JWT_ACCESS_SECRET must contain at least 32 characters"),

  JWT_REFRESH_SECRET: z
    .string()
    .min(32, "JWT_REFRESH_SECRET must contain at least 32 characters"),

  ACCESS_TOKEN_EXPIRES_IN: z.string().default("15m"),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default("7d"),

  CLIENT_URL: z.string().url().default("http://localhost:5174"),
  PUBLIC_API_URL: z.string().url().default("http://localhost:5001/api/v1"),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("RepairTrack <onboarding@resend.dev>"),
  NOTIFY_USER_ID: z.string().optional(),
  NOTIFY_API_KEY: z.string().optional(),
  NOTIFY_SENDER_ID: z.string().default("NotifyDEMO"),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  COOKIE_SAME_SITE: z.enum(["lax", "strict", "none"]).default("lax"),
  COOKIE_DOMAIN: z.string().optional(),
  ERROR_WEBHOOK_URL: z.string().url().optional(),
}).superRefine((value, context) => {
  if (value.NODE_ENV !== "production") return;
  const required = [
    ["CLOUDINARY_CLOUD_NAME", value.CLOUDINARY_CLOUD_NAME],
    ["CLOUDINARY_API_KEY", value.CLOUDINARY_API_KEY],
    ["CLOUDINARY_API_SECRET", value.CLOUDINARY_API_SECRET],
  ] as const;
  for (const [path, setting] of required) {
    if (!setting) context.addIssue({
      code: "custom",
      path: [path],
      message: `${path} is required in production`,
    });
  }
  for (const path of ["CLIENT_URL", "PUBLIC_API_URL"] as const) {
    if (!value[path].startsWith("https://")) context.addIssue({
      code: "custom",
      path: [path],
      message: `${path} must use HTTPS in production`,
    });
  }
  if (value.JWT_ACCESS_SECRET === value.JWT_REFRESH_SECRET) context.addIssue({
    code: "custom",
    path: ["JWT_REFRESH_SECRET"],
    message: "Access and refresh secrets must be different",
  });
  if (
    value.RESEND_API_KEY &&
    value.EMAIL_FROM.includes("onboarding@resend.dev")
  ) context.addIssue({
    code: "custom",
    path: ["EMAIL_FROM"],
    message: "EMAIL_FROM must use a verified production sender",
  });
});

const parsedEnvironment = environmentSchema.safeParse(process.env);

if (!parsedEnvironment.success) {
  console.error(
    "Invalid environment variables:",
    parsedEnvironment.error.flatten().fieldErrors,
  );

  process.exit(1);
}

export const env = parsedEnvironment.data;
