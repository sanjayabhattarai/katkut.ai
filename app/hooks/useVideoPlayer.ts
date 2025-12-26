import { useEffect, useRef, useState } from 'react';

interface Clip {
  url: string;
  duration: number;
  trimStart?: number;
  trimDuration?: number;
  muted?: boolean;
}

export const useVideoPlayer = (project: { clips: Clip[] } | null, activeClipIndex: number, isPlayingAll: boolean) => {
  const player1Ref = useRef<HTMLVideoElement>(null);
  const player2Ref = useRef<HTMLVideoElement>(null);
  const [isBuffering, setIsBuffering] = useState(false);

  const activePlayerRef = activeClipIndex % 2 === 0 ? player1Ref : player2Ref;
  const inactivePlayerRef = activeClipIndex % 2 === 0 ? player2Ref : player1Ref;

  // Setup video players
  useEffect(() => {
    if (!project) return;
    
    const activeClip = project.clips[activeClipIndex];
    const nextClipIdx = (activeClipIndex + 1) % project.clips.length;
    const nextClip = project.clips[nextClipIdx];

    // --- A. ACTIVE PLAYER ---
    if (activePlayerRef.current) {
        const vid = activePlayerRef.current;
        const currentSrc = vid.getAttribute("src");

        if (currentSrc !== activeClip.url) {
             setIsBuffering(true);
             vid.src = activeClip.url;
             // Reset currentTime BEFORE load to ensure clean state
             vid.currentTime = 0;
             vid.load();
        }

        // If clip.muted is true, we mute the HTML video element
        vid.muted = activeClip.muted || false;

        // Seek to trim position (only if already loaded)
        if (vid.readyState >= 2 && Math.abs(vid.currentTime - (activeClip.trimStart || 0)) > 0.5) {
            vid.currentTime = activeClip.trimStart || 0;
        }

        // Play Logic
        if (isPlayingAll) {
            const p = vid.play();
            if (p) p.catch(() => {});
        } else {
             vid.pause();
        }
    }


    // --- B. INACTIVE PLAYER (Preload next) ---
    if (inactivePlayerRef.current) {
        const vid = inactivePlayerRef.current;
        vid.pause();
        
        const currentSrc = vid.getAttribute("src");
        if (currentSrc !== nextClip.url) {
            vid.src = nextClip.url;
            // Set the correct position for the next clip
            vid.currentTime = nextClip.trimStart || 0;
            vid.load();
        }
    }

  }, [activeClipIndex, project, isPlayingAll]);

  return {
    player1Ref,
    player2Ref,
    isBuffering,
    setIsBuffering,
    activePlayerRef,
  };
};
