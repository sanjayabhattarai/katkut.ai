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
    <div className="animate-fade-in-up w-full max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold mb-8 text-center text-white">🎬 Select Your Vibe</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {VIBES.map((vibe) => (
          <div 
            key={vibe.id}
            onClick={() => onSelect(vibe)}
            className={`p-5 rounded-xl border cursor-pointer transition-all
              ${selectedVibe.id === vibe.id 
                ? 'bg-blue-600/20 border-blue-500 scale-[1.02] shadow-blue-900/50 shadow-lg' 
                : 'bg-gray-900 border-gray-700 hover:border-gray-500 hover:bg-gray-800'}
              border-2
            `}
          >
            <div className="flex items-start gap-3 mb-2">
              <span className="text-3xl">{vibe.emoji}</span>
              <span className="font-bold text-white text-lg">{vibe.label}</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">{vibe.description}</p>
          </div>
        ))}
      </div>

      <button 
        onClick={onBuild}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 rounded-xl text-xl hover:scale-105 transition shadow-lg mb-4"
      >
        Make my video
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