from rest_framework import viewsets
from .models import FilmRecord, Catalog
from .serializers import FilmRecordSerializer, CatalogSerializer

class FilmRecordViewSet(viewsets.ModelViewSet):
    queryset = FilmRecord.objects.all()
    serializer_class = FilmRecordSerializer

class CatalogViewSet(viewsets.ModelViewSet):
    queryset = Catalog.objects.all()
    serializer_class = CatalogSerializer
