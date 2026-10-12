import type { Role } from "./enums";

/** Granular permission keys. `*` grants everything (super admin). */
export const PERMISSIONS = {
  "children:manage": "children:manage",
  "subscription:manage": "subscription:manage",
  "tracking:view": "tracking:view",
  "support:create": "support:create",
  "trips:execute": "trips:execute",
  "students:board": "students:board",
  "incidents:report": "incidents:report",
  "gps:send": "gps:send",
  "school:manage": "school:manage",
  "students:view": "students:view",
  "routes:view": "routes:view",
  "reports:export": "reports:export",
  "tickets:manage": "tickets:manage",
  "parents:view": "parents:view",
  "refunds:review": "refunds:review",
  "fleet:manage": "fleet:manage",
  "billing:manage": "billing:manage",
  "users:manage": "users:manage",
  "system:manage": "system:manage",
} as const;

export type Permission = keyof typeof PERMISSIONS;

const ROLE_PERMISSIONS: Record<Role, Permission[] | "*"> = {
  PARENT: ["children:manage", "subscription:manage", "tracking:view", "support:create"],
  DRIVER: ["trips:execute", "students:board", "incidents:report", "gps:send"],
  SCHOOL_ADMIN: ["school:manage", "students:view", "routes:view", "reports:export", "support:create"],
  SUPPORT: ["tickets:manage", "parents:view", "refunds:review", "support:create"],
  SUPER_ADMIN: "*",
};

export function can(role: Role | undefined | null, permission: Permission): boolean {
  if (!role) return false;
  const granted = ROLE_PERMISSIONS[role];
  if (granted === "*") return true;
  return granted.includes(permission);
}

export function permissionsFor(role: Role): Permission[] {
  const granted = ROLE_PERMISSIONS[role];
  return granted === "*" ? (Object.keys(PERMISSIONS) as Permission[]) : granted;
}
