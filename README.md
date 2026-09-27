# Mascot Apple Dealz storefront

Next.js storefront with a Django catalog and order backend. Prices use GHS. The frontend is deployed on Vercel and the backend on Railway.

## Local development

Use Node.js 24 and Python 3.10 or newer.

```sh
npm ci
```

Follow [backend/README.md](backend/README.md) to install Python dependencies, initialize the local catalog and start Django. Local setup creates an ignored `.env.local` with the backend connection; never commit credentials, database files or uploaded customer data.

```sh
npm run dev -- --port 3001
```

Open http://localhost:3001. Without `DJANGO_API_URL`, local development uses the bundled demo catalog; checkout requires a configured backend. A configured backend outage displays an availability message while support and privacy pages remain accessible.

## Validation

```sh
npm run lint
npm test
npm run build
backend/.venv/bin/python backend/manage.py test store --noinput
npx playwright install chromium
npm run test:browser
```

Browser tests start an isolated demo storefront on port 3100. To test an already running local app with installed Chrome:

```sh
E2E_BASE_URL=http://localhost:3001 E2E_CHANNEL=chrome npm run test:browser
```

The suite covers desktop/mobile layouts, serious accessibility violations, cookie preferences, catalog pagination, product configuration and cart updates. It stops before submitting an order. Use a local or staging environment; tests are not intended for a production store. The GitHub Actions workflow runs the build, browser checks, dependency audits, secret scanning and backend tests.

## Storefront behavior

- The shop displays 24 products per page and preserves filter/sort state in its URL.
- Product metadata, JSON-LD, `/sitemap.xml` and `/robots.txt` support search indexing. Set `SITE_URL` to the public frontend origin. Cart, checkout and Vercel preview pages request no indexing.
- Figtree is self-hosted through `next/font/local`; its license is in `app/fonts/OFL.txt`.
- Cart and cookie settings use browser storage with an in-memory fallback if writes fail. That fallback lasts only for the current visit.
- Checkout validates orders server-side and limits payment metadata to purchased items. Paystack remains test-only; live payments, payment webhooks, inventory tracking and shipping integrations require further implementation.

## Deployment and operations

- [VERCEL.md](VERCEL.md): frontend settings and environment variables.
- [RAILWAY.md](RAILWAY.md): backend deployment and persistent storage.
- [DEPLOYMENT.md](DEPLOYMENT.md): alternative Hostinger VPS setup.
- [backend/README.md](backend/README.md): catalog and order administration.

Back up the production database and media separately. Automated checks supplement manual testing and dependency maintenance; they do not guarantee accessibility or security in every scenario.
