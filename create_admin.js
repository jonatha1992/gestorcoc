
const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc, serverTimestamp } = require('firebase/firestore');

const firebaseConfig = {
    apiKey: "AIzaSyCbd-Q5biTnz6rxhRy1qK4b-VA8hrmcpPw",
    authDomain: "crev-system.firebaseapp.com",
    projectId: "crev-system",
    storageBucket: "crev-system.firebasestorage.app",
    messagingSenderId: "126976468684",
    appId: "1:126976468684:web:eb7f447ff7210edbb78469"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const email = "admin@crev.com";
const password = "AdminPassword123!";

async function createAdmin() {
    try {
        console.log(`Creating user: ${email}...`);
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;

        console.log(`User created with UID: ${uid}. Setting up permissions...`);

        await setDoc(doc(db, "users", uid), {
            uid: uid,
            email: email,
            displayName: "Administrador Inicial",
            roleIds: ["admin"],
            isActive: true,
            createdAt: serverTimestamp()
        });

        console.log("SUCCESS: Admin user created successfully!");
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
        process.exit(0);
    } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
            console.log("The email is already in use. Checking Firestore document...");
            // Even if auth exists, maybe firestore doc is missing?
            // But we don't have the UID easily here without signing in.
        }
        console.error("Error creating admin:", error.message);
        process.exit(1);
    }
}

createAdmin();
