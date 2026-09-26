from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch

from django.test import TestCase, override_settings


@override_settings(ROOT_URLCONF='config.railway_urls', DEBUG=False)
class RailwayMediaTests(TestCase):
    def test_media_serves_images_but_rejects_traversal_and_non_images(self):
        with TemporaryDirectory() as directory:
            root = Path(directory) / 'media'
            root.mkdir()
            (root / 'phone.webp').write_bytes(b'example image')
            (root / 'secret.txt').write_text('private')
            outside = Path(directory) / 'outside.webp'
            outside.write_bytes(b'private')
            (root / 'link.webp').symlink_to(outside)
            with override_settings(MEDIA_ROOT=root):
                response = self.client.get('/media/phone.webp')
                self.assertEqual(response.status_code, 200)
                self.assertEqual(response['Content-Type'], 'image/webp')
                self.assertEqual(b''.join(response.streaming_content), b'example image')
                response.close()
                for path in ('secret.txt', '../outside.webp', 'link.webp', 'missing.webp'):
                    self.assertEqual(self.client.get(f'/media/{path}').status_code, 404)

    @override_settings(
        SECURE_SSL_REDIRECT=True,
        SECURE_REDIRECT_EXEMPT=[r'^api/health/$'],
        SECURE_PROXY_SSL_HEADER=('HTTP_X_FORWARDED_PROTO', 'https'),
        ALLOWED_HOSTS=['api.example.com', 'healthcheck.railway.app'],
    )
    def test_health_probe_is_allowed_over_http_but_admin_requires_https(self):
        with patch('store.views.connection.cursor'):
            response = self.client.get('/api/health/', HTTP_HOST='healthcheck.railway.app')
        self.assertEqual(response.status_code, 200)
        response = self.client.get('/admin/', HTTP_HOST='api.example.com')
        self.assertEqual(response.status_code, 301)
        self.assertEqual(response['Location'], 'https://api.example.com/admin/')
        response = self.client.get('/media/missing.webp', HTTP_HOST='api.example.com', HTTP_X_FORWARDED_PROTO='https')
        self.assertEqual(response.status_code, 404)
