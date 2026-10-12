import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Tailwind-aware className combiner. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a number as Egyptian Pounds. */
export function formatEGP(amount: number, locale: "en" | "ar" = "en") {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(value: number, locale: "en" | "ar" = "en") {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US").format(value);
}

export function formatDate(date: Date | string, locale: "en" | "ar" = "en") {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function formatDateTime(date: Date | string, locale: "en" | "ar" = "en") {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function formatTime(date: Date | string, locale: "en" | "ar" = "en") {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/** Relative "2h ago" style formatting. */
export function timeAgo(date: Date | string, locale: "en" | "ar" = "en") {
  const d = typeof date === "string" ? new Date(date) : date;
  const diffMs = Date.now() - d.getTime();
  const mins = Math.round(diffMs / 60000);
  const rtf = new Intl.RelativeTimeFormat(locale === "ar" ? "ar" : "en", { numeric: "auto" });
  if (Math.abs(mins) < 60) return rtf.format(-mins, "minute");
  const hrs = Math.round(mins / 60);
  if (Math.abs(hrs) < 24) return rtf.format(-hrs, "hour");
  const days = Math.round(hrs / 24);
  return rtf.format(-days, "day");
}

export function minutesToLabel(minutes: number) {
  if (minutes < 1) return "less than a minute";
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m ? `${h}h ${m}m` : `${h}h`;
}

/** First letters of a name for avatar fallbacks. */
export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

/** Stable pseudo-random avatar background from a string. */
export function avatarColor(seed: string) {
  const palette = ["#0ea5e9", "#8b5cf6", "#f59e0b", "#10b981", "#ef4444", "#6366f1", "#ec4899", "#14b8a6"];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return palette[hash % palette.length];
}

/** Generate a numeric one-time code. */
export function generateOtp(length = 6) {
  let code = "";
  for (let i = 0; i < length; i++) code += Math.floor(Math.random() * 10);
  return code;
}

/** Mask a phone number for display: +201*****201 */
export function maskPhone(phone: string) {
  if (phone.length < 7) return phone;
  return `${phone.slice(0, 4)}*****${phone.slice(-3)}`;
}

export function truncate(text: string, max = 60) {
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
}
