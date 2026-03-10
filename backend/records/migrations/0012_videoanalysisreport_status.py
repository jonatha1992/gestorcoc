from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('records', '0011_alter_filmrecord_operator'),
    ]

    operations = [
        migrations.AddField(
            model_name='videoanalysisreport',
            name='status',
            field=models.CharField(
                choices=[('PENDIENTE', 'Pendiente'), ('BORRADOR', 'Borrador'), ('FINALIZADO', 'Finalizado')],
                default='PENDIENTE',
                max_length=20,
            ),
        ),
    ]
