import { Suspense } from "react";
import { getLocale } from "@/lib/i18n";
import { LoginForm } from "./login-form";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";

export default async function LoginPage() {
  const locale = await getLocale();
  return (
    <div>
      <div className="mb-4 flex justify-end">
        <LocaleSwitcher current={locale} />
      </div>
      <Suspense>
        <LoginForm locale={locale} />
      </Suspense>
    </div>
  );
}