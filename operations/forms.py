from core.forms import BaseModelForm

from .models import Hecho


class HechoForm(BaseModelForm):
    class Meta:
        model = Hecho
        fields = [
            "nro_orden",
            "fecha_intervencion",
            "novedad",
            "quien_detecta",
            "elementos",
            "sector",
            "solucionado_coc",
            "genero_causa",
            "hs_resolucion",
            "detalle_cierre",
            "sugerencia",
            "falencia",
            "observaciones",
        ]
