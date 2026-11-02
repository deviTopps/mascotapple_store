from django.forms import inlineformset_factory
from django.test import TestCase
from .forms import VariantPriceForm, VariantPriceFormSet
from .models import Category, Product, ProductOption, ProductVariantPrice, configured_price

class VariantFormErrorsTests(TestCase):
    def setUp(self):
        self.product = Product.objects.create(name='iPhone 17 Pro', slug='iphone-17-pro', category=Category.objects.create(name='iPhone'), price=14500)
        ProductOption.objects.create(product=self.product, key='color', label='Color', values='Deep Blue\nCosmic Orange\nSilver')
        self.factory = inlineformset_factory(Product, ProductVariantPrice, form=VariantPriceForm, formset=VariantPriceFormSet, extra=0)

    def formset(self, size='256GB', color='', price='15900'):
        return self.factory(instance=self.product, prefix='variant_prices', data={
            'product_color': 'Deep Blue\nCosmic Orange\nSilver', 'storage_size': '',
            'variant_prices-TOTAL_FORMS': '1', 'variant_prices-INITIAL_FORMS': '0',
            'variant_prices-0-product_size': size, 'variant_prices-0-product_color': color, 'variant_prices-0-price': price})

    def test_size_only_price_saves_without_duplicating_options(self):
        formset = self.formset()
        self.assertTrue(formset.is_valid(), formset.errors)
        variant = formset.save()[0]
        self.assertEqual(variant.selections, {'storage': '256GB'})
        self.assertEqual(configured_price(self.product, {'storage': '256GB', 'color': 'Silver'}), 15900)

    def test_color_override_takes_priority_over_size(self):
        ProductVariantPrice.objects.create(product=self.product, selections={'storage': '256GB'}, price=15900)
        formset = self.formset(color='deep blue', price='18900')
        self.assertTrue(formset.is_valid(), formset.errors)
        variant = formset.save()[0]
        self.assertEqual(variant.selections, {'color': 'Deep Blue', 'storage': '256GB'})
        self.assertEqual(configured_price(self.product, {'storage':'256GB','color':'Deep Blue'}),18900)
        self.assertEqual(configured_price(self.product, {'storage':'256GB','color':'Silver'}),15900)

    def test_invalid_color_has_field_error(self):
        formset = self.formset(color='RED')
        self.assertFalse(formset.is_valid())
        self.assertIn('product_color', formset.forms[0].errors)

    def test_existing_price_initializes_separate_inputs(self):
        variant = ProductVariantPrice.objects.create(product=self.product, selections={'storage':'256GB','color':'Silver'}, price=15900)
        form = VariantPriceForm(instance=variant)
        self.assertEqual(form.initial['product_size'],'256GB')
        self.assertEqual(form.initial['product_color'],'Silver')

    def test_color_photo_mapping_is_in_catalog(self):
        self.product.color_image_positions = {'Silver': 2, 'Deep Blue': 4}
        self.product.full_clean()
        self.product.save()
        response = self.client.get('/api/catalog/')
        self.assertEqual(response.json()['products'][0]['colorImagePositions'], {'Silver': 2, 'Deep Blue': 4})

    def test_invalid_color_photo_position_is_rejected(self):
        from django.core.exceptions import ValidationError
        for value in [5, 0, True, '2']:
            self.product.color_image_positions = {'Silver': value}
            with self.assertRaises(ValidationError): self.product.full_clean()

    def test_empty_size_is_a_form_error_not_a_server_error(self):
        formset = self.formset(size='')
        self.assertFalse(formset.is_valid())
        self.assertIn('product_size', formset.forms[0].errors)

    def test_admin_save_adds_size_as_selectable_option(self):
        from django.contrib.auth import get_user_model
        user = get_user_model().objects.create_superuser('size-admin', 'admin@example.com', 'test-password')
        self.client.force_login(user)
        data = dict(self.formset().data)
        data.update(name=self.product.name, slug=self.product.slug, category=str(self.product.category_id), price='14500', visual='phone-pro', tone='sand', sort_order='0', is_active='on', color_image_positions='{}')
        data.update({'options-TOTAL_FORMS':'0','options-INITIAL_FORMS':'0','_continue':'Save and continue editing'})
        response = self.client.post(f'/admin/store/product/{self.product.pk}/change/', data)
        self.assertEqual(response.status_code,302, response.context['adminform'].form.errors if response.context else '')
        self.assertEqual(self.product.options.get(key='storage').value_list(), ['256GB'])
        self.assertEqual(self.product.variant_prices.get().selections, {'storage':'256GB'})
