import { SignJWT, jwtVerify } from "jose";
import type { Role } from "@/lib/enums";

export const SESSION_COOKIE = "saferide_session";

export type SessionUser = {
  id: string;
  role: Role;
  fullName: string;
  email: string;
};

function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("AUTH_SECRET is not configured (min 16 chars).");
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(user: SessionUser): Promise<string> {
  const ttl = Number(process.env.AUTH_SESSION_TTL ?? 604800);
  return new SignJWT({ role: user.role, fullName: user.fullName, email: user.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${ttl}s`)
    .sign(secretKey());
}

export async function verifySessionToken(token: string | undefined | null): Promise<SessionUser | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (!payload.sub || typeof payload.role !== "string") return null;
    return {
      id: payload.sub,
      role: payload.role as Role,
      fullName: (payload.fullName as string) ?? "",
      email: (payload.email as string) ?? "",
    };
  } catch {
    return null;
  }
}
