// app/api/render/route.ts
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

interface ClipInput {
  url: string;
  duration: number;
}

interface ShotstackClip {
  asset: {
    type: string;
    src: string;
    trim?: number;
  };
  start: number;
  length: number;
  scale?: number;     // Helps fill the screen
  position?: string;  // Center the video
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

    // 🧠 TIKTOK LOGIC LOOP
    let currentTime = 0;
    
    const tracks: ShotstackClip[] = clipsData.map((clip) => {
      
      let cutStart = 0;
      let cutLength = 0;

      // RULE: Smart Cut (Keep short clips, trim long ones)
      if (clip.duration < 5) {
        cutStart = 0;
        cutLength = clip.duration;
      } else {
        cutLength = 3.5; // TikToks are faster! (3.5s ideal)
        const center = clip.duration / 2;
        cutStart = center - 1.75; 
      }

      const shotstackClip: ShotstackClip = {
        asset: { 
          type: "video", 
          src: clip.url, 
          trim: cutStart,
        },
        start: currentTime,
        length: cutLength,
        // 📱 IMPORTANT: "Cover" the vertical screen (No black bars)
        // We scale the video up so it fills the 9:16 frame
        scale: 0.5, // 0.5 usually fits HD landscape into SD vertical nicely, but 'fit' is handled by size below
        position: 'center'
      };

      // ✂️ No Overlap (Hard Cut)
      currentTime += cutLength; 
      
      return shotstackClip;
    });

    const jsonPayload = {
      timeline: {
        background: "#000000",
        tracks: [{ clips: tracks }]
      },
      output: { 
        format: "mp4", 
        // 📱 VERTICAL RESOLUTION (9:16)
        size: {
          width: 720,
          height: 1280
        }
      }
    };

    console.log("🚀 Sending TikTok Job to Shotstack...");
    
    const response = await axios.post(ENDPOINT, jsonPayload, {
      headers: {
        "x-api-key": API_KEY,
        "Content-Type": "application/json"
      }
    });

    return NextResponse.json({ 
      success: true, 
      id: response.data.response.id 
    });

  } catch (error: any) {
    console.error("❌ Error:", error.response ? error.response.data : error.message);
    return NextResponse.json({ error: "Failed to render" }, { status: 500 });
  }
}