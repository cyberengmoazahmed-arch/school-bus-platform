"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Lock, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";

/**
 * Sandbox-only mock card page. This is the demo stand-in for Paymob's hosted
 * iframe. Submitting posts to the SAME webhook endpoint Paymob would call in
 * live mode, so the rest of the pipeline never changes.
 */
export function DemoCheckout({ paymentId, amount, liveMode }: { paymentId: string; amount: number; liveMode: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const pay = (form: FormData) =>
    startTransition(async () => {
      if (!form.get("card") || form.get("card")!.toString().replace(/\D/g, "").length < 12) {
        setError("Use a demo card number like 4000 0000 0000 0002 with any future date / CVC.");
        return;
      }
      setError(null);
      const res = await fetch("/api/payments/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ demo: true, success: true, reference: paymentId }),
      });
      if (res.ok) {
        router.push("/parent/subscription?paid=1");
      } else {
        setError("Payment failed. Please retry.");
      }
    });

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardContent className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <span className="flex items-center gap-2 font-semibold">
              <CreditCard size={18} className="text-primary" /> SafeRide checkout
            </span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">demo</span>
          </div>

          <form action={pay} className="space-y-4">
            <Field label="Card number">
              <Input name="card" placeholder="4000 0000 0000 0002" inputMode="numeric" autoComplete="cc-number" disabled={pending} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Expiry">
                <Input name="expiry" placeholder="12/28" autoComplete="cc-exp" disabled={pending} />
              </Field>
              <Field label="CVC">
                <Input name="cvc" placeholder="123" inputMode="numeric" autoComplete="cc-csc" disabled={pending} />
              </Field>
            </div>
            <Field label="Name on card">
              <Input name="name" placeholder="Parent Name" autoComplete="cc-name" disabled={pending} />
            </Field>

            {error ? <p className="text-sm text-danger">{error}</p> : null}

            <Button type="submit" className="w-full" size="lg" disabled={pending || liveMode}>
              {pending ? "Processing…" : `Pay EGP ${amount.toFixed(2)}`}
              {!pending ? <Lock size={15} /> : null}
            </Button>
          </form>

          {liveMode ? (
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Demo checkout is disabled in live payments mode.
            </p>
          ) : (
            <p className="mt-3 flex items-center gap-1.5 text-center text-xs text-muted-foreground">
              <Check size={13} /> Sandbox demo — no real charge. Any card number (≥12 digits) works.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}