
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, serverTimestamp } = require('firebase/firestore');

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

const unitsData = [
    { name: "MAR DEL PLATA", code: "MDP", description: "Unidad Regional Mar del Plata" },
    { name: "EZEIZA", code: "EZE", description: "Unidad Regional Ezeiza" },
    { name: "SAN FRANCISCO", code: "SFO", description: "Unidad Regional San Francisco" },
    { name: "METROPOLITANO", code: "MET", description: "Unidad Regional Metropolitano" },
    { name: "BAHIA BLANCA", code: "BHI", description: "Unidad Regional Bahía Blanca" }
];

async function unifiedSeed() {
    console.log("Starting unified seeding...");
    try {
        for (const unit of unitsData) {
            // 1. Create Unit in 'organization_units'
            const unitRef = await addDoc(collection(db, "organization_units"), {
                name: unit.name,
                description: unit.description,
                isActive: true,
                createdAt: serverTimestamp(),
                createdBy: 'system_init'
            });
            console.log(`Created Unit: ${unit.name} (${unitRef.id})`);

            // 2. Create System in 'organization_systems'
            const systemRef = await addDoc(collection(db, "organization_systems"), {
                name: `SISTEMA COC ${unit.code}`,
                description: `Sistema de CCTV de ${unit.name}`,
                unitId: unitRef.id, // Correct key
                isActive: true,
                createdAt: serverTimestamp(),
                createdBy: 'system_init'
            });
            console.log(`  - Created System for ${unit.code} (${systemRef.id})`);

            // 3. Create Group in 'organization_groups'
            const groupRef = await addDoc(collection(db, "organization_groups"), {
                name: `COC ${unit.code} - OPERADORES`,
                description: `Operadores de la unidad ${unit.name}`,
                unitIds: [unitRef.id],
                systemIds: [systemRef.id],
                isActive: true,
                createdAt: serverTimestamp(),
                createdBy: 'system_init'
            });
            console.log(`  - Created Group for ${unit.code} (${groupRef.id})`);
        }
        console.log("SUCCESS: Hierarchy fully initialized in correct collections.");
        process.exit(0);
    } catch (error) {
        console.error("Error during unified seeding:", error);
        process.exit(1);
    }
}

unifiedSeed();
