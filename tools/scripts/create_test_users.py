import os
import sys
import django

# Aseguramos que el path del backend este en sys.path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from personnel.models import Person, UserAccountProfile
from personnel.access import assign_role_group
from assets.models import Unit, System, Server, Camera
from hechos.models import Hecho
from novedades.models import Novedad
from records.models import FilmRecord
from django.test import Client

User = get_user_model()

def main():
    units = Unit.objects.filter(code__in=['AEP', 'EZE', 'FDO', 'BHI', 'MDQ'])
    
    print("--- CREANDO USUARIOS POR CENTRO ---")
    users_info = []
    
    for unit in units:
        username = f"op_{unit.code.lower()}"
        password = f"Pass{unit.code}123"
        
        # Crear User
        user, created = User.objects.get_or_create(username=username)
        if created:
            user.set_password(password)
            user.save()
            assign_role_group(user, 'OPERADOR')
            profile, _ = UserAccountProfile.objects.get_or_create(user=user)
            profile.must_change_password = False
            profile.save()
        else:
            user.set_password(password)
            user.save()
            
        # Crear Person
        person, p_created = Person.objects.get_or_create(user=user, defaults={
            'first_name': 'Operador',
            'last_name': unit.name,
            'badge_number': f"99{unit.code}",
            'role': 'OPERADOR',
            'unit': unit
        })
        if not p_created:
            person.unit = unit
            person.role = 'OPERADOR'
            person.save()

        users_info.append((username, password, unit))
        print(f"Usuario Creado/Actualizado: {username} | Pass: {password} | Centro: {unit.name}")

    print("\n--- GENERANDO DATOS DE PRUEBA SI NO EXISTEN ---")
    # Generar sistemas y camaras dummy si la unidad no tiene
    for i, (username, _, unit) in enumerate(users_info):
        system, _ = System.objects.get_or_create(name=f"Sys {unit.code}", unit=unit)
        server, _ = Server.objects.get_or_create(name=f"Srv {unit.code}", system=system, defaults={'ip_address': f"10.0.0.{200+i}"})
        camera, _ = Camera.objects.get_or_create(name=f"Cam {unit.code}", server=server, defaults={'status': 'ONLINE'})
        
        from django.utils import timezone
        now = timezone.now()
        # Hecho
        if not Hecho.objects.filter(camera=camera).exists():
             Hecho.objects.create(camera=camera, description=f"Hecho de prueba en {unit.name}", category='ASALTO', timestamp=now)
            
        # Novedad
        if not Novedad.objects.filter(camera=camera).exists():
             person = Person.objects.get(user__username=username)
             Novedad.objects.create(camera=camera, description=f"Novedad camara fallando en {unit.name}", severity='HIGH', status='OPEN', reported_by=person, reporter_name=username)
            
        # FilmRecord
        if not FilmRecord.objects.filter(generator_unit=unit).exists():
             FilmRecord.objects.create(generator_unit=unit, case_title=f"Expediente {unit.code}", request_type='OFICIO', request_number=f"123-{unit.code}", judicial_case_number=f"J-{unit.code}", entry_date=now.date())

    print("\n--- VERIFICANDO AISLAMIENTO DE DATOS (TESTING) ---")
    client = Client()
    for username, password, unit in users_info:
        # Hacer login
        login_success = client.login(username=username, password=password)
        if not login_success:
            print(f"[{unit.code}] Error al loguear con {username}")
            continue

        url_hechos = '/api/hechos/'
        resp = client.get(url_hechos)
        if resp.status_code == 200:
            hechos_data = resp.json()
            hechos_count = hechos_data.get('count', len(hechos_data)) if isinstance(hechos_data, dict) else len(hechos_data)
        else:
            hechos_count = f"Error {resp.status_code}"

        resp = client.get('/api/novedades/')
        if resp.status_code == 200:
             nov_data = resp.json()
             nov_count = nov_data.get('count', len(nov_data)) if isinstance(nov_data, dict) else len(nov_data)
        else:
             nov_count = f"Error {resp.status_code}"

        resp = client.get('/api/records/')
        if resp.status_code == 200:
            rec_data = resp.json()
            rec_count = rec_data.get('count', len(rec_data)) if isinstance(rec_data, dict) else len(rec_data)
        else:
            rec_count = f"Error {resp.status_code}"
            
        print(f"[{unit.code}] Visto por {username}: {hechos_count} Hechos | {nov_count} Novedades | {rec_count} Records")
        client.logout()

    print("\nTodo listo. Puedes ingresar con los usuarios creados y verificar visualmente.")

if __name__ == '__main__':
    main()
