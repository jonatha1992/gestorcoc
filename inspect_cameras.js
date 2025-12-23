const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const infoDir = path.join(__dirname, 'informacion');
const files = fs.readdirSync(infoDir);

console.log('Archivos en /informacion:');
files.forEach(file => {
    console.log(`- ${file}`);
    if (file.endsWith('.xlsx') || file.endsWith('.xlsm')) {
        try {
            const workbook = XLSX.readFile(path.join(infoDir, file));
            console.log(`  Sheets: ${workbook.SheetNames.join(', ')}`);

            // Inspect first few rows of each sheet to look for camera data
            workbook.SheetNames.forEach(sheetName => {
                const sheet = workbook.Sheets[sheetName];
                const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
                if (data.length > 0) {
                    console.log(`  - Sheet [${sheetName}] Headings:`, data[0].slice(0, 10));
                }
            });
        } catch (e) {
            console.log(`  Error reading ${file}: ${e.message}`);
        }
    }
});
