# Mascot Django backend

Django 5.2 LTS, SQLite for local development, and Django's built-in admin.

## Run locally

Use Python 3.10+ (this workspace uses the bundled Python 3.12 runtime):

```sh
python3 -m venv backend/.venv
backend/.venv/bin/python -m pip install -r backend/requirements.txt
backend/.venv/bin/python backend/setup_local.py
backend/.venv/bin/python backend/manage.py runserver 127.0.0.1:8000
```

The setup command migrates the database, imports the starter catalog without overwriting existing products, creates a local admin account, and connects Next.js through `.env.local`. Restart `npm run dev` if environment variables are not picked up automatically.

- Admin: http://127.0.0.1:8000/admin/
- Local generated login: `.admin-credentials.txt` (ignored by Git). Change the password using the admin's Change password link.
- Catalog: `/api/catalog/`
- Health: `/api/health/`
- Internal order endpoints: `/api/orders/` and `/api/orders/<reference>/paid/` require the server-only bearer token.

## Manage the store

Use Products to edit names, prices (GHS), descriptions, photos, visibility and ordering. Upload up to four photos using Image and Image 2–4, or keep the existing storefront path as the main image. The main image is used on product cards; the product details gallery shows all uploaded views. Each photo must be under 5 MB and 20 megapixels. Set one highlight per line. Under Product options add Storage, Color or Size groups, with one allowed value per line. Under Size prices, enter Size / storage (for example `256GB` or `42 mm`) and its full GHS price in separate inputs. Leave Color blank to apply the size price to every color, or enter one of the product's configured color names for a color-specific override. Sizes entered in these rows are added to the selectable product options automatically. Existing prices retain their size and color. Color-specific prices take priority over size-only prices; unmatched configurations use the base price. Inventory is not implemented.

Reload the storefront after saving changes in admin. It loads active products and options from Django without a catalog cache. Uploaded images are served through the Next.js media proxy. The storefront's hardcoded starter catalog is used only when `DJANGO_API_URL` is not configured. If a configured backend is down, catalog loading fails visibly rather than silently accepting stale prices.

Checkout revalidates catalog prices and options, stores a pending order before opening Paystack, and marks it paid only after server-side Paystack test verification. Existing pre-backend payments are not imported. Admin can update fulfillment status, but payment details and order line snapshots are read-only. Test payments remain test-only. If a customer never returns from Paystack, the order stays pending; reconcile those transactions in Paystack. Automatic webhook reconciliation, live payments, stock tracking and shipping services are future work.

SQLite database, images and generated local credentials are ignored by Git; back up `db.sqlite3` and `media/` separately. This runserver setup is for local development. Production needs a durable database/media store, a production application server, HTTPS, deployment-specific secrets and `DJANGO_DEBUG=false` plus `DJANGO_ALLOWED_HOSTS`.

## Checks

```sh
backend/.venv/bin/python backend/manage.py check
backend/.venv/bin/python backend/manage.py test store
```

Environment variables: `DJANGO_SECRET_KEY`, `DJANGO_API_TOKEN`, `DJANGO_DEBUG`, `DJANGO_ALLOWED_HOSTS`, `EMAIL_HOST_USER`, and `EMAIL_HOST_PASSWORD` on Django; `DJANGO_API_URL`, `DJANGO_API_TOKEN` on Next.js. Order confirmations are sent from `mascotappledealzgh@gmail.com` through Gmail SMTP (`smtp.gmail.com:587`, TLS). Set `EMAIL_HOST_PASSWORD` to a Gmail App Password in the backend runtime's secret configuration; never commit it. Pay-on-delivery orders receive an itemized confirmation when placed, and Paystack orders receive one after payment verification. The sent timestamp prevents routine webhook retries from sending duplicate confirmations. Local generated secrets live in `.local-config.json`, with permissions restricted to the current user.
