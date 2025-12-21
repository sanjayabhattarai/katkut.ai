// app/components/editor/ShareButton.tsx
import React, { useState } from 'react';

interface Props {
  videoUrl: string;
}

export function ShareButton({ videoUrl }: Props) {
  const [loading, setLoading] = useState(false);

  const handleShare = async () => {
    setLoading(true);
    try {
      // 1. We have to "fetch" the video first to turn it into a File object
      const response = await fetch(videoUrl);
      const blob = await response.blob();
      
      // 2. Create a proper file that apps like Instagram/CapCut can read
      const file = new File([blob], "katkut-ai-edit.mp4", { type: "video/mp4" });

      // 3. Check if the browser allows sharing files (Most mobile phones do)
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          // Title/Text often gets ignored by Instagram, but good to have
          title: 'My AI Edit',
          text: 'Check out this video I made with KatKut!',
          files: [file], // 👈 This is the key! It sends the actual VIDEO FILE.
        });
      } else {
        // Fallback for PC/Mac (where sharing is rare): Just download it.
        const a = document.createElement('a');
        a.href = videoUrl;
        a.download = 'katkut-ai-edit.mp4';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Error sharing:", error);
      // Optional: Add a toast notification here "Sharing failed, try downloading manually"
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleShare}
      disabled={loading}
      className={`
        relative overflow-hidden
        bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 
        text-white font-bold py-4 px-8 rounded-full shadow-xl 
        flex items-center gap-3 transition-all transform
        ${loading ? 'opacity-80 cursor-wait' : 'hover:scale-105 hover:shadow-2xl active:scale-95'}
      `}
    >
      {loading ? (
        <>
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span>Preparing Video...</span>
        </>
      ) : (
        <>
          {/* Share Icon */}
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          <span className="text-lg">Share to Apps</span>
        </>
      )}
    </button>
  );
}