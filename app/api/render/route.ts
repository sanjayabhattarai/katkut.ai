// app/api/render/route.ts
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// 1. Define Types (So TypeScript is happy)
interface RenderRequest {
  urls: string[];
}

interface ShotstackClip {
  asset: {
    type: string;
    src: string;
    trim?: number;
  };
  start: number;
  length: number;
}

// 2. Load Keys
const API_KEY = process.env.SHOTSTACK_API_KEY!;
const ENDPOINT = process.env.SHOTSTACK_ENDPOINT!;

// 3. The POST Handler (This listens for the button click)
export async function POST(request: NextRequest) {
  try {
    const body: RenderRequest = await request.json();
    const videoUrls = body.urls;

    if (!videoUrls || videoUrls.length === 0) {
      return NextResponse.json({ error: "No videos provided" }, { status: 400 });
    }

    // 4. Build the Timeline Logic
    let currentTime = 0;
    const clips: ShotstackClip[] = videoUrls.map((url) => {
      const clip: ShotstackClip = {
        asset: { type: "video", src: url, trim: 0.0 },
        start: currentTime,
        length: 2.0 // Default to 2 seconds per clip
      };
      currentTime += 2.0;
      return clip;
    });

    const jsonPayload = {
      timeline: {
        background: "#000000",
        tracks: [{ clips: clips }]
      },
      output: { format: "mp4", resolution: "sd" }
    };

    console.log("🚀 Sending job to Shotstack...");
    
    // 5. Send to Shotstack
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