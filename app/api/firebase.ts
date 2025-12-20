// app/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAYZ1s6IAu1jOO6qh9kZ_0Nye8C4IsrqQ8",
  authDomain: "katkut-app-70814.firebaseapp.com",
  projectId: "katkut-app-70814",
  storageBucket: "katkut-app-70814.firebasestorage.app",
  messagingSenderId: "1023813237510",
  appId: "1:1023813237510:web:0d9fd14bf09ca168f47c87",
  measurementId: "G-GL177EF1GE"
};

// 1. Initialize Firebase (Singleton pattern to prevent re-initialization errors)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// 2. Export Storage (Critically needed for your Upload Zone)
export const storage = getStorage(app);

// 3. Export Auth & Google Provider (For future authentication features)
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// 4. Analytics (Only run this in the browser, not on the server)
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      getAnalytics(app);
    }
  });
}