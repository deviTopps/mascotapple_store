import json
from unittest.mock import patch
from django.db import OperationalError
from decimal import Decimal
from django.test import TestCase, override_settings
from django.contrib.auth import get_user_model
from .models import Category, Product, ProductOption, Order

@override_settings(INTERNAL_API_TOKEN='test-service-token')
class StoreTests(TestCase):
    def test_health_checks_database_without_exposing_errors(self):
        self.assertEqual(self.client.get('/api/health/').status_code, 200)
        with patch('store.views.connection.cursor', side_effect=OperationalError('private database details')):
            response = self.client.get('/api/health/')
        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json(), {'status': 'unavailable'})
        self.assertEqual(response.headers['Cache-Control'], 'no-store')

    def setUp(self):
        category = Category.objects.create(name='iPhone')
        self.product = Product.objects.create(name='Test Phone', slug='test-phone', category=category, price='99.00')
        ProductOption.objects.create(product=self.product, key='storage', label='Storage', values='128 GB\n256 GB')
        self.order = {'reference':'mascot-test-order','name':'Test Buyer','email':'buyer@example.com','phone':'+233200000000','delivery':'pickup','address':'','city':'','notes':'','location':None,'amount':9900,'currency':'GHS','items':[{'slug':'test-phone','quantity':1,'selections':{'storage':'128 GB'}}]}
    def post(self, path, data, token='test-service-token'):
        return self.client.post(path, json.dumps(data), content_type='application/json', HTTP_AUTHORIZATION='Bearer '+token)
    def test_catalog_tracks_admin_product_values(self):
        self.product.name = 'Renamed Phone'
        self.product.price = Decimal('125.50')
        self.product.save()
        item = self.client.get('/api/catalog/').json()['products'][0]
        self.assertEqual(item['name'], 'Renamed Phone')
        self.assertEqual(item['priceValue'], 125.5)
        self.assertEqual(item['options'][0]['values'], ['128 GB','256 GB'])
        self.product.is_active = False
        self.product.save()
        self.assertEqual(self.client.get('/api/catalog/').json()['products'], [])
    def test_admin_requires_login(self):
        self.assertEqual(self.client.get('/admin/store/product/').status_code, 302)
        admin = get_user_model().objects.create_superuser('owner','owner@example.com','test-password')
        self.client.force_login(admin)
        self.assertEqual(self.client.get('/admin/store/product/').status_code, 200)
        self.assertEqual(self.client.get('/admin/store/order/').status_code, 200)
    def test_orders_require_service_token(self):
        self.assertEqual(self.post('/api/orders/',self.order,token='wrong').status_code,401)
        self.assertEqual(Order.objects.count(),0)
    def test_order_records_snapshot_and_payment_is_idempotent(self):
        self.assertEqual(self.post('/api/orders/',self.order).status_code,201)
        order = Order.objects.get()
        self.assertEqual(order.items.get().selections,{'storage':'128 GB'})
        self.assertEqual(order.amount,Decimal('99.00'))
        self.assertEqual(self.post('/api/orders/',self.order).status_code,409)
        paid = '/api/orders/mascot-test-order/paid/'
        self.assertEqual(self.post(paid,{'amount':1,'currency':'GHS','domain':'test'}).status_code,400)
        self.assertEqual(self.post(paid,{'amount':9900,'currency':'GHS','domain':'live'}).status_code,400)
        for _ in range(2): self.assertEqual(self.post(paid,{'amount':9900,'currency':'GHS','domain':'test'}).status_code,200)
        order.refresh_from_db()
        self.assertEqual(order.payment_status,'paid')
    def test_rejects_tampering_and_invalid_variants(self):
        for mutation in [{'amount':1}, {'items':[{'slug':'test-phone','quantity':0,'selections':{'storage':'128 GB'}}]}, {'items':[{'slug':'test-phone','quantity':1,'selections':{'storage':'9 TB'}}]}, {'email':'invalid'}]:
            self.assertEqual(self.post('/api/orders/', self.order | mutation).status_code,400)
        self.assertEqual(Order.objects.count(),0)

    def test_admin_can_edit_product_and_options(self):
        admin = get_user_model().objects.create_superuser('editor', 'editor@example.com', 'test-password')
        self.client.force_login(admin)
        url = f'/admin/store/product/{self.product.pk}/change/'
        self.assertContains(self.client.get('/admin/store/product/'), 'Edit product')
        self.assertEqual(self.client.get(url).status_code, 200)
        response = self.client.post(url, {
            'name': 'Updated Phone', 'slug': 'test-phone', 'category': self.product.category_id,
            'price': '150.00', 'tag': 'New', 'description': 'Updated description', 'long_description': '',
            'highlights': 'New highlight', 'image_path': '', 'image_alt': '', 'visual': 'phone-pro',
            'tone': 'sand', 'is_active': 'on', 'sort_order': '0',
            'product_color': 'Blue\nSilver', 'storage_size': '256 GB\n512 GB',
            'options-TOTAL_FORMS': '0', 'options-INITIAL_FORMS': '0', 'options-MIN_NUM_FORMS': '0', 'options-MAX_NUM_FORMS': '1000',
            '_save': 'Save',
        })
        self.assertEqual(response.status_code, 302)
        self.product.refresh_from_db()
        self.assertEqual(self.product.name, 'Updated Phone')
        self.assertEqual(self.product.price, Decimal('150.00'))
        catalog = self.client.get('/api/catalog/').json()['products'][0]
        self.assertEqual(catalog['name'], 'Updated Phone')
        options = {option['id']: option['values'] for option in catalog['options']}
        self.assertEqual(options['storage'], ['256 GB', '512 GB'])
        self.assertEqual(options['color'], ['Blue', 'Silver'])
        edit = self.client.get(url)
        self.assertContains(edit, 'Product Color')
        self.assertContains(edit, 'Storage Size')
        self.assertEqual(edit.context['adminform'].form.initial['product_color'], 'Blue\nSilver')

    def test_quick_price_edit_preserves_storage_options(self):
        admin = get_user_model().objects.create_superuser('quick-editor', 'quick@example.com', 'test-password')
        self.client.force_login(admin)
        response = self.client.post('/admin/store/product/', {
            'form-TOTAL_FORMS': '1', 'form-INITIAL_FORMS': '1', 'form-MIN_NUM_FORMS': '0', 'form-MAX_NUM_FORMS': '1000',
            'form-0-id': self.product.pk, 'form-0-price': '120.00', 'form-0-is_active': 'on', 'form-0-sort_order': '0', '_save': 'Save',
        })
        self.assertEqual(response.status_code, 302)
        self.product.refresh_from_db()
        self.assertEqual(self.product.price, Decimal('120.00'))
        self.assertEqual(self.product.options.get(key='storage').value_list(), ['128 GB', '256 GB'])

    def test_pay_on_delivery_is_saved_unpaid_and_retries_do_not_duplicate(self):
        order = self.order | {'paymentMethod': 'cod'}
        self.assertEqual(self.post('/api/orders/', order).status_code, 201)
        self.assertEqual(self.post('/api/orders/', order).status_code, 200)
        self.assertEqual(Order.objects.count(), 1)
        saved = Order.objects.get()
        self.assertEqual(saved.payment_method, 'cod')
        self.assertEqual(saved.payment_status, 'pending')
        self.assertIsNone(saved.paid_at)
        self.assertEqual(self.post('/api/orders/', order | {'name': 'Different Buyer'}).status_code, 409)
        self.assertEqual(self.post('/api/orders/mascot-test-order/paid/', {'amount': 9900, 'currency': 'GHS', 'domain': 'test'}).status_code, 400)

    def test_invalid_payment_method_is_rejected(self):
        self.assertEqual(self.post('/api/orders/', self.order | {'paymentMethod': 'unknown'}).status_code, 400)

    def test_checkout_order_can_be_managed_in_admin(self):
        self.assertEqual(self.post('/api/orders/', self.order | {'paymentMethod': 'cod'}).status_code, 201)
        order = Order.objects.get()
        admin = get_user_model().objects.create_superuser('manager', 'manager@example.com', 'test-password')
        self.client.force_login(admin)
        self.assertContains(self.client.get('/admin/store/order/'), order.reference)
        detail = self.client.get(f'/admin/store/order/{order.pk}/change/')
        self.assertContains(detail, 'Test Buyer')
        self.assertContains(detail, 'Storage: 128 GB')
        self.assertContains(detail, 'Test Phone')
        response = self.client.post('/admin/store/order/', {
            'form-TOTAL_FORMS': '1', 'form-INITIAL_FORMS': '1', 'form-MIN_NUM_FORMS': '0', 'form-MAX_NUM_FORMS': '1000',
            'form-0-id': order.pk, 'form-0-fulfillment_status': 'processing', '_save': 'Save',
        })
        self.assertEqual(response.status_code, 302)
        order.refresh_from_db()
        self.assertEqual(order.fulfillment_status, 'processing')
        for _ in range(2):
            self.client.post('/admin/store/order/', {'action': 'mark_cash_received', '_selected_action': [order.pk], 'index': '0'})
        order.refresh_from_db()
        self.assertEqual(order.payment_status, 'paid')
        self.assertIsNotNone(order.paid_at)
        from django.contrib.admin.models import LogEntry
        self.assertEqual(LogEntry.objects.filter(object_id=str(order.pk), change_message__contains='Recorded delivery/pickup').count(), 1)

    def test_manual_cash_action_cannot_mark_online_orders_paid(self):
        self.post('/api/orders/', self.order)
        order = Order.objects.get()
        admin = get_user_model().objects.create_superuser('payments', 'payments@example.com', 'test-password')
        self.client.force_login(admin)
        self.client.post('/admin/store/order/', {'action': 'mark_cash_received', '_selected_action': [order.pk], 'index': '0'})
        order.refresh_from_db()
        self.assertEqual(order.payment_status, 'pending')
