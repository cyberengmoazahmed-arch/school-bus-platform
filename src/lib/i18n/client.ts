import type { Locale } from "./config";
import { en, type Dictionary } from "./dictionaries/en";
import { ar } from "./dictionaries/ar";

const dictionaries: Record<Locale, Dictionary> = { en, ar };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? en;
}

/** Replaces {tokens} in a template string. */
export function fmt(template: string, vars: Record<string, string | number>): string {
  return Object.entries(vars).reduce(
    (acc, [key, value]) => acc.replace(new RegExp(`\\{${key}\\}`, "g"), String(value)),
    template,
  );
}

/** Resolves a dotted dictionary path like "auth.invalidCredentials" into the localized string. */
export function resolve(t: Dictionary, path: string): string {
  let node: unknown = t;
  for (const key of path.split(".")) {
    if (!node || typeof node !== "object") return path;
    node = (node as Record<string, unknown>)[key];
  }
  return typeof node === "string" ? node : path;
}

export type { Dictionary };
export type { Locale };