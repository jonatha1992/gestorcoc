
const { initializeApp } = require('firebase/app');
const {
    getFirestore,
    collection,
    getDocs,
    addDoc,
    writeBatch,
    doc,
    serverTimestamp
} = require('firebase/firestore');
const fs = require('fs');
const path = require('path');

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

const FILE_PATH = path.join(__dirname, 'informacion', 'EZEIZA 22-12-25.csv');

const CATALOG_CODES = {
    UBICACIONES: 'UBICACIONES',
    TIPOS_CAMARA: 'TIPOS_CAMARA'
};

async function migrate() {
    console.log("Starting camera migration...");

    // 1. Get/Create Catalogs
    const catalogsSnapshot = await getDocs(collection(db, "catalogs"));
    const catalogs = {};
    catalogsSnapshot.forEach(doc => {
        catalogs[doc.data().code] = { id: doc.id, ...doc.data() };
    });

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

    // 3. Read CSV
    const content = fs.readFileSync(FILE_PATH, 'utf8');
    const lines = content.split('\n').filter(line => line.trim() !== '');

    console.log(`Read ${lines.length} lines from CSV.`);

    // 4. Transform and Upload in batches
    let batch = writeBatch(db);
    let count = 0;
    let totalMigrated = 0;

    for (const line of lines) {
        // EZE01;NAME;BRAND;MODEL;LOCATION;ID LOGICO;IP;MAC;VERSION1;VERSION2;SERIAL;...
        const fields = line.split(';');
        if (fields.length < 13) continue;

        const name = fields[1]?.trim();
        if (!name) continue;

        const brand = fields[2]?.trim();
        const model = fields[3]?.trim();
        const locationName = fields[4]?.trim();
        const ipAddress = fields[6]?.trim();
        const serialNumber = fields[10]?.trim();
        const statusField = fields[13]?.trim(); // e.g., "Online"

        const camera = {
            name: name,
            brand: brand || '',
            model: model || '',
            locationId: await getOrCreateItem(CATALOG_CODES.UBICACIONES, locationName || 'DESCONOCIDA'),
            typeId: await getOrCreateItem(CATALOG_CODES.TIPOS_CAMARA, brand || 'OTRA'),
            ipAddress: ipAddress || '',
            serialNumber: serialNumber || '',
            status: statusField === 'Online' ? 'Operativa' : 'Fuera de Servicio',
            notes: fields[5]?.trim() || '', // ID Logico
            createdAt: serverTimestamp(),
            createdBy: 'migration_script'
        };

        const newDocRef = doc(collection(db, "cameras"));
        batch.set(newDocRef, camera);

        count++;
        totalMigrated++;

        if (count === 400) {
            console.log(`Committing batch of ${count} cameras. Total: ${totalMigrated}`);
            await batch.commit();
            batch = writeBatch(db);
            count = 0;
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }

    if (count > 0) {
        console.log(`Committing final batch of ${count} cameras. Total: ${totalMigrated}`);
        await batch.commit();
    }

    console.log("Migration completed successfully!");
    process.exit(0);
}

migrate().catch(err => {
    console.error("Migration failed:", err);
    process.exit(1);
});
