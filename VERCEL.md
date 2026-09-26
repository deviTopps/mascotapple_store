# Deploy the frontend to Vercel

This repository's root is the Next.js frontend. `vercel.json` selects Next.js, runs `npm ci`, and builds with `npm run build`. `package.json` selects Node.js 24.x. The Django backend must run separately, for example on Railway; Vercel does not start it as part of this frontend deployment.

## Import the project

1. Push the prepared frontend files to GitHub.
2. In Vercel, choose **Add New → Project** and import `deviTopps/mascotapple_store`.
3. Keep **Root Directory** at the repository root (`.`), choose **Next.js**, and leave **Output Directory** at its framework default. Do not select `app/`, `public/`, or `backend/` as the root.
4. Choose your project name. Your initial storefront origin will normally be `https://YOUR-PROJECT.vercel.app`; verify the actual assigned domain in Vercel.
5. Add the environment variables below to **Production**, then deploy.

## Required environment variables

- `DJANGO_API_URL`: the deployed backend's HTTPS origin, such as `https://YOUR-BACKEND.up.railway.app`. No trailing slash or `/api` suffix. Localhost will not work from Vercel.
- `DJANGO_API_TOKEN`: the exact token configured on the backend, at least 32 characters. Keep it server-only.
- `SITE_URL`: the exact storefront origin, such as `https://YOUR-PROJECT.vercel.app`, with no trailing slash. This controls checkout origin validation and the payment return URL.

The build deliberately fails if these settings are missing or malformed. A working storefront also needs the backend's `/api/catalog/` endpoint and order endpoints to be reachable. Build success alone does not verify backend availability or the shared token.

## Optional environment variables

- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: enables delivery address search. Restrict the key to your storefront referrers and required Google APIs. Manual address entry works without it.
- `PAYSTACK_SECRET_KEY`: accepts test keys only. Leave blank to use pay on delivery/pickup without online payments. Live Paystack payments are not implemented.

Never use a `NEXT_PUBLIC_` prefix for the backend token or payment secret. Enter credentials in Vercel's environment settings; do not commit `.env.local`. `.env.example` lists the configuration names, and `.vercelignore` excludes local environment files and the backend from frontend uploads.

## Domains and previews

After adding a custom domain under **Settings → Domains**, apply the DNS records Vercel gives you. Update `SITE_URL` to the chosen canonical HTTPS origin and redeploy. Redirect other domain aliases to that origin so checkout requests pass origin validation.

For **Preview** deployments, configure a separate staging backend URL/token and leave `SITE_URL` unset. Checkout will use the preview request origin. Do not give untrusted preview deployments production backend credentials. If you have no staging backend, configure Production only; preview builds will fail clearly until their backend settings are provided.

Environment changes affect new deployments; redeploy after changing them.

## Verify after deployment

1. Open the storefront and a product page; confirm the current backend prices and product options appear.
2. Check an uploaded product image loads through `/api/store-media/...`.
3. Place a pay-on-delivery/pickup test order and confirm it appears once in Django admin.
4. If checkout says “Invalid checkout origin”, compare the browser origin with `SITE_URL`, correct it, and redeploy.
5. If the store is unavailable, check the backend's `/api/health/` and `/api/catalog/` URLs and Vercel function logs.

Local checks: `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build`.

Vercel Hobby is restricted to personal, non-commercial projects; use an appropriate paid plan for this store. References: [Next.js on Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs), [environment variables](https://vercel.com/docs/environment-variables), [Node.js versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions), [Hobby plan](https://vercel.com/docs/plans/hobby).
