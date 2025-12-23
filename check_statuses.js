
const XLSX = require('xlsx');

const filePath = 'informacion/LIBRO DE REGISTROS FILMICOS 22-09-2025(Recuperado automáticamente).xlsm';
const workbook = XLSX.readFile(filePath);
const sheetName = 'REGISTROS FILMICO';
const worksheet = workbook.Sheets[sheetName];

const data = XLSX.utils.sheet_to_json(worksheet);
const uniqueStatuses = [...new Set(data.map(row => row['ESTADO']))];
console.log(JSON.stringify(uniqueStatuses, null, 2));
