// app/components/ui/ExportBorder.tsx
import React from 'react';

interface Props {
  progress: number; // 0 to 100
}

export const ExportBorder = ({ progress }: Props) => {
  return (
    <div className="absolute inset-0 z-50 pointer-events-none rounded-3xl overflow-hidden">
      <svg className="w-full h-full">
        {/* 1. Dark Grey Background Track */}
        <rect
          x="4" y="4"
          width="calc(100% - 8px)"
          height="calc(100% - 8px)"
          rx="24" // Matches the rounded-3xl look
          ry="24"
          fill="none"
          stroke="#374151" // Gray-700
          strokeWidth="6"
        />

        {/* 2. Orange Progress Line */}
        <rect
          x="4" y="4"
          width="calc(100% - 8px)"
          height="calc(100% - 8px)"
          rx="24"
          ry="24"
          fill="none"
          stroke="#F97316" // Orange-500 (Matches your screenshot)
          strokeWidth="6"
          strokeLinecap="round" // Makes the ends round like the image
          
          // The Magic Trick for smooth animation:
          pathLength="100" 
          strokeDasharray="100"
          strokeDashoffset={100 - progress}
          
          className="transition-all duration-300 ease-linear shadow-[0_0_20px_rgba(249,115,22,0.4)]"
        />
      </svg>
    </div>
  );
};