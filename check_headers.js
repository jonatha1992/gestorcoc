
const XLSX = require('xlsx');

const filePath = 'informacion/LIBRO DE REGISTROS FILMICOS 22-09-2025(Recuperado automáticamente).xlsm';
const workbook = XLSX.readFile(filePath);
const sheetName = 'REGISTROS FILMICO';
const worksheet = workbook.Sheets[sheetName];

if (!worksheet) {
    console.error(`Sheet ${sheetName} not found`);
    process.exit(1);
}

const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
const headers = data[0];
console.log(JSON.stringify(headers, null, 2));
