from core.forms import BaseModelForm

from core.models import OrganizationalUnit
from .models import Hecho


class HechoForm(BaseModelForm):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Solo unidades con Sala COC si existen; sino mostrar todas
        coc_units = OrganizationalUnit.objects.filter(has_coc=True)
        if coc_units.exists():
            self.fields["org_unit"].queryset = coc_units

    class Meta:
        model = Hecho
        fields = [
            "nro_orden",
            "fecha_intervencion",
            "novedad",
            "quien_detecta",
            "elementos",
            "sector",
            "cctv_system",
            "camera",
            "org_unit",
            "solucionado_coc",
            "genero_causa",
            "hs_resolucion",
            "detalle_cierre",
            "sugerencia",
            "falencia",
            "observaciones",
            "status",
            "resolved_at",
            "resolved_group",
        ]
