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
  const { isRendering, downloadUrl, exportVideo, setDownloadUrl } = useRenderExport(projectId, projectMetadata?.userId);

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
    exportVideo({ clips });
  };

  if (loading) return <div className="bg-black h-screen text-white flex items-center justify-center">Loading...</div>;
  if (!project) return <div className="bg-black h-screen text-white flex items-center justify-center">Project not found</div>;

  const activeClip = clips[activeClipIndex];

  return (
    <main className="h-screen bg-black text-white flex flex-col overflow-hidden font-sans">
      {/* VIDEO PLAYER SECTION - Takes 50% when editing, 100% otherwise */}
      <div className={`relative flex items-center justify-center bg-[#101010] transition-all duration-300 overflow-hidden ${isEditing ? 'flex-1' : 'flex-1'}`}>
        {downloadUrl ? (
          <ResultPreview finalVideoUrl={downloadUrl} onClose={() => router.push('/')} />
        ) : (
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
        )}
      </div>

      {/* EDITING PANEL - Shows/Hides below video */}
      {isEditing && (
        <div className="flex-1 bg-[#181818] border-t border-gray-700 overflow-hidden">
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
