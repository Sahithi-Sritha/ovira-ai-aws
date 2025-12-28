'use client';

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth';
import { getFirestore, Firestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase only on client side
let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let storage: FirebaseStorage | undefined;
let googleProvider: GoogleAuthProvider | undefined;

if (typeof window !== 'undefined') {
    try {
        app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
        auth = getAuth(app);
        db = getFirestore(app);
        storage = getStorage(app);
        googleProvider = new GoogleAuthProvider();
        googleProvider.setCustomParameters({
            prompt: 'select_account'
        });

        // Enable offline persistence for better UX
        if (db) {
            enableIndexedDbPersistence(db).catch((err) => {
                if (err.code === 'failed-precondition') {
                    // Multiple tabs open, persistence can only be enabled in one tab at a time
                    console.warn('Firestore persistence unavailable - multiple tabs open');
                } else if (err.code === 'unimplemented') {
                    // The current browser doesn't support persistence
                    console.warn('Firestore persistence not supported');
                }
            });
        }
    } catch (error) {
        console.error('Firebase initialization error:', error);
    }
}

<<<<<<< HEAD
export { app, auth, db, storage, googleProvider };
=======
// Export with type assertions for client-side only usage
// These should only be used in 'use client' components
export { app, auth, db as db, storage, googleProvider };

// Type-safe getters that throw if Firebase isn't initialized
export function getDb(): Firestore {
    if (!db) throw new Error('Firestore not initialized. Are you running on the server?');
    return db;
}

export function getAuthInstance(): Auth {
    if (!auth) throw new Error('Auth not initialized. Are you running on the server?');
    return auth;
}
>>>>>>> v3
