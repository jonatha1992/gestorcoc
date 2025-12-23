
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, deleteDoc, doc, writeBatch } = require('firebase/firestore');

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

async function cleanup(collectionName) {
    console.log(`Cleaning up collection [${collectionName}]...`);
    const snapshot = await getDocs(collection(db, collectionName));
    console.log(`Found ${snapshot.size} documents.`);

    let batch = writeBatch(db);
    let count = 0;

    for (const d of snapshot.docs) {
        batch.delete(d.ref);
        count++;
        if (count === 400) {
            await batch.commit();
            batch = writeBatch(db);
            count = 0;
            console.log(`Deleted 400 documents...`);
        }
    }

    if (count > 0) {
        await batch.commit();
    }
    console.log(`Finished cleaning [${collectionName}].`);
}

async function run() {
    // Cleanup both collections just in case
    await cleanup('cameras');
    await cleanup('camaras');
    process.exit(0);
}

run().catch(console.error);
