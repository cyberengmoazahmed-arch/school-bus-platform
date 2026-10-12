"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction, type AuthActionState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { getDictionary, resolve, type Locale } from "@/lib/i18n/client";

export function RegisterForm({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const [state, action, pending] = useActionState<AuthActionState, FormData>(registerAction, {});

  const err = (field: string) => (state.fieldErrors?.[field] ? resolve(t, state.fieldErrors[field]) : undefined);

  return (
    <form action={action} className="space-y-4">
      <h1 className="text-xl font-semibold tracking-tight">{t.auth.createAccount}</h1>
      <p className="-mt-2 text-sm text-muted-foreground">{t.auth.signUpSubtitle}</p>

      {state.error ? (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">{resolve(t, state.error)}</div>
      ) : null}

      <Field label={t.common.fullName} error={err("fullName")}>
        <Input name="fullName" placeholder="e.g. Ahmed Hassan" autoComplete="name" disabled={pending} />
      </Field>
      <Field label={t.common.email} error={err("email")}>
        <Input name="email" type="email" placeholder="you@example.com" autoComplete="email" disabled={pending} />
      </Field>
      <Field label={t.common.phone} error={err("phone")}>
        <Input name="phone" type="tel" placeholder="+20 100 000 0000" autoComplete="tel" disabled={pending} />
      </Field>
      <Field label={t.common.password} error={err("password")}>
        <Input name="password" type="password" autoComplete="new-password" disabled={pending} />
      </Field>

      <Button type="submit" className="w-full" size="lg" disabled={pending}>
        {pending ? t.common.loading : t.common.signUp}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {t.auth.haveAccount}{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          {t.common.signIn}
        </Link>
      </p>
    </form>
  );
}