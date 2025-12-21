// app/api/render/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const API_KEY = process.env.SHOTSTACK_API_KEY!;
const ENDPOINT = process.env.SHOTSTACK_ENDPOINT || "https://api.shotstack.io/stage/render";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }

    const response = await axios.get(`${ENDPOINT}/${id}`, {
      headers: {
        "x-api-key": API_KEY,
        "Content-Type": "application/json"
      }
    });

    // Check if response structure is valid
    if (!response.data || !response.data.response) {
       throw new Error("Invalid response from Shotstack");
    }

    const status = response.data.response.status; // 'queued', 'rendering', 'done', 'failed'
    const url = response.data.response.url;

    return NextResponse.json({ 
      status: status, 
      url: url 
    });

  } catch (error: any) {
    // Log the actual error from Shotstack if available
    console.error("❌ Status Check Failed:", error.response?.data || error.message);
    return NextResponse.json({ error: "Failed to check status" }, { status: 500 });
  }
}