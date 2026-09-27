export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  if (!process.env.DJANGO_API_URL) return new Response(null, { status: 404 });
  const { path } = await params;
  if (path.some(part => !/^[\w.-]+$/.test(part) || part.includes('..'))) return new Response(null, { status: 400 });
  const query = new URL(request.url).searchParams;
  if ([...query.keys()].some(key => key !== 'v') || query.getAll('v').length > 1) return new Response(null, { status: 400 });
  const version = query.get('v');
  if (version !== null && !/^\d{1,20}$/.test(version)) return new Response(null, { status: 400 });
  const lifetime = version ? 86400 : 60;
  const source = `${process.env.DJANGO_API_URL}/media/${path.map(encodeURIComponent).join('/')}${version ? `?v=${version}` : ''}`;
  let response: Response;
  try {
    response = await fetch(source, { next: { revalidate: lifetime }, redirect: 'error', signal: AbortSignal.timeout(5000) });
  } catch {
    return new Response(null, { status: 502, headers: { 'Cache-Control': 'no-store' } });
  }
  const contentType = response.headers.get('content-type') ?? '';
  if (!response.ok || !/^image\/(jpeg|png|webp|gif|avif)$/.test(contentType)) return new Response(null, { status: 404 });
  return new Response(response.body, { headers: {
    'Content-Type': contentType,
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': `public, max-age=${version ? 3600 : 60}`,
    'CDN-Cache-Control': `public, s-maxage=${lifetime}, stale-while-revalidate=3600`,
  } });
}
