import json
import secrets
from decimal import Decimal
from functools import wraps
from django.conf import settings
from django.db import transaction
from django.core.exceptions import ValidationError
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST
from .models import Product, Order, OrderItem

@require_GET
def health(request): return JsonResponse({'status': 'ok'})

@require_GET
def catalog(request):
    result = []
    for p in Product.objects.filter(is_active=True).select_related('category').prefetch_related('options'):
        result.append({'slug': p.slug, 'name': p.name, 'category': p.category.name, 'price': f'GH₵{p.price:,.2f}' if p.price is not None else 'Contact for price', 'priceValue': float(p.price) if p.price is not None else None, 'tag': p.tag, 'description': p.description, 'longDescription': p.long_description, 'image': f'/api/store-media/{p.image.name}' if p.image else p.image_path or '/main_logo.jpg', 'imageAlt': p.image_alt or p.name, 'highlights': [v.strip() for v in p.highlights.splitlines() if v.strip()], 'visual': p.visual, 'tone': p.tone, 'options': [{'id': o.key, 'label': o.label, 'values': o.value_list()} for o in p.options.all()]})
    return JsonResponse({'products': result}, headers={'Cache-Control': 'no-store'})

def internal(view):
    @wraps(view)
    def wrapped(request, *args, **kwargs):
        token = request.headers.get('Authorization', '').removeprefix('Bearer ')
        if not settings.INTERNAL_API_TOKEN or not secrets.compare_digest(token, settings.INTERNAL_API_TOKEN):
            return JsonResponse({'error': 'Unauthorized'}, status=401)
        return view(request, *args, **kwargs)
    return wrapped

@csrf_exempt
@require_POST
@internal
def create_order(request):
    try:
        if len(request.body) > 32000: raise ValueError('Order too large')
        data = json.loads(request.body)
        if not isinstance(data, dict): raise ValueError('Invalid request')
        reference = data['reference']
        if not isinstance(reference, str) or not reference.startswith('mascot-') or len(reference) > 100: raise ValueError('Invalid reference')
        lines = data['items']
        if not isinstance(lines, list) or not 1 <= len(lines) <= 100: raise ValueError('Invalid items')
        amount = 0
        items = []
        seen = set()
        for line in lines:
            p = Product.objects.prefetch_related('options').get(slug=line['slug'], is_active=True)
            quantity = line['quantity']
            if type(quantity) is not int or not 1 <= quantity <= 99 or p.price is None: raise ValueError('Invalid quantity or price')
            selections = line['selections']
            options = {o.key: o.value_list() for o in p.options.all()}
            if not isinstance(selections, dict) or set(selections) != set(options) or any(v not in options[k] for k, v in selections.items()): raise ValueError('Invalid product options')
            identity = (p.pk, json.dumps(selections, sort_keys=True))
            if identity in seen: raise ValueError('Duplicate variant')
            seen.add(identity)
            amount += int(p.price * 100) * quantity
            items.append((p, quantity, selections))
        if amount != data['amount'] or data['currency'] != 'GHS': raise ValueError('Prices changed. Refresh your cart.')
        if data['delivery'] not in ['pickup', 'delivery']: raise ValueError('Invalid delivery')
        payment_method = data.get('paymentMethod', 'paystack')
        if payment_method not in ['cod', 'paystack']: raise ValueError('Invalid payment method')
        with transaction.atomic():
            order, created = Order.objects.get_or_create(reference=reference, defaults={k: data.get(k, '') for k in ['name','email','phone','delivery','address','city','notes']} | {'location': data.get('location'), 'amount': Decimal(amount) / 100, 'payment_method': payment_method})
            if not created:
                matches = payment_method == 'cod' and order.payment_method == 'cod' and order.amount == Decimal(amount) / 100
                matches = matches and all(getattr(order, k) == data.get(k, '') for k in ['name','email','phone','delivery','address','city','notes']) and order.location == data.get('location')
                saved = [(line.product_id, line.quantity, line.selections) for line in order.items.order_by('id')]
                matches = matches and saved == [(p.pk, q, s) for p, q, s in items]
                if matches: return JsonResponse({'reference': order.reference, 'status': 'placed'})
                return JsonResponse({'error': 'Reference already exists'}, status=409)
            order.full_clean()
            OrderItem.objects.bulk_create([OrderItem(order=order, product=p, name=p.name, quantity=q, selections=s, unit_price=p.price) for p,q,s in items])
        return JsonResponse({'reference': order.reference}, status=201)
    except (KeyError, TypeError, ValueError, ValidationError, Product.DoesNotExist) as error:
        return JsonResponse({'error': str(error) or 'Invalid order'}, status=400)

@csrf_exempt
@require_POST
@internal
def mark_paid(request, reference):
    try:
        data = json.loads(request.body)
        if not isinstance(data, dict): raise ValueError('Invalid request')
        with transaction.atomic():
            order = Order.objects.select_for_update().get(reference=reference)
            if order.payment_method != 'paystack' or data.get('amount') != int(order.amount * 100) or data.get('currency') != order.currency or data.get('domain') != 'test':
                return JsonResponse({'error': 'Payment mismatch'}, status=400)
            if order.payment_status != 'paid':
                order.payment_status = 'paid'
                order.paid_at = timezone.now()
                order.save(update_fields=['payment_status','paid_at'])
        return JsonResponse({'reference': reference, 'status': 'paid'})
    except Order.DoesNotExist: return JsonResponse({'error': 'Order not found'}, status=404)
    except (ValueError, TypeError): return JsonResponse({'error': 'Invalid payment'}, status=400)
