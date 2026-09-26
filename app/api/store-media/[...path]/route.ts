export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  if (!process.env.DJANGO_API_URL) return new Response(null, { status: 404 });
  const { path } = await params;
  if (path.some(part => !/^[\w.-]+$/.test(part) || part.includes('..'))) return new Response(null, { status: 400 });
  const response = await fetch(`${process.env.DJANGO_API_URL}/media/${path.map(encodeURIComponent).join('/')}`, { signal: AbortSignal.timeout(5000) });
  const contentType = response.headers.get('content-type') ?? '';
  if (!response.ok || !/^image\/(jpeg|png|webp|gif|avif)$/.test(contentType)) return new Response(null, { status: 404 });
  return new Response(response.body, { headers: { 'Content-Type': contentType, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'public, max-age=60' } });
}
