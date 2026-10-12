import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { ROLE_HOME, type Role } from "@/lib/enums";

/** Full current user record (cached per request). Null if not signed in. */
export const getCurrentUser = cache(async () => {
  const session = await getSession();
  if (!session) return null;
  const user = await prisma.user.findUnique({ where: { id: session.id } });
  if (!user || !user.isActive) return null;
  return user;
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(roles: Role | Role[]) {
  const user = await requireUser();
  const list = Array.isArray(roles) ? roles : [roles];
  if (!list.includes(user.role as Role)) {
    redirect(ROLE_HOME[user.role as Role] ?? "/login");
  }
  return user;
}

/** Throwing variant for use inside server actions (not redirects). */
export async function requireUserOrThrow() {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

export async function requireRoleOrThrow(roles: Role | Role[]) {
  const user = await requireUserOrThrow();
  const list = Array.isArray(roles) ? roles : [roles];
  if (!list.includes(user.role as Role)) throw new Error("FORBIDDEN");
  return user;
}
