// app/components/VibeSelector.tsx
"use client";
import { useState } from 'react';
import { VibeType, VIBES, VibeCategory } from '../utils/vibeLogic';

interface Props {
  selectedVibe: VibeType;
  onSelect: (vibe: VibeType) => void;
  onBuild: () => void;
  onCancel: () => void;
}

export default function VibeSelector({ selectedVibe, onSelect, onBuild, onCancel }: Props) {
  // Default to 'personal' so the screen isn't empty
  const [activeCategory, setActiveCategory] = useState<VibeCategory>('personal');

  // Filter the master list based on which tab is active
  const displayedVibes = VIBES.filter(v => v.category === activeCategory);

  return (
    <div className="animate-fade-in-up w-full max-w-2xl mx-auto pb-24">
      
      {/* 1. CATEGORY TABS (Personal vs Business) */}
      <div className="flex p-1 bg-gray-900 rounded-2xl mb-8 border border-gray-800 sticky top-0 z-30 shadow-2xl backdrop-blur-md">
        <button
          onClick={() => setActiveCategory('personal')}
          className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2
            ${activeCategory === 'personal' 
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-[1.02]' 
              : 'text-gray-400 hover:text-white'
            }`}
        >
          👤 Personal
        </button>
        <button
          onClick={() => setActiveCategory('business')}
          className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2
            ${activeCategory === 'business' 
              ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg scale-[1.02]' 
              : 'text-gray-400 hover:text-white'
            }`}
        >
          💼 Business
        </button>
      </div>

      {/* 2. DYNAMIC HEADER */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white">
          {activeCategory === 'personal' ? 'Choose your Style' : 'Select your Industry'}
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          {activeCategory === 'personal' 
            ? 'For stories, memories, and travel.' 
            : 'For promos, listings, and ads.'}
        </p>
      </div>
      
      {/* 3. VIBE GRID (Filtered) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {displayedVibes.map((vibe) => (
          <div 
            key={vibe.id}
            onClick={() => onSelect(vibe)}
            className={`p-5 rounded-xl border cursor-pointer transition-all relative overflow-hidden group
              ${selectedVibe.id === vibe.id 
                ? activeCategory === 'personal' 
                  ? 'bg-blue-900/20 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)]'
                  : 'bg-orange-900/20 border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.3)]'
                : 'bg-gray-900 border-gray-800 hover:border-gray-600 hover:bg-gray-800'}
            `}
          >
            {/* Hover Glow Effect */}
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity
               ${activeCategory === 'personal' ? 'bg-blue-500' : 'bg-orange-500'}`} 
            />

            <div className="flex items-start gap-3 mb-2 relative z-10">
              <span className="text-3xl">{vibe.emoji}</span>
              <div className="flex flex-col">
                <span className="font-bold text-white text-lg">{vibe.label}</span>
                {/* Optional Badge for Business Vibes */}
                {vibe.category === 'business' && (
                  <span className="text-[10px] text-orange-400 font-mono uppercase tracking-wider">PRO TEMPLATE</span>
                )}
              </div>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed relative z-10">{vibe.description}</p>
          </div>
        ))}
      </div>

      {/* 4. ACTION BUTTONS */}
      <div className="sticky bottom-4 z-30">
        <button 
          onClick={onBuild}
          className={`w-full text-white font-bold py-4 rounded-xl text-xl hover:scale-[1.02] active:scale-95 transition shadow-xl mb-3 border border-white/10
            ${activeCategory === 'personal' 
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 shadow-blue-900/20' 
              : 'bg-gradient-to-r from-orange-500 to-red-600 shadow-orange-900/20'
            }`}
        >
          ✨ Make my video
        </button>
        
        <button 
          onClick={onCancel}
          className="w-full py-3 bg-black/60 backdrop-blur-md rounded-xl text-gray-400 text-sm hover:text-white border border-gray-800 transition"
        >
          Cancel / Re-upload
        </button>
      </div>
    </div>
  );
}