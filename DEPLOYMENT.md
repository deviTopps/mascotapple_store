# Vercel frontend + Hostinger VPS backend

The Next.js app runs on Vercel. Its server routes call Django over HTTPS using a private token. Django admin, PostgreSQL and uploaded images run on a Hostinger VPS. Browser requests use the storefront's own API routes, so CORS is not required.

Hostinger **Web/Cloud shared hosting cannot run this Django backend**. Use a VPS with Docker Engine and the Compose plugin, for example a clean Ubuntu VPS. This setup owns ports 80/443; do not run it alongside an existing web server on those ports. See [Hostinger's Django requirements](https://support.hostinger.com/en/articles/1583678-is-django-supported-at-hostinger) and [Docker's Ubuntu installation guide](https://docs.docker.com/engine/install/ubuntu/).

Replace `example.com` with your storefront domain and `api.example.com` with your backend domain. No real domains or credentials are included in the repository.

## 1. Backend on the VPS

Point the DNS A record for `api.example.com` to the VPS IPv4 address. Add an AAAA record only if IPv6 is configured correctly. Permit inbound TCP 80/443 and your SSH port in the Hostinger/OS firewall. PostgreSQL and Gunicorn have no published host ports. Caddy obtains and renews HTTPS certificates automatically.

Clone the repository using your GitHub SSH key or other configured Git credentials:

```sh
git clone https://github.com/deviTopps/mascotapple_store.git
cd mascotapple_store/deploy
cp .env.example .env
chmod 600 .env
```

Edit `deploy/.env` on the server:

- `BACKEND_DOMAIN`: just `api.example.com`, without scheme, path or slash.
- `ACME_EMAIL`: your real email for certificate registration.
- `DJANGO_SECRET_KEY`: a new random secret of at least 50 characters.
- `DJANGO_API_TOKEN`: a separate new random secret of at least 32 characters; put the exact same value in Vercel.
- `POSTGRES_PASSWORD`: a third new random secret of at least 32 characters.
- Keep `POSTGRES_DB=mascot` and `POSTGRES_USER=mascot` unless you need different names.

Generate each secret separately with `openssl rand -hex 32`. Do not reuse the local development credentials. Do not run `setup_local.py` on the VPS.

From the `deploy` directory:

```sh
docker compose build web
docker compose up -d db
docker compose run --rm web python manage.py migrate --noinput
docker compose run --rm web python manage.py collectstatic --noinput
docker compose run --rm web python manage.py check --deploy
```

Choose your catalog before starting the site:

- To use the starter catalog: `docker compose run --rm web python manage.py import_catalog`.
- To preserve your current local product edits and uploads: use the migration steps below **instead of importing the starter catalog**.

Create a new production admin and start the services:

```sh
docker compose run --rm web python manage.py createsuperuser
docker compose up -d
docker compose ps
curl --fail https://api.example.com/api/health/
curl --fail https://api.example.com/api/catalog/
```

Open `https://api.example.com/admin/`. Confirm that login works, admin CSS loads, and uploaded product images load. The deployment uses PostgreSQL and named volumes for database, media and certificates; container replacement preserves these volumes. `check --deploy` may report HSTS subdomain/preload advisories: those are intentionally disabled because this configuration only governs the backend hostname.

## 2. Frontend on Vercel

Import `deviTopps/mascotapple_store` into Vercel. Select **Next.js**, root directory **`.`**, install command `npm ci`, build command `npm run build`, and the default Next.js output settings. This app requires server routes; do not configure a static export.

In Vercel's **Production** environment, add:

- `DJANGO_API_URL=https://api.example.com` (no trailing slash).
- `DJANGO_API_TOKEN`: exactly the production backend token.
- `SITE_URL=https://example.com`: the exact origin customers will use for checkout, without trailing slash. If starting with a Vercel domain, use that domain first and update/redeploy when attaching your custom domain.
- Optional `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: restrict it to your storefront referrers and required Google APIs. This key is browser-visible.
- Optional `PAYSTACK_SECRET_KEY`: **test keys only**. Leave unset for pay-on-delivery/pickup checkout without online payments.

The build rejects missing backend settings and invalid HTTPS origins. Only the Maps key is public; never prefix the backend token or Paystack secret with `NEXT_PUBLIC_`. Vercel environment changes require a new deployment. See [Vercel environment variables](https://vercel.com/docs/environment-variables).

Attach the storefront domain in Vercel and apply the DNS records Vercel supplies. Redirect aliases such as `www` to the canonical `SITE_URL`, since checkout validates the request origin. Keep the backend `api` DNS record pointing to Hostinger.

For Vercel Preview deployments, use a separate staging backend and token. Omit `SITE_URL` so the checkout callback uses that preview's request origin. Never connect untrusted preview code to production order data or production secrets.

## 3. Move the current local catalog (optional, before accepting orders)

The Git repository deliberately excludes the local SQLite database and uploaded images. Deploying Git alone will not copy your current Django admin edits. These steps transfer products and options only; local orders and admin accounts are not copied.

On your Mac, from the project root:

```sh
backend/.venv/bin/python backend/manage.py dumpdata store.category store.product store.productoption --indent 2 --output /tmp/mascot-catalog.json
tar -czf /tmp/mascot-media.tar.gz -C backend/media .
scp /tmp/mascot-catalog.json /tmp/mascot-media.tar.gz YOUR_SSH_USER@YOUR_VPS_IP:/tmp/
```

On the VPS, from `deploy`, after migrations and before starter import or any production orders:

```sh
docker compose run --rm -T web python manage.py loaddata --format json - < /tmp/mascot-catalog.json
docker compose run --rm -T web tar -xzf - -C /data/media < /tmp/mascot-media.tar.gz
```

Check catalog counts, prices, options and image URLs. Remove the temporary transfer files from both machines after verifying the transfer. Do not load the catalog fixture over an operating store: fixture primary keys could overwrite live products.

## 4. Launch checks

Confirm HTTPS, admin login, product images, variant selections, cart and a complete pay-on-delivery/pickup order. Verify the order appears once in Django admin, including after retrying the same checkout request. Confirm the backend rejects an unauthenticated POST to `/api/orders/` with HTTP 401.

Paystack is still **test-only**. Live payment collection, webhook reconciliation, stock tracking and variant-specific prices are separate work; hosting does not enable those features. Review the current catalog and delivery policy before taking real orders.

## 5. Backups and updates

Back up both PostgreSQL and media, plus securely retain `deploy/.env`. Store encrypted copies off the VPS and test restoration on a separate stack. For a consistent backup, pause ordering/uploads by stopping `web` during this short maintenance window. From `deploy`:

```sh
mkdir -p backups
chmod 700 backups
umask 077
docker compose stop web
docker compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > backups/database.dump
docker compose run --rm --no-deps -T web tar -czf - -C /data/media . > backups/media.tar.gz
docker compose start web
```

Check command exit codes and retain dated copies instead of overwriting your only backup. If a backup command fails, restart `web` and resolve the failure before relying on that backup. Schedule backups through your VPS administration after choosing retention and off-server storage.

To restore into a separate, empty stack with the same environment configuration, start its database, then:

```sh
docker compose exec -T db sh -c 'pg_restore --exit-on-error --no-owner -U "$POSTGRES_USER" -d "$POSTGRES_DB"' < backups/database.dump
docker compose run --rm --no-deps -T web tar -xzf - -C /data/media < backups/media.tar.gz
docker compose run --rm web python manage.py collectstatic --noinput
docker compose up -d
```

Restore media before starting Caddy on a fresh stack so the web image initializes the volume with the correct ownership. Never use `docker compose down -v` on the production stack; it removes persistent volumes.

For backend updates, take a backup first, then from `deploy`:

```sh
git pull --ff-only
docker compose build --pull web
docker compose stop web
docker compose run --rm web python manage.py migrate --noinput
docker compose run --rm web python manage.py collectstatic --noinput
docker compose run --rm web python manage.py check --deploy
docker compose up -d
```

Review migrations before applying them. Rollback may require restoring a database backup as well as the previous Git revision. Vercel deploys frontend changes from its configured production branch. Use `docker compose logs --tail=100 web caddy` to investigate backend failures; do not post credentials or customer details from logs.
