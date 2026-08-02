import { Resend } from "resend";
import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";

export async function notifyUser(
  userId: string,
  title: string,
  message: string,
  repairJobId?: string,
) {
  return prisma.notification.create({
    data: {
      userId,
      title,
      message,
      repairJobId,
      channel: "IN_APP",
      deliveryStatus: "SENT",
    },
  });
}

export async function notifyRole(
  role: "ADMIN" | "RECEPTIONIST" | "TECHNICIAN",
  title: string,
  message: string,
  repairJobId?: string,
) {
  const users = await prisma.user.findMany({
    where: { role, isActive: true },
    select: { id: true },
  });
  if (!users.length) return;
  await prisma.notification.createMany({
    data: users.map(({ id }) => ({
      userId: id,
      title,
      message,
      repairJobId,
      channel: "IN_APP" as const,
      deliveryStatus: "SENT" as const,
    })),
  });
}

export async function sendCustomerMessage(input: {
  email?: string | null;
  phone?: string | null;
  title: string;
  message: string;
  repairJobId?: string;
}) {
  const results: {
    channel: "EMAIL" | "SMS";
    status: "SENT" | "FAILED" | "SKIPPED";
    reference?: string;
    error?: string;
  }[] = [];
  if (input.email && env.RESEND_API_KEY) {
    try {
      const response = await new Resend(env.RESEND_API_KEY).emails.send({
        from: env.EMAIL_FROM,
        to: input.email,
        subject: input.title,
        text: input.message,
      });
      results.push({
        channel: "EMAIL",
        status: "SENT",
        reference: response.data?.id,
      });
    } catch (e) {
      results.push({
        channel: "EMAIL",
        status: "FAILED",
        error: e instanceof Error ? e.message : "Email failed",
      });
    }
  } else results.push({ channel: "EMAIL", status: "SKIPPED" });
  if (input.phone && env.NOTIFY_USER_ID && env.NOTIFY_API_KEY) {
    try {
      const phone = input.phone.replace(/^0/, "94").replace(/\D/g, "");
      const body = new URLSearchParams({
        user_id: env.NOTIFY_USER_ID,
        api_key: env.NOTIFY_API_KEY,
        sender_id: env.NOTIFY_SENDER_ID,
        to: phone,
        message: input.message,
      });
      const response = await fetch("https://app.notify.lk/api/v1/send", {
        method: "POST",
        body,
      });
      if (!response.ok)
        throw new Error(`SMS provider returned ${response.status}`);
      results.push({ channel: "SMS", status: "SENT" });
    } catch (e) {
      results.push({
        channel: "SMS",
        status: "FAILED",
        error: e instanceof Error ? e.message : "SMS failed",
      });
    }
  } else results.push({ channel: "SMS", status: "SKIPPED" });
  await prisma.notification.createMany({
    data: results.map((r) => ({
      repairJobId: input.repairJobId,
      title: input.title,
      message: input.message,
      channel: r.channel,
      deliveryStatus: r.status,
      providerReference: r.reference,
      failureReason: r.error,
    })),
  });
  return results;
}

export function audit(
  actorId: string | undefined,
  action: string,
  entityType: string,
  entityId: string,
  details?: object,
) {
  return prisma.auditLog.create({
    data: { actorId, action, entityType, entityId, details },
  });
}
