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

      {/* --- BUTTONS --- */}
      {!isPlayingAll && (
        <div className="absolute bottom-6 w-full flex justify-center gap-4 px-4 z-40 animate-fade-in-up" onClick={e => e.stopPropagation()}>
            <button onClick={onEdit} className="flex-1 bg-gray-800/90 backdrop-blur border border-gray-600 hover:bg-gray-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition">
                ✂️ Edit
            </button>
            <button onClick={onRender} disabled={rendering} className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:scale-105 text-white font-bold py-3 rounded-xl shadow-lg transition">
                {rendering ? "⏳..." : "🚀 Export"}
            </button>
        </div>
      )}
    </div>
  );
};
