
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

// In JS Web SDK we can't list collections directly without knowing the name,
// but we can try common ones and report size.
async function check() {
    const cand = ['cameras', 'camaras', 'caras', 'cameras ', ' camaras', 'Cameras', 'Camaras'];
    for (const c of cand) {
        try {
            const snap = await getDocs(collection(db, c));
            if (snap.size > 0) {
                console.log(`FOUND: [${c}] with ${snap.size} docs.`);
            } else {
                // console.log(`Empty: [${c}]`);
            }
        } catch (e) { }
    }
    process.exit(0);
}
check();
