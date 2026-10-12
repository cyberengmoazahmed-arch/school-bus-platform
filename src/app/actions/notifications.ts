"use server";

import { revalidatePath } from "next/cache";
import { requireUserOrThrow } from "@/data/auth";
import { prisma } from "@/lib/db";

export async function markAllReadAction() {
  const user = await requireUserOrThrow();
  await prisma.notification.updateMany({ where: { userId: user.id, readAt: null }, data: { readAt: new Date() } });
  revalidatePath("/notifications");
}

export async function markReadAction(id: string) {
  const user = await requireUserOrThrow();
  await prisma.notification.update({ where: { id }, data: { readAt: new Date() } }).catch(() => null);
  revalidatePath("/notifications");
}

const PREF_BOOL = [
  "emailEnabled",
  "smsEnabled",
  "pushEnabled",
  "whatsappEnabled",
  "before10",
  "before5",
  "arrivalAlert",
  "boardedAlert",
  "schoolArrival",
  "droppedHome",
  "delayAlerts",
] as const;

export async function updatePrefsAction(formData: FormData) {
  const user = await requireUserOrThrow();
  const data: Record<string, boolean> = {};
  for (const key of PREF_BOOL) data[key] = formData.get(key) === "on";
  await prisma.notificationPreference.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...data },
    update: data,
  });
  revalidatePath("/notifications");
}