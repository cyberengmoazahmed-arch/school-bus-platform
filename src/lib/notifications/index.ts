import "server-only";
import { prisma } from "@/lib/db";
import type { NotificationSeverity } from "@/lib/enums";
import { sendEmail, sendPush, sendSms, sendWhatsApp } from "./providers";

export type NotifyInput = {
  userId: string;
  type: string;
  title: string;
  body: string;
  severity?: NotificationSeverity;
  data?: Record<string, unknown>;
  /** When set, identical alerts for the same user within the window are suppressed. */
  dedupeKey?: string;
  dedupeWindowMs?: number;
};

type PreferenceFlag =
  | "before10"
  | "before5"
  | "arrivalAlert"
  | "boardedAlert"
  | "schoolArrival"
  | "droppedHome"
  | "delayAlerts";

/** Which notification "types" map to a user preference toggle. */
const PREFERENCE_GATE: Record<string, PreferenceFlag> = {
  BUS_APPROACHING_10: "before10",
  BUS_APPROACHING_5: "before5",
  BUS_ARRIVED: "arrivalAlert",
  STUDENT_BOARDED: "boardedAlert",
  SCHOOL_ARRIVAL: "schoolArrival",
  DROPPED_HOME: "droppedHome",
  DELAY: "delayAlerts",
  ROUTE_DEVIATION: "delayAlerts",
};

export async function dispatchNotification(input: NotifyInput) {
  const windowMs = input.dedupeWindowMs ?? 5 * 60 * 1000;

  if (input.dedupeKey) {
    const existing = await prisma.notification.findFirst({
      where: {
        userId: input.userId,
        type: input.type,
        data: { contains: `"dedupe":"${input.dedupeKey}"` },
        createdAt: { gte: new Date(Date.now() - windowMs) },
      },
      select: { id: true },
    });
    if (existing) return { notificationId: existing.id, deduped: true };
  }

  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { phone: true, email: true, notificationPref: true },
  });
  if (!user) return { notificationId: null, deduped: false };

  const data = { ...(input.data ?? {}), ...(input.dedupeKey ? { dedupe: input.dedupeKey } : {}) };

  const notification = await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      severity: input.severity ?? "INFO",
      data: JSON.stringify(data),
    },
  });

  // --- Determine channels --------------------------------------------------
  const pref = user.notificationPref;
  const gate = PREFERENCE_GATE[input.type];
  const allowedByPref = gate && pref ? Boolean(pref[gate as keyof typeof pref]) : true;

  const channels: string[] = ["IN_APP"];
  if (allowedByPref && pref) {
    if (pref.pushEnabled) channels.push("PUSH");
    if (pref.emailEnabled) channels.push("EMAIL");
    if (pref.smsEnabled) channels.push("SMS");
    if (pref.whatsappEnabled) channels.push("WHATSAPP");
  }

  for (const channel of channels) {
    if (channel === "IN_APP") {
      await prisma.notificationDeliveryLog.create({
        data: { notificationId: notification.id, channel, status: "SENT", sentAt: new Date() },
      });
      continue;
    }

    let result;
    if (channel === "PUSH") result = await sendPush(user.phone, input.title, input.body);
    else if (channel === "EMAIL") result = await sendEmail(user.email, input.title, input.body);
    else if (channel === "SMS") result = await sendSms(user.phone, `${input.title}: ${input.body}`);
    else result = await sendWhatsApp(user.phone, `${input.title}\n${input.body}`);

    await prisma.notificationDeliveryLog.create({
      data: {
        notificationId: notification.id,
        channel,
        status: result.status,
        providerRef: result.providerRef ?? null,
        error: result.error ?? null,
        sentAt: result.status === "SENT" ? new Date() : null,
      },
    });
  }

  return { notificationId: notification.id, deduped: false };
}

/** Notify every authorized guardian of a student. */
export async function notifyStudentGuardians(studentId: string, input: Omit<NotifyInput, "userId">) {
  const guardians = await prisma.guardianRelationship.findMany({
    where: { studentId },
    select: { userId: true },
  });
  const results = await Promise.all(
    guardians.map((g) => dispatchNotification({ ...input, userId: g.userId })),
  );
  return { guardians: guardians.length, results };
}
