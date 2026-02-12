from rest_framework import viewsets
from .models import Novedad
from .serializers import NovedadSerializer


class NovedadViewSet(viewsets.ModelViewSet):
    queryset = Novedad.objects.all()
    serializer_class = NovedadSerializer
