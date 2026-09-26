"""Production settings for the private Gunicorn service behind Caddy."""
import os
import re

from django.core.exceptions import ImproperlyConfigured

from .settings import *  # noqa: F403


def required(name, minimum=1):
    value = os.environ.get(name, '').strip()
    if len(value) < minimum or value.lower().startswith(('replace', 'change')):
        raise ImproperlyConfigured(f'Set {name} to a production value.')
    return value


DEBUG = False
# Never reuse secrets from the local development configuration.
SECRET_KEY = required('DJANGO_SECRET_KEY', 50)
INTERNAL_API_TOKEN = required('DJANGO_API_TOKEN', 32)
BACKEND_DOMAIN = required('BACKEND_DOMAIN')
if not re.fullmatch(r'[a-zA-Z0-9](?:[a-zA-Z0-9.-]*[a-zA-Z0-9])?', BACKEND_DOMAIN):
    raise ImproperlyConfigured('BACKEND_DOMAIN must be a hostname, without scheme, path or port.')
ALLOWED_HOSTS = [BACKEND_DOMAIN]
CSRF_TRUSTED_ORIGINS = [f'https://{BACKEND_DOMAIN}']
DATABASES = {'default': {
    'ENGINE': 'django.db.backends.postgresql',
    'NAME': required('POSTGRES_DB'),
    'USER': required('POSTGRES_USER'),
    'PASSWORD': required('POSTGRES_PASSWORD', 32),
    'HOST': os.environ.get('POSTGRES_HOST', 'db'),
    'PORT': os.environ.get('POSTGRES_PORT', '5432'),
    'CONN_MAX_AGE': 60,
    'CONN_HEALTH_CHECKS': True,
    'OPTIONS': {'connect_timeout': 5},
}}
STATIC_URL = '/static/'
STATIC_ROOT = '/data/static'
MEDIA_ROOT = '/data/media'
# Caddy overwrites this header. Gunicorn is never exposed on a host port.
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000
# Only this backend hostname is covered; do not force unrelated subdomains.
SECURE_HSTS_INCLUDE_SUBDOMAINS = False
SECURE_HSTS_PRELOAD = False
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = 'same-origin'
DATA_UPLOAD_MAX_MEMORY_SIZE = 2 * 1024 * 1024
FILE_UPLOAD_PERMISSIONS = 0o644
FILE_UPLOAD_DIRECTORY_PERMISSIONS = 0o755
