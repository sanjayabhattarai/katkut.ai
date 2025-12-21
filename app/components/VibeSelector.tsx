// app/components/VibeSelector.tsx
"use client";
import { VibeType, VIBES } from '../utils/vibeLogic'; // 👈 Import from new file

interface Props {
  selectedVibe: VibeType;
  onSelect: (vibe: VibeType) => void;
  onBuild: () => void;
  onCancel: () => void;
}

export default function VibeSelector({ selectedVibe, onSelect, onBuild, onCancel }: Props) {
  return (
    <div className="animate-fade-in-up w-full max-w-lg mx-auto">
      <h2 className="text-3xl font-bold mb-2 text-center text-white">Select your Vibe 🎬</h2>
      <p className="text-gray-400 text-center mb-8">How do you want your video to feel?</p>
      
      <div className="grid grid-cols-2 gap-4 mb-8">
        {VIBES.map((vibe) => (
          <div 
            key={vibe.id}
            onClick={() => onSelect(vibe)}
            className={`p-6 rounded-xl border cursor-pointer transition-all flex flex-col items-center gap-2
              ${selectedVibe.id === vibe.id 
                ? 'bg-blue-600/20 border-blue-500 scale-105 shadow-blue-900/50 shadow-lg' 
                : 'bg-gray-900 border-gray-700 hover:border-gray-500 hover:bg-gray-800'}
              border-2
            `}
          >
            <span className="text-4xl mb-2">{vibe.emoji}</span>
            <span className="font-bold text-white">{vibe.label}</span>
            <span className="text-xs text-gray-500 font-mono">{vibe.duration}s cuts</span>
          </div>
        ))}
      </div>

      <button 
        onClick={onBuild}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 rounded-xl text-xl hover:scale-105 transition shadow-lg mb-4"
      >
        🚀 Build Montage
      </button>
      
      <button 
        onClick={onCancel}
        className="w-full text-gray-500 text-sm hover:text-white underline"
      >
        Cancel / Re-upload
      </button>
    </div>
  );
}