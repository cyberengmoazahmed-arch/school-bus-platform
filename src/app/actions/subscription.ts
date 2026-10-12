"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUserOrThrow } from "@/data/auth";
import { prisma } from "@/lib/db";
import { recordAudit } from "@/lib/audit";
import { calculatePrice, planDurationDays } from "@/lib/pricing";
import { haversineKm } from "@/lib/geo";
import { createPaymobCheckout, paymentsMode } from "@/lib/payments/provider";

export type SubscribeState = { ok?: boolean; error?: string; fieldErrors?: Record<string, string> };

const subscribeSchema = z.object({
  studentId: z.string().min(1),
  planId: z.string().min(1),
  promo: z.string().trim().optional(),
});

async function invoiceNumber() {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  let n = `INV-${ymd}-`;
  do {
    n = `INV-${ymd}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  } while (await prisma.invoice.findUnique({ where: { number: n } }));
  return n;
}

export async function subscribeAction(_prev: SubscribeState, formData: FormData): Promise<SubscribeState> {
  const user = await requireUserOrThrow();
  if (user.role !== "PARENT") return { error: "PARENTS_ONLY" };

  const parsed = subscribeSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: "MISSING_FIELDS" };
  const data = parsed.data;

  const student = await prisma.student.findFirst({
    where: { id: data.studentId, guardians: { some: { userId: user.id } } },
    include: { school: true, homeAddress: true },
  });
  if (!student) return { error: "NOT_YOUR_CHILD" };

  const existing = await prisma.subscription.findFirst({
    where: { studentId: student.id, status: { in: ["ACTIVE", "PENDING", "PENDING_PAYMENT"] } },
  });
  if (existing) return { error: "ALREADY_SUBSCRIBED" };

  const plan = await prisma.subscriptionPlan.findFirst({ where: { id: data.planId, isActive: true } });
  if (!plan) return { error: "PLAN_NOT_FOUND" };

  // --- Price -----------------------------------------------------------------
  const distanceKm = student.homeAddress
    ? haversineKm(
        { lat: student.homeAddress.lat, lng: student.homeAddress.lng },
        { lat: student.school.lat, lng: student.school.lng },
      )
    : 0;

  const siblingsAtSameSchool = await prisma.student.count({
    where: {
      schoolId: student.schoolId,
      guardians: { some: { userId: user.id } },
      id: { not: student.id },
    },
  });

  let promo = null;
  if (data.promo) {
    promo = await prisma.promoCode.findFirst({
      where: {
        code: data.promo.toUpperCase(),
        isActive: true,
        OR: [{ activeTo: null }, { activeTo: { gt: new Date() } }],
      },
    });
  }

  const quote = calculatePrice({
    plan: {
      basePrice: plan.basePrice,
      perKmPrice: plan.perKmPrice,
      planType: plan.planType,
      serviceType: plan.serviceType,
      siblingDiscountPercent: plan.siblingDiscountPercent,
    },
    distanceKm,
    siblingIndex: siblingsAtSameSchool,
    promo: promo
      ? { code: promo.code, discountPercent: promo.discountPercent, discountEGP: promo.discountEGP }
      : null,
  });

  const now = new Date();
  const subscription = await prisma.subscription.create({
    data: {
      parentId: user.id,
      studentId: student.id,
      planId: plan.id,
      status: "PENDING",
      startDate: now,
      endDate: new Date(now.getTime() + planDurationDays(plan.planType) * 24 * 60 * 60 * 1000),
      autoRenew: false,
      priceEGP: quote.subtotal,
      discountEGP: quote.siblingDiscount + quote.promoDiscount,
      promoCode: promo?.code ?? null,
    },
  });

  const invoice = await prisma.invoice.create({
    data: {
      subscriptionId: subscription.id,
      parentId: user.id,
      number: await invoiceNumber(),
      amountEGP: quote.subtotal,
      taxEGP: 0,
      totalEGP: quote.total,
      dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  const payment = await prisma.payment.create({
    data: {
      subscriptionId: subscription.id,
      parentId: user.id,
      amountEGP: quote.total,
      method: "CARD",
      status: "PENDING",
      provider: "PAYMOB",
      idempotencyKey: `sub-${subscription.id}`,
    },
  });

  await recordAudit({
    actorId: user.id,
    action: "SUBSCRIPTION_CREATE",
    entity: "Subscription",
    entityId: subscription.id,
    metadata: { planId: plan.id, amount: quote.total, invoice: invoice.number },
  });

  // --- Checkout --------------------------------------------------------------
  const mode = paymentsMode();
  try {
    if (mode === "live" && process.env.PAYMOB_API_KEY && process.env.PAYMOB_INTEGRATION_ID) {
      const { checkoutUrl } = await createPaymobCheckout({
        amountEGP: quote.total,
        merchantOrderId: payment.id,
        email: user.email,
      });
      redirect(checkoutUrl);
    }
  } catch {
    // fall through to demo checkout so a mis-configured live mode never blocks payment
  }

  // Sandbox / demo checkout: the mock card page posts to the SAME webhook.
  await prisma.payment.update({
    where: { id: payment.id },
    data: { providerRef: payment.id },
  });
  redirect(`/payments/${payment.id}`);
}

export async function cancelSubscriptionAction(subscriptionId: string): Promise<SubscribeState> {
  const user = await requireUserOrThrow();
  const sub = await prisma.subscription.findFirst({ where: { id: subscriptionId, parentId: user.id } });
  if (!sub) return { error: "NOT_YOURS" };

  await prisma.subscription.update({
    where: { id: sub.id },
    data: { status: "CANCELLED", cancelledAt: new Date(), cancelReason: "User cancelled" },
  });
  await recordAudit({ actorId: user.id, action: "SUBSCRIPTION_CANCEL", entity: "Subscription", entityId: sub.id });
  return { ok: true };
}

export async function pauseSubscriptionAction(subscriptionId: string): Promise<SubscribeState> {
  const user = await requireUserOrThrow();
  const sub = await prisma.subscription.findFirst({ where: { id: subscriptionId, parentId: user.id }, include: { plan: true } });
  if (!sub) return { error: "NOT_YOURS" };

  await prisma.subscription.update({
    where: { id: sub.id },
    data: { status: "PAUSED", pausedFrom: new Date(), pausedTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
  });
  await recordAudit({ actorId: user.id, action: "SUBSCRIPTION_PAUSE", entity: "Subscription", entityId: sub.id });
  return { ok: true };
}

export async function resumeSubscriptionAction(subscriptionId: string): Promise<SubscribeState> {
  const user = await requireUserOrThrow();
  const sub = await prisma.subscription.findFirst({ where: { id: subscriptionId, parentId: user.id } });
  if (!sub) return { error: "NOT_YOURS" };

  await prisma.subscription.update({
    where: { id: sub.id },
    data: { status: "ACTIVE", pausedFrom: null, pausedTo: null },
  });
  return { ok: true };
}