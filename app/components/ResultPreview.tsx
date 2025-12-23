// components/editor/ResultPreview.tsx
import React, { useState } from 'react';

interface ResultPreviewProps {
  finalVideoUrl: string;
  onClose: () => void;
}

export const ResultPreview: React.FC<ResultPreviewProps> = ({
  finalVideoUrl,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);

  // --- SHARE LOGIC (App Buttons) ---
  const handleShareToApp = async () => {
    setLoading(true);
    try {
      const response = await fetch(finalVideoUrl);
      const blob = await response.blob();
      const file = new File([blob], "katkut-ai-edit.mp4", { type: "video/mp4" });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'My AI Edit',
        });
      } else {
        // If sharing is not supported, run our new download logic
        handleDownload();
      }
    } catch (e) {
      console.error(e);
    } finally {
      // Always reset loading state, even if user cancels
      setLoading(false);
    }
  };

  // --- DOWNLOAD LOGIC (Force Save) ---
  const handleDownload = async () => {
    setLoading(true);
    try {
      // 1. Fetch the video data
      const response = await fetch(finalVideoUrl);
      if (!response.ok) throw new Error("Network error");
      const blob = await response.blob();
      
      // 2. Create a local URL
      const url = window.URL.createObjectURL(blob);
      
      // 3. Create invisible link to trigger save
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'katkut-ai-edit.mp4';
      document.body.appendChild(a);
      a.click();
      
      // 4. Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download failed:", error);
      // Fallback: open in new tab
      window.open(finalVideoUrl, '_blank');
    } finally {
      setLoading(false);
    }
  };

  if (!finalVideoUrl) return null;

  return (
    <div className="relative w-full max-w-[350px] aspect-[9/16] shadow-2xl animate-fade-in-up z-50 flex flex-col">
      
      {/* 1. VIDEO PLAYER AREA */}
      <div className="flex-1 relative bg-black rounded-t-2xl overflow-hidden group">
        <video 
          src={finalVideoUrl} 
          controls 
          className="w-full h-full object-cover" 
        />
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full backdrop-blur-md transition z-20"
        >
          ✕
        </button>
      </div>

      {/* 2. EXPORT PANEL */}
      <div className="bg-[#121212] p-6 rounded-b-2xl border-t border-gray-800">
        
        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-5 text-center">
          Share to Apps
        </p>

        {/* APP ICONS GRID */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          
          {/* CapCut */}
          <button onClick={handleShareToApp} disabled={loading} className="group flex flex-col items-center gap-2">
            <div className="w-14 h-14 bg-black border border-gray-800 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg overflow-hidden">
               <img src="/assets/CapCut.png" alt="CapCut" className="w-full h-full object-cover" />
            </div>
            <span className="text-[10px] text-gray-400 font-medium group-hover:text-white">CapCut</span>
          </button>

          {/* TikTok */}
          <button onClick={handleShareToApp} disabled={loading} className="group flex flex-col items-center gap-2">
            <div className="w-14 h-14 bg-black border border-gray-800 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg overflow-hidden">
               <img src="/assets/tiktok.png" alt="TikTok" className="w-full h-full object-cover" />
            </div>
            <span className="text-[10px] text-gray-400 font-medium group-hover:text-white">TikTok</span>
          </button>

          {/* Meta */}
          <button onClick={handleShareToApp} disabled={loading} className="group flex flex-col items-center gap-2">
            <div className="w-14 h-14 bg-black border border-gray-800 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg overflow-hidden">
               <img src="/assets/edits.png" alt="Meta Edits" className="w-full h-full object-cover" />
            </div>
            <span className="text-[10px] text-gray-400 font-medium group-hover:text-white">Meta</span>
          </button>

        </div>

        {/* SAVE TO GALLERY BUTTON */}
        <button 
          onClick={handleDownload}
          disabled={loading}
          className="w-full bg-white text-black hover:bg-gray-200 font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? (
             <span className="animate-pulse">Saving...</span>
          ) : (
             <>
               <img src="/assets/download.png" alt="Download" className="w-5 h-5" />
               <span>Save to Gallery</span>
             </>
          )}
        </button>

      </div>
    </div>
  );
};