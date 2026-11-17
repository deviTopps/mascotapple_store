import { backendSupportsLivePayments, getStoreProducts, recordBackendOrder } from "../../lib/store-backend";
import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { validateOrder } from "../../lib/checkout";
import { initializePaystackCheckout, paystackMode, PaystackApiError, signSession } from "../../lib/paystack";
import { readOrderBody, RequestBodyError } from "../../lib/request-body";
import { checkoutOrigin } from "../../lib/checkout-origin";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const origin = checkoutOrigin(request, process.env.SITE_URL, process.env.CHECKOUT_ALLOWED_ORIGINS);
  if (!origin) return Response.json({ error: "Invalid checkout origin." }, { status: 403 });
  const secret = process.env.PAYSTACK_SECRET_KEY;
  const paymentMode = paystackMode(secret);

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
  if (!secret || !paymentMode) return Response.json({ error: "Online payment is not available yet. Choose pay on delivery instead." }, { status: 503 });
  if (paymentMode === "live" && !(await backendSupportsLivePayments())) {
    return Response.json({ error: "Live payment setup is still deploying. Please choose pay on delivery or try again later." }, { status: 503 });
  }
  try {
    const reference = `mascot-${randomUUID()}`;
    const session = { reference, amount: order.amount, expires: Date.now() + 86400000 };
    const authorizationUrl = await initializePaystackCheckout(secret, {
      email: order.email, amount: order.amount, currency: "GHS", reference,
      callback_url: `${origin}/checkout/complete`,
      // Payment reconciliation needs purchased items, not addresses or notes.
      metadata: { source: "mascot-store", order: { items: order.items } },
    });
    // Persist only after Paystack accepts initialization. Invalid credentials or
    // malformed responses must not leave unpaid orders in the store database.
    await recordBackendOrder("/api/orders/", { ...order, paymentMethod: "paystack", reference });
    (await cookies()).set(`mascot-payment-${reference}`, signSession(session, secret), { httpOnly: true, secure: origin.startsWith("https:"), sameSite: "lax", maxAge: 86400, path: "/" });
    return Response.json({ url: authorizationUrl }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof PaystackApiError && error.status === 401) {
      return Response.json({
        error: "Online payment is temporarily unavailable. Choose pay at pickup or delivery, or contact the store.",
        code: "PAYMENT_CONFIGURATION",
      }, { status: 502 });
    }
    if (!(error instanceof PaystackApiError)) {
      console.error("Checkout initialization failed", error instanceof Error ? error.message : "Unknown error");
    }
    return Response.json({ error: "Unable to open Paystack. Please try again shortly." }, { status: 502 });
  }
}
