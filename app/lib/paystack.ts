import { createHmac, timingSafeEqual } from "node:crypto";
export type PaymentSession = { reference: string; amount: number; expires: number };
export function signSession(session: PaymentSession, secret: string) {
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${payload}.${createHmac("sha256", secret).update(payload).digest("base64url")}`;
}
export function readSession(token: string, secret: string): PaymentSession | null {
  try {
    if (token.length > 2048 || token.split('.').length !== 2) return null;
    const [payload, signature] = token.split(".");
    const expected = createHmac("sha256", secret).update(payload).digest();
    const actual = Buffer.from(signature, "base64url");
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
    const session = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (!Number.isSafeInteger(session.expires) || session.expires <= Date.now() || typeof session.reference !== "string" || !/^mascot-[\w-]{1,93}$/.test(session.reference) || !Number.isSafeInteger(session.amount) || session.amount <= 0) return null;
    return session;
  } catch { return null; }
}
export async function paystack(path: string, secret: string, body?: unknown) {
  const response = await fetch(`https://api.paystack.co${path}`, {
    method: body ? "POST" : "GET", headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}), cache: "no-store", signal: AbortSignal.timeout(15000),
  });
  const data = await response.json();
  if (!response.ok || !data.status) throw new Error("Paystack is unavailable. Please try again shortly.");
  return data.data;
}
