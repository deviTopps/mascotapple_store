import { paystack } from '../../../lib/paystack';
import { readWebhookBody, validPaystackSignature } from '../../../lib/paystack-webhook';
import { recordBackendOrder } from '../../../lib/store-backend';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret?.startsWith('sk_test_')) return new Response(null, { status: 503 });
  let raw: Buffer;
  try { raw = await readWebhookBody(request); }
  catch { return new Response(null, { status: 400 }); }
  if (!validPaystackSignature(raw, request.headers.get('x-paystack-signature'), secret)) return new Response(null, { status: 401 });
  let event;
  try { event = JSON.parse(raw.toString('utf8')); }
  catch { return new Response(null, { status: 400 }); }
  if (!event || typeof event !== 'object') return new Response(null, { status: 400 });
  if (event.event !== 'charge.success') return new Response(null, { status: 200 });
  const reference = event.data?.reference;
  if (typeof reference !== 'string' || !/^mascot-[\w-]{1,93}$/.test(reference)) return new Response(null, { status: 200 });
  try {
    // Never rely on the browser redirect or event data alone to mark an order paid.
    const transaction = await paystack(`/transaction/verify/${encodeURIComponent(reference)}`, secret);
    if (transaction.reference !== reference || transaction.status !== 'success' || transaction.domain !== 'test' || transaction.currency !== 'GHS' || !Number.isSafeInteger(transaction.amount) || transaction.amount <= 0 || transaction.metadata?.source !== 'mascot-store') return new Response(null, { status: 400 });
    // Django checks this amount against the stored order and handles repeats atomically.
    await recordBackendOrder(`/api/orders/${encodeURIComponent(reference)}/paid/`, { amount: transaction.amount, currency: transaction.currency, domain: transaction.domain });
    return new Response(null, { status: 200 });
  } catch {
    // A non-2xx response lets Paystack retry transient verification/storage failures.
    return new Response(null, { status: 503 });
  }
}
