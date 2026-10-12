/**
 * Canonical enum values used across the app. The database stores these as
 * strings (portable across SQLite/PostgreSQL); this module is the single source
 * of truth for validation and display.
 */

export const ROLES = ["PARENT", "DRIVER", "SCHOOL_ADMIN", "SUPER_ADMIN", "SUPPORT"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABEL: Record<Role, string> = {
  PARENT: "Parent / Guardian",
  DRIVER: "Driver",
  SCHOOL_ADMIN: "School Admin",
  SUPER_ADMIN: "Super Admin",
  SUPPORT: "Support",
};

/** Where each role lands after login. */
export const ROLE_HOME: Record<Role, string> = {
  PARENT: "/parent",
  DRIVER: "/driver",
  SCHOOL_ADMIN: "/school",
  SUPER_ADMIN: "/admin",
  SUPPORT: "/support",
};

export const SUBSCRIPTION_STATUS = {
  PENDING: "PENDING",
  ACTIVE: "ACTIVE",
  PAUSED: "PAUSED",
  EXPIRED: "EXPIRED",
  CANCELLED: "CANCELLED",
  OVERDUE: "OVERDUE",
} as const;
export type SubscriptionStatus = keyof typeof SUBSCRIPTION_STATUS;

export const PLAN_TYPE = { MONTHLY: "MONTHLY", TERM: "TERM", ANNUAL: "ANNUAL" } as const;
export type PlanType = keyof typeof PLAN_TYPE;
export const SERVICE_TYPE = { ONE_WAY: "ONE_WAY", ROUND_TRIP: "ROUND_TRIP" } as const;
export type ServiceType = keyof typeof SERVICE_TYPE;

export const PAYMENT_STATUS = {
  PENDING: "PENDING",
  SUCCEEDED: "SUCCEEDED",
  FAILED: "FAILED",
  REFUNDED: "REFUNDED",
} as const;
export type PaymentStatus = keyof typeof PAYMENT_STATUS;

export const PAYMENT_METHOD = {
  CARD: "CARD",
  CASH: "CASH",
  WALLET: "WALLET",
  BANK_TRANSFER: "BANK_TRANSFER",
} as const;

export const TRIP_STATUS = {
  SCHEDULED: "SCHEDULED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  ABORTED: "ABORTED",
} as const;
export type TripStatus = keyof typeof TRIP_STATUS;

export const TRIP_DIRECTION = { MORNING: "MORNING", AFTERNOON: "AFTERNOON" } as const;

export const STUDENT_TRIP_STATUS = {
  EXPECTED: "EXPECTED",
  ONBOARD: "ONBOARD",
  DROPPED: "DROPPED",
  ABSENT: "ABSENT",
  MISSED: "MISSED",
  UNACCOUNTED: "UNACCOUNTED",
} as const;
export type StudentTripStatus = keyof typeof STUDENT_TRIP_STATUS;

export const DRIVER_STATUS = {
  PENDING: "PENDING",
  VERIFIED: "VERIFIED",
  SUSPENDED: "SUSPENDED",
  REJECTED: "REJECTED",
} as const;

export const INCIDENT_TYPE = {
  BREAKDOWN: "BREAKDOWN",
  DELAY: "DELAY",
  ACCIDENT: "ACCIDENT",
  ABSENT: "ABSENT",
  MISSING_CHILD: "MISSING_CHILD",
  ROUTE_DEVIATION: "ROUTE_DEVIATION",
  SOS: "SOS",
  OTHER: "OTHER",
} as const;
export type IncidentType = keyof typeof INCIDENT_TYPE;

export const INCIDENT_SEVERITY = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  CRITICAL: "CRITICAL",
} as const;
export type IncidentSeverity = keyof typeof INCIDENT_SEVERITY;

export const NOTIFICATION_SEVERITY = {
  INFO: "INFO",
  SUCCESS: "SUCCESS",
  WARNING: "WARNING",
  CRITICAL: "CRITICAL",
} as const;
export type NotificationSeverity = keyof typeof NOTIFICATION_SEVERITY;

export const NOTIFICATION_CHANNEL = {
  IN_APP: "IN_APP",
  PUSH: "PUSH",
  EMAIL: "EMAIL",
  SMS: "SMS",
  WHATSAPP: "WHATSAPP",
} as const;
export type NotificationChannel = keyof typeof NOTIFICATION_CHANNEL;

export const TICKET_STATUS = {
  OPEN: "OPEN",
  IN_PROGRESS: "IN_PROGRESS",
  WAITING: "WAITING",
  RESOLVED: "RESOLVED",
  CLOSED: "CLOSED",
} as const;

export const TICKET_CATEGORY = {
  LATE_BUS: "LATE_BUS",
  LOST_ITEM: "LOST_ITEM",
  DRIVER_FEEDBACK: "DRIVER_FEEDBACK",
  SAFETY: "SAFETY",
  BILLING: "BILLING",
  OTHER: "OTHER",
} as const;
export type TicketCategory = keyof typeof TICKET_CATEGORY;

/** GPS readings older than this (ms) are considered stale. */
export const GPS_STALE_MS = 90_000;
/** A bus is "approaching" within this distance (km) of a stop. */
export const APPROACH_RADIUS_KM = 1.2;
/** Route deviation threshold (km) from the planned polyline. */
export const ROUTE_DEVIATION_KM = 0.5;
