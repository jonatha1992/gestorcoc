from django.core.validators import RegexValidator
from django.db import migrations, models


RANK_CHOICES = {
    "JEFE",
    "OFICIAL_AYUDANTE_PRINCIPAL",
    "OFICIAL_PRINCIPAL",
    "OFICIAL",
    "MAYOR",
    "OFICIAL_JEFE",
    "SUBINSPECTOR",
    "INSPECTOR",
    "COMISIONADO_MAYOR",
    "COMISIONADO_GENERAL",
    "CIVIL",
}


def normalize_person_data(apps, schema_editor):
    Person = apps.get_model("personnel", "Person")

    used_badges = set()
    for person in Person.objects.order_by("id"):
        digits = "".join(ch for ch in str(person.badge_number or "") if ch.isdigit())
        if digits:
            candidate = digits[-6:].zfill(6)
        else:
            candidate = f"{person.id % 1000000:06d}"

        candidate_int = int(candidate)
        attempts = 0
        while candidate in used_badges:
            candidate_int = (candidate_int + 1) % 1000000
            candidate = f"{candidate_int:06d}"
            attempts += 1
            if attempts > 1000000:
                raise RuntimeError("No se pudo generar un legajo unico de 6 digitos.")
        used_badges.add(candidate)

        normalized_rank = (person.rank or "").strip().upper().replace(" ", "_")
        if normalized_rank not in RANK_CHOICES:
            normalized_rank = "CIVIL"

        updates = {}
        if person.badge_number != candidate:
            updates["badge_number"] = candidate
        if person.rank != normalized_rank:
            updates["rank"] = normalized_rank

        if updates:
            Person.objects.filter(pk=person.pk).update(**updates)


def noop_reverse(apps, schema_editor):
    return


class Migration(migrations.Migration):

    dependencies = [
        ("personnel", "0010_rename_operator_to_operador"),
    ]

    operations = [
        migrations.RunPython(normalize_person_data, noop_reverse),
        migrations.AlterField(
            model_name="person",
            name="badge_number",
            field=models.CharField(
                help_text="Legajo (6 digitos)",
                max_length=6,
                unique=True,
                validators=[
                    RegexValidator(
                        message="El legajo debe contener exactamente 6 digitos.",
                        regex="^\\d{6}$",
                    )
                ],
            ),
        ),
        migrations.AlterField(
            model_name="person",
            name="rank",
            field=models.CharField(
                choices=[
                    ("JEFE", "Jefe"),
                    ("OFICIAL_AYUDANTE_PRINCIPAL", "Oficial Ayudante Principal"),
                    ("OFICIAL_PRINCIPAL", "Oficial Principal"),
                    ("OFICIAL", "Oficial"),
                    ("MAYOR", "Mayor"),
                    ("OFICIAL_JEFE", "Oficial Jefe"),
                    ("SUBINSPECTOR", "Subinspector"),
                    ("INSPECTOR", "Inspector"),
                    ("COMISIONADO_MAYOR", "Comisionado Mayor"),
                    ("COMISIONADO_GENERAL", "Comisionado General"),
                    ("CIVIL", "Civil"),
                ],
                default="CIVIL",
                help_text="Jerarquia",
                max_length=40,
            ),
        ),
        migrations.CreateModel(
            name="ExternalPerson",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("first_name", models.CharField(max_length=100)),
                ("last_name", models.CharField(max_length=100)),
                (
                    "dni",
                    models.CharField(
                        db_index=True,
                        max_length=10,
                        unique=True,
                        validators=[
                            RegexValidator(
                                message="El DNI debe contener solo numeros (entre 7 y 10 digitos).",
                                regex="^\\d{7,10}$",
                            )
                        ],
                    ),
                ),
                ("email", models.EmailField(max_length=254)),
                ("function", models.CharField(help_text="Funcion que cumple", max_length=150)),
                ("is_active", models.BooleanField(default=True)),
            ],
            options={
                "verbose_name": "Personal externo",
                "verbose_name_plural": "Personal externo",
                "ordering": ["last_name", "first_name"],
            },
        ),
    ]
