import { env } from "../config/env.js";

export async function reportServerError(input: {
  requestId?: string;
  method: string;
  path: string;
  error: unknown;
}) {
  if (!env.ERROR_WEBHOOK_URL) return;
  const error = input.error instanceof Error ? input.error : new Error(String(input.error));
  try {
    await fetch(env.ERROR_WEBHOOK_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        application: "RepairTrack API",
        environment: env.NODE_ENV,
        requestId: input.requestId,
        method: input.method,
        path: input.path,
        error: error.message,
        stack: error.stack,
        occurredAt: new Date().toISOString(),
      }),
      signal: AbortSignal.timeout(3000),
    });
  } catch {
    // Request logging remains the fallback when the monitoring provider is down.
  }
}
