import app from "./app.js";
import { env } from "./config/env.js";

const server = app.listen(env.PORT, () => {
  console.log(
    `RepairTrack API is running at http://localhost:${env.PORT}`,
  );
});

function shutdown(signal: string): void {
  console.log(`${signal} received. Closing server...`);

  server.close(() => {
    console.log("Server closed successfully.");
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));