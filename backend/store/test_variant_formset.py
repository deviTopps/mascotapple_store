from django.forms import inlineformset_factory
from django.test import TestCase
from .forms import VariantPriceForm, VariantPriceFormSet
from .models import Category, Product, ProductOption, ProductVariantPrice

class VariantFormErrorsTests(TestCase):
    def setUp(self):
        self.product = Product.objects.create(name='iPhone 17 Pro', slug='iphone-17-pro', category=Category.objects.create(name='iPhone'), price=14500)
        ProductOption.objects.create(product=self.product, key='color', label='Color', values='Deep Blue\nCosmic Orange\nSilver')
        self.factory = inlineformset_factory(Product, ProductVariantPrice, form=VariantPriceForm, formset=VariantPriceFormSet, extra=0)

    def formset(self, selections, storage=''):
        return self.factory(instance=self.product, prefix='variant_prices', data={
            'product_color': 'Deep Blue\nCosmic Orange\nSilver', 'storage_size': storage,
            'variant_prices-TOTAL_FORMS': '1', 'variant_prices-INITIAL_FORMS': '0',
            'variant_prices-0-selections': selections, 'variant_prices-0-price': '15900'})

    def test_invalid_row_has_specific_errors(self):
        formset = self.formset('storage=256GB\ncolor=BLACK')
        self.assertFalse(formset.is_valid())
        errors = str(formset.forms[0].errors['selections'])
        self.assertIn('Storage Size', errors)
        self.assertIn('color=BLACK', errors)
        self.assertIn('Cosmic Orange', errors)

    def test_case_normalization_preserves_price(self):
        formset = self.formset('storage=256GB\ncolor=deep blue', '256GB')
        self.assertTrue(formset.is_valid(), formset.errors)
        variant = formset.save()[0]
        self.assertEqual(variant.selections, {'color': 'Deep Blue', 'storage': '256GB'})
        self.assertEqual(variant.price, 15900)

    def test_missing_color_is_reported(self):
        formset = self.formset('storage=256GB', '256GB')
        self.assertFalse(formset.is_valid())
        self.assertIn('Missing color', str(formset.forms[0].errors))

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
            with self.assertRaises(ValidationError):
                self.product.full_clean()
