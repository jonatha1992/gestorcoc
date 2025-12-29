
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, addDoc, serverTimestamp } = require('firebase/firestore');

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

async function seedSystemsAndGroups() {
    console.log("Fetching units...");
    try {
        const unitsSnapshot = await getDocs(collection(db, "units"));
        const units = unitsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        console.log(`Found ${units.length} units. Seeding systems and groups...`);

        for (const unit of units) {
            // 1. Create CCTV System
            const systemRef = await addDoc(collection(db, "systems"), {
                name: `SISTEMA COC ${unit.code}`,
                description: `Sistema de CCTV principal de ${unit.name}`,
                orgUnitId: unit.id,
                isActive: true,
                createdAt: serverTimestamp(),
                createdBy: 'system_init'
            });
            console.log(`Created system for ${unit.code}`);

            // 2. Create Access Group
            await addDoc(collection(db, "groups"), {
                name: `COC ${unit.code} - OPERADORES`,
                description: `Grupo de acceso para operadores de la unidad ${unit.name}`,
                unitIds: [unit.id],
                systemIds: [systemRef.id],
                isActive: true,
                createdAt: serverTimestamp(),
                createdBy: 'system_init'
            });
            console.log(`Created group for ${unit.code}`);
        }

        console.log("SUCCESS: Initial systems and groups seeded successfully.");
        process.exit(0);
    } catch (error) {
        console.error("Error seeding systems/groups:", error);
        process.exit(1);
    }
}

seedSystemsAndGroups();
