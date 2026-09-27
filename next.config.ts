import type { NextConfig } from "next";

// Fail a hosted build early instead of deploying the local demo catalog.
if (process.env.VERCEL) {
  for (const name of ["DJANGO_API_URL", ...(process.env.VERCEL_ENV === "production" || process.env.SITE_URL ? ["SITE_URL"] : [])]) {
    const value = process.env[name];
    if (!value) throw new Error(`${name} must be configured in Vercel.`);
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      // Do not attach the original URL error: it contains the supplied value.
      throw new Error(`${name} is not a valid URL. In Vercel Settings > Environment Variables, enter only https:// followed by the domain, without quotes, backticks, or a variable-name prefix.`);
    }
    if (url.protocol !== "https:" || url.origin !== value) {
      throw new Error(`${name} must be an HTTPS origin without a path or trailing slash.`);
    }
  }
  if (!process.env.DJANGO_API_TOKEN || process.env.DJANGO_API_TOKEN.length < 32) {
    throw new Error("Configure DJANGO_API_TOKEN in Vercel using the backend's production token.");
  }
}

const nextConfig: NextConfig = {
  images: {
    localPatterns: [
      { pathname: '/**', search: '' },
      // Product versions change when an image is replaced. The media route
      // validates the version before fetching it from the backend.
      { pathname: '/api/store-media/**' },
    ],
  },
};

export default nextConfig;
