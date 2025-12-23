const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, 'informacion', 'LIBRO DE REGISTROS FILMICOS 22-09-2025(Recuperado automáticamente).xlsm');

try {
    const workbook = XLSX.readFile(filePath);
    console.log('Sheets:', workbook.SheetNames);

    workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        console.log(`\n--- Sheet [${sheetName}] ---`);
        for (let i = 0; i < Math.min(data.length, 10); i++) {
            console.log(`Line ${i}:`, data[i].slice(0, 15));
        }
    });
} catch (e) {
    console.log(`Error: ${e.message}`);
}
