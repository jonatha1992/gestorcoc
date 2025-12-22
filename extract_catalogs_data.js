const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const filePath = path.join(__dirname, 'LIBRO DE REGISTROS FILMICOS 22-09-2025(Recuperado automáticamente).xlsm');
const outPath = path.join(__dirname, 'extracted_catalogs.json');

try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = 'REGISTROS FILMICO';
    const worksheet = workbook.Sheets[sheetName];

    // Convertir a JSON crudo (array de arrays) iniciando en fila 0 para tener headers
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, range: 0 });

    // Índices de columnas basados en la inspección (0-indexed desde A)
    // A=0, B=1, ...
    // TIPO SOLICITUD: Columna D (Índice 3)
    // SOLICITANTE (UNIDAD): Columna F (Índice 5)
    // TIPO DE DELITO: Columna J (Índice 9)
    // ORGANISMO: Columna V (Índice 21)

    // Ajuste según output anterior: 
    // [3] = 'TIPO \r\nSOLICITUD'
    // [5] = 'SOLICITANTE'
    // [9] = 'TIPO DE DELITO'
    // [21] = 'ORGANISMO'

    const catalogs = {
        TIPOS_SOLICITUD: new Set(),
        UNIDADES: new Set(),
        TIPOS_DELITO: new Set(),
        ORGANISMOS: new Set()
    };

    // Empezar desde fila 1 (saltar headers)
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row || row.length === 0) continue;

        const solicitud = row[3];
        const unidad = row[5];
        const delito = row[9];
        const organismo = row[21];

        if (solicitud) catalogs.TIPOS_SOLICITUD.add(cleanValue(solicitud));
        if (unidad) catalogs.UNIDADES.add(cleanValue(unidad));
        if (delito) catalogs.TIPOS_DELITO.add(cleanValue(delito));
        if (organismo) catalogs.ORGANISMOS.add(cleanValue(organismo));
    }

    // Convertir Sets a Arrays ordenados
    const result = {
        TIPOS_SOLICITUD: Array.from(catalogs.TIPOS_SOLICITUD).sort(),
        UNIDADES: Array.from(catalogs.UNIDADES).sort(),
        TIPOS_DELITO: Array.from(catalogs.TIPOS_DELITO).sort(),
        ORGANISMOS: Array.from(catalogs.ORGANISMOS).sort(),
    };

    console.log('--- Extracción Completada ---');
    console.log('Tipos de Solicitud:', result.TIPOS_SOLICITUD.length);
    console.log('Unidades:', result.UNIDADES.length);
    console.log('Tipos de Delito:', result.TIPOS_DELITO.length);
    console.log('Organismos:', result.ORGANISMOS.length);

    fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
    console.log(`\nDatos guardados en ${outPath}`);

} catch (error) {
    console.error('Error procesando el archivo:', error);
}

function cleanValue(val) {
    if (typeof val !== 'string') return String(val).toUpperCase().trim();
    return val.toUpperCase().trim().replace(/\s+/g, ' '); // Eliminar espacios múltiples
}
