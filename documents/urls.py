from django.urls import path

from .views import (
    DocumentCreateView,
    DocumentListView,
    DocumentUpdateView,
    FilmRecordCreateView,
    FilmRecordListView,
    FilmRecordUpdateView,
)

app_name = "documents"

urlpatterns = [
    path("documents/", DocumentListView.as_view(), name="document_list"),
    path("documents/new/", DocumentCreateView.as_view(), name="document_create"),
    path("documents/<int:pk>/edit/", DocumentUpdateView.as_view(), name="document_update"),
    path("registros/", FilmRecordListView.as_view(), name="film_record_list"),
    path("nuevo-registro/", FilmRecordCreateView.as_view(), name="film_record_create"),
    path("editar-registro/<int:pk>/", FilmRecordUpdateView.as_view(), name="film_record_update"),
]
