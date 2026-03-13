from django.conf import settings
from django.db import migrations, models


ROLE_MAPPING = {
    "OP_EXTRACTION": "OPERADOR",
    "OP_CONTROL": "OPERADOR",
    "OP_VIEWER": "OPERADOR",
    "ADMIN": "ADMIN",
}


def migrate_roles(apps, schema_editor):
    Person = apps.get_model("personnel", "Person")
    for old_value, new_value in ROLE_MAPPING.items():
        Person.objects.filter(role=old_value).update(role=new_value)


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("personnel", "0012_externalperson_alter_person_badge_number"),
    ]

    operations = [
        migrations.CreateModel(
            name="UserAccountProfile",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("must_change_password", models.BooleanField(default=True)),
                (
                    "user",
                    models.OneToOneField(on_delete=models.deletion.CASCADE, related_name="account_profile", to=settings.AUTH_USER_MODEL),
                ),
            ],
            options={
                "verbose_name": "Perfil de cuenta",
                "verbose_name_plural": "Perfiles de cuenta",
            },
        ),
        migrations.AddField(
            model_name="person",
            name="user",
            field=models.OneToOneField(
                blank=True,
                help_text="Cuenta de sistema asociada",
                null=True,
                on_delete=models.deletion.SET_NULL,
                related_name="person",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AlterField(
            model_name="person",
            name="role",
            field=models.CharField(
                choices=[
                    ("OPERADOR", "Operador"),
                    ("COORDINADOR_COC", "Coordinador COC"),
                    ("CREV", "CREV"),
                    ("COORDINADOR_CREV", "Coordinador CREV"),
                    ("ADMIN", "Administrador"),
                ],
                default="OPERADOR",
                max_length=50,
            ),
        ),
        migrations.RunPython(migrate_roles, migrations.RunPython.noop),
    ]
