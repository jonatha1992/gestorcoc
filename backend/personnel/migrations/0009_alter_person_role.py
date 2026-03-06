from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('personnel', '0008_alter_person_options'),
    ]

    operations = [
        migrations.AlterField(
            model_name='person',
            name='role',
            field=models.CharField(
                choices=[
                    ("ADMIN", "Administrador"),
                    ("OP_EXTRACTION", "Operador Basico (Extraccion/Visualizacion)"),
                    ("OP_CONTROL", "Operador de Camaras (Fijas/Domos/PTZ)"),
                    ("OP_VIEWER", "Solo Visualizacion"),
                ],
                default="OP_VIEWER",
                max_length=20,
                verbose_name="Rol",
            ),
        ),
    ]
