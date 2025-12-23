
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

async function check() {
    const collections = ['cameras', 'camaras', 'registros_filmicos', 'equipamiento', 'catalogs', 'catalog_items'];

    for (const name of collections) {
        try {
            const snapshot = await getDocs(collection(db, name));
            console.log(`Collection [${name}]: ${snapshot.size} documents`);
            if (snapshot.size > 0 && (name === 'cameras' || name === 'camaras')) {
                console.log(`Sample document from [${name}]:`, snapshot.docs[0].data());
            }
        } catch (err) {
            console.error(`Error checking [${name}]:`, err.message);
        }
    }
    process.exit(0);
}

check();
