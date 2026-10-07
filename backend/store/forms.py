from django import forms
from pathlib import Path
from .models import Product, ProductOption, ProductColorImage

class ProductAdminForm(forms.ModelForm):
    def clean_image(self):
        image = self.cleaned_data.get('image')
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

    product_color = forms.CharField(label='Product Color', required=False, widget=forms.Textarea(attrs={'rows': 3, 'cols': 45, 'placeholder': 'Black\nBlue\nSilver'}), help_text='Enter one color per line. Leave empty if color selection is not needed.')
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


class ProductColorImageForm(forms.ModelForm):
    clean_image = ProductAdminForm.clean_image

    class Meta:
        model = ProductColorImage
        fields = '__all__'
