from django.db import models
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator

class Category(models.Model):
    name = models.CharField(max_length=80, unique=True)
    class Meta:
        verbose_name_plural = 'categories'
        ordering = ['name']
    def __str__(self): return self.name

class Product(models.Model):
    name = models.CharField(max_length=150)
    slug = models.SlugField(unique=True)
    category = models.ForeignKey(Category, on_delete=models.PROTECT)
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0.01)], help_text='GHS. Leave blank for contact-for-price products.')
    tag = models.CharField(max_length=40, blank=True)
    description = models.CharField(max_length=300, blank=True)
    long_description = models.TextField(blank=True)
    image = models.ImageField(upload_to='products/', blank=True, help_text='Upload a replacement product photo.')
    image_2 = models.ImageField(upload_to='products/', blank=True, verbose_name='Image 2')
    image_3 = models.ImageField(upload_to='products/', blank=True, verbose_name='Image 3')
    image_4 = models.ImageField(upload_to='products/', blank=True, verbose_name='Image 4')
    image_path = models.CharField(max_length=300, blank=True, help_text='Existing storefront image path, e.g. /products/photo.webp. Upload takes priority.')
    image_alt = models.CharField(max_length=300, blank=True)
    highlights = models.TextField(blank=True, help_text='One highlight per line.')
    visual = models.CharField(max_length=30, choices=[(v,v) for v in ['phone-pro','macbook','ipad','watch','airpods']], default='phone-pro')
    tone = models.CharField(max_length=30, default='sand')
    is_active = models.BooleanField(default=True, help_text='Uncheck to hide the product from the storefront.')
    sort_order = models.PositiveIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta: ordering = ['sort_order', 'id']
    def __str__(self): return self.name
    def clean(self):
        if self.image_path and (not self.image_path.startswith('/') or self.image_path.startswith('//') or '..' in self.image_path):
            raise ValidationError({'image_path': 'Use a local storefront path starting with /.'})

class ProductOption(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='options')
    key = models.SlugField(help_text='Stable option ID, e.g. storage or color.')
    label = models.CharField(max_length=60)
    values = models.TextField(help_text='One allowed value per line, e.g. 128 GB, then 256 GB on the next line.')
    position = models.PositiveIntegerField(default=0)
    class Meta:
        ordering = ['position', 'id']
        constraints = [models.UniqueConstraint(fields=['product', 'key'], name='unique_product_option')]
    def clean(self):
        if not self.value_list(): raise ValidationError({'values': 'Provide at least one value.'})
    def value_list(self): return list(dict.fromkeys(v.strip() for v in self.values.splitlines() if v.strip()))
    def __str__(self): return f'{self.product}: {self.label}'

class ProductVariantPrice(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='variant_prices')
    selections = models.JSONField(help_text='Exact configuration: one option=value per line, e.g. storage=256GB and color=BLUE. Use the exact option values above.')
    price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0.01)], help_text='Full price in GHS for this configuration, not a surcharge.')

    class Meta:
        constraints = [models.UniqueConstraint(fields=['product', 'selections'], name='unique_product_variant_price')]

    def clean(self):
        if not isinstance(self.selections, dict) or not self.selections or any(not isinstance(k, str) or not isinstance(v, str) or not k or not v for k, v in self.selections.items()):
            raise ValidationError({'selections': 'Enter at least one option=value pair.'})
        self.selections = dict(sorted(self.selections.items()))

    def __str__(self): return ' · '.join(self.selections.values())


def configured_price(product, selections):
    for variant in product.variant_prices.all():
        if variant.selections == selections:
            return variant.price
    return product.price

class Order(models.Model):
    reference = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=30)
    delivery = models.CharField(max_length=10, choices=[('pickup','Store pickup'),('delivery','Delivery')])
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    location = models.JSONField(null=True, blank=True)
    notes = models.TextField(blank=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default='GHS')
    payment_method = models.CharField(max_length=12, default='paystack', choices=[('paystack', 'Paystack (test)'), ('cod', 'Pay on delivery / pickup')])
    payment_status = models.CharField(max_length=12, default='pending', choices=[('pending','Pending'),('paid','Paid')])
    fulfillment_status = models.CharField(max_length=20, default='new', choices=[('new','New'),('processing','Processing'),('ready','Ready for pickup'),('shipped','Shipped'),('completed','Completed'),('cancelled','Cancelled')])
    created_at = models.DateTimeField(auto_now_add=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    class Meta: ordering = ['-created_at']
    def __str__(self): return self.reference

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    name = models.CharField(max_length=150)
    selections = models.JSONField(default=dict)
    quantity = models.PositiveSmallIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    def __str__(self): return f'{self.name} × {self.quantity}'
