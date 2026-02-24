import hashlib
import os
import base64
import binascii
from io import BytesIO
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from pathlib import Path

class IntegrityService:
    @staticmethod
    def _as_text(value, default=''):
        if value is None:
            return default
        return str(value)

    @staticmethod
    def _add_heading_safe(document, text, level=1):
        style_by_level = {1: "Heading 1", 2: "Heading 2", 3: "Heading 3"}
        style_name = style_by_level.get(level)
        if style_name:
            try:
                return document.add_paragraph(text, style=style_name)
            except Exception:
                pass
        paragraph = document.add_paragraph(text)
        if level == 1:
            paragraph.runs[0].bold = True
            paragraph.runs[0].font.size = None
        elif level == 2:
            paragraph.runs[0].bold = True
        return paragraph

    @staticmethod
    def _decode_base64_image(content_base64):
        payload = content_base64.split(',', 1)[1] if ',' in content_base64 else content_base64
        try:
            return base64.b64decode(payload, validate=True)
        except (ValueError, binascii.Error) as exc:
            raise RuntimeError("No se pudo decodificar un fotograma en base64.") from exc

    @staticmethod
    def _prepare_picture_stream(frame):
        raw = IntegrityService._decode_base64_image(frame.get('content_base64', ''))
        mime = frame.get('mime_type')
        if mime != 'image/webp':
            return BytesIO(raw)

        try:
            from PIL import Image
        except ImportError as exc:
            raise RuntimeError("Falta Pillow para procesar imagenes WEBP.") from exc

        try:
            source = BytesIO(raw)
            target = BytesIO()
            with Image.open(source) as image:
                image.convert('RGB').save(target, format='PNG')
            target.seek(0)
            return target
        except Exception as exc:
            raise RuntimeError("No se pudo convertir un fotograma WEBP.") from exc

    @staticmethod
    def _append_frames_annex(document, frames):
        if not frames:
            return

        try:
            from docx.shared import Inches
        except ImportError as exc:
            raise RuntimeError("python-docx no permite insertar imagenes (docx.shared no disponible).") from exc

        ordered = sorted(frames, key=lambda frame: frame.get('order', 0))
        document.add_page_break()
        IntegrityService._add_heading_safe(document, "Anexo de fotogramas", level=1)

        for idx, frame in enumerate(ordered, start=1):
            file_name = frame.get('file_name', f'fotograma_{idx}.jpg')
            description = frame.get('description') or ''
            IntegrityService._add_heading_safe(document, f"Fotograma {idx}: {file_name}", level=2)
            pic_stream = IntegrityService._prepare_picture_stream(frame)
            try:
                document.add_picture(pic_stream, width=Inches(6.2))
            except Exception as exc:
                raise RuntimeError(f"No se pudo insertar el fotograma '{file_name}'.") from exc

            if description:
                document.add_paragraph(f"Descripcion: {description}")

            document.add_paragraph("")

    @staticmethod
    def _normalize_video_payload(payload):
        # Nuevo formato recomendado: {'report_data': {...}, 'frames': [...]}
        if 'report_data' in payload:
            return payload.get('report_data') or {}, payload.get('frames') or []
        # Compatibilidad legacy
        return payload, []

    @staticmethod
    def _replace_text_in_docx(document, replacements):
        def replace_in_paragraph(paragraph):
            original = paragraph.text
            updated = original
            for src, dst in replacements:
                updated = updated.replace(src, dst)
            if updated != original:
                paragraph.text = updated

        for paragraph in document.paragraphs:
            replace_in_paragraph(paragraph)

        for table in document.tables:
            for row in table.rows:
                for cell in row.cells:
                    for paragraph in cell.paragraphs:
                        replace_in_paragraph(paragraph)

        for section in document.sections:
            for paragraph in section.header.paragraphs:
                replace_in_paragraph(paragraph)
            for paragraph in section.footer.paragraphs:
                replace_in_paragraph(paragraph)

    @staticmethod
    def generate_video_analysis_docx(payload):
        """
        Genera un informe DOCX usando data/Modelo Informe.docx como base.
        """
        try:
            from docx import Document
        except ImportError as exc:
            raise RuntimeError("python-docx no esta instalado") from exc

        template_path = Path(__file__).resolve().parents[3] / "data" / "Modelo Informe.docx"
        if not template_path.exists():
            raise FileNotFoundError(f"No se encontro plantilla: {template_path}")

        report_data, frames = IntegrityService._normalize_video_payload(payload or {})

        report_date = report_data.get("report_date") or datetime.now().strftime("%Y-%m-%d")
        try:
            if isinstance(report_date, datetime):
                parsed = report_date
            else:
                parsed = datetime.strptime(str(report_date), "%Y-%m-%d")
        except ValueError:
            parsed = datetime.now()

        month_names = {
            1: "enero", 2: "febrero", 3: "marzo", 4: "abril",
            5: "mayo", 6: "junio", 7: "julio", 8: "agosto",
            9: "septiembre", 10: "octubre", 11: "noviembre", 12: "diciembre",
        }
        month_name = month_names.get(parsed.month, "enero")
        year = str(parsed.year)

        destinatarios = IntegrityService._as_text(report_data.get("destinatarios"), "URSA I - Jefe")
        tipo_informe = IntegrityService._as_text(report_data.get("tipo_informe"), "IAV - Informe Analisis de Video")
        numero_informe = IntegrityService._as_text(report_data.get("numero_informe"), f"{parsed.year}/001")
        grado = IntegrityService._as_text(report_data.get("grado"), "Oficial Mayor")
        operador = IntegrityService._as_text(report_data.get("operador"), "Operador")
        lup = IntegrityService._as_text(report_data.get("lup"), "0000")
        sistema = IntegrityService._as_text(report_data.get("sistema"), "MILESTONE")
        prevencion_sumaria = IntegrityService._as_text(report_data.get("prevencion_sumaria"), "000BAR/2026")
        caratula = IntegrityService._as_text(report_data.get("caratula"), "DENUNCIA S/ PRESUNTO HURTO")
        fiscalia = IntegrityService._as_text(report_data.get("fiscalia"), "Fiscalia Nro. 02")
        fiscal = IntegrityService._as_text(report_data.get("fiscal"), "Fiscal Interviniente")
        denunciante = IntegrityService._as_text(report_data.get("denunciante"), "Denunciante")
        vuelo = IntegrityService._as_text(report_data.get("vuelo"), "WJ 3045")
        objeto_denunciado = IntegrityService._as_text(report_data.get("objeto_denunciado"), "objeto denunciado")
        conclusion = IntegrityService._as_text(report_data.get("conclusion"), "")
        desarrollo = IntegrityService._as_text(report_data.get("desarrollo"), "")
        firma = IntegrityService._as_text(report_data.get("firma"), "Coordinador CReV I DEL ESTE")

        replacements = [
            ("Fecha: Enero de 2026.", f"Fecha: {month_name.capitalize()} de {year}."),
            ("URSA I - Jefe", destinatarios),
            ("IAV - Informe Análisis de Video    /2026", f"{tipo_informe} {numero_informe}"),
            ("IAV - Informe Analisis de Video    /2026", f"{tipo_informe} {numero_informe}"),
            ("Oficial Mayor XXX, LUP: XXX", f"{grado} {operador}, LUP: {lup}"),
            ("denominado “MILESTONE”", f"denominado \"{sistema}\""),
            ("denominado \"MILESTONE\"", f"denominado \"{sistema}\""),
            ("Prevención Sumaria 003BAR/2026", f"Prevencion Sumaria {prevencion_sumaria}"),
            ("“DENUNCIA S/ PRESUNTO HURTO”", f"\"{caratula}\""),
            ("\"DENUNCIA S/ PRESUNTO HURTO\"", f"\"{caratula}\""),
            ("Fiscalía Nro. 02 de San Carlos de Bariloche, Provincia de Rio Negro", fiscalia),
            ("Dr. INTI ISLA", f"Dr. {fiscal}"),
            ("Sr. PONZO Osvaldo", f"Sr. {denunciante}"),
            ("vuelo WJ 3045", f"vuelo {vuelo}"),
            ("RIVER PLATE", objeto_denunciado),
            ("Coordinador CReV I DEL ESTE", firma),
        ]

        document = Document(str(template_path))
        IntegrityService._replace_text_in_docx(document, replacements)

        if desarrollo or conclusion:
            document.add_page_break()
            IntegrityService._add_heading_safe(document, "Ampliacion del informe", level=1)
            if desarrollo:
                IntegrityService._add_heading_safe(document, "Desarrollo", level=2)
                document.add_paragraph(desarrollo)
            if conclusion:
                IntegrityService._add_heading_safe(document, "Conclusion", level=2)
                document.add_paragraph(conclusion)

        IntegrityService._append_frames_annex(document, frames)

        out = BytesIO()
        document.save(out)
        out.seek(0)
        return out, f"informe_analisis_video_{parsed.strftime('%Y%m%d')}.docx"

    @staticmethod
    def _get_hasher(algorithm='sha256'):
        if algorithm == 'sha256':
            return hashlib.sha256()
        if algorithm == 'sha512':
            return hashlib.sha512()
        if algorithm == 'sha3':
            return hashlib.sha3_256()
        raise ValueError(f"Algoritmo no soportado: {algorithm}")

    @staticmethod
    def calculate_file_hash(file_obj, algorithm='sha256'):
        """
        Calcula el hash de un archivo usando el algoritmo especificado.
        
        Args:
            file_obj: Objeto de archivo (Django UploadedFile o file-like object)
            algorithm: 'sha256', 'sha512' o 'sha3' (default: sha256)
        
        Returns:
            str: Hash hexadecimal del archivo
        """
        hasher = IntegrityService._get_hasher(algorithm)

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
            hasher = IntegrityService._get_hasher(algorithm)
            
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
            hashes: dict {'SHA256': '...', 'SHA512': '...', 'SHA-3': '...'}
        
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
    def generate_integrity_summary_pdf(entries):
        """
        Genera un PDF resumen con todos los archivos hasheados en la sesión UI.

        Args:
            entries: list[dict] con name, size, algorithm, hash, time_ms

        Returns:
            BytesIO: Buffer con el PDF generado
        """
        buffer = BytesIO()
        p = canvas.Canvas(buffer, pagesize=A4)
        width, height = A4

        p.setFont("Helvetica-Bold", 18)
        p.drawString(50, height - 50, "Resumen de Integridad")
        p.setFont("Helvetica", 10)
        p.drawString(50, height - 70, f"Generado el: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
        p.line(50, height - 80, width - 50, height - 80)

        y = height - 110
        p.setFont("Helvetica-Bold", 10)
        p.drawString(50, y, "Archivo")
        p.drawString(215, y, "Algoritmo")
        p.drawString(300, y, "Tiempo (ms)")
        p.drawString(380, y, "Hash")
        y -= 12
        p.line(50, y, width - 50, y)
        y -= 14

        p.setFont("Helvetica", 9)
        for idx, entry in enumerate(entries, start=1):
            name = str(entry.get("name", "N/A"))
            algorithm = str(entry.get("algorithm", "N/A"))
            time_ms = str(entry.get("time_ms", "N/A"))
            hash_value = str(entry.get("hash", "N/A"))

            if y < 70:
                p.showPage()
                y = height - 60
                p.setFont("Helvetica", 9)

            p.drawString(50, y, f"{idx}. {name[:28]}")
            p.drawString(215, y, algorithm[:12])
            p.drawString(300, y, time_ms[:10])
            p.setFont("Courier", 7)
            p.drawString(380, y, hash_value[:44])
            p.setFont("Helvetica", 9)
            y -= 14

        p.setFont("Helvetica-Oblique", 8)
        p.drawString(50, 40, "Documento de resumen generado por GestorCOC.")

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
