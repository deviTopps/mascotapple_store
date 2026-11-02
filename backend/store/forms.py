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
    selections = forms.CharField(widget=forms.Textarea(attrs={'rows': 3, 'cols': 35, 'placeholder': 'storage=256GB\ncolor=BLUE'}), help_text='One option=value per line. Include every option for this configuration, using exact values from the product options.')

    class Meta:
        model = ProductVariantPrice
        fields = ['selections', 'price']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance.pk:
            self.initial['selections'] = '\n'.join(f'{key}={value}' for key, value in self.instance.selections.items())

    def clean_selections(self):
        result = {}
        for line in self.cleaned_data['selections'].splitlines():
            if not line.strip(): continue
            key, separator, value = line.partition('=')
            key, value = key.strip(), value.strip()
            if not separator or not key or not value or key in result:
                raise forms.ValidationError('Use one option=value per line, with no duplicate option names.')
            result[key] = value
        if not result: raise forms.ValidationError('Enter a configuration.')
        return dict(sorted(result.items()))


class VariantPriceFormSet(forms.BaseInlineFormSet):
    def clean(self):
        super().clean()
        if any(self.errors): return
        options = {o.key: o.value_list() for o in self.instance.options.all()} if self.instance.pk else {}
        for field, key in [('storage_size', 'storage'), ('product_color', 'color')]:
            if field in self.data:
                values = ProductAdminForm.normalize(self.data[field]).splitlines()
                if values: options[key] = values
                else: options.pop(key, None)
        # Include other option rows being edited in the same admin submission.
        for index in range(int(self.data.get('options-TOTAL_FORMS', 0))):
            prefix = f'options-{index}-'
            key = self.data.get(prefix + 'key', '').strip()
            if not key: continue
            if self.data.get(prefix + 'DELETE'): options.pop(key, None)
            else: options[key] = ProductAdminForm.normalize(self.data.get(prefix + 'values', '')).splitlines()
        seen = set()
        for form in self.forms:
            if not form.cleaned_data or form.cleaned_data.get('DELETE'): continue
            selections = form.cleaned_data.get('selections', {})
            problems = []
            for key in sorted(set(options) - set(selections)):
                problems.append(f'Missing {key}. Add {key}= followed by one of: {", ".join(options[key])}.')
            for key in sorted(set(selections) - set(options)):
                field = {'storage': 'Storage Size', 'color': 'Product Color'}.get(key, 'Other product options')
                problems.append(f'{key} is not configured. Add {selections[key]} to {field} above, or remove {key}= from this row.')
            for key in sorted(set(selections) & set(options)):
                # Case differences are harmless; use the configured spelling in orders.
                matched = next((value for value in options[key] if value.casefold() == selections[key].casefold()), None)
                if matched is None:
                    problems.append(f'{key}={selections[key]} is not allowed. Choose one of: {", ".join(options[key])}.')
                else:
                    selections[key] = matched
            if problems:
                form.add_error('selections', problems)
                continue
            form.cleaned_data['selections'] = dict(sorted(selections.items()))
            form.instance.selections = form.cleaned_data['selections']
            identity = tuple(sorted(selections.items()))
            if identity in seen: raise forms.ValidationError('Only one price is allowed per configuration.')
            seen.add(identity)
