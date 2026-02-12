import hashlib
import os
from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from datetime import datetime

class IntegrityService:
    @staticmethod
    def calculate_file_hash(file_obj, algorithm='sha256'):
        """
        Calcula el hash de un archivo usando el algoritmo especificado.
        
        Args:
            file_obj: Objeto de archivo (Django UploadedFile o file-like object)
            algorithm: 'md5' o 'sha256' (default: sha256)
        
        Returns:
            str: Hash hexadecimal del archivo
        """
        if algorithm == 'md5':
            hasher = hashlib.md5()
        elif algorithm == 'sha256':
            hasher = hashlib.sha256()
        else:
            raise ValueError(f"Algoritmo no soportado: {algorithm}")

        # Leer archivo en chunks para evitar problemas de memoria
        for chunk in file_obj.chunks():
            hasher.update(chunk)
            
        return hasher.hexdigest()
    
    @staticmethod
    def verify_existing_backup(backup_path, expected_hash, algorithm='sha256'):
        """
        Verifica la integridad de un archivo de backup existente.
        
        Args:
            backup_path: Ruta completa al archivo de backup
            expected_hash: Hash esperado para comparación
            algorithm: Algoritmo de hash utilizado
        
        Returns:
            dict: {'is_valid': bool, 'calculated_hash': str, 'message': str}
        """
        if not os.path.exists(backup_path):
            return {
                'is_valid': False,
                'calculated_hash': None,
                'message': f'El archivo no existe en la ruta: {backup_path}'
            }
        
        try:
            if algorithm == 'md5':
                hasher = hashlib.md5()
            elif algorithm == 'sha256':
                hasher = hashlib.sha256()
            else:
                raise ValueError(f"Algoritmo no soportado: {algorithm}")
            
            # Leer archivo en chunks
            with open(backup_path, 'rb') as f:
                while chunk := f.read(8192):
                    hasher.update(chunk)
            
            calculated_hash = hasher.hexdigest()
            is_valid = calculated_hash == expected_hash
            
            return {
                'is_valid': is_valid,
                'calculated_hash': calculated_hash,
                'message': 'Integridad verificada correctamente' if is_valid else 'El hash no coincide - archivo modificado'
            }
        except Exception as e:
            return {
                'is_valid': False,
                'calculated_hash': None,
                'message': f'Error al verificar archivo: {str(e)}'
            }

    @staticmethod
    def generate_integrity_pdf(file_name, file_size, hashes):
        """
        Genera un reporte PDF básico con detalles del archivo y hashes calculados.
        
        Args:
            file_name: Nombre del archivo
            file_size: Tamaño en bytes
            hashes: dict {'MD5': '...', 'SHA256': '...'}
        
        Returns:
            BytesIO: Buffer con el PDF generado
        """
        buffer = BytesIO()
        p = canvas.Canvas(buffer, pagesize=A4)
        width, height = A4

        # Header
        p.setFont("Helvetica-Bold", 18)
        p.drawString(50, height - 50, "Reporte de Integridad de Archivo")
        
        p.setFont("Helvetica", 10)
        p.drawString(50, height - 70, f"Generado el: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
        p.line(50, height - 80, width - 50, height - 80)

        # File Details
        y = height - 120
        p.setFont("Helvetica-Bold", 12)
        p.drawString(50, y, "Detalles del Archivo")
        y -= 20
        p.setFont("Helvetica", 12)
        p.drawString(70, y, f"Nombre: {file_name}")
        y -= 20
        p.drawString(70, y, f"Tamaño: {file_size} bytes")
        
        y -= 40
        p.line(50, y, width - 50, y)
        y -= 30

        # Hashes
        p.setFont("Helvetica-Bold", 12)
        p.drawString(50, y, "Verificación de Integridad (Hashes)")
        y -= 30

        for algo, hash_val in hashes.items():
            p.setFont("Helvetica-Bold", 11)
            p.drawString(70, y, f"{algo}:")
            p.setFont("Courier", 10)
            p.drawString(130, y, hash_val)
            y -= 25

        # Footer
        p.setFont("Helvetica-Oblique", 8)
        p.drawString(50, 50, "Este documento es un reporte generado automáticamente por el sistema GestorCOC.")
        p.drawString(50, 40, "No garantiza la autenticidad del archivo si este es modificado posteriormente.")

        p.showPage()
        p.save()
        
        buffer.seek(0)
        return buffer
    
    @staticmethod
    def generate_verification_report(film_record):
        """
        Genera un reporte completo de verificación para un FilmRecord.
        Incluye todos los datos del registro, verificación CREV y hash de integridad.
        
        Args:
            film_record: Instancia de FilmRecord
        
        Returns:
            BytesIO: Buffer con el PDF de certificación
        """
        buffer = BytesIO()
        p = canvas.Canvas(buffer, pagesize=A4)
        width, height = A4

        # Header
        p.setFont("Helvetica-Bold", 20)
        p.drawString(50, height - 50, "CERTIFICADO DE INTEGRIDAD")
        p.drawString(50, height - 75, "Registro Fílmico - GestorCOC")
        
        p.setFont("Helvetica", 9)
        p.drawString(50, height - 95, f"Generado el: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
        p.line(50, height - 105, width - 50, height - 105)

        # Información del Registro
        y = height - 140
        p.setFont("Helvetica-Bold", 14)
        p.drawString(50, y, f"Registro N° {film_record.id}")
        y -= 30
        
        # Datos principales
        p.setFont("Helvetica-Bold", 11)
        p.drawString(50, y, "Información de la Solicitud:")
        y -= 20
        p.setFont("Helvetica", 10)
        
        fields = [
            ("Nº Asunto", film_record.issue_number),
            ("Nº Causa Judicial", film_record.judicial_case_number),
            ("Solicitante", film_record.requester),
            ("Fecha de Ingreso", film_record.entry_date.strftime('%d/%m/%Y') if film_record.entry_date else 'N/A'),
            ("Cámara", film_record.camera.name if film_record.camera else 'N/A'),
            ("Período", f"{film_record.start_time.strftime('%d/%m/%Y %H:%M')} - {film_record.end_time.strftime('%d/%m/%Y %H:%M')}"),
        ]
        
        for label, value in fields:
            if value:
                p.drawString(70, y, f"{label}: {value}")
                y -= 18
        
        # Información de Backup
        y -= 20
        p.setFont("Helvetica-Bold", 11)
        p.drawString(50, y, "Información de Backup:")
        y -= 20
        p.setFont("Helvetica", 10)
        p.drawString(70, y, f"Ruta: {film_record.backup_path or 'No especificada'}")
        y -= 18
        p.drawString(70, y, f"Tamaño: {film_record.file_size or 'N/A'} bytes")
        
        # Hash de Integridad
        y -= 30
        p.setFont("Helvetica-Bold", 11)
        p.drawString(50, y, "Hash de Integridad (SHA-256):")
        y -= 20
        p.setFont("Courier", 8)
        p.drawString(70, y, film_record.file_hash or 'No calculado')
        
        # Verificación CREV
        y -= 40
        p.setFont("Helvetica-Bold", 12)
        p.drawString(50, y, "VERIFICACIÓN CREV")
        p.line(50, y - 5, width - 50, y - 5)
        y -= 25
        p.setFont("Helvetica", 10)
        
        if film_record.verified_by_crev:
            p.drawString(70, y, f"Verificado por: {film_record.verified_by_crev.last_name}, {film_record.verified_by_crev.first_name}")
            y -= 18
            p.drawString(70, y, f"Fecha de Verificación: {film_record.verification_date.strftime('%d/%m/%Y %H:%M:%S')}")
            y -= 18
            p.setFont("Helvetica-Bold", 10)
            p.setFillColorRGB(0, 0.5, 0)  # Verde
            p.drawString(70, y, "✓ REGISTRO CERTIFICADO Y BLOQUEADO PARA EDICIÓN")
        else:
            p.setFillColorRGB(0.8, 0, 0)  # Rojo
            p.drawString(70, y, "✗ PENDIENTE DE VERIFICACIÓN CREV")
        
        # Footer
        p.setFillColorRGB(0, 0, 0)  # Negro
        p.setFont("Helvetica-Oblique", 8)
        p.drawString(50, 50, "Este certificado es válido solo si el hash coincide con el archivo de backup.")
        p.drawString(50, 40, "Sistema GestorCOC - Centro de Operaciones y Control")

        p.showPage()
        p.save()
        
        buffer.seek(0)
        return buffer
