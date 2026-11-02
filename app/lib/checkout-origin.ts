export function checkoutOrigin(request: Request, siteUrl?: string, aliases = ""): string | null {
  const origin = request.headers.get("origin");
  const allowed = [siteUrl || new URL(request.url).origin, ...aliases.split(",").map(value => value.trim()).filter(Boolean)];
  if (!origin || !allowed.includes(origin)) return null;
  try {
    const url = new URL(origin);
    return url.origin === origin && ["http:", "https:"].includes(url.protocol) ? origin : null;
  } catch { return null; }
}
