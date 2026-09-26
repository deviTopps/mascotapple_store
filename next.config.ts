import type { NextConfig } from "next";

// Fail a hosted build early instead of deploying the local demo catalog.
if (process.env.VERCEL) {
  for (const name of ["DJANGO_API_URL", ...(process.env.VERCEL_ENV === "production" || process.env.SITE_URL ? ["SITE_URL"] : [])]) {
    const value = process.env[name];
    if (!value) throw new Error(`${name} must be configured in Vercel.`);
    const url = new URL(value);
    if (url.protocol !== "https:" || url.origin !== value) {
      throw new Error(`${name} must be an HTTPS origin without a path or trailing slash.`);
    }
  }
  if (!process.env.DJANGO_API_TOKEN || process.env.DJANGO_API_TOKEN.length < 32) {
    throw new Error("Configure DJANGO_API_TOKEN in Vercel using the backend's production token.");
  }
}

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
