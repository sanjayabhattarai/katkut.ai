import React from 'react';
import { TrimSlider } from './TrimSlider';

interface Clip {
  url: string;
  duration: number;
  trimStart?: number;
  trimDuration?: number;
  muted?: boolean;
}

const SpeakerOnIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    className={className}
  >
    <path d="M5 9v6h4l5 5V4L9 9H5z" fill="currentColor" />
    <path d="M16 8.82a4 4 0 010 6.36M18.5 6a7 7 0 010 12" />
  </svg>
);

const SpeakerOffIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    className={className}
  >
    <path d="M5 9v6h4l5 5V4L9 9H5z" fill="currentColor" />
    <line x1="18" y1="6" x2="22" y2="10" />
    <line x1="22" y1="6" x2="18" y2="10" />
  </svg>
);

interface Props {
  isOpen: boolean;
  activeClip: Clip;
  clips: Clip[];
  activeClipIndex: number;
  onClose: () => void;
  onUpdateClip: (updates: { trimStart?: number; trimDuration?: number }) => void;
  onSelectClip: (index: number) => void;
  onExport: () => void;
  isRendering: boolean;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onToggleMute: (index: number) => void;
}

export function EditPanel({
  onToggleMute,
  isOpen,
  activeClip,
  clips,
  activeClipIndex,
  onClose,
  onUpdateClip,
  onSelectClip,
  onExport,
  isRendering,
  isPlaying,
  onTogglePlay,
}: Props) {
  const handleTrimChange = (newStart: number, newDuration: number) => {
    // 🚨 ATOMIC UPDATE: Send both start AND duration to the parent
    onUpdateClip({ 
        trimStart: newStart, 
        trimDuration: newDuration 
    });
  };

  return (
    <div className={`fixed bottom-0 left-0 w-full bg-[#181818] border-t border-gray-700 transition-transform duration-300 ease-out z-50 ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}>
      <div className="flex justify-between items-center px-4 py-2 bg-black/20 border-b border-white/5">
        <span className="text-xs font-bold text-gray-400">EDIT CLIP {activeClipIndex + 1}</span>
        <div className="flex items-center gap-2">
          <button
            onClick={onTogglePlay}
            className="text-xs font-bold text-white bg-gray-700 px-3 py-1 rounded-full"
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <button onClick={onClose} className="text-sm font-bold text-white bg-gray-800 px-3 py-1 rounded-full">
            Done
          </button>
        </div>
      </div>

      <div className="p-6 pb-8 max-w-2xl mx-auto">
        <div className="mb-8">
          <TrimSlider
            totalDuration={activeClip.duration || 10}
            trimStart={activeClip.trimStart || 0}
            trimDuration={activeClip.trimDuration || 3}
            onChange={handleTrimChange}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar mb-4">
          {clips.map((clip, idx) => (
            <div
              key={idx}
              onClick={() => onSelectClip(idx)}
              className={`relative min-w-[60px] h-[60px] rounded-lg overflow-hidden cursor-pointer border-2 transition-all shrink-0 ${
                activeClipIndex === idx ? 'border-blue-500 scale-110 z-10' : 'border-transparent opacity-50 grayscale'
              }`}
            >
              <video src={clip.url} className="w-full h-full object-cover pointer-events-none" />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleMute(idx);
                }}
                className="absolute top-1 right-1 h-6 w-6 flex items-center justify-center rounded-full bg-black/70 text-white border border-white/10 shadow-sm hover:bg-black/80"
                aria-label={`${clip.muted ? 'Unmute' : 'Mute'} clip ${idx + 1}`}
              >
                {clip.muted ? (
                  <SpeakerOffIcon className="h-3.5 w-3.5" />
                ) : (
                  <SpeakerOnIcon className="h-3.5 w-3.5" />
                )}
              </button>
              <div className="absolute bottom-0 w-full bg-black/60 text-[8px] text-center text-white font-mono">{idx + 1}</div>
            </div>
          ))}
        </div>

        <button
          onClick={onExport}
          disabled={isRendering}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg transition flex items-center justify-center gap-2"
        >
          {isRendering ? <span className="animate-pulse">⏳ Rendering...</span> : <span> Export Final Video</span>}
        </button>
      </div>
    </div>
  );
}
