import React, { RefObject } from 'react';

interface Clip {
  url: string;
  duration: number;
  trimStart?: number;
  trimDuration?: number;
  muted?: boolean;
}

interface VideoPlayerProps {
  player1Ref: RefObject<HTMLVideoElement>;
  player2Ref: RefObject<HTMLVideoElement>;
  activeClipIndex: number;
  isBuffering: boolean;
  isPlayingAll: boolean;
  onTimeUpdate: (e: React.SyntheticEvent<HTMLVideoElement>) => void;
  onTogglePlay: () => void;
  onSetBuffering: (buffering: boolean) => void;
  onEdit: () => void;
  onRender: () => void;
  rendering: boolean;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  player1Ref,
  player2Ref,
  activeClipIndex,
  isBuffering,
  isPlayingAll,
  onTimeUpdate,
  onTogglePlay,
  onSetBuffering,
  onEdit,
  onRender,
  rendering,
}) => {
  // Guard timeUpdate to only active player
  const handlePlayer1TimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    if (activeClipIndex % 2 === 0) onTimeUpdate(e);
  };

  const handlePlayer2TimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    if (activeClipIndex % 2 !== 0) onTimeUpdate(e);
  };

  return (
    <div 
      className="relative w-full max-w-[350px] aspect-[9/16] bg-black rounded-lg overflow-hidden border border-gray-800 shadow-2xl cursor-pointer"
      onClick={onTogglePlay}
    >
      {/* --- PLAYER 1 (Evens) --- */}
      <video 
        ref={player1Ref}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ 
            zIndex: activeClipIndex % 2 === 0 ? 20 : 10
        }}
        onTimeUpdate={handlePlayer1TimeUpdate}
        onWaiting={() => onSetBuffering(true)}
        onCanPlay={() => onSetBuffering(false)}
        playsInline
        preload="auto"
        crossOrigin="anonymous"
        webkit-playsinline="true"
      />

      {/* --- PLAYER 2 (Odds) --- */}
      <video 
        ref={player2Ref}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ 
            zIndex: activeClipIndex % 2 !== 0 ? 20 : 10
        }}
        onTimeUpdate={handlePlayer2TimeUpdate}
        onWaiting={() => onSetBuffering(true)}
        onCanPlay={() => onSetBuffering(false)}
        playsInline
        preload="auto"
        crossOrigin="anonymous"
        webkit-playsinline="true"
      />

      {/* --- PREVIEW MODE TEXT --- */}
      <div className="absolute top-3 left-3 z-40">
        <p className="text-yellow-400 text-[10px] font-bold bg-black/60 backdrop-blur-sm px-2 py-1 rounded-md">Preview Mode</p>
      </div>

      {/* --- SPINNER --- */}
      {isBuffering && isPlayingAll && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px]">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
          </div>
      )}
      
      {/* --- PLAY BUTTON --- */}
      {!isPlayingAll && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-30 group">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/50 shadow-2xl group-hover:scale-110 transition-transform">
                  <span className="text-4xl ml-2 text-white">▶</span>
              </div>
          </div>
      )}

      {/* --- QUALITY DISCLAIMER & EXPORT BUTTON (Always Visible) --- */}
      <div className="absolute bottom-6 w-full flex flex-col items-center gap-2 px-4 z-40" onClick={e => e.stopPropagation()}>
          <p className="text-gray-300 text-[10px] text-center leading-tight px-2 bg-black/60 backdrop-blur-sm py-1.5 rounded-lg">
            Don&apos;t worry! This is a low-res draft to save your data. Your final export will be smooth 4K quality.
          </p>
          <button 
            onClick={onRender} 
            disabled={rendering} 
            className="group relative bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm py-2 px-6 rounded-lg shadow-lg hover:shadow-blue-500/50 transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {rendering ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                  Export
                </>
              )}
            </span>
          </button>
      </div>
    </div>
  );
};
