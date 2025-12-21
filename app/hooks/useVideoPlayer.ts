import { useEffect, useRef, useState } from 'react';

interface Clip {
  url: string;
  duration: number;
  trimStart?: number;
  trimDuration?: number;
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
             console.log("Loading New Clip:", activeClip.url);
             setIsBuffering(true);
             vid.src = activeClip.url;
             vid.load();
        }

        // Seek
        if (Math.abs(vid.currentTime - (activeClip.trimStart || 0)) > 0.5) {
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

    // --- B. INACTIVE PLAYER ---
    if (inactivePlayerRef.current) {
        const vid = inactivePlayerRef.current;
        vid.pause();
        
        // Preload Next
        const currentSrc = vid.getAttribute("src");
        if (currentSrc !== nextClip.url) {
            vid.src = nextClip.url;
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
