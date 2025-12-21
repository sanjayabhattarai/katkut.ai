// app/utils/vibeLogic.ts

export interface VibeType {
  id: string;
  emoji: string;
  label: string;
  duration: number; // Target length per clip
}

export const VIBES: VibeType[] = [
  { id: 'fast', emoji: '⚡', label: 'Fast / TikTok', duration: 0.8 },
  { id: 'travel', emoji: '✈️', label: 'Travel / Mini Vlog', duration: 3.0 },
  { id: 'food', emoji: '🍳', label: 'Food / Cooking', duration: 2.0 },
  { id: 'vibe', emoji: '✨', label: 'Chill Vibe', duration: 4.0 },
];

interface RawClip {
  url: string;
  duration: number;
}

interface ProcessedClip extends RawClip {
  trimStart: number;
  trimDuration: number;
}

/**
 * THE BRAIN: Takes raw videos and cuts them according to the Vibe
 */
export function processClipsWithVibe(clips: RawClip[], vibeId: string): ProcessedClip[] {
  
  const selectedVibe = VIBES.find(v => v.id === vibeId) || VIBES[1];
  const targetLen = selectedVibe.duration;

  return clips.map(clip => {
    // 1. Determine Length
    // If the video is shorter than the target, use the whole video.
    const finalLen = clip.duration < targetLen ? clip.duration : targetLen;
    
    // 2. Determine Start (The Math)
    // Default: Start at 0
    let start = 0;

    // Logic: Always grab the PERFECT CENTER
    if (clip.duration > targetLen) {
      start = (clip.duration / 2) - (finalLen / 2);
    }

    // 💡 FUTURE UPGRADE: 
    // If vibeId === 'fast', maybe we add random jumps?
    // If vibeId === 'travel', maybe we take the end of the clip?
    // WE will write specific 'if' statements here later!

    return {
      ...clip,
      trimStart: start,
      trimDuration: finalLen
    };
  });
}