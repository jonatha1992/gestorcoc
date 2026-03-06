from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    FilmRecordViewSet,
    CatalogViewSet,
    IntegrityReportView,
    IntegritySummaryReportView,
    VideoAnalysisReportView,
    VideoAnalysisImproveTextView,
    AIUsageSummaryView,
    DashboardStatsView,
    DashboardNovedadesView,
    DashboardHechosView,
    DashboardRecordsView,
    DashboardPersonnelView,
    DashboardMapView,
    VideoAnalysisReportViewSet,
)

router = DefaultRouter()
router.register(r'film-records', FilmRecordViewSet)
router.register(r'catalogs', CatalogViewSet)
router.register(r'video-analysis-reports', VideoAnalysisReportViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('integrity-check/', IntegrityReportView.as_view(), name='integrity-check'),
    path('integrity-summary-report/', IntegritySummaryReportView.as_view(), name='integrity-summary-report'),
    path('video-analysis-report/', VideoAnalysisReportView.as_view(), name='video-analysis-report'),
    path('video-analysis-improve-text/', VideoAnalysisImproveTextView.as_view(), name='video-analysis-improve-text'),
    path('ai-usage-daily/', AIUsageSummaryView.as_view(), name='ai-usage-daily'),
    path('dashboard-stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('dashboard/novedades/', DashboardNovedadesView.as_view(), name='dashboard-novedades'),
    path('dashboard/hechos/', DashboardHechosView.as_view(), name='dashboard-hechos'),
    path('dashboard/records/', DashboardRecordsView.as_view(), name='dashboard-records'),
    path('dashboard/personnel/', DashboardPersonnelView.as_view(), name='dashboard-personnel'),
    path('dashboard/map/', DashboardMapView.as_view(), name='dashboard-map'),
]
