// components/SmartVideoPlayer.tsx
import React, { useState, useRef } from 'react';

interface Props {
  src: string;
  className?: string;
}

export const SmartVideoPlayer: React.FC<Props> = ({ src, className }) => {
  const [isLandscape, setIsLandscape] = useState(false);
  const mainVideoRef = useRef<HTMLVideoElement>(null);

  // This runs as soon as the video loads enough data to know its size
  const handleMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const { videoWidth, videoHeight } = e.currentTarget;
    // If width is greater than or equal to height, it's Landscape/Square -> Needs Blur
    setIsLandscape(videoWidth >= videoHeight);
  };

  return (
    <div className={`relative w-full h-full bg-black overflow-hidden ${className}`}>
      
      {/* 1. BACKGROUND LAYER (Only renders if Landscape) */}
      {isLandscape && (
        <div className="absolute inset-0 z-0">
           <video 
             src={src} 
             className="w-full h-full object-cover blur-xl opacity-50 scale-110" 
             muted 
             playsInline
             loop
             // Sync this background player with the main one is tricky in UI, 
             // but for a simple preview, auto-loop is usually fine.
             autoPlay 
           />
        </div>
      )}

      {/* 2. FOREGROUND LAYER (The Controller) */}
      <div className="absolute inset-0 z-10 flex items-center justify-center">
         <video 
           ref={mainVideoRef}
           src={src} 
           className="w-full h-full object-contain drop-shadow-2xl" 
           controls 
           playsInline
           onLoadedMetadata={handleMetadata} // 👈 The magic check
         />
      </div>

    </div>
  );
};