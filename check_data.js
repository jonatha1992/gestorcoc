
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

async function checkCollections() {
    const collections = ['users', 'organization_units', 'organization_systems', 'organization_groups'];
    for (const colName of collections) {
        console.log(`Checking collection: ${colName}`);
        const snapshot = await getDocs(collection(db, colName));
        console.log(`- Found ${snapshot.size} documents.`);
        snapshot.forEach(doc => {
            console.log(`  - [${doc.id}]:`, doc.data());
        });
    }
    process.exit(0);
}

checkCollections();
