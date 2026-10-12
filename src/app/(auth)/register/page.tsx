import { Suspense } from "react";
import { getLocale } from "@/lib/i18n";
import { RegisterForm } from "./register-form";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";

export default async function RegisterPage() {
  const locale = await getLocale();
  return (
    <div>
      <div className="mb-4 flex justify-end">
        <LocaleSwitcher current={locale} />
      </div>
      <Suspense>
        <RegisterForm locale={locale} />
      </Suspense>
    </div>
  );
}