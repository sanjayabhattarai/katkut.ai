// app/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import {
  getAuth,
  GoogleAuthProvider,
  initializeAuth,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  setPersistence,
  Auth,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";


const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const storage = getStorage(app);

// Use client-side friendly persistent auth for iOS/Safari environments
let authInstance: Auth;
if (typeof window !== "undefined") {
  try {
    authInstance = initializeAuth(app, {
      persistence: [
        // Prefer IndexedDB (best on Safari/iOS)
        indexedDBLocalPersistence,
        // Fallback to localStorage
        browserLocalPersistence,
        // Final fallback to sessionStorage
        browserSessionPersistence,
      ],
    });
  } catch {
    // If initializeAuth has already run, fall back to getAuth
    authInstance = getAuth(app);
    // Explicitly set persistence when falling back to getAuth
    // Try IndexedDB, then localStorage, then sessionStorage
    if (typeof window !== "undefined") {
      setPersistence(authInstance, indexedDBLocalPersistence)
        .catch(() => setPersistence(authInstance, browserLocalPersistence))
        .catch(() => setPersistence(authInstance, browserSessionPersistence))
        .catch(() => {});
    }
  }
} else {
  // On server, avoid IndexedDB; use standard getAuth
  authInstance = getAuth(app);
}

export const auth = authInstance;
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
