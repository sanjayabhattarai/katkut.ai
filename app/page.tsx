"use client";
import { useState } from 'react';
import axios from 'axios';

interface ApiResponse {
  success: boolean;
  id: string;
}

export default function Home() {
  const [status, setStatus] = useState<"idle" | "processing" | "done">("idle");
  const [videoUrl, setVideoUrl] = useState<string>("");

  // Your Dropbox Links
  const myLinks: string[] = [
    "https://www.dropbox.com/scl/fi/tssicwg1uwbmiyzwa1tln/Screen-Recording-2025-03-16-163313.mp4?rlkey=9simfugovlolu51iv86b6n99p&st=lvlgnzp8&dl=1",
    "https://www.dropbox.com/scl/fi/98i74ir2aaxgl724pta46/Screen-Recording-2025-03-20-012107.mp4?rlkey=o6ltkm4xh5qz86agk0jb41h2s&st=xejs2mec&dl=1",
    "https://www.dropbox.com/scl/fi/uyb9125qkqi4gcapazxhl/Screen-Recording-2025-11-28-122422.mp4?rlkey=7n4hbzpkwxcyalud1psbgnihh&st=n3rrghuf&dl=1",
    "https://www.dropbox.com/scl/fi/xlhm4cahk5ahbmkr1e6x3/Screen-Recording-2025-12-11-231058.mp4?rlkey=2p2zdghbvxlaase5j7hbf0iq6&st=5xe6s0o9&dl=1"
  ];

  async function handleCreateVideo() {
    setStatus("processing");
    setVideoUrl(""); // Reset previous video

    try {
      // 1. Start the render
      const res = await axios.post('/api/render', { urls: myLinks });
      const data = res.data as ApiResponse; 
      console.log("Job started:", data.id);

      // 2. Start checking status (Real Loop)
      checkStatusLoop(data.id);

    } catch (e) {
      console.error(e);
      setStatus("idle");
      alert("Something went wrong.");
    }
  }

  // The Looper Function: Checks every 3 seconds
  async function checkStatusLoop(id: string) {
    const interval = setInterval(async () => {
      try {
        const res = await axios.get(`/api/render/status?id=${id}`);
        const status = res.data.status; // 'done', 'failed', 'rendering'

        console.log("Current Status:", status);

        if (status === 'done') {
            clearInterval(interval); // Stop checking
            setVideoUrl(res.data.url); // Save the video URL
            setStatus("done");
        } else if (status === 'failed') {
            clearInterval(interval);
            setStatus("idle");
            alert("Render Failed!");
        }
      } catch (e) {
        console.error("Check failed", e);
      }
    }, 3000); 
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-black text-white">
      <h1 className="text-4xl font-bold mb-8">KatKut.ai</h1>
      
      <div className="border border-gray-700 p-8 rounded-xl text-center w-full max-w-2xl">
        
        {/* VIEW 1: IDLE */}
        {status === "idle" && (
          <div>
            <p className="mb-6 text-gray-400">Ready to montage your 4 clips?</p>
            <button 
              onClick={handleCreateVideo}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-full transition w-full"
            >
              ✨ Create Magic Montage
            </button>
          </div>
        )}

        {/* VIEW 2: PROCESSING */}
        {status === "processing" && (
            <div className="flex flex-col items-center animate-pulse text-yellow-400">
                <span className="text-4xl mb-4">⚙️</span>
                <p>AI is stitching your video...</p>
                <p className="text-sm text-gray-500 mt-2">(This takes about 20-30 seconds)</p>
            </div>
        )}

        {/* VIEW 3: DONE (Show Video) */}
        {status === "done" && videoUrl && (
            <div className="text-green-400">
                <h2 className="text-2xl font-bold mb-4">🎉 Your Video is Ready!</h2>
                
                {/* THE VIDEO PLAYER */}
                <video controls className="w-full rounded-lg border border-gray-700 mb-6" src={videoUrl}>
                    Your browser does not support the video tag.
                </video>

                <div className="flex gap-4 justify-center">
                    <a href={videoUrl} target="_blank" className="text-blue-400 underline hover:text-blue-300">
                        Download
                    </a>
                    <button onClick={() => setStatus("idle")} className="text-gray-400 hover:text-white">
                        Create New
                    </button>
                </div>
            </div>
        )}
      </div>
    </main>
  );
}