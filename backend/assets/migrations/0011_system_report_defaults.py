from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('assets', '0010_camera_server_cameramangear_assigned_to_name_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='system',
            name='report_authenticity_detail_default',
            field=models.CharField(blank=True, default='', help_text="Detalle sugerido cuando la autenticidad del material es 'otro'.", max_length=500),
        ),
        migrations.AddField(
            model_name='system',
            name='report_authenticity_mode_default',
            field=models.CharField(blank=True, choices=[('vms_propio', 'Autenticacion provista por el propio sistema'), ('hash_preventivo', 'Hash preventivo externo'), ('sin_autenticacion', 'Sin autenticacion'), ('otro', 'Otro metodo')], default='', help_text='Metodo sugerido para la autenticidad del material en informes.', max_length=20),
        ),
        migrations.AddField(
            model_name='system',
            name='report_hash_program_default',
            field=models.CharField(blank=True, default='', help_text='Programa de hash sugerido cuando aplica verificacion externa.', max_length=200),
        ),
        migrations.AddField(
            model_name='system',
            name='report_native_hash_algorithm_other_default',
            field=models.CharField(blank=True, default='', help_text='Texto libre para algoritmos nativos no contemplados en la lista.', max_length=200),
        ),
        migrations.AddField(
            model_name='system',
            name='report_native_hash_algorithms_default',
            field=models.JSONField(blank=True, default=list, help_text='Algoritmos hash nativos sugeridos para el informe.'),
        ),
    ]
