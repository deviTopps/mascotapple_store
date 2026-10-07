from django.contrib import admin
from django.db import transaction
from django.utils import timezone
from django.urls import reverse
from django.utils.html import format_html
from .forms import ProductAdminForm, OtherOptionForm, ProductColorImageForm
from .models import Category, Product, ProductOption, ProductColorImage, Order, OrderItem
admin.site.site_header = 'Mascot Store Administration'
admin.site.site_title = 'Mascot Admin'
admin.site.index_title = 'Manage your store'

class OptionInline(admin.TabularInline):
    model = ProductOption
    form = OtherOptionForm
    extra = 0
    verbose_name_plural = 'Other product options (e.g. case size)'

    def get_queryset(self, request):
        return super().get_queryset(request).exclude(key__in=['color', 'storage'])

class ColorImageInline(admin.TabularInline):
    model = ProductColorImage
    form = ProductColorImageForm
    extra = 0
    fields = ['color', 'image', 'image_alt']
    verbose_name_plural = 'Color photos (match the Product Color names above)'

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    form = ProductAdminForm
    list_display = ['name', 'category', 'price', 'is_active', 'sort_order', 'updated_at', 'edit_product']
    list_display_links = ['name']
    list_filter = ['category', 'is_active']
    list_editable = ['price', 'is_active', 'sort_order']
    search_fields = ['name', 'slug']
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = ['updated_at']
    inlines = [ColorImageInline, OptionInline]
    save_on_top = True

    @admin.display(description='Edit')
    def edit_product(self, obj):
        return format_html('<a href="{}" aria-label="Edit {}">Edit product</a>', reverse('admin:store_product_change', args=[obj.pk]), obj.name)

    fieldsets = [('Product', {'fields': ('name','slug','category','price','tag','is_active','sort_order')}), ('Product variants', {'fields': ('product_color', 'storage_size')}), ('Description', {'fields': ('description','long_description','highlights')}), ('Images and appearance', {'fields': ('image','image_path','image_alt','visual','tone')}), ('Record', {'fields': ('updated_at',)})]

    def save_related(self, request, form, formsets, change):
        super().save_related(request, form, formsets, change)
        for field, key, label, position in [('product_color', 'color', 'Color', 1), ('storage_size', 'storage', 'Storage', 0)]:
            # Changelist edits don't submit these fields; preserve their options.
            if form.add_prefix(field) not in form.data:
                continue
            values = form.cleaned_data[field]
            if values:
                ProductOption.objects.update_or_create(product=form.instance, key=key, defaults={'label': label, 'values': values, 'position': position})
            else:
                form.instance.options.filter(key=key).delete()

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    search_fields = ['name']

class ItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    fields = ['name','variant_details','quantity','unit_price','line_total']
    readonly_fields = fields

    @admin.display(description='Selected options')
    def variant_details(self, obj):
        return ' · '.join(f'{key.title()}: {value}' for key, value in obj.selections.items()) or '—'

    @admin.display(description='Line total (GHS)')
    def line_total(self, obj):
        return f'{obj.unit_price * obj.quantity:,.2f}' if obj.pk else '—'
    can_delete = False
    def has_add_permission(self, request, obj=None): return False

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['reference','name','order_total','payment_method','payment_status','delivery','fulfillment_status','created_at']
    list_editable = ['fulfillment_status']
    date_hierarchy = 'created_at'
    save_on_top = True
    actions = ['mark_cash_received']
    list_filter = ['payment_method','payment_status','fulfillment_status','delivery','created_at']
    search_fields = ['reference','name','email','phone']
    readonly_fields = [f.name for f in Order._meta.fields if f.name not in ['id','fulfillment_status']]
    inlines = [ItemInline]
    fieldsets = [
        ('Order', {'fields': ('reference', 'created_at', 'fulfillment_status')}),
        ('Customer', {'fields': ('name', 'email', 'phone')}),
        ('Delivery', {'fields': ('delivery', 'address', 'city', 'location', 'notes')}),
        ('Payment', {'fields': ('payment_method', 'payment_status', 'amount', 'currency', 'paid_at')}),
    ]

    @admin.display(description='Total', ordering='amount')
    def order_total(self, obj):
        return f'{obj.currency} {obj.amount:,.2f}'

    @admin.action(description='Mark selected delivery/pickup payments as received', permissions=['change'])
    def mark_cash_received(self, request, queryset):
        count = 0
        with transaction.atomic():
            for order in queryset.select_for_update().filter(payment_method='cod', payment_status='pending').exclude(fulfillment_status='cancelled'):
                order.payment_status = 'paid'
                order.paid_at = timezone.now()
                order.save(update_fields=['payment_status', 'paid_at'])
                self.log_change(request, order, 'Recorded delivery/pickup payment received.')
                count += 1
        self.message_user(request, f'{count} delivery/pickup payment(s) marked received. Online, cancelled, and already paid orders were left unchanged.')
    def has_add_permission(self, request): return False
    def has_delete_permission(self, request, obj=None): return False
