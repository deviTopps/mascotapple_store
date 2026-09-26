# Railway backend

Use a Railway project with a PostgreSQL service and one backend service from this GitHub repository. Configure the backend's **Root Directory** as `/backend` and its **Config File Path** as `/backend/railway.json`. The Dockerfile installs the production requirements; Railway runs migrations before deployment and initializes static files after the persistent volume is mounted.

Attach a volume at **`/data`** to the backend and generate a Railway public domain targeting port **8000**. Use one backend replica with this volume. The backend refuses to start without the volume so uploaded images are not accidentally stored on ephemeral disk.

Set these backend service variables (replace `Postgres` if your database service has a different name):

```dotenv
DJANGO_SETTINGS_MODULE=config.railway
RAILWAY_RUN_UID=0
PORT=8000
DJANGO_SECRET_KEY=<new random secret, at least 50 characters>
DJANGO_API_TOKEN=<new random token, at least 32 characters>
PGDATABASE=${{Postgres.PGDATABASE}}
PGUSER=${{Postgres.PGUSER}}
PGPASSWORD=${{Postgres.PGPASSWORD}}
PGHOST=${{Postgres.PGHOST}}
PGPORT=${{Postgres.PGPORT}}
```

`RAILWAY_PUBLIC_DOMAIN` supplies the hostname automatically after generating the domain. For a custom backend domain, set `BACKEND_DOMAIN` explicitly. Use the database's private hostname. The production password must be at least 32 characters.

Railway mounts volumes as root; the startup process creates the media/static directories, assigns them to user 10001, and drops root privileges before running Django. HTTPS is provided by Railway. WhiteNoise serves admin static assets, and Django streams only approved image extensions from persistent media storage.

After the service is healthy, open a Railway service shell (or `railway ssh`) and run:

```sh
python manage.py createsuperuser
```

Populate the catalog by importing your current catalog and uploaded images, or run `python manage.py import_catalog` for starter products. Do not import the starter catalog first if you plan to load a fixture containing your existing product IDs. The existing local data migration instructions in `DEPLOYMENT.md` explain how to export products/options and media; do not copy development admin credentials or secrets into production. Use the Railway volume file tools or service shell to transfer data.

Verify `/api/health/`, `/api/catalog/`, `/admin/`, admin styling and a uploaded image. Add the resulting HTTPS domain as Vercel's `DJANGO_API_URL`, and use the same `DJANGO_API_TOKEN` on both services. Redeploy Vercel after adding its variables.

Enable scheduled backups for both the Postgres volume and backend media volume in Railway. Volume-backed deployments can have a short interruption during redeploys. Paystack remains test-only; pay-on-delivery/pickup is supported.

References: [Django](https://docs.railway.com/guides/django), [volumes](https://docs.railway.com/volumes), [healthchecks](https://docs.railway.com/deployments/healthchecks).
