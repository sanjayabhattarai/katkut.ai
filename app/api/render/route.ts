// app/api/render/route.ts
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

interface ClipInput {
  url: string;
  duration: number;
  trimStart?: number;
  trimDuration?: number;
  muted?: boolean;
  width?: number;   // Video dimensions for smart processing
  height?: number;
}

interface ShotstackTrack {
  clips: any[];
}

const API_KEY = process.env.SHOTSTACK_API_KEY!;
const ENDPOINT = process.env.SHOTSTACK_ENDPOINT!;

// Helper function to determine if video needs smart background
const getTracksForClip = (clip: ClipInput, start: number, length: number) => {
  const isVertical = clip.height && clip.width && clip.height > clip.width;

  const baseClip = {
    asset: { 
      type: 'video', 
      src: clip.url, 
      trim: clip.trimStart || 0 
    },
    start,
    length
  };

  // ✅ VERTICAL VIDEO: Simple single track
  if (isVertical) {
    return [
      {
        clips: [{
          ...baseClip,
          fit: 'cover' // Fills the screen
        }]
      }
    ];
  }

  // ✅ HORIZONTAL/SQUARE VIDEO: Two-track system
  // Track order: Foreground first (renders on top), Background second (renders behind)
  return [
    // Track 1 (Foreground): Clean video with no cropping
    {
      clips: [{
        ...baseClip,
        fit: 'contain' // Shows the whole video
      }]
    },
    // Track 2 (Background): Blurred fill
    {
      clips: [{
        ...baseClip,
        scale: 1.8,
        filter: 'blur',
        opacity: 0.6
      }]
    }
  ];
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const clipsData: ClipInput[] = body.clips;

    if (!clipsData || clipsData.length === 0) {
      return NextResponse.json({ error: "No videos provided" }, { status: 400 });
    }

    let currentTime = 0;
    const allTracks: ShotstackTrack[] = [];
    
    // Process each clip and collect all tracks
    clipsData.forEach((clip) => {
      let cutStart = 0;
      let cutLength = 0;

      // Determine trim values
      if (clip.trimStart !== undefined && clip.trimDuration !== undefined) {
        cutStart = clip.trimStart;
        cutLength = clip.trimDuration;
      } else {
        if (clip.duration < 5) {
          cutStart = 0;
          cutLength = clip.duration;
        } else {
          cutLength = 3.5; 
          const center = clip.duration / 2;
          cutStart = center - 1.75; 
        }
      }

      // Get tracks for this clip (1 for vertical, 2 for horizontal/square)
      const clipTracks = getTracksForClip(
        { ...clip, trimStart: cutStart }, 
        currentTime, 
        cutLength
      );

      // Add all tracks from this clip
      allTracks.push(...clipTracks);
      
      currentTime += cutLength;
    });

    const jsonPayload = {
      timeline: {
        background: "#000000",
        tracks: allTracks
      },
      output: { 
        format: "mp4", 
        size: { width: 1080, height: 1920 },
        quality: "high"
      }
    };

    const response = await axios.post(ENDPOINT, jsonPayload, {
      headers: {
        "x-api-key": API_KEY,
        "Content-Type": "application/json"
      }
    });

    return NextResponse.json({ success: true, id: response.data.response.id });

  } catch (error: any) {
    console.error("❌ Error:", error);
    return NextResponse.json({ error: "Failed to render" }, { status: 500 });
  }
}