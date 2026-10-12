"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { loginAction, type AuthActionState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { getDictionary, resolve, type Locale } from "@/lib/i18n/client";

export function LoginForm({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const [state, action, pending] = useActionState<AuthActionState, FormData>(loginAction, {});
  const params = useSearchParams();
  const verified = params.get("verified") === "1";

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="from" value={params.get("from") ?? ""} />
      <h1 className="text-xl font-semibold tracking-tight">{t.auth.welcomeBack}</h1>
      <p className="-mt-2 text-sm text-muted-foreground">{t.auth.signInSubtitle}</p>

      {verified ? (
        <div className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 ring-1 ring-green-200">
          Phone verified — welcome back!
        </div>
      ) : null}
      {state.error ? (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">{resolve(t, state.error)}</div>
      ) : null}

      <Field label={t.common.email}>
        <Input name="identifier" placeholder="you@example.com / +20 100 000 0000" autoComplete="username" disabled={pending} />
      </Field>
      <Field label={t.common.password}>
        <Input name="password" type="password" autoComplete="current-password" disabled={pending} />
      </Field>

      <Button type="submit" className="w-full" size="lg" disabled={pending}>
        {pending ? t.common.loading : t.common.signIn}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {t.auth.noAccount}{" "}
        <Link href="/register" className="font-medium text-primary hover:underline">
          {t.common.signUp}
        </Link>
      </p>
    </form>
  );
}