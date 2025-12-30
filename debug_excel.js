const XLSX = require('xlsx');

const FILE_PATH = 'informacion/LIBRO DE REGISTROS FILMICOS 22-09-2025(Recuperado automáticamente).xlsm';
const SHEET_NAME = 'REGISTROS FILMICO';

try {
    const workbook = XLSX.readFile(FILE_PATH);
    const worksheet = workbook.Sheets[SHEET_NAME];

    // Get headers (first row)
    const headers = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0];
    console.log("EXCEL HEADERS FOUND:");
    console.log(JSON.stringify(headers, null, 2));

    // Get first data row to see values
    const data = XLSX.utils.sheet_to_json(worksheet)[0];
    console.log("\nFIRST ROW DATA:");
    console.log(JSON.stringify(data, null, 2));

} catch (error) {
    console.error("Error reading Excel:", error);
}
