"use client";

import { useActionState } from "react";
import { verifyOtpAction, resendOtpAction, type AuthActionState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { getDictionary, resolve, type Locale } from "@/lib/i18n/client";

export function VerifyForm({
  locale,
  phone,
  devCode,
}: {
  locale: Locale;
  phone: string;
  devCode: string | null;
}) {
  const t = getDictionary(locale);
  const [state, action, pending] = useActionState<AuthActionState, FormData>(verifyOtpAction, {});

  return (
    <div className="space-y-5">
      <form action={action} className="space-y-4">
        <h1 className="text-xl font-semibold tracking-tight">{t.auth.verifyPhone}</h1>
        <p className="-mt-2 break-all text-sm text-muted-foreground">{t.auth.verifyPhoneSubtitle}</p>
        <p className="text-sm font-medium">{phone}</p>

        {devCode ? (
          <div className="rounded-lg border border-dashed border-primary/40 bg-blue-50 px-3 py-2 text-sm text-blue-800">
            <span className="font-semibold">Dev mode —</span> your code is{" "}
            <span className="font-mono font-bold tracking-widest">{devCode}</span>
          </div>
        ) : null}

        {state.error ? (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">{resolve(t, state.error)}</div>
        ) : null}

        <input type="hidden" name="phone" value={phone} />
        <Field label={t.auth.otpCode}>
          <Input
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="123456"
            maxLength={6}
            className="text-center font-mono text-lg tracking-[0.5em]"
            autoFocus
            disabled={pending}
          />
        </Field>

        <Button type="submit" className="w-full" size="lg" disabled={pending}>
          {pending ? t.common.loading : t.auth.verify}
        </Button>
      </form>

      <form action={resendOtpAction} className="text-center">
        <input type="hidden" name="phone" value={phone} />
        <button type="submit" className="text-sm font-medium text-primary hover:underline">
          {t.auth.resend}
        </button>
      </form>
    </div>
  );
}