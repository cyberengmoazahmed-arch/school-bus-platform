import { Suspense } from "react";
import { getLocale } from "@/lib/i18n";
import { VerifyForm } from "./verify-form";

export default async function VerifyPhonePage({
  searchParams,
}: {
  searchParams: Promise<{ phone?: string; code?: string }>;
}) {
  const { phone, code } = await searchParams;
  const locale = await getLocale();
  const devCode = process.env.AUTH_DEV_OTP !== "false" && code ? code : null;

  return (
    <Suspense>
      <VerifyForm locale={locale} phone={phone ?? ""} devCode={devCode} />
    </Suspense>
  );
}