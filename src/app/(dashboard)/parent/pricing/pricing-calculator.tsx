"use client";

import { useState } from "react";
import { calculatePrice, planMonths, type PricingPlan } from "@/lib/pricing";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/field";

type Plan = {
  id: string;
  name: string;
  planType: string;
  serviceType: string;
  basePrice: number;
  perKmPrice: number;
  siblingDiscountPercent: number;
};

export function PricingCalculator({ plans }: { plans: Plan[] }) {
  const [planId, setPlanId] = useState(plans[0]?.id ?? "");
  const [distance, setDistance] = useState(5);
  const [siblings, setSiblings] = useState(0);
  const [promoPercent, setPromoPercent] = useState(0);

  const plan = plans.find((p) => p.id === planId) ?? plans[0];
  if (!plan) return <p className="text-sm text-muted-foreground">No plans available.</p>;

  const pricingPlan: PricingPlan = {
    basePrice: plan.basePrice,
    perKmPrice: plan.perKmPrice,
    planType: plan.planType,
    serviceType: plan.serviceType,
    siblingDiscountPercent: plan.siblingDiscountPercent,
  };

  const quote = calculatePrice({
    plan: pricingPlan,
    distanceKm: Number(distance) || 0,
    siblingIndex: Number(siblings) || 0,
    promo: promoPercent > 0 ? { discountPercent: Number(promoPercent) || 0 } : null,
  });

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
      <Card>
        <CardContent className="p-5 space-y-4">
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Plan</legend>
            <Select value={planId} onChange={(e) => setPlanId(e.target.value)}>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · {p.planType} · {p.serviceType.replace("_", " ")}
                </option>
              ))}
            </Select>
            <PlanBadges plan={plan} />
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Home → school distance</legend>
            <div className="flex items-center gap-3">
              <Input
                type="range"
                min={0}
                max={30}
                step={0.5}
                value={distance}
                onChange={(e) => setDistance(Number(e.target.value))}
                className="h-2 p-0"
              />
              <span className="w-14 text-sm font-mono">{distance} km</span>
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Siblings at same school" hint={`2nd child gets ${plan.siblingDiscountPercent}% off`}>
              <Input
                type="number"
                min={0}
                max={3}
                value={siblings}
                onChange={(e) => setSiblings(Number(e.target.value))}
              />
            </Field>
            <Field label="Promo discount %" hint="e.g. WELCOME10 = 10">
              <Input
                type="number"
                min={0}
                max={50}
                value={promoPercent}
                onChange={(e) => setPromoPercent(Number(e.target.value))}
              />
            </Field>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Estimate</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row label={`Base (${plan.planType.toLowerCase()}, ${planMonths(plan.planType)} month${planMonths(plan.planType) > 1 ? "s" : ""})`} value={quote.base} />
          <Row label="Distance fee" value={quote.distanceFee} />
          <Row label="Subtotal" value={quote.subtotal} bold />
          {quote.siblingDiscount > 0 ? <Row label="Sibling discount" value={-quote.siblingDiscount} tone="green" /> : null}
          {quote.promoDiscount > 0 ? <Row label="Promo discount" value={-quote.promoDiscount} tone="green" /> : null}
          <div className="border-t border-border pt-2">
            <Row label="Total" value={quote.total} bold big />
          </div>
          <p className="text-xs text-muted-foreground">
            Sibling discount applies from the 2nd child. Prices in Egyptian pounds (EGP).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function PlanBadges({ plan }: { plan: Plan }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Badge tone="primary">{plan.planType}</Badge>
      <Badge tone="neutral">{plan.serviceType.replace("_", " ")}</Badge>
      <Badge tone="info">EGP {plan.basePrice.toFixed(0)}</Badge>
      {plan.perKmPrice > 0 ? <Badge tone="info">+{plan.perKmPrice.toFixed(2)}/km</Badge> : null}
    </div>
  );
}

function Row({
  label,
  value,
  bold,
  big,
  tone,
}: {
  label: string;
  value: number;
  bold?: boolean;
  big?: boolean;
  tone?: "green" | "red" | "default";
}) {
  return (
    <div className={`flex items-center justify-between ${bold ? "font-semibold" : ""}`}>
      <span className="text-muted-foreground">{label}</span>
      <span
        className={
          (big ? "text-xl " : "") +
          (tone === "green" ? "text-success " : tone === "red" ? "text-danger " : "font-mono ")
        }
      >
        EGP {value.toFixed(2)}
      </span>
    </div>
  );
}