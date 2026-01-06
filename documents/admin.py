from django.contrib import admin

from .models import Document, DocumentAttachment, FilmRecord


class DocumentAttachmentInline(admin.TabularInline):
    model = DocumentAttachment
    extra = 0


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ("reference_number", "doc_type", "status", "priority", "date")
    list_filter = ("doc_type", "status", "priority")
    search_fields = ("reference_number", "sender", "recipient", "subject")
    inlines = [DocumentAttachmentInline]


@admin.register(FilmRecord)
class FilmRecordAdmin(admin.ModelAdmin):
    list_display = ("nro_asunto", "estado", "fecha_ingreso")
    list_filter = ("estado",)
    search_fields = ("nro_asunto", "nro_solicitud", "solicitante")
