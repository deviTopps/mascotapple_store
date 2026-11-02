from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from store.models import Product, ProductOption
from store.iphone_colors import iphone_colors

class Command(BaseCommand):
    help = 'Apply the supplied model palettes and preserve matching variant prices.'
    @transaction.atomic
    def handle(self, *args, **kwargs):
        count = 0
        for product in Product.objects.filter(is_active=True):
            palette = iphone_colors(product.name)
            if not palette: continue
            names = {c['name'].casefold(): c['name'] for c in palette}
            aliases = {'night star': 'Night Sky', 'sky white': 'Star White'}
            if '17 Pro' in product.name or '17 pro' in product.name:
                aliases.update(blue='Deep Blue', orange='Cosmic Orange')
            if 'iPhone Air' in product.name:
                aliases.update(white='Cloud White', black='Space Black')
            if 'iPhone 17 ' in product.name:
                aliases.update(blue='Mist Blue', silver='White')
            # Earlier placeholder options for the 18 Pro Max have no equivalent.
            # Preserve such prices for review instead of silently assigning them.
            for variant in product.variant_prices.all():
                old = variant.selections.get('color')
                if old:
                    canonical = names.get(old.casefold(), aliases.get(old.casefold()))
                    if not canonical or canonical.casefold() not in names:
                        raise CommandError(f'Unmapped variant color {old!r} on {product.name}; no changes committed.')
                    variant.selections = dict(variant.selections, color=canonical)
                    variant.save()
            ProductOption.objects.update_or_create(product=product, key='color', defaults=dict(label='Color', values='\n'.join(c['name'] for c in palette), position=1))
            count += 1
        self.stdout.write(f'Applied exact palettes to {count} products.')
