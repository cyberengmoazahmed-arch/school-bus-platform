import type { PlanType, ServiceType } from "./enums";

export type PricingPlan = {
  basePrice: number;
  perKmPrice: number;
  planType: PlanType | string;
  serviceType: ServiceType | string;
  siblingDiscountPercent: number;
};

export type Promo = {
  code?: string;
  discountPercent?: number | null;
  discountEGP?: number | null;
};

export type PriceBreakdown = {
  base: number;
  distanceFee: number;
  subtotal: number;
  siblingDiscount: number;
  promoDiscount: number;
  total: number;
  currency: "EGP";
  months: number;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Number of months a plan covers (used for term/annual normalisation). */
export function planMonths(planType: string): number {
  switch (planType) {
    case "TERM":
      return 3;
    case "ANNUAL":
      return 12;
    default:
      return 1;
  }
}

export function planDurationDays(planType: string): number {
  switch (planType) {
    case "TERM":
      return 90;
    case "ANNUAL":
      return 365;
    default:
      return 30;
  }
}

/**
 * Pure pricing calculator. Price = plan base + distance component, then
 * applied sibling and promo discounts. The first child never gets the sibling
 * discount (`siblingIndex` is 0-based per family+school).
 */
export function calculatePrice(params: {
  plan: PricingPlan;
  distanceKm: number;
  siblingIndex?: number;
  promo?: Promo | null;
}): PriceBreakdown {
  const { plan, distanceKm } = params;
  const siblingIndex = params.siblingIndex ?? 0;
  const promo = params.promo ?? null;

  const base = round2(plan.basePrice);
  const distanceFee = round2(plan.perKmPrice * Math.max(0, distanceKm));
  const subtotal = round2(base + distanceFee);

  const siblingDiscount =
    siblingIndex > 0 ? round2((subtotal * plan.siblingDiscountPercent) / 100) : 0;

  let promoDiscount = 0;
  if (promo) {
    if (promo.discountPercent) promoDiscount = round2((subtotal * promo.discountPercent) / 100);
    else if (promo.discountEGP) promoDiscount = round2(promo.discountEGP);
  }
  promoDiscount = Math.min(promoDiscount, round2(subtotal - siblingDiscount));

  const total = round2(Math.max(0, subtotal - siblingDiscount - promoDiscount));

  return {
    base,
    distanceFee,
    subtotal,
    siblingDiscount,
    promoDiscount,
    total,
    currency: "EGP",
    months: planMonths(plan.planType),
  };
}
