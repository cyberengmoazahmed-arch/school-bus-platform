"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { createOtp, verifyOtp } from "@/lib/auth/otp";
import { rateLimit } from "@/lib/rate-limit";
import { ROLE_HOME } from "@/lib/enums";
import { dispatchNotification } from "@/lib/notifications";

export type AuthActionState = { error?: string; fieldErrors?: Record<string, string> };

function normalizePhone(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (!digits.startsWith("20")) {
    if (digits.startsWith("0")) digits = `2${digits}`;
    else digits = `20${digits}`;
  }
  return `+${digits}`;
}

function devOtpDisplay(): boolean {
  if (process.env.NODE_ENV === "production") return process.env.AUTH_DEV_OTP === "true";
  return process.env.AUTH_DEV_OTP !== "false";
}

const registerSchema = z.object({
  fullName: z.string().trim().min(2, "common.required"),
  email: z.string().trim().email("auth.invalidEmail"),
  phone: z.string().trim().min(8, "auth.invalidPhone"),
  password: z.string().min(8, "auth.weakPassword"),
});

export async function registerAction(_prev: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[issue.path[0] as string] = issue.message;
    return { fieldErrors };
  }

  const { fullName, email } = parsed.data;
  const phone = normalizePhone(parsed.data.phone);

  const existing = await prisma.user.findFirst({ where: { OR: [{ email }, { phone }] } });
  if (existing) return { error: "auth.emailOrPhoneTaken" };

  const hash = await hashPassword(parsed.data.password);
  const user = await prisma.user.create({
    data: {
      email,
      phone,
      passwordHash: hash,
      fullName,
      role: "PARENT",
      locale: "en",
      parentProfile: { create: {} },
    },
  });

  const code = await createOtp({ userId: user.id, phone, purpose: "PHONE_VERIFICATION" });
  console.log(`[SafeRide][DEV] OTP for ${phone}: ${code}`);

  const qs = new URLSearchParams({ phone });
  if (devOtpDisplay()) qs.set("code", code);
  redirect(`/verify-phone?${qs.toString()}`);
}

const loginSchema = z.object({
  identifier: z.string().trim().min(3),
  password: z.string().min(1, "common.required"),
});

export async function loginAction(_prev: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const h = await headers();
  const ip = h.get("x-forwarded-for") ?? "local";
  const limit = rateLimit(`login:${ip}`, 10, 15 * 60 * 1000);
  if (!limit.ok) return { error: "auth.tooManyAttempts" };

  const parsed = loginSchema.safeParse({
    identifier: formData.get("identifier"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "auth.invalidCredentials" };

  const { identifier, password } = parsed.data;
  const idField = identifier.includes("@") ? "email" : "phone";
  const value = idField === "phone" ? normalizePhone(identifier) : identifier.toLowerCase();

  const user = await prisma.user.findUnique({ where: { [idField]: value } as never });
  if (!user) return { error: "auth.invalidCredentials" };

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return { error: "auth.invalidCredentials" };

  if (!user.isActive) return { error: "auth.accountDisabled" };

  if (!user.phoneVerified) {
    const code = await createOtp({ userId: user.id, phone: user.phone, purpose: "PHONE_VERIFICATION" });
    console.log(`[SafeRide][DEV] OTP for ${user.phone}: ${code}`);
    const qs = new URLSearchParams({ phone: user.phone });
    if (devOtpDisplay()) qs.set("code", code);
    redirect(`/verify-phone?${qs.toString()}`);
  }

  await createSession({ id: user.id, role: user.role as never, fullName: user.fullName, email: user.email });
  redirect(ROLE_HOME[user.role as never]);
}

export async function verifyOtpAction(_prev: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const phone = normalizePhone((formData.get("phone") as string) ?? "");
  const code = (formData.get("code") as string) ?? "";

  if (!phone || !code) return { error: "common.required" };

  const result = await verifyOtp({ phone, code, purpose: "PHONE_VERIFICATION" });
  if (!result.ok) {
    if (result.reason === "LOCKED") return { error: "auth.otpLocked" };
    return { error: "auth.invalidOtp" };
  }

  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) return { error: "auth.invalidCred" };

  await prisma.user.update({ where: { id: user.id }, data: { phoneVerified: true } });
  await createSession({ id: user.id, role: user.role as never, fullName: user.fullName, email: user.email });
  await dispatchNotification({
    userId: user.id,
    type: "ACCOUNT_VERIFIED",
    title: "Phone verified",
    body: "Your phone number has been verified. Welcome to SafeRide!",
    severity: "SUCCESS",
  });
  redirect(ROLE_HOME[user.role as never]);
}

export async function resendOtpAction(formData: FormData): Promise<never> {
  const phone = normalizePhone((formData.get("phone") as string) ?? "");
  const user = await prisma.user.findUnique({ where: { phone } });
  const code = await createOtp({ userId: user?.id, phone, purpose: "PHONE_VERIFICATION" });
  console.log(`[SafeRide][DEV] OTP for ${phone}: ${code}`);
  const qs = new URLSearchParams({ phone });
  if (devOtpDisplay()) qs.set("code", code);
  redirect(`/verify-phone?${qs.toString()}`);
}