from personnel.models import Person

class UnitFilterMixin:
    """
    Mixin para aislar datos por la unidad operativa (Unit) del usuario autenticado.
    Los administradores y el personal CREV/Regional ven los datos de todas las unidades.
    El personal COC local solo ve los datos asociados a su propia unidad.
    """

    def is_global_viewer(self):
        user = getattr(self, "request", None) and self.request.user
        if not user or not user.is_authenticated:
            return False

        if user.is_superuser or getattr(user, 'role', '') == 'ADMIN':
            return True

        person = getattr(user, 'person', None)
        if not person:
            return False

        return person.role in [
            Person.ROLE_ADMIN,
            Person.ROLE_CREV,
            Person.ROLE_COORDINADOR_CREV
        ]

    def filter_by_unit(self, queryset, unit_field_path='unit'):
        """
        unit_field_path: El path del ORM hacia el campo `Unit`.
        Ejemplos:
          - 'unit' (para System)
          - 'system__unit' (para Server)
          - 'camera__server__system__unit' (para Hechos)
          - 'generator_unit' (para Registros)
        """
        user = getattr(self, "request", None) and self.request.user
        if not user or not user.is_authenticated:
            return queryset.none()

        if self.is_global_viewer():
            return queryset

        person = getattr(user, 'person', None)
        if not person or not person.unit:
            return queryset.none()

        filter_kwargs = {unit_field_path: person.unit}
        return queryset.filter(**filter_kwargs)
