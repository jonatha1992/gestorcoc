
const { initializeApp } = require('firebase/app');
const {
    getFirestore,
    collection,
    getDocs,
    addDoc,
    writeBatch,
    doc,
    query,
    where,
    serverTimestamp
} = require('firebase/firestore');
const XLSX = require('xlsx');

const firebaseConfig = {
    apiKey: "AIzaSyCbd-Q5biTnz6rxhRy1qK4b-VA8hrmcpPw",
    authDomain: "crev-system.firebaseapp.com",
    projectId: "crev-system",
    storageBucket: "crev-system.firebasestorage.app",
    messagingSenderId: "126976468684",
    appId: "1:126976468684:web:eb7f447ff7210edbb78469"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const FILE_PATH = 'informacion/LIBRO DE REGISTROS FILMICOS 22-09-2025(Recuperado automáticamente).xlsm';
const SHEET_NAME = 'REGISTROS FILMICO';

const CATALOG_CODES = {
    TIPOS_SOLICITUD: 'TIPOS_SOLICITUD',
    TIPOS_DELITO: 'TIPOS_DELITO',
    UNIDADES: 'UNIDADES',
    ORGANISMOS: 'ORGANISMOS',
};

async function migrate() {
    console.log("Starting migration...");

    // 1. Get Catalogs
    const catalogsSnapshot = await getDocs(collection(db, "catalogs"));
    const catalogs = {};
    catalogsSnapshot.forEach(doc => {
        catalogs[doc.data().code] = { id: doc.id, ...doc.data() };
    });

    // Verify all codes exist
    for (const code of Object.values(CATALOG_CODES)) {
        if (!catalogs[code]) {
            console.log(`Creating catalog: ${code}`);
            const newCat = await addDoc(collection(db, "catalogs"), {
                name: code.replace('_', ' '),
                code: code,
                isActive: true,
                createdAt: serverTimestamp(),
                createdBy: 'migration_script'
            });
            catalogs[code] = { id: newCat.id, code: code };
        }
    }

    // 2. Get Catalog Items
    const itemsSnapshot = await getDocs(collection(db, "catalog_items"));
    const catalogItems = {}; // catalogId -> { name -> id }
    itemsSnapshot.forEach(doc => {
        const data = doc.data();
        if (!catalogItems[data.catalogId]) catalogItems[data.catalogId] = {};
        catalogItems[data.catalogId][data.name.toUpperCase().trim()] = doc.id;
    });

    async function getOrCreateItem(catalogCode, name) {
        if (!name) return null;
        const cleanName = name.toString().toUpperCase().trim();
        const catalogId = catalogs[catalogCode].id;

        if (!catalogItems[catalogId]) catalogItems[catalogId] = {};

        if (catalogItems[catalogId][cleanName]) {
            return catalogItems[catalogId][cleanName];
        }

        console.log(`Creating item [${cleanName}] in catalog [${catalogCode}]`);
        const newItem = await addDoc(collection(db, "catalog_items"), {
            catalogId: catalogId,
            name: name.toString().trim(),
            isActive: true,
            order: Object.keys(catalogItems[catalogId]).length,
            createdAt: serverTimestamp(),
            createdBy: 'migration_script'
        });

        catalogItems[catalogId][cleanName] = newItem.id;
        return newItem.id;
    }

    // 3. Read Excel
    const workbook = XLSX.readFile(FILE_PATH, { cellDates: true });
    const worksheet = workbook.Sheets[SHEET_NAME];
    const rawData = XLSX.utils.sheet_to_json(worksheet);

    console.log(`Read ${rawData.length} rows from Excel.`);

    // 4. Transform and Upload in batches
    let batch = writeBatch(db);
    let count = 0;
    let totalMigrated = 0;

    const statusMap = {
        'ENTREGADO': 'Finalizado',
        'FINALIZADO': 'Finalizado',
        'PENDIENTE': 'Pendiente',
        'INICIADO': 'En Proceso',
        'EN REVISION': 'En Proceso'
    };

    function formatDate(val) {
        if (!val) return '';
        try {
            const d = new Date(val);
            if (isNaN(d.getTime())) return '';
            return d.toISOString().split('T')[0];
        } catch (e) {
            return '';
        }
    }

    for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i];

        // Skip rows without order number if they seem empty
        if (!row['Nº ORDEN'] && !row['FECHA INGRESO']) continue;

        const record = {
            nroOrden: row['Nº ORDEN']?.toString() || '',
            fechaIngreso: formatDate(row['FECHA INGRESO']),
            idTipoSolicitud: await getOrCreateItem(CATALOG_CODES.TIPOS_SOLICITUD, row['TIPO \r\nSOLICITUD']),
            nroSolicitud: row['NUMERO SOLICITUD']?.toString() || '',
            solicitante: row['SOLICITANTE']?.toString() || '',
            causaJudicial: row['Nº DE CAUSA JUDICIAL/PREVENCION SUMARIA']?.toString() || '',
            caratula: row['CARATULA']?.toString() || '',
            fechaHecho: formatDate(row['FECHA DEL HECHO']),
            idTipoDelito: await getOrCreateItem(CATALOG_CODES.TIPOS_DELITO, row['TIPO DE DELITO']),
            idUnidad: await getOrCreateItem(CATALOG_CODES.UNIDADES, row['DEPENDENCIA INTERVINIENTE']),
            recepcionadoPor: row['RECEPCIONADO POR ']?.toString() || '',
            confeccionadoPor: row['CONFECCIONADO POR']?.toString() || '',
            detalle: row['DETALLE']?.toString() || '',
            nroDvd: row['Nº DE DVD']?.toString() || '',
            nroInforme: row['Nº DE INFORME']?.toString() || '',
            ifgra: row['IFGRA']?.toString() || '',
            nroExpediente: row['EXPEDIENTE']?.toString() || '',
            actaEntrega: row['Nº ACTA DE ENTREGA / ELEVACION']?.toString() || '',
            fechaSalida: formatDate(row['FECHA DE SALIDA']),
            retiradoPor: row['RETIRADO POR']?.toString() || '',
            idOrganismo: await getOrCreateItem(CATALOG_CODES.ORGANISMOS, row['ORGANISMO']),
            estado: statusMap[row['ESTADO']] || 'Pendiente',
            observaciones: row['OBSERVACIONES']?.toString() || '',
            nroAsunto: row['NUMERO SOLICITUD']?.toString() || (row['Nº ORDEN']?.toString() || i.toString()),
            createdAt: serverTimestamp(),
            createdBy: 'migration_script'
        };

        const newDocRef = doc(collection(db, "registros_filmicos"));
        batch.set(newDocRef, record);

        count++;
        totalMigrated++;

        if (count === 400) { // Keep it below 500 limit
            console.log(`Committing batch of ${count} records. Total: ${totalMigrated}`);
            await batch.commit();
            batch = writeBatch(db);
            count = 0;
            // Small pause to avoid hitting rate limits too hard
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    if (count > 0) {
        console.log(`Committing final batch of ${count} records. Total: ${totalMigrated}`);
        await batch.commit();
    }

    console.log("Migration completed successfully!");
    process.exit(0);
}

migrate().catch(err => {
    console.error("Migration failed:", err);
    process.exit(1);
});
