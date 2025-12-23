// app/editor/[id]/page.tsx
"use client";
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useVideoPlayer } from '../../hooks/useVideoPlayer';
import { useRenderExport } from '../../hooks/useRenderExport';
import { useHistory } from '../../hooks/useHistory';
import { VideoPlayer } from '../../components/VideoPlayer';
import { EditPanel } from '../../components/editor/EditPanel';
import { ResultPreview } from '../../components/ResultPreview';
import { ExportBorder } from '../../components/ui/ExportBorder';

interface Clip {
  url: string;
  duration: number;
  trimStart?: number;
  trimDuration?: number;
  muted?: boolean;
}

interface ProjectData {
  clips: Clip[];
  status: string;
  userId?: string;
  finalVideoUrl?: string;
}

export default function Editor() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string;

  const [projectMetadata, setProjectMetadata] = useState<Omit<ProjectData, 'clips'> | null>(null);
  const { state: clips, set: setClips, undo, redo, canUndo, canRedo } = useHistory<Clip[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeClipIndex, setActiveClipIndex] = useState(0);
  const [isPlayingAll, setIsPlayingAll] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Reconstruct project object for compatibility
  const project = projectMetadata ? { ...projectMetadata, clips } : null;

  const { player1Ref, player2Ref, isBuffering, setIsBuffering, activePlayerRef } = useVideoPlayer(project, activeClipIndex, isPlayingAll);
  const { isRendering, downloadUrl, exportVideo, setDownloadUrl, renderProgress } = useRenderExport(projectId, projectMetadata?.userId);

  useEffect(() => {
    if (!projectId) return;
    async function fetchProject() {
      const docRef = doc(db, "projects", projectId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as ProjectData;
        const initializedClips = data.clips.map(clip => ({
          ...clip,
          trimStart: clip.trimStart ?? (clip.duration > 5 ? (clip.duration / 2) - 1.5 : 0),
          trimDuration: clip.trimDuration ?? (clip.duration > 5 ? 3 : clip.duration),
        }));
        // Separate clips from metadata
        const { clips: _, ...metadata } = data;
        setProjectMetadata(metadata);
        setClips(initializedClips);
        // ✅ Don't auto-open the preview popup - let the user decide
        // They can access it by clicking "Export" if they want to download
      }
      setLoading(false);
    }
    fetchProject();
  }, [projectId]);

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    if (!project) return;
    const v = e.currentTarget;

    if (v.currentTime > 0 && !v.paused && v.readyState > 2) {
      setIsBuffering(false);
    }

    const clip = project.clips[activeClipIndex];
    const start = clip.trimStart || 0;
    const end = start + (clip.trimDuration || 100);

    if (v.currentTime >= end) {
      if (isPlayingAll) {
        if (activeClipIndex < project.clips.length - 1) {
          setActiveClipIndex(prev => prev + 1);
        } else {
          setActiveClipIndex(0);
        }
      } else {
        v.currentTime = start;
        v.play().catch(() => {});
      }
    }
  };

  const updateClip = (updates: { trimStart?: number; trimDuration?: number }) => {
    if (!project) return;
    setIsPlayingAll(false);
    const newClips = [...clips];
    const prev = newClips[activeClipIndex];
    const next = { ...prev, ...updates };
    newClips[activeClipIndex] = next;
    setClips(newClips);

    if (activePlayerRef.current && updates.trimStart !== undefined) {
      activePlayerRef.current.currentTime = updates.trimStart;
    }
  };

  const togglePlayAll = () => {
    if (isPlayingAll) {
      setIsPlayingAll(false);
      activePlayerRef.current?.pause();
    } else {
      setIsPlayingAll(true);
      activePlayerRef.current?.play().catch(() => {});
    }
  };

  const handleToggleMute = (index: number) => {
    const updatedClips = clips.map((clip, idx) =>
      idx === index ? { ...clip, muted: !clip.muted } : clip
    );
    setClips(updatedClips);
  };

  const deleteClip = (indexToDelete: number) => {
    // Prevent deleting if only one clip remains
    if (clips.length <= 1) {
      alert("Cannot delete the last clip!");
      return;
    }

    // 1. Stop playback immediately to prevent errors
    setIsPlayingAll(false);

    // 2. Remove the clip
    const newClips = clips.filter((_, index) => index !== indexToDelete);
    setClips(newClips);

    // 3. SAFEGUARD: Adjust the active index
    // If we deleted the active clip (or one before it), we need to shift the index
    if (activeClipIndex >= indexToDelete) {
      // Go back one step, or reset to 0 if it was the first one
      setActiveClipIndex(Math.max(0, activeClipIndex - 1));
    }
  };

  const handleSelectClip = (index: number) => {
    setActiveClipIndex(index);
    setIsPlayingAll(false);
  };

  const handleReorderClips = (newClips: Clip[]) => {
    setClips(newClips);
    // Keep active clip tracking after reorder
    const currentClip = clips[activeClipIndex];
    const newIndex = newClips.findIndex(clip => clip.url === currentClip.url);
    if (newIndex !== -1) {
      setActiveClipIndex(newIndex);
    }
  };

  const handleRenderClick = () => {
    if (!project) return;
    setIsEditing(false); // Close editing panel when export starts
    exportVideo({ clips });
  };

  if (loading) return <div className="bg-black h-screen text-white flex items-center justify-center">Loading...</div>;
  if (!project) return <div className="bg-black h-screen text-white flex items-center justify-center">Project not found</div>;

  const activeClip = clips[activeClipIndex];

  return (
    <main className="h-screen bg-black text-white flex flex-col overflow-hidden font-sans">
      {/* VIDEO PLAYER SECTION */}
      <div className={`relative flex flex-col items-center justify-center bg-[#101010] transition-all duration-300 overflow-hidden ${isEditing ? 'h-[60vh] md:h-[55vh] pt-4 md:pt-8' : 'flex-1 pt-6 md:pt-12'}`}>
        {downloadUrl ? (
          <ResultPreview finalVideoUrl={downloadUrl} onClose={() => router.push('/')} />
        ) : (
          <>
            <VideoPlayer
              player1Ref={player1Ref as React.RefObject<HTMLVideoElement>}
              player2Ref={player2Ref as React.RefObject<HTMLVideoElement>}
              activeClipIndex={activeClipIndex}
              isBuffering={isBuffering}
              isPlayingAll={isPlayingAll}
              onTimeUpdate={handleTimeUpdate}
              onTogglePlay={togglePlayAll}
              onSetBuffering={setIsBuffering}
              onEdit={() => setIsEditing(true)}
              onRender={handleRenderClick}
              rendering={isRendering}
            />

            {/* Manual Edit Call-to-Action */}
            {!isEditing && (
              <div className="text-center mt-6 md:mt-10">
                <p className="text-gray-500 text-xs md:text-sm mb-2">Want to change a specific clip?</p>
                <button 
                  onClick={() => setIsEditing(true)} 
                  className="text-blue-400 hover:text-blue-300 text-sm md:text-base font-bold flex items-center justify-center gap-2 mx-auto transition-colors"
                >
                  <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Enter Manual Edit Mode
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* FULL SCREEN EXPORT OVERLAY */}
      {isRendering && (
        <div className="fixed inset-0 z-[60] bg-black flex flex-col items-center justify-center p-6 animate-fade-in">
          
          {/* 1. TEXT SECTION (Above Video) */}
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-white mb-2 font-mono">
              {Math.round(renderProgress)}%
            </h1>
            <p className="text-gray-400 text-sm max-w-xs mx-auto leading-relaxed">
              Keep this screen open and don&apos;t lock your phone. We&apos;ll let you save or share the video in a moment.
            </p>
          </div>

          {/* 2. VIDEO CONTAINER WITH BORDER */}
          <div className="relative w-full max-w-[320px] aspect-[9/16] bg-gray-900 rounded-3xl shadow-2xl">
            
            {/* The Actual Video Preview */}
            <video 
              ref={activePlayerRef}
              className="w-full h-full object-cover rounded-3xl opacity-50"
              muted
              playsInline
            />

            {/* ✨ The Orange Border Component ✨ */}
            <ExportBorder progress={renderProgress} />
            
          </div>
        </div>
      )}

      {/* EDITING PANEL - Shows below video with responsive height */}
      {isEditing && (
        <div className="h-[40vh] md:h-[45vh] bg-[#181818] border-t-4 border-gray-700/50 overflow-hidden mt-3 md:mt-6">
          <EditPanel
            isOpen={isEditing}
            onClose={() => setIsEditing(false)}
            activeClipIndex={activeClipIndex}
            activeClip={activeClip}
            clips={clips}
            onUpdateClip={updateClip}
            onSelectClip={handleSelectClip}
            onReorderClips={handleReorderClips}
            onExport={handleRenderClick}
            isRendering={isRendering}
            isPlaying={isPlayingAll}
            onToggleMute={handleToggleMute}
            onTogglePlay={togglePlayAll}
            onDeleteClip={deleteClip}
            onUndo={undo}
            onRedo={redo}
            canUndo={canUndo}
            canRedo={canRedo}
          />
        </div>
      )}
    </main>
  );
}
