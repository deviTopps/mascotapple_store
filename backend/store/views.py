import json
import logging
import secrets
from decimal import Decimal
from functools import wraps
from django.conf import settings
from django.db import DatabaseError, connection, transaction
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST
from .models import Product, Order, OrderItem, configured_price

logger = logging.getLogger(__name__)


def send_order_confirmation(reference):
    order = Order.objects.prefetch_related('items').get(reference=reference)
    if order.confirmation_email_sent_at:
        return

    item_lines = []
    for item in order.items.all():
        options = ', '.join(f'{key.replace("_", " ").title()}: {value}' for key, value in item.selections.items())
        description = f'{item.name} ({options})' if options else item.name
        line_total = item.unit_price * item.quantity
        item_lines.append(f'- {description} × {item.quantity}: {order.currency} {line_total:,.2f}')

    delivery = 'Store pickup' if order.delivery == 'pickup' else 'Delivery'
    if order.delivery == 'delivery':
        delivery += f' to {order.address}, {order.city}'
    payment = 'Pay on delivery / pickup' if order.payment_method == 'cod' else 'Paystack (test payment confirmed)'
    status = 'Payment is due when you receive your order.' if order.payment_method == 'cod' else 'Your Paystack test payment has been confirmed.'
    body_lines = [
        f'Hello {order.name},',
        '',
        'Thank you for your order from Mascot Apple Dealz GH.',
        f'Order reference: {order.reference}',
        f'Contact phone: {order.phone}',
        '',
        'Items:',
        *item_lines,
        '',
        f'Total: {order.currency} {order.amount:,.2f}',
        f'Delivery: {delivery}',
        f'Payment method: {payment}',
        status,
    ]
    if order.notes:
        body_lines.extend(['', f'Order notes: {order.notes}'])
    body_lines.extend(['', f'Contact us at {settings.DEFAULT_FROM_EMAIL.split("<")[-1].rstrip("> ")} if you need help.'])
    body = '\n'.join(body_lines)
    sent = send_mail(
        f'Order confirmation {order.reference} — Mascot Apple Dealz GH',
        body,
        settings.DEFAULT_FROM_EMAIL,
        [order.email],
        fail_silently=False,
    )
    if sent:
        Order.objects.filter(pk=order.pk, confirmation_email_sent_at__isnull=True).update(confirmation_email_sent_at=timezone.now())
    else:
        logger.error('Order confirmation email was not accepted for order %s', order.reference)

@require_GET
def health(request):
    try:
        with connection.cursor() as cursor:
            cursor.execute('SELECT 1')
    except DatabaseError:
        return JsonResponse({'status': 'unavailable'}, status=503, headers={'Cache-Control': 'no-store'})
    return JsonResponse({'status': 'ok'}, headers={'Cache-Control': 'no-store'})

@require_GET
def catalog(request):
    result = []
    for p in Product.objects.filter(is_active=True).select_related('category').prefetch_related('options', 'variant_prices'):
        version = int(p.updated_at.timestamp() * 1000000)
        primary = f'/api/store-media/{p.image.name}?v={version}' if p.image else p.image_path
        images = ([primary] if primary else []) + [f'/api/store-media/{image.name}?v={version}' for image in [p.image_2, p.image_3, p.image_4] if image]
        result.append({'colorImagePositions': p.color_image_positions, 'images': images or ['/main_logo.jpg'], 'slug': p.slug, 'name': p.name, 'category': p.category.name, 'price': f'GH₵{p.price:,.2f}' if p.price is not None else 'Contact for price', 'priceValue': float(p.price) if p.price is not None else None, 'tag': p.tag, 'description': p.description, 'longDescription': p.long_description, 'image': f'/api/store-media/{p.image.name}?v={int(p.updated_at.timestamp() * 1000000)}' if p.image else p.image_path or '/main_logo.jpg', 'imageAlt': p.image_alt or p.name, 'highlights': [v.strip() for v in p.highlights.splitlines() if v.strip()], 'visual': p.visual, 'tone': p.tone, 'variantPrices': [{'selections': v.selections, 'priceValue': float(v.price)} for v in p.variant_prices.all()], 'options': [{'id': o.key, 'label': o.label, 'values': o.value_list()} for o in p.options.all()]})
    return JsonResponse({'products': result}, headers={'Cache-Control': 'no-store'})

def internal(view):
    @wraps(view)
    def wrapped(request, *args, **kwargs):
        authorization = request.headers.get('Authorization', '')
        token = authorization.removeprefix('Bearer ')
        if not authorization.startswith('Bearer ') or not settings.INTERNAL_API_TOKEN or not secrets.compare_digest(token.encode(), settings.INTERNAL_API_TOKEN.encode()):
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
            p = Product.objects.prefetch_related('options', 'variant_prices').get(slug=line['slug'], is_active=True)
            quantity = line['quantity']
            if type(quantity) is not int or not 1 <= quantity <= 99: raise ValueError('Invalid quantity or price')
            selections = line['selections']
            options = {o.key: o.value_list() for o in p.options.all()}
            if not isinstance(selections, dict) or set(selections) != set(options) or any(v not in options[k] for k, v in selections.items()): raise ValueError('Invalid product options')
            identity = (p.pk, json.dumps(selections, sort_keys=True))
            if identity in seen: raise ValueError('Duplicate variant')
            seen.add(identity)
            unit_price = configured_price(p, selections)
            if unit_price is None: raise ValueError('Price confirmation required')
            amount += int(unit_price * 100) * quantity
            items.append((p, quantity, selections, unit_price))
        if amount != data['amount'] or data['currency'] != 'GHS': raise ValueError('Prices changed. Refresh your cart.')
        if data['delivery'] not in ['pickup', 'delivery']: raise ValueError('Invalid delivery')
        payment_method = data.get('paymentMethod', 'paystack')
        if payment_method not in ['cod', 'paystack']: raise ValueError('Invalid payment method')
        confirmation_reference = None
        with transaction.atomic():
            order, created = Order.objects.get_or_create(reference=reference, defaults={k: data.get(k, '') for k in ['name','email','phone','delivery','address','city','notes']} | {'location': data.get('location'), 'amount': Decimal(amount) / 100, 'payment_method': payment_method})
            if not created:
                matches = payment_method == 'cod' and order.payment_method == 'cod' and order.amount == Decimal(amount) / 100
                matches = matches and all(getattr(order, k) == data.get(k, '') for k in ['name','email','phone','delivery','address','city','notes']) and order.location == data.get('location')
                saved = [(line.product_id, line.quantity, line.selections) for line in order.items.order_by('id')]
                matches = matches and saved == [(p.pk, q, s) for p, q, s, price in items]
                if not matches: return JsonResponse({'error': 'Reference already exists'}, status=409)
            else:
                order.full_clean()
                OrderItem.objects.bulk_create([OrderItem(order=order, product=p, name=p.name, quantity=q, selections=s, unit_price=price) for p,q,s,price in items])
            if order.payment_method == 'cod' and not order.confirmation_email_sent_at:
                confirmation_reference = order.reference
        if confirmation_reference:
            try:
                send_order_confirmation(confirmation_reference)
            except Exception:
                logger.exception('Could not send order confirmation for order %s', confirmation_reference)
        return JsonResponse({'reference': order.reference, 'status': 'placed'}, status=201 if created else 200)
    except (KeyError, TypeError, ValueError, ValidationError, Product.DoesNotExist):
        return JsonResponse({'error': 'Invalid order. Check the details and refresh your cart.'}, status=400)

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
            should_send_confirmation = not order.confirmation_email_sent_at
        if should_send_confirmation:
            try:
                send_order_confirmation(reference)
            except Exception:
                logger.exception('Could not send order confirmation for order %s', reference)
        return JsonResponse({'reference': reference, 'status': 'paid'})
    except Order.DoesNotExist: return JsonResponse({'error': 'Order not found'}, status=404)
    except (ValueError, TypeError): return JsonResponse({'error': 'Invalid payment'}, status=400)
