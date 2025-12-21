// app/page.tsx
"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { auth, storage, db } from './api/firebase'; 
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';


import { processClipsWithVibe, VIBES, VibeType } from './utils/vibeLogic'; 
import Login from './components/Login';
import UploadZone from './components/UploadZone';
import VibeSelector from './components/VibeSelector';
import { RecentEdits } from './components/dashboard/RecentEdits';

interface ClipData {
  url: string;
  duration: number;
}

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // App State
  const [appState, setAppState] = useState<'idle' | 'files_selected' | 'uploading'>('idle');
  const [files, setFiles] = useState<File[]>([]);
  const [selectedVibe, setSelectedVibe] = useState<VibeType>(VIBES[1]); 
  const [progress, setProgress] = useState<string>("");
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

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

  const onFilesDropped = (droppedFiles: File[]) => {
    setFiles(droppedFiles);
    setAppState('files_selected');
  };

  const handleBuild = async () => {
    if (!user) return;
    setAppState('uploading'); 
    const uploadedClips: ClipData[] = [];

    try {
      // 1. Upload Files
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProgress(`Uploading clip ${i + 1}/${files.length}...`);
        const duration = await getVideoDuration(file);
        
        const uniqueName = `${Date.now()}-${file.name}`;
        const storageRef = ref(storage, `uploads/${user.uid}/${uniqueName}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);

        uploadedClips.push({ url, duration });
      }

      // 2. AI MAGIC ANIMATION (Fake Delay)
      setProgress("AI is watching your videos...");
      // ⏳ WAIT 2 SECONDS to show off the animation
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 3. Calculate Cuts
      setProgress("Designing the timeline...");
      const clipsWithVibe = processClipsWithVibe(uploadedClips, selectedVibe.id);
      
      // ⏳ WAIT 1 SECOND MORE
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 4. Save Project
      setProgress("Finalizing studio...");
      const projectRef = await addDoc(collection(db, "projects"), {
        userId: user.uid,
        createdAt: serverTimestamp(),
        status: 'draft',
        vibe: selectedVibe.id,
        clips: clipsWithVibe,
      });

      router.push(`/editor/${projectRef.id}`);

    } catch (error) {
      console.error(error);
      setAppState('idle');
      alert("Failed to build project.");
    }
  };

  if (loadingAuth) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>;
  if (!user) return <div className="min-h-screen bg-black text-white flex items-center justify-center"><Login onLogin={setUser} /></div>;

  return (
    <main className="min-h-screen flex flex-col items-center p-12 bg-black text-white relative overflow-hidden font-sans">
      
      {/* HEADER */}
      <div className="w-full max-w-2xl mb-12 flex justify-between items-center border-b border-gray-800 pb-6 relative z-10">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
          KatKut.ai
        </h1>
        <div className="relative">
          <button 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-3 hover:opacity-80 transition"
          >
            {user.photoURL ? (
              <img src={user.photoURL} className="w-10 h-10 rounded-full border-2 border-gray-700" alt="User" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold">
                {user.displayName?.[0] || user.email?.[0] || 'U'}
              </div>
            )}
          </button>
          
          {/* Dropdown Menu */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 bg-gray-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden z-50">
              <div className="px-3 py-2 flex items-center justify-between gap-2">
                <p className="text-xs text-white font-semibold truncate">{user.displayName || 'User'}</p>
                <button
                  onClick={async () => {
                    await signOut(auth);
                    setShowProfileMenu(false);
                  }}
                  className="text-red-400 hover:text-red-300 transition text-xs font-bold whitespace-nowrap"
                >
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="w-full max-w-2xl relative z-10">
        {appState === 'idle' && <UploadZone onFilesSelected={onFilesDropped} isLoading={false} />}
        
        {appState === 'files_selected' && (
          <VibeSelector 
            selectedVibe={selectedVibe}
            onSelect={setSelectedVibe}
            onBuild={handleBuild}
            onCancel={() => setAppState('idle')}
          />
        )}
      </div>

      {/* 👇 RECENT EDITS GALLERY */}
      {appState === 'idle' && user && (
        <div className="w-full max-w-6xl mt-12 relative z-10">
          <RecentEdits userId={user.uid} />
        </div>
      )}


      {/* VIEW 3: AI PROCESSING OVERLAY */}
      {appState === 'uploading' && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center backdrop-blur-md">
            <div className="relative flex items-center justify-center mb-10">
              <div className="absolute w-40 h-40 bg-blue-600/30 rounded-full animate-ping"></div>
              <div className="absolute w-60 h-60 bg-purple-600/20 rounded-full animate-ping delay-100"></div>
              <div className="relative z-10 bg-gradient-to-tr from-blue-600 to-purple-600 p-8 rounded-full shadow-[0_0_50px_rgba(37,99,235,0.5)]">
                <span className="text-6xl animate-pulse">✨</span>
              </div>
            </div>

            <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 mb-4 animate-pulse">
              AI is Creating Your Edit
            </h2>
            <p className="text-gray-400 text-xl mb-10 font-light">Analyzing scenes for <span className="text-blue-400 font-bold">{selectedVibe.label}</span> vibe...</p>

            <div className="w-80 h-1 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 animate-[width_3s_ease-in-out_infinite]" style={{ width: '100%' }}></div>
            </div>
            <p className="mt-4 text-sm text-gray-500 font-mono animate-fade-in">{progress}</p>
        </div>
      )}
    </main>
  );
}