import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { paymentsMode, verifyPaymobSignature } from "@/lib/payments/provider";
import { dispatchNotification } from "@/lib/notifications";
import { recordAudit } from "@/lib/audit";

/**
 * Webhook receives a Paymob transaction callback when the payment succeeds.
 * In sandbox ("demo") mode the built-in mock card page posts here directly so
 * the full purchase loop works without external credentials.
 * Server-side verification is mandatory — the frontend is never trusted.
 */
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const mode = paymentsMode();

  let reference: string | null = null;

  if (mode === "live") {
    const hmac = request.headers.get("hmac");
    if (!hmac || !verifyPaymobSignature(rawBody, hmac)) {
      return NextResponse.json({ ok: false, error: "BAD_SIGNATURE" }, { status: 403 });
    }
    const body = JSON.parse(rawBody);
    const obj = body?.obj ?? body ?? {};
    const success = obj.success === true;
    if (!success) return NextResponse.json({ ok: true, ignored: "not_success" });
    reference = obj.order?.merchant_order_id ?? null;
  } else {
    let body;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ ok: false, error: "BAD_JSON" }, { status: 400 });
    }
    // Sandbox only: never accept demo payments in live mode.
    if (body?.demo !== true || body?.success !== true || !body?.reference) {
      return NextResponse.json({ ok: false, error: "INVALID_DEMO" }, { status: 400 });
    }
    reference = String(body.reference);
  }

  if (!reference) return NextResponse.json({ ok: false, error: "NO_REFERENCE" }, { status: 400 });

  const result = await completePayment(reference);
  if (result === "NOT_FOUND") return NextResponse.json({ ok: false, error: "UNKNOWN_PAYMENT" }, { status: 404 });

  return NextResponse.json({ ok: true, status: result });
}

async function completePayment(reference: string): Promise<"SUCCEEDED" | "ALREADY" | "NOT_FOUND"> {
  const payment = await prisma.payment.findFirst({
    where: { OR: [{ providerRef: reference }, { idempotencyKey: reference }] },
    include: { subscription: { include: { plan: true, student: true } }, parent: true },
  });
  if (!payment) return "NOT_FOUND";
  if (payment.status === "SUCCEEDED") return "ALREADY";
  if (payment.status !== "PENDING") return "ALREADY";

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: { status: "SUCCEEDED", paidAt: new Date(), providerRef: payment.providerRef ?? reference },
    });
    await tx.invoice.updateMany({
      where: { subscriptionId: payment.subscriptionId ?? undefined, parentId: payment.parentId, status: "ISSUED" },
      data: { status: "PAID", paidAt: new Date() },
    });
    if (payment.subscription) {
      await tx.subscription.update({
        where: { id: payment.subscriptionId as string },
        data: { status: "ACTIVE", startDate: new Date() },
      });
    }
    if (payment.subscription?.promoCode) {
      await tx.promoCode.updateMany({
        where: { code: payment.subscription.promoCode },
        data: { uses: { increment: 1 } },
      });
    }
  });

  await recordAudit({
    actorId: payment.parentId,
    action: "PAYMENT_SUCCEEDED",
    entity: "Payment",
    entityId: payment.id,
    metadata: { amount: payment.amountEGP, reference },
  });

  await dispatchNotification({
    userId: payment.parentId,
    type: "PAYMENT_CONFIRMED",
    title: "Payment received",
    body: `EGP ${payment.amountEGP.toFixed(2)} — subscription is now active.`,
    severity: "SUCCESS",
  });

  return "SUCCEEDED";
}