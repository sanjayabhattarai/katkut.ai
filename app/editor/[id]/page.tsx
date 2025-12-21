// app/editor/[id]/page.tsx
"use client";
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { db } from '../../api/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useVideoPlayer } from '../../hooks/useVideoPlayer';
import { useRenderExport } from '../../hooks/useRenderExport';
import { VideoPlayer } from '../../components/VideoPlayer';
import { EditPanel } from '../../components/editor/EditPanel';
import { ResultPreview } from '../../components/ResultPreview';

interface Clip {
  url: string;
  duration: number;
  trimStart?: number;
  trimDuration?: number;
}

interface ProjectData {
  clips: Clip[];
  status: string;
}

export default function Editor() {
  const params = useParams();
  const projectId = params?.id as string;

  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeClipIndex, setActiveClipIndex] = useState(0);
  const [isPlayingAll, setIsPlayingAll] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const { player1Ref, player2Ref, isBuffering, setIsBuffering, activePlayerRef } = useVideoPlayer(project, activeClipIndex, isPlayingAll);
  const { rendering, finalVideoUrl, setFinalVideoUrl, handleRender } = useRenderExport();

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
        setProject({ ...data, clips: initializedClips });
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
    const newClips = [...project.clips];
    const prev = newClips[activeClipIndex];
    const next = { ...prev, ...updates };
    newClips[activeClipIndex] = next;
    setProject({ ...project, clips: newClips });

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

  const handleSelectClip = (index: number) => {
    setActiveClipIndex(index);
    setIsPlayingAll(false);
  };

  const handleRenderClick = () => {
    if (!project) return;
    handleRender(project.clips);
  };

  if (loading) return <div className="bg-black h-screen text-white flex items-center justify-center">Loading...</div>;
  if (!project) return <div className="bg-black h-screen text-white flex items-center justify-center">Project not found</div>;

  const activeClip = project.clips[activeClipIndex];

  return (
    <main className="h-screen bg-black text-white flex flex-col overflow-hidden font-sans relative">
      <div className={`flex-1 relative flex items-center justify-center bg-[#101010] transition-all duration-500 ${isEditing ? 'pb-64' : 'pb-0'}`}>
        {finalVideoUrl ? (
          <ResultPreview finalVideoUrl={finalVideoUrl} onClose={() => setFinalVideoUrl("")} />
        ) : (
          <VideoPlayer
            player1Ref={player1Ref}
            player2Ref={player2Ref}
            activeClipIndex={activeClipIndex}
            isBuffering={isBuffering}
            isPlayingAll={isPlayingAll}
            onTimeUpdate={handleTimeUpdate}
            onTogglePlay={togglePlayAll}
            onSetBuffering={setIsBuffering}
            onEdit={() => setIsEditing(true)}
            onRender={handleRenderClick}
            rendering={rendering}
          />
        )}
      </div>

      <EditPanel
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        activeClipIndex={activeClipIndex}
        activeClip={activeClip}
        clips={project.clips}
        onUpdateClip={updateClip}
        onSelectClip={handleSelectClip}
        onExport={handleRenderClick}
        isRendering={rendering}
        isPlaying={isPlayingAll}
        onTogglePlay={togglePlayAll}
      />
    </main>
  );
}
