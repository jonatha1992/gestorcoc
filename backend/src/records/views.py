from django.http import FileResponse
from django.utils import timezone
from rest_framework import viewsets, views, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from .models import FilmRecord, Catalog
from .serializers import FilmRecordSerializer, CatalogSerializer
from .services import IntegrityService

class FilmRecordViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión completa de Registros Fílmicos.
    Incluye búsqueda, filtrado y acción de verificación CREV.
    """
    queryset = FilmRecord.objects.select_related(
        'camera', 
        'operator', 
        'received_by', 
        'verified_by_crev'
    ).all()
    serializer_class = FilmRecordSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    
    # Filtros
    filterset_fields = {
        'delivery_status': ['exact'],
        'has_backup': ['exact'],
        'is_editable': ['exact'],
        'entry_date': ['gte', 'lte', 'exact'],
        'verified_by_crev': ['isnull'],
    }
    
    # Búsqueda
    search_fields = [
        'judicial_case_number',
        'issue_number',
        'request_number',
        'case_title',
        'requester',
        'camera__name',
    ]
    
    # Ordenamiento
    ordering_fields = ['entry_date', 'created_at', 'delivery_status', 'id']
    ordering = ['-entry_date', '-created_at']
    
    @action(detail=True, methods=['post'])
    def verify_by_crev(self, request, pk=None):
        """
        Acción personalizada para que un fiscalizador CREV verifique un registro.
        Solo usuarios con permisos CREV pueden ejecutar esta acción.
        
        POST /api/film-records/{id}/verify_by_crev/
        Body: {
            "verified_by": <person_id>,
            "observations": "Observaciones opcionales"
        }
        """
        film_record = self.get_object()
        
        # Validar que el registro no esté ya verificado
        if film_record.verified_by_crev:
            return Response({
                'error': 'Este registro ya fue verificado por CREV',
                'verified_by': f"{film_record.verified_by_crev.last_name}, {film_record.verified_by_crev.first_name}",
                'verification_date': film_record.verification_date
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validar que tenga backup y hash
        if not film_record.has_backup or not film_record.file_hash:
            return Response({
                'error': 'El registro debe tener backup y hash calculado antes de ser verificado'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Obtener el verificador del request
        verified_by_id = request.data.get('verified_by')
        observations = request.data.get('observations', '')
        
        if not verified_by_id:
            return Response({
                'error': 'Debe especificar el ID del verificador CREV (verified_by)'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            from personnel.models import Person
            verified_by = Person.objects.get(id=verified_by_id)
        except Person.DoesNotExist:
            return Response({
                'error': f'No se encontró una persona con ID {verified_by_id}'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Marcar como verificado
        film_record.verified_by_crev = verified_by
        film_record.verification_date = timezone.now()
        film_record.is_editable = False  # Se bloquea automáticamente
        if observations:
            film_record.observations = film_record.observations + f"\n[CREV {timezone.now().strftime('%d/%m/%Y')}] {observations}" if film_record.observations else observations
        film_record.save()
        
        serializer = self.get_serializer(film_record)
        return Response({
            'message': 'Registro verificado exitosamente por CREV',
            'record': serializer.data
        }, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['get'])
    def verification_certificate(self, request, pk=None):
        """
        Genera y descarga el certificado PDF de verificación CREV.
        
        GET /api/film-records/{id}/verification_certificate/
        """
        film_record = self.get_object()
        
        # Generar el PDF
        pdf_buffer = IntegrityService.generate_verification_report(film_record)
        
        filename = f"certificado_integridad_registro_{film_record.id}.pdf"
        return FileResponse(
            pdf_buffer,
            as_attachment=True,
            filename=filename,
            content_type='application/pdf'
        )

class CatalogViewSet(viewsets.ModelViewSet):
    queryset = Catalog.objects.all()
    serializer_class = CatalogSerializer

class IntegrityReportView(views.APIView):
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, *args, **kwargs):
        file_obj = request.FILES.get('file')
        algorithm = request.data.get('algorithm', 'all').lower()

        if not file_obj:
            return Response({"error": "No file provided"}, status=status.HTTP_400_BAD_REQUEST)

        hashes = {}
        try:
            if algorithm in ['md5', 'all']:
                hashes['MD5'] = IntegrityService.calculate_file_hash(file_obj, 'md5')
            
            # Reset file pointer for next read
            file_obj.seek(0)
            
            if algorithm in ['sha256', 'all']:
                hashes['SHA256'] = IntegrityService.calculate_file_hash(file_obj, 'sha256')
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        pdf_buffer = IntegrityService.generate_integrity_pdf(file_obj.name, file_obj.size, hashes)
        
        return FileResponse(
            pdf_buffer,
            as_attachment=True,
            filename=f"integrity_report_{file_obj.name}.pdf",
            content_type='application/pdf'
        )

