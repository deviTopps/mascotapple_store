from datetime import timedelta
from io import BytesIO
from unittest.mock import patch

from PIL import Image
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import Client, TestCase, override_settings
from django.utils import timezone
from axes.models import AccessAttempt

from .forms import ProductAdminForm
from .models import Category, Product


class SecurityTests(TestCase):
    def test_admin_throttles_failed_logins_and_recovers_after_cooloff(self):
        get_user_model().objects.create_superuser('security-owner', 'owner@example.com', 'a-long-test-password')
        for _ in range(10):
            response = self.client.post('/admin/login/', {'username': 'security-owner', 'password': 'wrong'})
        self.assertEqual(response.status_code, 429)
        response = self.client.post('/admin/login/', {'username': 'security-owner', 'password': 'a-long-test-password'}, HTTP_X_FORWARDED_FOR='198.51.100.1')
        self.assertEqual(response.status_code, 429)
        AccessAttempt.objects.update(attempt_time=timezone.now() - timedelta(minutes=16))
        response = self.client.post('/admin/login/', {'username': 'security-owner', 'password': 'a-long-test-password'})
        self.assertEqual(response.status_code, 302)
        self.assertEqual(AccessAttempt.objects.filter(username='security-owner').count(), 0)

    def test_admin_login_requires_csrf(self):
        client = Client(enforce_csrf_checks=True)
        response = client.post('/admin/login/', {'username': 'owner', 'password': 'anything'})
        self.assertEqual(response.status_code, 403)

    @override_settings(INTERNAL_API_TOKEN='test-service-token')
    def test_internal_auth_requires_bearer_and_handles_unicode(self):
        for header in ['test-service-token', 'Bearer wrong', 'Bearer café']:
            response = self.client.post('/api/orders/', '{}', content_type='application/json', HTTP_AUTHORIZATION=header)
            self.assertEqual(response.status_code, 401)

    def test_admin_upload_rejects_oversized_or_mislabelled_images(self):
        category = Category.objects.create(name='Test')
        product = Product.objects.create(name='Phone', slug='phone', category=category)
        output = BytesIO()
        Image.new('RGB', (10, 10)).save(output, format='PNG')
        def form(name, data):
            return ProductAdminForm(data={'name': 'Phone', 'slug': 'phone', 'category': category.pk, 'visual': 'phone-pro', 'tone': 'sand', 'sort_order': 0},
                                    files={'image': SimpleUploadedFile(name, data, content_type='image/png')}, instance=product)
        self.assertTrue(form('phone.png', output.getvalue()).is_valid())
        for name, data in [('phone.jpg', output.getvalue()), ('phone.html', output.getvalue()), ('phone.png', output.getvalue() + b'0' * (5 * 1024 * 1024))]:
            self.assertIn('image', form(name, data).errors)
        with patch.object(Image.Image, 'width', property(lambda self: 5000)), patch.object(Image.Image, 'height', property(lambda self: 5000)):
            self.assertIn('image', form('phone.png', output.getvalue()).errors)
