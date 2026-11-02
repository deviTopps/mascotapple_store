import { createHmac, timingSafeEqual } from 'node:crypto';

export function validPaystackSignature(body: Uint8Array, signature: string | null, secret: string): boolean {
  if (!signature || !/^[a-f0-9]{128}$/i.test(signature)) return false;
  const expected = createHmac('sha512', secret).update(body).digest();
  return timingSafeEqual(expected, Buffer.from(signature, 'hex'));
}

export async function readWebhookBody(request: Request, limit = 256000): Promise<Buffer> {
  if (Number(request.headers.get('content-length')) > limit) throw new Error('Webhook too large');
  const reader = request.body?.getReader();
  if (!reader) throw new Error('Missing webhook body');
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) { await reader.cancel(); throw new Error('Webhook too large'); }
      chunks.push(value);
    }
    return Buffer.concat(chunks);
  } finally { reader.releaseLock(); }
}
