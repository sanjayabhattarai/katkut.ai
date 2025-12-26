// app/page.tsx
"use client";
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { auth, storage, db } from './firebase'; 
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid'; 

import { processClipsWithVibe, VIBES, VibeType } from './utils/vibeLogic'; 
import Login from './components/Login';
import UploadZone from './components/UploadZone';
import VibeSelector from './components/VibeSelector';
import { RecentEdits } from './components/dashboard/RecentEdits';

// Internal type for the background queue
interface VideoQueueItem {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  firebaseUrl?: string;
  duration?: number;
  width?: number;
  height?: number;
}

interface ClipData {
  url: string;
  duration: number;
  width?: number;
  height?: number;
}

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // App State
  const [appState, setAppState] = useState<'idle' | 'files_selected' | 'uploading'>('idle');
  
  // The invisible queue
  const [videoQueue, setVideoQueue] = useState<VideoQueueItem[]>([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  
  const [selectedVibe, setSelectedVibe] = useState<VibeType>(VIBES[1]); 
  const [progress, setProgress] = useState<string>("");
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Lock to prevent double-execution
  const buildStartedRef = useRef(false);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  // Helper: Get Duration
  const getVideoDuration = (file: File): Promise<{ duration: number; width: number; height: number }> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        const result = {
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight
        };
        window.URL.revokeObjectURL(video.src);
        resolve(result);
      };
      video.src = URL.createObjectURL(file);
    });
  };

  // 1. TRIGGER: Add files to queue & Show Vibe Selector IMMEDIATELY
  const onFilesDropped = (droppedFiles: File[]) => {
    // Prepare the queue items
    const newItems: VideoQueueItem[] = droppedFiles.map(file => ({
      id: uuidv4(),
      file,
      status: 'pending' // Ready for background worker
    }));

    setVideoQueue(newItems);
    setAppState('files_selected'); 
    // Logic: The UI switches to VibeSelector instantly. 
    // The useEffect below sees 'pending' items and starts uploading in background.
  };

  // 2. BACKGROUND WORKER: Uploads silently while user is choosing vibe
  useEffect(() => {
    const processNext = async () => {
      if (isProcessingQueue) return;
      if (!user) return;

      const nextVideo = videoQueue.find(v => v.status === 'pending');
      if (!nextVideo) return;

      setIsProcessingQueue(true); // Lock

      try {
        await uploadSingleVideo(nextVideo);
      } catch (err) {
        console.error("Queue error:", err);
      } finally {
        setIsProcessingQueue(false); // Unlock
      }
    };

    processNext();
  }, [videoQueue, isProcessingQueue, user]);

  // 3. Single Upload Logic
  const uploadSingleVideo = async (item: VideoQueueItem) => {
    if (!user) return;

    // Update status to uploading (Silent update, user doesn't see this in Vibe view)
    setVideoQueue(prev => prev.map(v => v.id === item.id ? { ...v, status: 'uploading' } : v));

    return new Promise<void>((resolve) => {
      getVideoDuration(item.file).then(({ duration, width, height }) => {
        const uniqueName = `${Date.now()}-${item.file.name}`;
        const storageRef = ref(storage, `uploads/${user.uid}/${uniqueName}`);
        
        const uploadTask = uploadBytesResumable(storageRef, item.file);

        uploadTask.on('state_changed', 
          (snapshot) => { /* Background progress */ },
          (error) => {
            console.error("Upload failed", error);
            setVideoQueue(prev => prev.map(v => v.id === item.id ? { ...v, status: 'error' } : v));
            resolve();
          },
          async () => {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            setVideoQueue(prev => prev.map(v => v.id === item.id ? { 
              ...v, 
              status: 'completed', 
              firebaseUrl: downloadUrl,
              duration,
              width,
              height
            } : v));
            resolve();
          }
        );
      });
    });
  };

  // 4. CLICK "MAKE MY VIDEO": Switch to Loading Screen
  const handleBuild = () => {
    if (!user) return;
    setAppState('uploading'); 
    // The View switches to the "AI Processing" overlay.
    // The useEffect below handles the "Wait" logic.
  };

  // 5. FINALIZER: Watches progress on the Loading Screen
  useEffect(() => {
    if (appState !== 'uploading') return;

    const pendingVideos = videoQueue.filter(v => v.status === 'pending' || v.status === 'uploading');
    const total = videoQueue.length;
    const done = total - pendingVideos.length;

    // A. If uploads are still running, show progress
    if (pendingVideos.length > 0) {
      setProgress(`Uploading clips... (${done}/${total})`);
      return;
    }

    // B. If uploads are DONE, trigger AI
    if (!buildStartedRef.current && total > 0) {
      buildStartedRef.current = true;
      startAiProcessing();
    }
  }, [videoQueue, appState]);

  // 6. AI Processing (Timeline Creation)
  const startAiProcessing = async () => {
    try {
      setProgress("AI is watching your videos...");
      await new Promise(resolve => setTimeout(resolve, 2000));

      setProgress("Designing the timeline...");
      
      const validClips: ClipData[] = videoQueue
        .filter(v => v.status === 'completed' && v.firebaseUrl)
        .map(v => ({
          url: v.firebaseUrl!,
          duration: v.duration || 0,
          width: v.width,
          height: v.height
        }));

      const clipsWithVibe = processClipsWithVibe(validClips, selectedVibe.id);
      await new Promise(resolve => setTimeout(resolve, 1000));

      setProgress("Finalizing studio...");
      
      // Map ProcessedClip to editor-compatible format
      const editorClips = clipsWithVibe.map(clip => ({
        url: clip.assetUrl,
        duration: clip.length,
        trimStart: clip.startFrom,
        trimDuration: clip.length,
        muted: false
      }));
      
      const projectRef = await addDoc(collection(db, "projects"), {
        userId: user!.uid,
        createdAt: serverTimestamp(),
        status: 'draft',
        vibe: selectedVibe.id,
        clips: editorClips,
      });

      router.push(`/editor/${projectRef.id}`);

    } catch (error) {
      console.error(error);
      setAppState('idle');
      buildStartedRef.current = false;
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
            id="profile-button"
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
          
          {showProfileMenu && (
            <div id="profile-menu" className="absolute right-full mr-2 top-0 bg-gray-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden z-50">
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
        {/* VIEW 1: UPLOAD ZONE */}
        {appState === 'idle' && (
          <UploadZone onFilesSelected={onFilesDropped} isLoading={false} />
        )}
        
        {/* VIEW 2: VIBE SELECTOR (Background Uploads Happening Here!) */}
        {appState === 'files_selected' && (
          <VibeSelector 
            selectedVibe={selectedVibe}
            onSelect={setSelectedVibe}
            onBuild={handleBuild}
            onCancel={() => {
              setVideoQueue([]); // Clear queue if cancelled
              setAppState('idle');
            }}
          />
        )}
      </div>

      {/* RECENT EDITS */}
      {appState === 'idle' && user && (
        <div className="w-full max-w-6xl mt-12 relative z-10">
          <RecentEdits userId={user.uid} />
        </div>
      )}

      {/* VIEW 3: LOADING OVERLAY (Shows progress if background upload isn't done yet) */}
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
            <p className="text-gray-400 text-xl mb-10 font-light">
              Analyzing scenes for <span className="text-blue-400 font-bold">{selectedVibe.label}</span> vibe...
            </p>

            <div className="w-80 h-1 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 animate-[width_3s_ease-in-out_infinite]" style={{ width: '100%' }}></div>
            </div>
            
            {/* Will show "Uploading clips..." only if they aren't done yet */}
            <p className="mt-4 text-sm text-gray-500 font-mono animate-fade-in">{progress}</p>
        </div>
      )}
    </main>
  );
}