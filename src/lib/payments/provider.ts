import "server-only";
import { createHmac, timingSafeEqual } from "crypto";

/**
 * Paymob integration for card payments.
 *
 * Two modes, selected by PAYMENTS_MODE:
 *  - "live"  → real Paymob checkout (requires PAYMOB_API_KEY + integration ids).
 *  - "sandbox" (default) → a built-in demo checkout loop: the parent pays on a
 *    mock card page which calls the same webhook endpoint that Paymob would.
 *    This keeps the full purchase flow demonstrable end-to-end without keys.
 */

export function paymentsMode(): "live" | "sandbox" {
  return process.env.PAYMENTS_MODE === "live" ? "live" : "sandbox";
}

export function paymobReady(): boolean {
  return Boolean(
    process.env.PAYMOB_API_KEY &&
      process.env.PAYMOB_INTEGRATION_ID &&
      process.env.PAYMOB_IFRAME_ID,
  );
}

const BASE = process.env.PAYMOB_BASE_URL ?? "https://accept.paymob.com/api";

/**
 * Creates a Paymob order + payment token for the given amount. Returns the
 * hosted iframe URL the user is redirected to. Throws on any failure.
 */
export async function createPaymobCheckout(input: {
  amountEGP: number;
  merchantOrderId: string;
  email: string;
}): Promise<{ checkoutUrl: string; paymentToken: string }> {
  const apiKey = process.env.PAYMOB_API_KEY ?? "";
  const integrationId = process.env.PAYMOB_INTEGRATION_ID ?? "";
  const iframeId = process.env.PAYMOB_IFRAME_ID ?? "";
  const amountCents = Math.round(input.amountEGP * 100);
  const currency = "EGP";

  // 1) Auth token
  const tokenRes = await fetch(`${BASE}/auth/tokens`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: apiKey }),
  });
  const tokenBody = (await tokenRes.json()) as { token: string };
  if (!tokenBody.token) throw new Error("PAYMOB_AUTH_FAILED");

  // 2) Order
  const orderRes = await fetch(`${BASE}/ecommerce/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      auth_token: tokenBody.token,
      delivery_needed: false,
      amount_cents: amountCents,
      currency,
      merchant_order_id: input.merchantOrderId,
      items: [],
    }),
  });
  const orderBody = (await orderRes.json()) as { id?: string };
  if (!orderBody.id) throw new Error("PAYMOB_ORDER_FAILED");

  // 3) Payment key
  const keyRes = await fetch(`${BASE}/acceptance/payment_keys`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      auth_token: tokenBody.token,
      amount_cents: amountCents,
      expiration: 3600,
      order_id: orderBody.id,
      billing_data: {
        email: input.email,
        first_name: "SafeRide",
        last_name: "Parent",
        phone_number: "+201000000000",
        city: "Cairo",
        country: "EG",
        street: "N/A",
      },
      currency,
      integration_id: Number(integrationId),
    }),
  });
  const keyBody = (await keyRes.json()) as { token: string };
  if (!keyBody.token) throw new Error("PAYMOB_KEY_FAILED");

  return {
    paymentToken: keyBody.token,
    checkoutUrl: `https://accept.paymob.com/api/acceptance/iframes/${iframeId}?payment_token=${keyBody.token}`,
  };
}

/** HMAC-SHA512 of the raw request body, per Paymob's webhook signing spec. */
export function verifyPaymobSignature(rawBody: string, headerHmac: string | null): boolean {
  if (!headerHmac) return false;
  const secret = process.env.PAYMOB_HMAC_SECRET ?? "";
  if (!secret) return false;
  const expected = createHmac("sha512", secret).update(rawBody).digest("hex");
  try {
    const a = Buffer.from(expected, "hex");
    const b = Buffer.from(headerHmac, "hex");
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}