import json
from pathlib import Path
from django.core.management.base import BaseCommand
from django.db import transaction
from store.models import Category, Product, ProductOption
class Command(BaseCommand):
    help = 'Import starter catalog; existing products are never overwritten.'
    @transaction.atomic
    def handle(self, *args, **options):
        data = json.loads((Path(__file__).resolve().parents[3] / 'seed-catalog.json').read_text())
        for index, item in enumerate(data):
            category, _ = Category.objects.get_or_create(name=item['category'])
            product, created = Product.objects.get_or_create(slug=item['slug'], defaults={'name': item['name'], 'category': category, 'price': item['priceValue'], 'tag': item['tag'], 'description': item['description'], 'long_description': item['longDescription'], 'image_path': item['image'], 'image_alt': item['imageAlt'], 'highlights': '\n'.join(item['highlights']), 'visual': item['visual'], 'tone': item['tone'], 'sort_order': index})
            if created:
                for position, option in enumerate(item['options']):
                    ProductOption.objects.create(product=product, key=option['id'], label=option['label'], values='\n'.join(option['values']), position=position)
        self.stdout.write(self.style.SUCCESS(f'Catalog ready: {Product.objects.count()} products'))
