import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { resolve } from "node:path";
import helmet from "helmet";
import { pinoHttp } from "pino-http";

import { env } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFoundHandler } from "./middleware/notFound.js";
import { authRouter } from "./routes/auth.routes.js";
import { customerRouter } from "./routes/customer.routes.js";
import { dashboardRouter } from "./routes/dashboard.routes.js";
import { deviceRouter } from "./routes/device.routes.js";
import { healthRouter } from "./routes/health.routes.js";
import { publicRouter } from "./routes/public.routes.js";
import { repairRouter } from "./routes/repair.routes.js";
import { userRouter } from "./routes/user.routes.js";
import { notificationRouter } from "./routes/notification.routes.js";
import { businessRouter } from "./routes/business.routes.js";
import { attachmentRouter } from "./routes/attachment.routes.js";
import { passwordResetRouter } from "./routes/passwordReset.routes.js";

const app = express();

app.disable("x-powered-by");
if (env.NODE_ENV === "production") app.set("trust proxy", 1);

app.use(
  helmet({
    strictTransportSecurity:
      env.NODE_ENV === "production"
        ? { maxAge: 31536000, includeSubDomains: true, preload: true }
        : false,
  }),
);

app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  }),
);

app.use(express.json({ limit: "1mb" }));
app.use(
  express.urlencoded({
    extended: true,
    limit: "1mb",
  }),
);

app.use(cookieParser());
app.use(
  pinoHttp({
    redact: {
      paths: [
        "req.headers.authorization",
        "req.headers.cookie",
        "req.body.password",
        "req.body.currentPassword",
        "req.body.newPassword",
        "req.body.code",
        "res.headers.set-cookie",
      ],
      censor: "[REDACTED]",
    },
  }),
);
app.use(
  "/uploads",
  express.static(resolve(process.cwd(), "uploads"), {
    setHeaders: (response) =>
      response.setHeader("Cross-Origin-Resource-Policy", "cross-origin"),
  }),
);

app.get("/", (_request, response) => {
  response.status(200).json({
    success: true,
    message: "RepairTrack API is running",
    data: {
      health: "/api/v1/health",
      databaseHealth: "/api/v1/health/database",
    },
  });
});

app.use("/api/v1", healthRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/auth", passwordResetRouter);
app.use("/api/v1/customers", customerRouter);
app.use("/api/v1/dashboard", dashboardRouter);
app.use("/api/v1/devices", deviceRouter);
app.use("/api/v1/repairs", repairRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/notifications", notificationRouter);
app.use("/api/v1/public", publicRouter);
app.use("/api/v1", businessRouter);
app.use("/api/v1", attachmentRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
