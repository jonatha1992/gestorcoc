
const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } = require('firebase/auth');
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

// Intentionally using the normalized email format expected by AuthService for username "admin"
const email = "admin@crev.local";
const password = "admin123";

async function resetAdmin() {
    console.log(`Resetting/Creating Admin User...`);
    console.log(`Target Email: ${email}`);
    console.log(`Target Password: ${password}`);

    try {
        // Try creating first
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            console.log(`[OK] Created new user with UID: ${userCredential.user.uid}`);
            await setupFirestore(userCredential.user.uid);
        } catch (createError) {
            if (createError.code === 'auth/email-already-in-use') {
                console.log(`[INFO] Email already exists. Trying to sign in to get UID...`);
                try {
                    const signInCred = await signInWithEmailAndPassword(auth, email, password);
                    console.log(`[OK] Signed in successfully. UID: ${signInCred.user.uid}`);
                    await setupFirestore(signInCred.user.uid);
                } catch (signInError) {
                    console.error(`[ERROR] Could not sign in. The password might be different.`);
                    console.error(`Please manually delete this user in Firebase Console or use a different email.`);
                    console.error(`Error details: ${signInError.message}`);
                    process.exit(1);
                }
            } else {
                throw createError;
            }
        }

    } catch (error) {
        console.error("FATAL ERROR:", error);
        process.exit(1);
    }
}

async function setupFirestore(uid) {
    try {
        console.log(`Setting up Firestore permissions for UID: ${uid}...`);
        await setDoc(doc(db, "users", uid), {
            uid: uid,
            email: email,
            username: "admin", // Explicit username
            displayName: "System Admin",
            roleIds: ["admin"],
            isActive: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        console.log("SUCCESS: Firestore profile updated.");
        process.exit(0);
    } catch (e) {
        console.error("Error writing to Firestore:", e);
        process.exit(1);
    }
}

resetAdmin();
