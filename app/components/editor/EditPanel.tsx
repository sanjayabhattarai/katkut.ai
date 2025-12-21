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
  onDeleteClip: (index: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
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
  onDeleteClip,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: Props) {
  const handleTrimChange = (newStart: number, newDuration: number) => {
    // 🚨 ATOMIC UPDATE: Send both start AND duration to the parent
    onUpdateClip({ 
        trimStart: newStart, 
        trimDuration: newDuration 
    });
  };

  return (
    <div className="w-full h-full bg-[#181818] border-t border-gray-700 flex flex-col overflow-hidden">
      <div className="flex justify-between items-center px-4 py-2 bg-black/20 border-b border-white/5 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-400">EDIT CLIP {activeClipIndex + 1}</span>
          
          {/* ↩️ UNDO BUTTON */}
          <button 
            onClick={onUndo} 
            disabled={!canUndo}
            className={`p-1.5 rounded-full transition ${
              canUndo 
                ? 'text-white hover:bg-gray-700' 
                : 'text-gray-600 cursor-not-allowed'
            }`}
            title="Undo (Ctrl+Z)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </button>

          {/* ↪️ REDO BUTTON */}
          <button 
            onClick={onRedo}
            disabled={!canRedo}
            className={`p-1.5 rounded-full transition ${
              canRedo 
                ? 'text-white hover:bg-gray-700' 
                : 'text-gray-600 cursor-not-allowed'
            }`}
            title="Redo (Ctrl+Y)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
            </svg>
          </button>
        </div>
        
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

      <div className="flex-1 p-6 pb-8 max-w-2xl mx-auto w-full overflow-y-auto">
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
              className={`relative min-w-[60px] h-[60px] rounded-lg overflow-hidden cursor-pointer border-2 transition-all shrink-0 group ${
                activeClipIndex === idx ? 'border-blue-500 scale-110 z-10' : 'border-transparent opacity-50 grayscale'
              }`}
            >
              <video src={clip.url} className="w-full h-full object-cover pointer-events-none" />
              
              {/* Mute Button */}
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

              {/* Delete Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteClip(idx);
                }}
                className="absolute top-1 left-1 h-6 w-6 flex items-center justify-center rounded-full bg-red-600/90 text-white transition-all hover:bg-red-700 hover:scale-110 z-10"
                aria-label={`Delete clip ${idx + 1}`}
                title="Delete Clip"
              >
                {/* Trash Icon SVG */}
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
              
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
