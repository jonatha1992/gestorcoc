import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

# Resetear password del admin
admin = User.objects.filter(username='admin').first()
if admin:
    admin.set_password('Temp123456!')
    admin.save()
    print(f"Password de '{admin.username}' actualizada a 'Temp123456!'")
    
    # Verificar
    print(f"Password Check: {admin.check_password('Temp123456!')}")
else:
    print("Usuario admin no encontrado")
