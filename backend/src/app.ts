import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
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

const app = express();

app.disable("x-powered-by");

app.use(helmet());

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
app.use(pinoHttp());

app.use("/api/v1", healthRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/customers", customerRouter);
app.use("/api/v1/dashboard", dashboardRouter);
app.use("/api/v1/devices", deviceRouter);
app.use("/api/v1/repairs", repairRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/public", publicRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
