import { requireUser } from "@/data/auth";
import { prisma } from "@/lib/db";
import { getT } from "@/lib/i18n";
import { PricingCalculator } from "./pricing-calculator";

export default async function PricingPage() {
  const user = await requireUser();
  const { locale, t } = await getT();
  const plans = await prisma.subscriptionPlan.findMany({ where: { isActive: true }, orderBy: { basePrice: "asc" } });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{t.nav.parent.pricing}</h1>
        <p className="text-sm text-muted-foreground">
          Estimate your price: plan base + distance fee, minus sibling and promo discounts.
        </p>
      </div>
      <PricingCalculator
        plans={plans.map((p) => ({
          id: p.id,
          name: p.name,
          planType: p.planType,
          serviceType: p.serviceType,
          basePrice: p.basePrice,
          perKmPrice: p.perKmPrice,
          siblingDiscountPercent: p.siblingDiscountPercent,
        }))}
      />
    </div>
  );
}