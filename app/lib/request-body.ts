export class RequestBodyError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

// Enforce the byte limit while reading, including chunked requests without a
// Content-Length header. Do not buffer an arbitrary body before checking it.
export async function readOrderBody(request: Request, limit = 16000): Promise<unknown> {
  if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    throw new RequestBodyError('Expected a JSON order.', 415);
  }
  const length = Number(request.headers.get('content-length'));
  if (length > limit) throw new RequestBodyError('Order is too large.', 413);
  const reader = request.body?.getReader();
  if (!reader) throw new RequestBodyError('Invalid order.', 400);
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) {
        await reader.cancel();
        throw new RequestBodyError('Order is too large.', 413);
      }
      chunks.push(value);
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch (error) {
    if (error instanceof RequestBodyError) throw error;
    throw new RequestBodyError('Invalid order.', 400);
  } finally {
    reader.releaseLock();
  }
}
