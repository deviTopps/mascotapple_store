from django import forms
from pathlib import Path
from .iphone_colors import iphone_colors
from .models import Product, ProductOption, ProductVariantPrice

class ProductAdminForm(forms.ModelForm):
    def clean_image(self):
        return self.validate_product_image(self.cleaned_data.get('image'))

    def clean_image_2(self): return self.validate_product_image(self.cleaned_data.get('image_2'))
    def clean_image_3(self): return self.validate_product_image(self.cleaned_data.get('image_3'))
    def clean_image_4(self): return self.validate_product_image(self.cleaned_data.get('image_4'))

    @staticmethod
    def validate_product_image(image):
        if not image or not hasattr(image, 'content_type'):
            return image
        if image.size > 5 * 1024 * 1024:
            raise forms.ValidationError('Upload an image smaller than 5 MB.')
        extensions = {'.jpg': 'JPEG', '.jpeg': 'JPEG', '.png': 'PNG', '.webp': 'WEBP', '.gif': 'GIF', '.avif': 'AVIF'}
        expected = extensions.get(Path(image.name).suffix.lower())
        decoded = getattr(image, 'image', None)
        if not expected or decoded is None or decoded.format != expected:
            raise forms.ValidationError('Upload a valid JPG, PNG, WebP, GIF or AVIF image with its correct extension.')
        if decoded.width * decoded.height > 20_000_000:
            raise forms.ValidationError('Upload an image with at most 20 megapixels.')
        return image

    product_color = forms.CharField(label='Product Color', required=False, widget=forms.Textarea(attrs={'rows': 3, 'cols': 45, 'placeholder': 'Black\nBlue\nSilver'}), help_text='Enter one color name per line using the model color reference below. Hex codes are applied automatically to the website finish preview. Leave empty if color selection is not needed.')
    storage_size = forms.CharField(label='Storage Size', required=False, widget=forms.Textarea(attrs={'rows': 3, 'cols': 45, 'placeholder': '128 GB\n256 GB\n512 GB'}), help_text='Enter one storage size per line. Leave empty for products without storage options.')
    class Meta:
        model = Product
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance.pk:
            options = {option.key: option.values for option in self.instance.options.filter(key__in=['color', 'storage'])}
            self.initial['product_color'] = options.get('color', '')
            self.initial['storage_size'] = options.get('storage', '')
        if not self.initial.get('product_color'):
            self.initial['product_color'] = '\n'.join(c['name'] for c in iphone_colors(self.instance.name))

    def clean_product_color(self):
        return self.normalize(self.cleaned_data['product_color'])

    def clean_storage_size(self):
        return self.normalize(self.cleaned_data['storage_size'])

    @staticmethod
    def normalize(value):
        return '\n'.join(dict.fromkeys(line.strip() for line in value.splitlines() if line.strip()))

class OtherOptionForm(forms.ModelForm):
    class Meta:
        model = ProductOption
        fields = '__all__'

    def clean_key(self):
        key = self.cleaned_data['key']
        if key.lower() in ['color', 'storage']:
            raise forms.ValidationError('Use the Product Color or Storage Size fields above for this option.')
        return key


class VariantPriceForm(forms.ModelForm):
    product_size = forms.CharField(label='Size / storage', required=False, widget=forms.TextInput(attrs={'placeholder': 'e.g. 256GB or 42 mm'}))
    product_color = forms.CharField(label='Color (optional)', required=False, widget=forms.TextInput(attrs={'placeholder': 'All colors'}), help_text='Leave blank to use this size price for every color.')

    class Meta:
        model = ProductVariantPrice
        fields = ['product_size', 'price', 'product_color']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        values = self.instance.selections or {}
        self.initial['product_size'] = values.get('storage', values.get('size', ''))
        self.initial['product_color'] = values.get('color', '')

    def _update_errors(self, errors):
        # The model stores selections internally; show its errors on the visible size input.
        if hasattr(errors, 'error_dict') and 'selections' in errors.error_dict:
            errors.error_dict.setdefault('product_size', []).extend(errors.error_dict.pop('selections'))
        super()._update_errors(errors)

    def clean(self):
        cleaned = super().clean()
        values = dict(self.instance.selections or {})
        size_key = 'size' if 'size' in values else 'storage'
        product = getattr(self.instance, 'product', None)
        if product and product.pk and product.options.filter(key='size').exists() and not product.options.filter(key='storage').exists():
            size_key = 'size'
        for key in ['storage', 'size', 'color']:
            values.pop(key, None)
        size = cleaned.get('product_size', '').strip()
        color = cleaned.get('product_color', '').strip()
        if size: values[size_key] = size
        if color: values['color'] = color
        if not values:
            self.add_error('product_size', 'Enter a size/storage value, or a color for a color-only price.')
        self.instance.selections = dict(sorted(values.items()))
        cleaned['selections'] = self.instance.selections
        return cleaned


class VariantPriceFormSet(forms.BaseInlineFormSet):
    def clean(self):
        super().clean()
        if any(self.errors): return
        colors = ProductAdminForm.normalize(self.data.get('product_color', '')).splitlines()
        if 'product_color' not in self.data and self.instance.pk:
            option = self.instance.options.filter(key='color').first()
            colors = option.value_list() if option else []
        seen = set()
        for form in self.forms:
            if not form.cleaned_data or form.cleaned_data.get('DELETE'): continue
            selections = form.instance.selections
            if selections.get('color'):
                match = next((value for value in colors if value.casefold() == selections['color'].casefold()), None)
                if not match:
                    form.add_error('product_color', 'Choose a configured product color: ' + ', '.join(colors) + '. Leave blank for all colors.')
                    continue
                selections['color'] = match
            # Reuse existing spelling for sizes, but permit adding sizes directly here.
            for key in ['storage', 'size']:
                if key in selections:
                    existing = self.instance.options.filter(key=key).first() if self.instance.pk else None
                    candidates = existing.value_list() if existing else []
                    selections[key] = next((v for v in candidates if v.replace(' ', '').casefold() == selections[key].replace(' ', '').casefold()), selections[key])
            identity = tuple(sorted(selections.items()))
            if identity in seen:
                form.add_error('product_size', 'This size and color already has a price. Edit that row instead.')
            seen.add(identity)
            form.instance.selections = dict(sorted(selections.items()))
            form.cleaned_data['selections'] = form.instance.selections
