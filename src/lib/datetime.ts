import { format, formatDistanceToNow } from "date-fns";
import { enUS, ar } from "date-fns/locale";

export function formatDateTime(date: Date | string, locale: "en" | "ar" = "en") {
  return format(new Date(date), "PPp", { locale: locale === "ar" ? ar : enUS });
}

export function formatDate(date: Date | string, locale: "en" | "ar" = "en") {
  return format(new Date(date), "PPP", { locale: locale === "ar" ? ar : enUS });
}

export function relativeTime(date: Date | string, locale: "en" | "ar" = "en") {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: locale === "ar" ? ar : enUS });
}

export function toISO(date: Date | string) {
  return new Date(date).toISOString();
}