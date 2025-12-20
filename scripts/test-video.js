// scripts/test-video.js
require('dotenv').config();
const axios = require('axios');

const API_KEY = process.env.SHOTSTACK_API_KEY;
const ENDPOINT = process.env.SHOTSTACK_ENDPOINT;

// 1. YOUR VIDEOS (I fixed the dl=1 link for you)
const CLIP_1 = "https://www.dropbox.com/scl/fi/tssicwg1uwbmiyzwa1tln/Screen-Recording-2025-03-16-163313.mp4?rlkey=9simfugovlolu51iv86b6n99p&st=lvlgnzp8&dl=1";
const CLIP_2 = "https://www.dropbox.com/scl/fi/98i74ir2aaxgl724pta46/Screen-Recording-2025-03-20-012107.mp4?rlkey=o6ltkm4xh5qz86agk0jb41h2s&st=xejs2mec&dl=1";
const CLIP_3 = "https://www.dropbox.com/scl/fi/uyb9125qkqi4gcapazxhl/Screen-Recording-2025-11-28-122422.mp4?rlkey=7n4hbzpkwxcyalud1psbgnihh&st=n3rrghuf&dl=1";
const CLIP_4 = "https://www.dropbox.com/scl/fi/xlhm4cahk5ahbmkr1e6x3/Screen-Recording-2025-12-11-231058.mp4?rlkey=2p2zdghbvxlaase5j7hbf0iq6&st=5xe6s0o9&dl=1";

const jsonPayload = {
    timeline: {
        background: "#000000",
        tracks: [
            {
                clips: [
                    // --- CLIP 1 (0s to 2s) ---
                    {
                        asset: { type: "video", src: CLIP_1, trim: 0.0 }, // Start from beginning of file
                        start: 0,      
                        length: 2.0    
                    },
                    // --- CLIP 2 (2s to 4s) ---
                    {
                        asset: { type: "video", src: CLIP_2, trim: 0.0 }, 
                        start: 2.0,    
                        length: 2.0    
                    },
                    // --- CLIP 3 (4s to 6s) ---
                    {
                        asset: { type: "video", src: CLIP_3, trim: 0.0 },
                        start: 4.0,    
                        length: 2.0    
                    },
                    // --- CLIP 4 (6s to 8s) ---
                    {
                        asset: { type: "video", src: CLIP_4, trim: 0.0 },
                        start: 6.0,    
                        length: 2.0    
                    }
                ]
            }
        ]
    },
    output: {
        format: "mp4",
        resolution: "sd"
    }
};

async function makeVideo() {
    try {
        console.log("🚀 Sending 4-Video Job to Shotstack...");
        
        const response = await axios.post(ENDPOINT, jsonPayload, {
            headers: {
                "x-api-key": API_KEY,
                "Content-Type": "application/json"
            }
        });

        const id = response.data.response.id;
        console.log(`✅ Job ID: ${id}`);
        console.log("⏳ Rendering... (This might take 30-40 seconds to download your files)");

        // Wait 20 seconds initially
        setTimeout(() => checkStatus(id), 20000);

    } catch (error) {
        console.error("❌ Send Error:", error.response ? error.response.data : error.message);
    }
}

async function checkStatus(id) {
    try {
        const statusUrl = `https://api.shotstack.io/stage/render/${id}`;
        const res = await axios.get(statusUrl, {
            headers: { "x-api-key": API_KEY }
        });

        const data = res.data.response;
        console.log(`📊 Status: ${data.status}`);

        if (data.status === 'done') {
            console.log("\n🎉 SUCCESS! Here is your custom montage:");
            console.log(data.url);
        } else if (data.status === 'failed') {
            console.log("❌ Failed:", data.error);
        } else {
            console.log("🔄 Still working... checking again in 5s");
            setTimeout(() => checkStatus(id), 5000);
        }

    } catch (error) {
        console.error("❌ Check Error:", error.message);
    }
}

makeVideo();