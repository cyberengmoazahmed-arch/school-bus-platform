import "server-only";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "./password";
import { generateOtp } from "@/lib/utils";

const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

/**
 * Creates a one-time code. Returns the PLAIN code so the caller can deliver it
 * through a channel. In this build no SMS provider is configured, so callers
 * surface the code to the developer console / dev UI instead.
 */
export async function createOtp(input: { userId?: string; phone: string; purpose?: string }) {
  const code = generateOtp(6);
  const codeHash = await hashPassword(code);
  await prisma.otpToken.create({
    data: {
      userId: input.userId ?? null,
      phone: input.phone,
      codeHash,
      purpose: input.purpose ?? "PHONE_VERIFICATION",
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    },
  });
  return code;
}

export async function verifyOtp(input: { phone: string; code: string; purpose?: string }) {
  const purpose = input.purpose ?? "PHONE_VERIFICATION";
  const token = await prisma.otpToken.findFirst({
    where: { phone: input.phone, purpose, consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!token) return { ok: false, reason: "EXPIRED" as const };
  if (token.attempts >= MAX_ATTEMPTS) return { ok: false, reason: "LOCKED" as const };

  const valid = await verifyPassword(input.code, token.codeHash);
  if (!valid) {
    await prisma.otpToken.update({ where: { id: token.id }, data: { attempts: { increment: 1 } } });
    return { ok: false, reason: "INVALID" as const };
  }

  await prisma.otpToken.update({ where: { id: token.id }, data: { consumedAt: new Date() } });
  return { ok: true as const };
}
