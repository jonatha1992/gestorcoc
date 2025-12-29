
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

const units = [
    { name: "MAR DEL PLATA", code: "MDP", description: "Unidad Regional Mar del Plata" },
    { name: "EZEIZA", code: "EZE", description: "Unidad Regional Ezeiza" },
    { name: "SAN FRANCISCO", code: "SFO", description: "Unidad Regional San Francisco" },
    { name: "METROPOLITANO", code: "MET", description: "Unidad Regional Metropolitano" },
    { name: "BAHIA BLANCA", code: "BHI", description: "Unidad Regional Bahía Blanca" }
];

async function seedUnits() {
    console.log("Seeding units...");
    try {
        for (const unit of units) {
            await addDoc(collection(db, "units"), {
                ...unit,
                isActive: true,
                createdAt: serverTimestamp(),
                createdBy: 'system_init'
            });
            console.log(`Created unit: ${unit.name}`);
        }
        console.log("SUCCESS: All units seeded successfully.");
        process.exit(0);
    } catch (error) {
        console.error("Error seeding units:", error);
        process.exit(1);
    }
}

seedUnits();
