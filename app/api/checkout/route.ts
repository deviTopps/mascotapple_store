import { getStoreProducts, recordBackendOrder } from "../../lib/store-backend";
import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { validateOrder } from "../../lib/checkout";
import { paystack, signSession } from "../../lib/paystack";
import { readOrderBody, RequestBodyError } from "../../lib/request-body";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const origin = process.env.SITE_URL || new URL(request.url).origin;
  if (request.headers.get("origin") !== origin) return Response.json({ error: "Invalid checkout origin." }, { status: 403 });
  const secret = process.env.PAYSTACK_SECRET_KEY;

  let order;
  let requestId: string | undefined;
  let input: Record<string, unknown>;
  try {
    const body = await readOrderBody(request);
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new RequestBodyError('Invalid order.', 400);
    input = body as Record<string, unknown>;
  } catch (error) {
    return Response.json({ error: error instanceof RequestBodyError ? error.message : 'Invalid order.' }, { status: error instanceof RequestBodyError ? error.status : 400 });
  }
  const catalog = await getStoreProducts().catch(() => null);
  if (!catalog) return Response.json({ error: 'Ordering is temporarily unavailable. Please try again later.' }, { status: 503 });
  try {
    if (input.paymentMethod === "cod") {
      if (typeof input.requestId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.requestId)) throw new Error("Invalid checkout request. Please refresh and try again.");
      requestId = input.requestId;
    }
    order = validateOrder(input, catalog);
    if (input.expectedAmount !== order.amount) throw new Error("Prices changed. Refresh your cart before paying.");
  } catch (error) {
    return Response.json({ error: error instanceof SyntaxError ? "Invalid order." : error instanceof Error ? error.message : "Please check your order." }, { status: 400 });
  }
  if (order.paymentMethod === "cod") {
    if (!process.env.DJANGO_API_URL || !process.env.DJANGO_API_TOKEN) return Response.json({ error: "Ordering is temporarily unavailable. Please try again later." }, { status: 503 });
    try {
      const reference = `mascot-${requestId}`;
      await recordBackendOrder("/api/orders/", { ...order, reference });
      return Response.json({ reference, amount: order.amount, paymentMethod: "cod", delivery: order.delivery, items: order.items }, { headers: { "Cache-Control": "no-store" } });
    } catch {
      return Response.json({ error: "We couldn’t confirm your order. Retry with this page open; your order will not be duplicated." }, { status: 502 });
    }
  }
  if (!secret?.startsWith("sk_test_")) return Response.json({ error: "Online payment is not available yet. Choose pay on delivery instead." }, { status: 503 });
  try {
    const reference = `mascot-${randomUUID()}`;
    const session = { reference, amount: order.amount, expires: Date.now() + 86400000 };
    await recordBackendOrder("/api/orders/", { ...order, reference });
    const result = await paystack("/transaction/initialize", secret, {
      email: order.email, amount: order.amount, currency: "GHS", reference,
      callback_url: `${origin}/checkout/complete`,
      metadata: { source: "mascot-store", order },
    });
    const url = new URL(result.authorization_url);
    if (url.protocol !== "https:" || url.hostname !== "checkout.paystack.com") throw new Error("Unexpected payment URL.");
    (await cookies()).set("mascot-payment", signSession(session, secret), { httpOnly: true, secure: origin.startsWith("https:"), sameSite: "lax", maxAge: 86400, path: "/" });
    return Response.json({ url: url.href }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Unable to open Paystack. Please try again shortly." }, { status: 502 });
  }
}
