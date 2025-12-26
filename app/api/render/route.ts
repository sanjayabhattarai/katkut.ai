// app/api/render/route.ts
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

interface ClipInput {
  assetUrl: string;
  startFrom: number;
  length: number;
  muted?: boolean;
  width?: number;
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
      src: clip.assetUrl,
      trim: clip.startFrom || 0
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
          fit: 'cover'
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
        fit: 'contain'
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
      console.error('❌ No clips provided');
      return NextResponse.json({ error: "No videos provided" }, { status: 400 });
    }

    let currentTime = 0;
    const allTracks: ShotstackTrack[] = [];
    
    // Process each clip and collect all tracks
    clipsData.forEach((clip, index) => {
      // Use the length directly from the clip (already calculated by vibe logic)
      const cutLength = clip.length;

      // Get tracks for this clip (1 for vertical, 2 for horizontal/square)
      const clipTracks = getTracksForClip(
        clip, 
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
    console.error("❌ Render Error:", error.message);
    if (error.response) {
      console.error("❌ Shotstack Response:", error.response.data);
      console.error("❌ Status:", error.response.status);
    }
    return NextResponse.json({ 
      error: "Failed to render", 
      details: error.response?.data || error.message,
      fullError: JSON.stringify(error.response?.data || error.message)
    }, { status: 500 });
  }
}