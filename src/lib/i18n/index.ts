import "server-only";
import { cookies } from "next/headers";
import { DEFAULT_LOCALE, dirFor, isLocale, type Locale } from "./config";
import { getDictionary, type Dictionary } from "./client";

export const LOCALE_COOKIE = "saferide_locale";

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  if (isLocale(value)) return value;
  return DEFAULT_LOCALE;
}

export async function getT() {
  const locale = await getLocale();
  return { locale, dir: dirFor(locale), t: getDictionary(locale) };
}

export { getDictionary };
export type { Dictionary };