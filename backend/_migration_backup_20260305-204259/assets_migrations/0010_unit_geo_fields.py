from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('assets', '0009_alter_camera_name_alter_camera_status_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='unit',
            name='latitude',
            field=models.DecimalField(blank=True, decimal_places=6, help_text='Latitud', max_digits=9, null=True),
        ),
        migrations.AddField(
            model_name='unit',
            name='longitude',
            field=models.DecimalField(blank=True, decimal_places=6, help_text='Longitud', max_digits=9, null=True),
        ),
        migrations.AddField(
            model_name='unit',
            name='map_enabled',
            field=models.BooleanField(db_index=True, default=False, help_text='Mostrar en mapa operacional'),
        ),
        migrations.AddField(
            model_name='unit',
            name='province',
            field=models.CharField(blank=True, help_text='Provincia', max_length=100, null=True),
        ),
    ]
