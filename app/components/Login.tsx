// app/components/Login.tsx
"use client";
import { signInWithPopup, signInWithRedirect } from "firebase/auth";
import { auth, googleProvider } from "../api/firebase";

export default function Login({ onLogin }: { onLogin: (user: any) => void }) {
  
  const handleLogin = async () => {
    try {
      // Try popup first (works on modern iOS with overlay windows)
      const result = await signInWithPopup(auth, googleProvider);
      onLogin(result.user);
    } catch (error: any) {
      const code = error?.code;
      console.warn("Popup login failed:", code);

      // Ignore user-initiated cancellation (don't force redirect)
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        return;
      }

      // Fallback to redirect only for technical failures
      if (
        code === "auth/popup-blocked" ||
        code === "auth/argument-error" ||
        code === "auth/web-storage-unsupported" ||
        code === "auth/internal-error"
      ) {
        try {
          console.log("Falling back to redirect...");
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch (redirectError) {
          console.error("Redirect login also failed", redirectError);
        }
      }

      alert("Login failed. Please check your connection or settings.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 text-center">
      <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
        Welcome to KatKut
      </h2>
      <p className="text-gray-400 mb-4">Login to save your edits and projects.</p>
      
      <button 
        onClick={handleLogin}
        className="flex items-center gap-3 bg-white text-black px-6 py-3 rounded-full font-bold hover:bg-gray-200 transition"
      >
        <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-6 h-6" alt="Google" />
        Sign in with Google
      </button>
    </div>
  );
}