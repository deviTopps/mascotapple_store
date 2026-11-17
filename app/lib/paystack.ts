import { createHmac, timingSafeEqual } from "node:crypto";
export type PaystackMode = "test" | "live";
export function paystackMode(secret: string | undefined): PaystackMode | null {
  const match = secret?.match(/^sk_(test|live)_\S{10,}$/);
  return match ? match[1] as PaystackMode : null;
}

export class PaystackApiError extends Error {
  constructor(public readonly status: number) {
    super("Paystack request failed");
    this.name = "PaystackApiError";
  }
}

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
  let response: Response;
  try {
    response = await fetch(`https://api.paystack.co${path}`, {
      method: body ? "POST" : "GET", headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
      ...(body ? { body: JSON.stringify(body) } : {}), cache: "no-store", signal: AbortSignal.timeout(15000),
    });
  } catch (error) {
    console.error("Paystack request failed", {
      endpoint: path.startsWith("/transaction/initialize") ? "initialize" : path.startsWith("/transaction/verify/") ? "verify" : "other",
      error: error instanceof Error ? error.name : "UnknownError",
    });
    throw new Error("Paystack is unavailable. Please try again shortly.");
  }
  let data;
  try {
    data = await response.json();
  } catch {
    console.error("Paystack returned an unreadable response", {
      endpoint: path.startsWith("/transaction/initialize") ? "initialize" : path.startsWith("/transaction/verify/") ? "verify" : "other",
      status: response.status,
    });
    throw new Error("Paystack is unavailable. Please try again shortly.");
  }
  if (!response.ok || !data || typeof data !== "object" || data.status !== true) {
    const message = data && typeof data === "object" && typeof data.message === "string" ? data.message : "Unknown Paystack error";
    console.error("Paystack rejected a request", {
      endpoint: path.startsWith("/transaction/initialize") ? "initialize" : path.startsWith("/transaction/verify/") ? "verify" : "other",
      status: response.status,
      message,
    });
    throw new PaystackApiError(response.status);
  }
  return data.data;
}

export function paystackAuthorizationUrl(value: unknown): string {
  if (typeof value !== "string") throw new Error("Paystack did not return a checkout URL.");
  let url: URL;
  try { url = new URL(value); }
  catch { throw new Error("Paystack returned an invalid checkout URL."); }
  if (url.protocol !== "https:" || url.hostname !== "checkout.paystack.com" || url.username || url.password) {
    throw new Error("Paystack returned an unexpected checkout URL.");
  }
  return url.href;
}

export type PaystackCheckoutRequest = {
  email: string;
  amount: number;
  currency: "GHS";
  reference: string;
  callback_url: string;
  metadata: { source: "mascot-store"; order: { items: unknown[] } };
};

export async function initializePaystackCheckout(secret: string, checkout: PaystackCheckoutRequest): Promise<string> {
  if (!paystackMode(secret)) throw new Error("A valid Paystack secret key is required.");
  if (!Number.isSafeInteger(checkout.amount) || checkout.amount <= 0 || !/^mascot-[\w-]{1,93}$/.test(checkout.reference)) {
    throw new Error("Invalid Paystack checkout details.");
  }
  let callback: URL;
  try { callback = new URL(checkout.callback_url); }
  catch { throw new Error("Invalid Paystack callback URL."); }
  if (!['http:', 'https:'].includes(callback.protocol) || callback.username || callback.password || callback.search || callback.hash) {
    throw new Error("Invalid Paystack callback URL.");
  }
  const result = await paystack("/transaction/initialize", secret, checkout);
  return paystackAuthorizationUrl(result?.authorization_url);
}

export function validPaystackTransaction(transaction: unknown, reference: string, mode: PaystackMode): transaction is {
  reference: string; status: string; currency: string; domain: string; amount: number; metadata?: { source?: string; order?: { items?: unknown } };
} {
  if (!transaction || typeof transaction !== "object") return false;
  const value = transaction as Record<string, unknown>;
  const metadata = value.metadata && typeof value.metadata === "object" ? value.metadata as Record<string, unknown> : undefined;
  return value.reference === reference && value.status === "success" && value.currency === "GHS" && value.domain === mode &&
    typeof value.amount === "number" && Number.isSafeInteger(value.amount) && value.amount > 0 && metadata?.source === "mascot-store";
}
