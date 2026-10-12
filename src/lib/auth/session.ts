import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { SESSION_COOKIE, signSession, verifySessionToken, type SessionUser } from "./jwt";

const ttl = () => Number(process.env.AUTH_SESSION_TTL ?? 604800);

export async function createSession(user: SessionUser) {
  const token = await signSession(user);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ttl(),
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

/**
 * Reads and verifies the session. Cached per-request so it can be called from
 * many components without re-verifying the JWT.
 */
export const getSession = cache(async (): Promise<SessionUser | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  return verifySessionToken(token);
});
