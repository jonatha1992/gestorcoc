from django import forms

from core.forms import BaseModelForm

from .models import Document, FilmRecord


class MultiFileInput(forms.ClearableFileInput):
    allow_multiple_selected = True


class MultipleFileField(forms.FileField):
    def clean(self, data, initial=None):
        if data in self.empty_values:
            return []
        if not isinstance(data, (list, tuple)):
            data = [data]
        cleaned_files = []
        for single in data:
            cleaned_files.append(super().clean(single, initial))
        return cleaned_files


class DocumentForm(BaseModelForm):
    attachments = MultipleFileField(
        required=False,
        widget=MultiFileInput(attrs={"multiple": True}),
        help_text="Puedes adjuntar uno o varios archivos.",
    )

    class Meta:
        model = Document
        fields = [
            "doc_type",
            "date",
            "reference_number",
            "sender",
            "recipient",
            "subject",
            "description",
            "status",
            "priority",
        ]


class FilmRecordForm(BaseModelForm):
    class Meta:
        model = FilmRecord
        fields = [
            "nro_asunto",
            "nro_orden",
            "fecha_ingreso",
            "tipo_solicitud",
            "nro_solicitud",
            "solicitante",
            "causa_judicial",
            "caratula",
            "fecha_hecho",
            "tipo_delito",
            "unidad",
            "recepcionado_por",
            "confeccionado_por",
            "detalle",
            "nro_dvd",
            "nro_informe",
            "ifgra",
            "nro_expediente",
            "acta_entrega",
            "fecha_salida",
            "retirado_por",
            "organismo",
            "estado",
            "observaciones",
            "org_unit",
            "org_system",
        ]
