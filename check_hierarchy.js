
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

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

async function checkHierarchy() {
    try {
        console.log("=== UNITS ===");
        const unitsSnapshot = await getDocs(collection(db, "units"));
        unitsSnapshot.forEach(doc => console.log(`- ${doc.data().name} (${doc.id})`));

        console.log("\n=== SYSTEMS (CCTV) ===");
        const systemsSnapshot = await getDocs(collection(db, "systems"));
        systemsSnapshot.forEach(doc => console.log(`- ${doc.data().name} [Unit: ${doc.data().orgUnitId}] (${doc.id})`));

        console.log("\n=== GROUPS (ACCESO) ===");
        const groupsSnapshot = await getDocs(collection(db, "groups"));
        groupsSnapshot.forEach(doc => console.log(`- ${doc.data().name} [Units: ${doc.data().unitIds?.length || 0}] (${doc.id})`));

        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

checkHierarchy();
