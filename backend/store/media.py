"""Serve persistent product images on Railway, where there is no Caddy service."""
from pathlib import Path

from django.conf import settings
from django.http import FileResponse, Http404
from django.views.decorators.http import require_safe

IMAGE_TYPES = {
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
    '.webp': 'image/webp', '.gif': 'image/gif', '.avif': 'image/avif',
}


@require_safe
def product_image(request, name):
    root = Path(settings.MEDIA_ROOT).resolve()
    image = (root / name).resolve()
    content_type = IMAGE_TYPES.get(image.suffix.lower())
    if not image.is_relative_to(root) or not content_type or not image.is_file():
        raise Http404
    try:
        stream = image.open('rb')
    except OSError:
        raise Http404
    response = FileResponse(stream, content_type=content_type)
    response['Cache-Control'] = 'public, max-age=60'
    response['X-Content-Type-Options'] = 'nosniff'
    return response
