/**
 * Generador de HTML para Actas de Novedades
 * 
 * Construye el documento HTML formateado para impresión
 * de actas de novedades técnicas
 */

export interface ActaData {
  numero: string;
  grado: string;
  nombre: string;
  aeropuerto: string;
  hora: string;
  firma?: string;
}

export interface NovedadItem {
  asset: string;
  description: string;
  severity: string;
}

/**
 * Escapa caracteres HTML para prevenir XSS
 */
export function escapeHtml(value: string): string {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Convierte un año numérico a palabras en español
 */
export function yearToWords(year: number): string {
  const units: string[] = [
    '', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve',
    'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete',
    'dieciocho', 'diecinueve', 'veinte', 'veintiuno', 'veintidós', 'veintitrés',
    'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve',
  ];
  const tens: string[] = [
    '', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa',
  ];
  
  if (year >= 2000 && year <= 2099) {
    const rem = year - 2000;
    if (rem === 0) return 'dos mil';
    if (rem < 30) return `dos mil ${units[rem]}`;
    const t = Math.floor(rem / 10);
    const u = rem % 10;
    return u === 0 ? `dos mil ${tens[t]}` : `dos mil ${tens[t]} y ${units[u]}`;
  }
  return year.toString();
}

/**
 * Agrupa novedades por tipo de incidente
 */
export function groupNovedadesByType(novedades: any[]): Record<string, NovedadItem[]> {
  const groups: Record<string, NovedadItem[]> = {};
  
  for (const n of novedades) {
    const key = (n.incident_type || 'SIN_CLASIFICAR').toUpperCase();
    if (!groups[key]) groups[key] = [];
    
    groups[key].push({
      asset: n.camera_name || n.server_name || n.system_name || n.cameraman_gear_name || 'Desconocido',
      description: (n.description || '').trim(),
      severity: n.severity || '',
    });
  }
  
  return groups;
}

/**
 * Construye el HTML completo del acta
 */
export function buildActaHtml(
  actaData: ActaData,
  novedades: any[],
  logoBase64: string
): string {
  const now = new Date();
  const [hh, mm] = (actaData.hora || '00:00').split(':');
  const day = now.getDate().toString().padStart(2, '0');
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];
  const month = monthNames[now.getMonth()];
  const yearWords = yearToWords(now.getFullYear());

  const groups = groupNovedadesByType(novedades);

  const severityLabel: Record<string, string> = {
    LOW: 'Baja', MEDIUM: 'Media', HIGH: 'Alta', CRITICAL: 'Crítica',
  };
  const typeLabel: Record<string, string> = {
    FALLA_TECNICA: 'Falla Técnica', DESCONEXION: 'Desconexión', OBJETO_SOSPECHOSO: 'Objeto Sospechoso',
    DISTURBIO: 'Disturbio', SOPORTE: 'Soporte', MANTENIMIENTO: 'Mantenimiento',
    SIN_CLASIFICAR: 'Sin Clasificar',
  };

  const sectionsHtml = (Object.entries(groups) as [string, NovedadItem[]][])
    .map(([type, items]) => {
      const typeDisplay = escapeHtml(typeLabel[type] || type.replace(/_/g, ' '));
      return `
      <p style="font-weight:bold; margin-top:16pt; margin-bottom:6pt; text-transform:uppercase;">${typeDisplay}</p>
      <ul style="list-style-type: disc; margin-left: 24pt; margin-top: 0;">
        ${items.map((item) => {
          const sev = severityLabel[item.severity] || item.severity;
          const sevHtml = sev ? ` <em style="font-size:10pt; color:#444;">(Gravedad: ${escapeHtml(sev)})</em>` : '';
          const descHtml = item.description
            ? ` — <span style="font-style:italic;">${escapeHtml(item.description)}</span>`
            : '';
          return `<li style="margin-bottom:5pt;"><strong>${escapeHtml(item.asset)}</strong>${sevHtml}${descHtml}</li>`;
        }).join('')}
      </ul>`;
    })
    .join('');

  const logoHtml = logoBase64
    ? `<img src="${logoBase64}" width="120" alt="Logo PSA" style="margin-bottom: 12px;">`
    : '';

  const firmaHtml =
    actaData.firma && actaData.firma.startsWith('data:image')
      ? `<img src="${actaData.firma}" style="max-height: 80px; display: inline-block; margin-bottom: 4px;" />`
      : '';

  const aero = escapeHtml(actaData.aeropuerto);
  const grado = escapeHtml(actaData.grado);
  const nombre = escapeHtml(actaData.nombre);

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @page { margin: 2.5cm 3cm; }
  body { font-family: Arial, sans-serif; font-size: 12pt; color: #000; text-align: justify; line-height: 1.4; }
  h1 { font-size: 13pt; text-align: center; font-weight: bold; margin-bottom: 18pt; }
  .intro { text-align: justify; margin-bottom: 0; }
  .conste { margin-top: 24pt; font-weight: bold; }
  .footer { text-align: right; margin-top: 60px; line-height: 1.6; }
</style>
</head>
<body>
  <div style="text-align: left;">${logoHtml}</div>

  <h1>ACTA DEJANDO CONSTANCIA Nro. ${escapeHtml(actaData.numero)}</h1>

  <p class="intro">En el aeropuerto Internacional ${aero}, asiento del Centro Operativo de Control
  ${aero} de la Policía de Seguridad Aeroportuaria, a los ${day} días del mes de ${month} del año ${yearWords},
  siendo las ${hh || '00'}:${mm || '00'} horas, el funcionario que suscribe, ${grado} ${nombre}, responsable del
  Turno COC ${aero}, labra la presente acta a los efectos de dejar debida constancia que los medios
  técnicos que se detallan a continuación presentaron las siguientes novedades.</p>

  ${sectionsHtml}

  <p class="conste">ES TODO CONSTE <span style="display:inline-block; width:60%; border-bottom:1px solid #000; vertical-align:middle;"></span></p>

  <div class="footer">
    <div style="display:inline-block; text-align:center; min-width:200px;">
      ${firmaHtml}
      <p style="margin:0;"><strong>${grado.toUpperCase()} ${nombre}</strong></p>
      <p style="margin:0;">RESPONSABLE TURNO COC</p>
      <p style="margin:0;">UOSP ${aero.toUpperCase()}</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Obtiene el logo como Base64 desde el servidor
 */
export async function getLogoBase64(): Promise<string> {
  try {
    const response = await fetch('/Logo-PSA.png');
    const blob = await response.blob();
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return '';
  }
}
