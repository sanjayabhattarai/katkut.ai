// app/api/render/route.ts
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// 1. UPDATE INTERFACE
interface ClipInput {
  url: string;
  duration: number;
  trimStart?: number;     // 👈 User's choice
  trimDuration?: number;  // 👈 User's choice
  muted?: boolean;
}

// ... (ShotstackClip interface stays the same) ...
interface ShotstackClip {
  asset: {
    type: string;
    src: string;
    trim?: number;
  };
  start: number;
  length: number;
  scale?: number;
  position?: string;
}

const API_KEY = process.env.SHOTSTACK_API_KEY!;
const ENDPOINT = process.env.SHOTSTACK_ENDPOINT!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const clipsData: ClipInput[] = body.clips;

    if (!clipsData || clipsData.length === 0) {
      return NextResponse.json({ error: "No videos provided" }, { status: 400 });
    }

    let currentTime = 0;
    
    // 🧠 LOGIC UPDATE: User Preference > AI Math
    const tracks: ShotstackClip[] = clipsData.map((clip) => {
      
      let cutStart = 0;
      let cutLength = 0;

      // CHECK: Did the user manually edit this?
      if (clip.trimStart !== undefined && clip.trimDuration !== undefined) {
          // ✅ USE USER VALUES
          cutStart = clip.trimStart;
          cutLength = clip.trimDuration;
      } else {
          // 🤖 USE AI MATH (Fallback)
          if (clip.duration < 5) {
            cutStart = 0;
            cutLength = clip.duration;
          } else {
            cutLength = 3.5; 
            const center = clip.duration / 2;
            cutStart = center - 1.75; 
          }
      }

      const shotstackClip: ShotstackClip = {
        asset: { 
          type: "video", 
          src: clip.url, 
          trim: cutStart,
        },
        start: currentTime,
        length: cutLength,
        scale: 0.5, 
        position: 'center'
      };

      currentTime += cutLength; 
      return shotstackClip;
    });

    // ... (Payload construction stays same) ...
    const jsonPayload = {
      timeline: {
        background: "#000000",
        tracks: [{ clips: tracks }]
      },
      output: { 
        format: "mp4", 
        size: { width: 720, height: 1280 }
      }
    };

    // ... (Axios call stays same) ...
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