"""Railway settings: private Postgres, persistent media, and platform HTTPS."""
import os

# Accept Railway's standard Postgres reference variables.
for target, source in {
    'BACKEND_DOMAIN': 'RAILWAY_PUBLIC_DOMAIN',
    'POSTGRES_DB': 'PGDATABASE',
    'POSTGRES_USER': 'PGUSER',
    'POSTGRES_PASSWORD': 'PGPASSWORD',
    'POSTGRES_HOST': 'PGHOST',
    'POSTGRES_PORT': 'PGPORT',
}.items():
    if os.environ.get(source):
        os.environ.setdefault(target, os.environ[source])

from .production import *  # noqa: E402,F403

ALLOWED_HOSTS = [BACKEND_DOMAIN, 'healthcheck.railway.app']  # noqa: F405
ROOT_URLCONF = 'config.railway_urls'
MIDDLEWARE = [MIDDLEWARE[0], 'whitenoise.middleware.WhiteNoiseMiddleware', *MIDDLEWARE[1:]]  # noqa: F405
STORAGES = {
    'default': {'BACKEND': 'django.core.files.storage.FileSystemStorage'},
    'staticfiles': {'BACKEND': 'whitenoise.storage.CompressedManifestStaticFilesStorage'},
}
# Railway's internal health probe uses HTTP; all other routes still require HTTPS.
SECURE_REDIRECT_EXEMPT = [r'^api/health/$']
