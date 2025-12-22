const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, 'LIBRO DE REGISTROS FILMICOS 22-09-2025(Recuperado automáticamente).xlsm');

try {
    const workbook = XLSX.readFile(filePath);
    console.log('Hojas encontradas:', workbook.SheetNames);

    // Leer la primera hoja (o la más probable de tener datos)
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convertir a JSON para ver encabezados y primeras filas
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, range: 0 }); // header: 1 devuelve array de arrays

    console.log('\n--- Primeras 3 filas (para identificar columnas) ---');
    console.log(jsonData.slice(0, 3));

} catch (error) {
    console.error('Error leyendo el archivo:', error.message);
}
