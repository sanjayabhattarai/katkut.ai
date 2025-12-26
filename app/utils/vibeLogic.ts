// app/utils/vibeLogic.ts

export type VibeCategory = 'personal' | 'business';

// 1. CONFIGURATION INTERFACE
export interface Vibe {
  id: string;
  label: string;
  category: VibeCategory;
  emoji: string;
  description: string;
  cutSettings: {
    minDuration: number;  // Seconds (e.g., 1.0)
    maxDuration: number;  // Seconds (e.g., 3.0)
    transition: 'fade' | 'cut' | 'zoom' | 'wipe';
  };
}

// 2. INPUT & OUTPUT TYPES
interface SourceClip {
  url: string;
  duration: number; // Total length of raw video
  width?: number;
  height?: number;
}

export interface ProcessedClip {
  assetUrl: string;
  startFrom: number; // Where to start cutting in the raw file
  length: number;    // How long the clip plays
  transition: string;
}

// 3. THE MASTER VIBE LIST 🎨
export const VIBES: Vibe[] = [
  // --- 👤 PERSONAL VIBES ---
  {
    id: 'hype',
    label: 'TikTok Hype',
    category: 'personal',
    emoji: '⚡️',
    description: 'Fast cuts, trending sounds, flash effects.',
    cutSettings: { minDuration: 0.6, maxDuration: 1.5, transition: 'cut' }
  },
  {
    id: 'chill',
    label: 'Chill / Lo-Fi',
    category: 'personal',
    emoji: '☕️',
    description: 'Slow transitions, relaxing atmosphere.',
    cutSettings: { minDuration: 3.0, maxDuration: 5.0, transition: 'fade' }
  },
  {
    id: 'vlog',
    label: 'Travel Vlog',
    category: 'personal',
    emoji: '✈️',
    description: 'Bright colors, upbeat tempo, journey style.',
    cutSettings: { minDuration: 2.0, maxDuration: 4.0, transition: 'cut' }
  },
  {
    id: 'memories',
    label: 'Memories',
    category: 'personal',
    emoji: '🎞️',
    description: 'Slow motion, sentimental music.',
    cutSettings: { minDuration: 3.5, maxDuration: 6.0, transition: 'fade' }
  },

  // --- 💼 BUSINESS VIBES ---
  {
    id: 'real_estate',
    label: 'Real Estate',
    category: 'business',
    emoji: '🏡',
    description: 'Smooth pans, elegant transitions.',
    cutSettings: { minDuration: 4.0, maxDuration: 6.0, transition: 'fade' }
  },
  {
    id: 'menu',
    label: 'The Menu',
    category: 'business',
    emoji: '🍔',
    description: 'Dynamic cuts, makes food look fresh.',
    cutSettings: { minDuration: 1.0, maxDuration: 2.5, transition: 'cut' }
  },
  {
    id: 'showcase',
    label: 'Product Showcase',
    category: 'business',
    emoji: '🛍️',
    description: 'Clean focus on products.',
    cutSettings: { minDuration: 2.5, maxDuration: 3.5, transition: 'fade' }
  },
  {
    id: 'fitness',
    label: 'Gym / Fitness',
    category: 'business',
    emoji: '💪',
    description: 'High energy, aggressive cuts.',
    cutSettings: { minDuration: 0.5, maxDuration: 1.5, transition: 'cut' }
  },
  {
    id: 'corporate',
    label: 'Corporate',
    category: 'business',
    emoji: '👔',
    description: 'Professional, stable, trustworthy.',
    cutSettings: { minDuration: 3.0, maxDuration: 5.0, transition: 'fade' }
  }
];

export type VibeType = typeof VIBES[0];

// 5. THE AI LOGIC 🧠
export const processClipsWithVibe = (clips: SourceClip[], vibeId: string): ProcessedClip[] => {
  const selectedVibe = VIBES.find(v => v.id === vibeId) || VIBES[0];
  const settings = selectedVibe.cutSettings;
  const isPersonal = selectedVibe.category === 'personal'; 
  
  const timeline: ProcessedClip[] = [];

  clips.forEach((clip) => {
    // A. Calculate Target Duration (Randomized for human feel)
    // -------------------------------------------------------
    let targetLength = Math.random() * (settings.maxDuration - settings.minDuration) + settings.minDuration;
    
    // Safety: Clip can't be longer than the source file
    let safeLength = Math.min(targetLength, clip.duration);

    // B. Calculate Smart Start Time (Avoid boring/shaky starts)
    // ---------------------------------------------------------
    let startTime = 0;

    if (isPersonal && clip.duration > safeLength + 1.0) {
      // PERSONAL: Pick a random spot to find "action" (skip the first boring second)
      // Example: 10s video, 4s cut. Start anywhere between 0s and 6s.
      const maxStartTime = clip.duration - safeLength;
      startTime = Math.random() * maxStartTime;
    } else {
      // BUSINESS: Start at 0:00 to ensure professional framing is kept
      startTime = 0;
    }

    // --- CLIP 1: The Main Cut ---
    timeline.push({
      assetUrl: clip.url,
      startFrom: startTime, 
      length: safeLength,
      transition: settings.transition
    });

    // --- CLIP 2: The "Double Dip" (If video > 30s) ---
    // -------------------------------------------------
    if (clip.duration > 30) {
      const middlePoint = clip.duration / 2;
      
      // Calculate a new random length for variety
      let secondLength = Math.random() * (settings.maxDuration - settings.minDuration) + settings.minDuration;
      let safeSecondLength = Math.min(secondLength, clip.duration - middlePoint);

      if (safeSecondLength > 1.5) { // Only add if we have at least 1.5s usable
        timeline.push({
          assetUrl: clip.url,
          startFrom: middlePoint + startTime, // Offset slightly into the second half
          length: safeSecondLength,
          transition: settings.transition
        });
      }
    }
  });

  return timeline;
};