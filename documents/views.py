from django.contrib.auth.mixins import LoginRequiredMixin
from django.urls import reverse_lazy
from django.views.generic import CreateView, ListView, UpdateView

from core.permissions import ModulePermissionRequiredMixin
from .forms import DocumentForm, FilmRecordForm
from .models import Document, DocumentAttachment, FilmRecord


class AuditCreateMixin:
    def form_valid(self, form):
        if hasattr(form.instance, "created_by") and not form.instance.created_by:
            form.instance.created_by = self.request.user
        return super().form_valid(form)


class DocumentListView(ModulePermissionRequiredMixin, ListView):
    module = "documents"
    model = Document
    template_name = "documents/document_list.html"

    def get_queryset(self):
        return Document.objects.select_related("created_by")


class DocumentCreateView(ModulePermissionRequiredMixin, AuditCreateMixin, CreateView):
    module = "documents"
    action = "create"
    model = Document
    form_class = DocumentForm
    template_name = "documents/document_form.html"
    success_url = reverse_lazy("documents:document_list")

    def form_valid(self, form):
        response = super().form_valid(form)
        files = form.cleaned_data.get("attachments", [])
        for file in files:
            DocumentAttachment.objects.create(
                document=self.object,
                file=file,
                original_name=file.name,
            )
        return response


class DocumentUpdateView(ModulePermissionRequiredMixin, UpdateView):
    module = "documents"
    action = "update"
    model = Document
    form_class = DocumentForm
    template_name = "documents/document_form.html"
    success_url = reverse_lazy("documents:document_list")

    def form_valid(self, form):
        response = super().form_valid(form)
        files = form.cleaned_data.get("attachments", [])
        for file in files:
            DocumentAttachment.objects.create(
                document=self.object,
                file=file,
                original_name=file.name,
            )
        return response


class FilmRecordListView(ModulePermissionRequiredMixin, ListView):
    module = "registros"
    model = FilmRecord
    template_name = "documents/film_record_list.html"

    def get_queryset(self):
        return FilmRecord.objects.select_related("tipo_solicitud", "tipo_delito", "org_unit", "org_system")


class FilmRecordCreateView(ModulePermissionRequiredMixin, AuditCreateMixin, CreateView):
    module = "registros"
    action = "create"
    model = FilmRecord
    form_class = FilmRecordForm
    template_name = "documents/film_record_form.html"
    success_url = reverse_lazy("documents:film_record_list")


class FilmRecordUpdateView(ModulePermissionRequiredMixin, UpdateView):
    module = "registros"
    action = "update"
    model = FilmRecord
    form_class = FilmRecordForm
    template_name = "documents/film_record_form.html"
    success_url = reverse_lazy("documents:film_record_list")
