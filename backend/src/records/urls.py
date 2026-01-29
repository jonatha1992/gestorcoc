from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FilmRecordViewSet, CatalogViewSet

router = DefaultRouter()
router.register(r'film-records', FilmRecordViewSet)
router.register(r'catalogs', CatalogViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
