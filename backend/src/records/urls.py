from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    FilmRecordViewSet,
    CatalogViewSet,
    IntegrityReportView,
    IntegritySummaryReportView,
    VideoAnalysisReportView,
)

router = DefaultRouter()
router.register(r'film-records', FilmRecordViewSet)
router.register(r'catalogs', CatalogViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('integrity-check/', IntegrityReportView.as_view(), name='integrity-check'),
    path('integrity-summary-report/', IntegritySummaryReportView.as_view(), name='integrity-summary-report'),
    path('video-analysis-report/', VideoAnalysisReportView.as_view(), name='video-analysis-report'),
]
