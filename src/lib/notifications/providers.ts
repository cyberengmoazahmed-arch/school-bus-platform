import type { NotificationChannel } from "@/lib/enums";

export type DeliveryResult = {
  channel: NotificationChannel;
  status: "SENT" | "FAILED" | "SKIPPED";
  providerRef?: string;
  error?: string;
};

/**
 * External notification providers.
 *
 * In-app notifications always work (they are stored in the database). Email,
 * SMS, WhatsApp and push require third-party credentials. When a provider is
 * not configured we return `SKIPPED` with a clear reason instead of pretending
 * the message was delivered. See README "External integrations".
 */

export async function sendPush(to: string, title: string, body: string): Promise<DeliveryResult> {
  const key = process.env.FCM_SERVER_KEY;
  if (!key) return { channel: "PUSH", status: "SKIPPED", error: "FCM_SERVER_KEY not configured" };
  try {
    // NOTE: FCM legacy HTTP API. Migrate to HTTP v1 (service account) for
    // production; this endpoint is provided as a working baseline.
    const res = await fetch("https://fcm.googleapis.com/fcm/send", {
      method: "POST",
      headers: { Authorization: `key=${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ to, notification: { title, body } }),
    });
    if (!res.ok) return { channel: "PUSH", status: "FAILED", error: `HTTP ${res.status}` };
    const json = (await res.json()) as { results?: { message_id?: string }[] };
    return { channel: "PUSH", status: "SENT", providerRef: json.results?.[0]?.message_id };
  } catch (error) {
    return { channel: "PUSH", status: "FAILED", error: String(error) };
  }
}

export async function sendEmail(to: string, subject: string, body: string): Promise<DeliveryResult> {
  if (!process.env.SMTP_HOST) {
    return { channel: "EMAIL", status: "SKIPPED", error: "SMTP_HOST not configured" };
  }
  // A transactional email HTTP API endpoint can be supplied via EMAIL_API_URL.
  const apiUrl = process.env.EMAIL_API_URL;
  const apiKey = process.env.EMAIL_API_KEY;
  if (!apiUrl || !apiKey) {
    return {
      channel: "EMAIL",
      status: "SKIPPED",
      error: "SMTP configured but no HTTP email transport (EMAIL_API_URL/EMAIL_API_KEY).",
    };
  }
  try {
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.SMTP_FROM, to, subject, text: body }),
    });
    if (!res.ok) return { channel: "EMAIL", status: "FAILED", error: `HTTP ${res.status}` };
    const json = (await res.json().catch(() => ({}))) as { id?: string };
    return { channel: "EMAIL", status: "SENT", providerRef: json.id };
  } catch (error) {
    return { channel: "EMAIL", status: "FAILED", error: String(error) };
  }
}

export async function sendSms(to: string, body: string): Promise<DeliveryResult> {
  if (!process.env.SMS_API_KEY || !process.env.SMS_PROVIDER) {
    return { channel: "SMS", status: "SKIPPED", error: "SMS provider not configured" };
  }
  try {
    const res = await fetch(process.env.SMS_PROVIDER, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.SMS_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ to, message: body }),
    });
    if (!res.ok) return { channel: "SMS", status: "FAILED", error: `HTTP ${res.status}` };
    return { channel: "SMS", status: "SENT" };
  } catch (error) {
    return { channel: "SMS", status: "FAILED", error: String(error) };
  }
}

export async function sendWhatsApp(to: string, body: string): Promise<DeliveryResult> {
  const { WHATSAPP_API_URL, WHATSAPP_API_TOKEN, WHATSAPP_PHONE_NUMBER_ID } = process.env;
  if (!WHATSAPP_API_URL || !WHATSAPP_API_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    return { channel: "WHATSAPP", status: "SKIPPED", error: "WhatsApp Business API not configured" };
  }
  try {
    const url = `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${WHATSAPP_API_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body } }),
    });
    if (!res.ok) return { channel: "WHATSAPP", status: "FAILED", error: `HTTP ${res.status}` };
    const json = (await res.json().catch(() => ({}))) as { messages?: { id?: string }[] };
    return { channel: "WHATSAPP", status: "SENT", providerRef: json.messages?.[0]?.id };
  } catch (error) {
    return { channel: "WHATSAPP", status: "FAILED", error: String(error) };
  }
}
