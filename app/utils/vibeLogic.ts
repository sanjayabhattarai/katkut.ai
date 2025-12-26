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
    effect?: 'zoomIn' | 'pan' | 'zoomOut' | 'none'; 
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
  // Visual Effects properties for Shotstack
  scaleIn: number;   
  scaleOut: number;  
  panX: number;      
}

// 3. HELPER: Translate "Text Effect" to "Shotstack Numbers"
const getEffectSettings = (effectName: string) => {
  switch (effectName) {
    case 'zoomIn':
      return { scaleIn: 1.0, scaleOut: 1.15, panX: 0 }; // Grow by 15%
    case 'zoomOut':
      return { scaleIn: 1.15, scaleOut: 1.0, panX: 0 }; // Shrink
    case 'pan':
      // Start zoomed in slightly so we have room to move without black bars
      return { scaleIn: 1.1, scaleOut: 1.1, panX: 0.1 }; // Move camera right
    default:
      return { scaleIn: 1.0, scaleOut: 1.0, panX: 0 }; // Static
  }
};

// 4. THE MASTER VIBE LIST 🎨
export const VIBES: Vibe[] = [
  // --- 👤 PERSONAL VIBES ---
  {
    id: 'hype',
    label: 'TikTok Hype',
    category: 'personal',
    emoji: '⚡️',
    description: 'Fast cuts, trending sounds, flash effects.',
    cutSettings: { minDuration: 0.6, maxDuration: 1.5, transition: 'zoom', effect: 'none' }
  },
  {
    id: 'chill',
    label: 'Chill / Lo-Fi',
    category: 'personal',
    emoji: '☕️',
    description: 'Slow transitions, relaxing atmosphere.',
    cutSettings: { minDuration: 3.0, maxDuration: 5.0, transition: 'fade', effect: 'zoomIn' }
  },
  {
    id: 'vlog',
    label: 'Travel Vlog',
    category: 'personal',
    emoji: '✈️',
    description: 'Bright colors, upbeat tempo, journey style.',
    cutSettings: { minDuration: 2.0, maxDuration: 4.0, transition: 'wipe', effect: 'none' }
  },
  {
    id: 'memories',
    label: 'Memories',
    category: 'personal',
    emoji: '🎞️',
    description: 'Slow motion, sentimental music.',
    cutSettings: { minDuration: 3.5, maxDuration: 6.0, transition: 'fade', effect: 'pan' }
  },

  // --- 💼 BUSINESS VIBES ---
  {
    id: 'real_estate',
    label: 'Real Estate',
    category: 'business',
    emoji: '🏡',
    description: 'Smooth pans, elegant transitions.',
    cutSettings: { minDuration: 4.0, maxDuration: 6.0, transition: 'fade', effect: 'pan' }
  },
  {
    id: 'menu',
    label: 'The Menu',
    category: 'business',
    emoji: '🍔',
    description: 'Dynamic cuts, makes food look fresh.',
    cutSettings: { minDuration: 1.0, maxDuration: 2.5, transition: 'cut', effect: 'zoomIn' }
  },
  {
    id: 'showcase',
    label: 'Product Showcase',
    category: 'business',
    emoji: '🛍️',
    description: 'Clean focus on products.',
    cutSettings: { minDuration: 2.5, maxDuration: 3.5, transition: 'fade', effect: 'none' }
  },
  {
    id: 'fitness',
    label: 'Gym / Fitness',
    category: 'business',
    emoji: '💪',
    description: 'High energy, aggressive cuts.',
    cutSettings: { minDuration: 0.5, maxDuration: 1.5, transition: 'cut', effect: 'none' }
  },
  {
    id: 'corporate',
    label: 'Corporate',
    category: 'business',
    emoji: '👔',
    description: 'Professional, stable, trustworthy.',
    cutSettings: { minDuration: 3.0, maxDuration: 5.0, transition: 'fade', effect: 'none' }
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

    // C. Get Visual Effects
    // ---------------------
    const effects = getEffectSettings(settings.effect || 'none');

    // --- CLIP 1: The Main Cut ---
    timeline.push({
      assetUrl: clip.url,
      startFrom: startTime, 
      length: safeLength,
      transition: settings.transition,
      scaleIn: effects.scaleIn,
      scaleOut: effects.scaleOut,
      panX: effects.panX
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
          transition: settings.transition,
          // Re-apply effects (or we could flip them for variety later)
          scaleIn: effects.scaleIn,
          scaleOut: effects.scaleOut,
          panX: effects.panX
        });
      }
    }
  });

  return timeline;
};