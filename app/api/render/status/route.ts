// app/api/render/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const API_KEY = process.env.SHOTSTACK_API_KEY!;

export async function GET(request: NextRequest) {
  // Get the 'id' from the URL (e.g., ?id=123)
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: "No ID provided" }, { status: 400 });
  }

  try {
    const url = `https://api.shotstack.io/stage/render/${id}`;
    const response = await axios.get(url, {
      headers: { "x-api-key": API_KEY }
    });

    return NextResponse.json(response.data.response);

  } catch (error: any) {
    return NextResponse.json({ error: "Failed to check status" }, { status: 500 });
  }
}