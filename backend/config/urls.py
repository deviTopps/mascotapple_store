from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path
from store import views
urlpatterns = [path('admin/', admin.site.urls), path('api/catalog/', views.catalog), path('api/orders/', views.create_order), path('api/orders/<str:reference>/paid/', views.mark_paid), path('api/health/', views.health)]
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
