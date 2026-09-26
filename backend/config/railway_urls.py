from django.urls import path
from store.media import product_image
from .urls import urlpatterns

urlpatterns = [*urlpatterns, path('media/<path:name>', product_image)]
