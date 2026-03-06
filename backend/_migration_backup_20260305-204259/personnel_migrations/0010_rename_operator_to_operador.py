from django.db import migrations, models


def forward_rename_operator(apps, schema_editor):
    Person = apps.get_model("personnel", "Person")
    Person.objects.filter(role="OPERATOR").update(role="OPERADOR")


def reverse_rename_operator(apps, schema_editor):
    Person = apps.get_model("personnel", "Person")
    Person.objects.filter(role="OPERADOR").update(role="OPERATOR")


class Migration(migrations.Migration):

    dependencies = [
        ("personnel", "0009_alter_person_role"),
    ]

    operations = [
        migrations.RunPython(forward_rename_operator, reverse_rename_operator),
        migrations.AlterField(
            model_name="person",
            name="role",
            field=models.CharField(
                choices=[
                    ("OPERADOR", "Operador COC"),
                    ("SUPERVISOR", "Fiscalizador CREV"),
                    ("ADMIN", "Administrador"),
                ],
                default="OPERADOR",
                max_length=50,
            ),
        ),
    ]

