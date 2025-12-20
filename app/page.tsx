// app/page.tsx
"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { auth } from './api/firebase'; 
import { storage } from './api/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Components
import Login from './components/Login';
import UploadZone from './components/UploadZone';

// --- Types ---
interface ClipData {
  url: string;
  duration: number;
}

interface ApiResponse {
  success: boolean;
  id: string;
}

export default function Home() {
  // --- State: User ---
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // --- State: App Logic ---
  const [status, setStatus] = useState<"idle" | "uploading" | "processing" | "done">("idle");
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [progress, setProgress] = useState<string>("");

  // --- 1. Check Login Status on Load ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  // --- 2. Helper: Get Video Duration ---
  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };
      video.src = URL.createObjectURL(file);
    });
  };

  // --- 3. Handle File Uploads ---
  async function handleFilesSelected(files: File[]) {
    setStatus("uploading");
    const uploadedClips: ClipData[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProgress(`Uploading ${i + 1} of ${files.length}: ${file.name}`);
        
        // A. Get Duration
        const duration = await getVideoDuration(file);
        
        // B. Upload to Firebase
        const uniqueName = `${Date.now()}-${file.name}`;
        const storageRef = ref(storage, `uploads/${user?.uid}/${uniqueName}`); // 💡 Note: Storing in user's specific folder
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);

        // C. Save Data
        uploadedClips.push({ url, duration });
      }

      // D. Send to AI
      handleCreateVideo(uploadedClips);

    } catch (error) {
      console.error("Upload failed:", error);
      setStatus("idle");
      alert("Error uploading files.");
    }
  }

  // --- 4. Send to Backend (Shotstack) ---
  async function handleCreateVideo(clips: ClipData[]) {
    setStatus("processing");
    setProgress("AI is editing (Cutting & Scaling for TikTok)...");

    try {
      const res = await axios.post('/api/render', { clips: clips });
      const data = res.data as ApiResponse; 
      checkStatusLoop(data.id);
    } catch (e) {
      console.error(e);
      setStatus("idle");
      alert("Render failed. Check console.");
    }
  }

  // --- 5. Poll for Status ---
  async function checkStatusLoop(id: string) {
    const interval = setInterval(async () => {
      try {
        const res = await axios.get(`/api/render/status?id=${id}`);
        const currentStatus = res.data.status;

        if (currentStatus === 'done') {
            clearInterval(interval);
            setVideoUrl(res.data.url);
            setStatus("done");
        } else if (currentStatus === 'failed') {
            clearInterval(interval);
            setStatus("idle");
            alert("Render Failed! The AI could not process the video.");
        }
      } catch (e) {
        console.error("Check failed", e);
      }
    }, 3000); // Check every 3 seconds
  }

  // --- RENDER: Loading Screen ---
  if (loadingAuth) {
    return <div className="flex min-h-screen items-center justify-center bg-black text-white">Loading...</div>;
  }

  // --- RENDER: Login Screen ---
  if (!user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-black text-white p-6">
        <Login onLogin={setUser} />
      </main>
    );
  }

  // --- RENDER: Main App ---
  return (
    <main className="flex min-h-screen flex-col items-center p-12 bg-black text-white">
      
      {/* Header */}
      <div className="flex justify-between w-full max-w-2xl mb-12 items-center border-b border-gray-800 pb-6">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
          KatKut.ai
        </h1>
        <div className="flex items-center gap-4">
            {user.photoURL && (
              <img src={user.photoURL} className="w-10 h-10 rounded-full border border-gray-600" alt="User" />
            )}
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-gray-200">{user.displayName}</p>
              <button onClick={() => signOut(auth)} className="text-xs text-red-400 hover:text-red-300">Sign Out</button>
            </div>
        </div>
      </div>
      
      <div className="w-full max-w-2xl">
        
        {/* VIEW 1: UPLOAD ZONE */}
        {status === "idle" && (
          <UploadZone 
            onFilesSelected={handleFilesSelected} 
            isLoading={false} 
          />
        )}

        {/* VIEW 2: UPLOADING / PROCESSING */}
        {(status === "uploading" || status === "processing") && (
            <div className="border border-gray-700 p-12 rounded-xl text-center bg-gray-900/50">
              <div className="animate-spin text-4xl mb-6">⏳</div>
              <h2 className="text-2xl font-bold text-blue-400 mb-2">
                {status === "uploading" ? "Uploading Files..." : "Rendering Video..."}
              </h2>
              <p className="text-gray-400 animate-pulse">{progress}</p>
            </div>
        )}

        {/* VIEW 3: DONE */}
        {status === "done" && videoUrl && (
            <div className="border border-green-500/30 p-8 rounded-xl bg-green-900/10 text-center">
                <h2 className="text-2xl font-bold mb-6 text-green-400">🎉 Your Reel is Ready!</h2>
                
                {/* 9:16 Aspect Ratio Container */}
                <div className="mx-auto w-[300px] aspect-[9/16] bg-black rounded-lg overflow-hidden border border-gray-700 mb-6 shadow-2xl">
                  <video controls className="w-full h-full object-cover" src={videoUrl}>
                      Your browser does not support the video tag.
                  </video>
                </div>

                <div className="flex gap-4 justify-center">
                    <a 
                      href={videoUrl} 
                      target="_blank" 
                      className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-full transition shadow-lg shadow-blue-900/20"
                    >
                        Download
                    </a>
                    <button 
                      onClick={() => setStatus("idle")} 
                      className="text-gray-400 hover:text-white underline py-3 px-4"
                    >
                        New Project
                    </button>
                </div>
            </div>
        )}
      </div>
    </main>
  );
}