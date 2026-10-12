"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n/config";
import { LOCALE_COOKIE } from "@/lib/i18n";

export async function setLocaleAction(locale: string) {
  const value = isLocale(locale) ? locale : DEFAULT_LOCALE;
  const store = await cookies();
  store.set(LOCALE_COOKIE, value, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  revalidatePath("/", "layout");
}
