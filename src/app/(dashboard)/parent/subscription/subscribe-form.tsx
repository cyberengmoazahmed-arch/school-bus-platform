"use client";

import { useActionState } from "react";
import { subscribeAction, type SubscribeState } from "@/app/actions/subscription";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import type { Locale } from "@/lib/i18n/client";

type StudentOption = { id: string; name: string; school: string };
type PlanOption = {
  id: string;
  name: string;
  planType: string;
  serviceType: string;
  basePrice: number;
  perKmPrice: number;
  description: string | null;
};

export function SubscribeForm({ locale, students, plans }: { locale: Locale; students: StudentOption[]; plans: PlanOption[] }) {
  const [state, action, pending] = useActionState<SubscribeState, FormData>(subscribeAction, {});

  return (
    <Card>
      <CardContent className="p-5">
        <form action={action} className="grid gap-4 md:grid-cols-[1fr_1fr_1fr_auto_auto]">
          <Field label="Child">
            <Select name="studentId" defaultValue="">
              <option value="" disabled>
                Choose…
              </option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — {s.school}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Plan">
            <Select name="planId" defaultValue="">
              <option value="" disabled>
                Choose…
              </option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · EGP {p.basePrice.toFixed(0)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Promo code" hint="Try WELCOME10">
            <Input name="promo" placeholder="WELCOME10" disabled={pending} />
          </Field>
          <div className="flex items-end">
            <Button type="submit" disabled={pending}>
              {pending ? "Creating checkout…" : "Subscribe"}
            </Button>
          </div>
        </form>

        {state.error ? <p className="mt-3 text-sm text-danger">{state.error}</p> : null}

        <div className="mt-4 space-y-2 border-t border-border pt-4">
          {plans.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center gap-2 text-sm">
              <Badge tone="primary">{p.planType}</Badge>
              <Badge tone="neutral">{p.serviceType.replace("_", " ")}</Badge>
              <span className="font-medium">{p.name}</span>
              <span className="text-muted-foreground">
                EGP {p.basePrice.toFixed(0)} base{buildFee(p.perKmPrice)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

const buildFee = (perKm: number) => (perKm > 0 ? ` + ${perKm.toFixed(2)}/km` : "");