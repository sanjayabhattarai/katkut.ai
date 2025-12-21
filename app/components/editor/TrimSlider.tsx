import React, { useRef, useState, useEffect } from 'react';

interface Props {
  totalDuration: number;
  trimStart: number;
  trimDuration: number;
  onChange: (start: number, duration: number) => void;
}

export function TrimSlider({ totalDuration, trimStart, trimDuration, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Track dragging state
  const [dragMode, setDragMode] = useState<'start' | 'end' | 'move' | null>(null);
  
  // ⚡ REFS: Capture the state exactly when the user clicks
  const startX = useRef<number>(0);         // Mouse X position on click
  const initialStart = useRef<number>(0);   // trimStart on click
  const initialDuration = useRef<number>(0);// trimDuration on click

  // 1. CSS Percentages
  const startPercent = (trimStart / totalDuration) * 100;
  const widthPercent = (trimDuration / totalDuration) * 100;
  const endPercent = startPercent + widthPercent;

  // 2. Handlers
  const handlePointerDown = (e: React.PointerEvent, mode: 'start' | 'end' | 'move') => {
    e.preventDefault();
    e.stopPropagation();
    
    // Capture initial values
    startX.current = e.clientX;
    initialStart.current = trimStart;
    initialDuration.current = trimDuration;
    
    setDragMode(mode);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    e.preventDefault();
    setDragMode(null);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragMode || !containerRef.current) return;
    e.preventDefault();

    const rect = containerRef.current.getBoundingClientRect();
    
    // How many pixels did we move?
    const deltaPixels = e.clientX - startX.current;
    
    // How many seconds is that?
    const deltaSeconds = (deltaPixels / rect.width) * totalDuration;
    
    const minDur = 0.5; // Minimum clip size

    // --- LOGIC A: DRAGGING LEFT HANDLE ---
    if (dragMode === 'start') {
       // 1. The "Right Edge" must stay FROZEN in time
       const fixedEndTime = initialStart.current + initialDuration.current;
       
       // 2. Calculate requested new start time
       let newStart = initialStart.current + deltaSeconds;

       // 3. Limits:
       // - Can't be less than 0
       if (newStart < 0) newStart = 0;
       // - Can't overlap the right handle (must leave minDur gap)
       if (newStart > fixedEndTime - minDur) newStart = fixedEndTime - minDur;

       // 4. Calculate new duration based on that fixed end time
       const newDuration = fixedEndTime - newStart;
       
       onChange(newStart, newDuration);
    } 

    // --- LOGIC B: DRAGGING RIGHT HANDLE ---
    else if (dragMode === 'end') {
       // 1. The "Left Edge" must stay FROZEN in time
       const fixedStartTime = initialStart.current;

       // 2. Calculate requested new duration
       let newDuration = initialDuration.current + deltaSeconds;

       // 3. Limits:
       // - Can't be smaller than minDur
       if (newDuration < minDur) newDuration = minDur;
       // - Can't go past the physical end of the video file
       if (fixedStartTime + newDuration > totalDuration) {
           newDuration = totalDuration - fixedStartTime;
       }

       onChange(fixedStartTime, newDuration);
    } 

    // --- LOGIC C: MOVING THE WHOLE BAR ---
    else if (dragMode === 'move') {
       // 1. Duration stays constant
       let newStart = initialStart.current + deltaSeconds;

       // 2. Limits:
       // - Keep inside 0
       if (newStart < 0) newStart = 0;
       // - Keep inside Max Length
       if (newStart + initialDuration.current > totalDuration) {
           newStart = totalDuration - initialDuration.current;
       }

       onChange(newStart, initialDuration.current);
    }
  };

  return (
    <div className="w-full select-none touch-none px-2 py-2">
       {/* Labels */}
       <div className="flex justify-between text-[10px] text-gray-400 font-mono mb-2 uppercase">
         <span>Start: {trimStart.toFixed(1)}s</span>
         <span>Dur: {trimDuration.toFixed(1)}s</span>
         <span>End: {(trimStart + trimDuration).toFixed(1)}s</span>
       </div>

       {/* RULER TRACK */}
       <div 
         ref={containerRef}
         className="relative h-12 bg-gray-900 rounded-lg touch-none border border-gray-700"
         onPointerMove={handlePointerMove}
         onPointerUp={handlePointerUp}
         onPointerLeave={handlePointerUp}
       >
         {/* Background Ticks */}
         <div className="absolute inset-0 opacity-20 pointer-events-none" 
              style={{ backgroundImage: 'linear-gradient(90deg, #666 1px, transparent 1px)', backgroundSize: '2% 100%' }} />

         {/* === ACTIVE BLUE ZONE (Draggable Body) === */}
         <div 
           onPointerDown={(e) => handlePointerDown(e, 'move')}
           className="absolute top-0 h-full bg-blue-600/40 border-t-2 border-b-2 border-blue-400 cursor-grab active:cursor-grabbing group z-10"
           style={{ left: `${startPercent}%`, width: `${widthPercent}%` }}
         >
             {/* Hover Grip Effect */}
             <div className="hidden group-hover:flex items-center justify-center h-full opacity-50">
                 <div className="w-1 h-4 bg-white mx-0.5 rounded-full"></div>
                 <div className="w-1 h-4 bg-white mx-0.5 rounded-full"></div>
             </div>
         </div>

         {/* === LEFT HANDLE (START) === */}
         <div 
           onPointerDown={(e) => handlePointerDown(e, 'start')}
           className="absolute top-0 bottom-0 w-8 -ml-4 z-20 cursor-ew-resize flex items-center justify-center hover:scale-110 transition-transform touch-none"
           style={{ left: `${startPercent}%` }}
         >
            <div className="h-4/5 w-4 bg-white rounded-l shadow-lg flex items-center justify-center">
               <div className="w-0.5 h-3 bg-gray-400"></div>
            </div>
         </div>

         {/* === RIGHT HANDLE (END) === */}
         <div 
           onPointerDown={(e) => handlePointerDown(e, 'end')}
           className="absolute top-0 bottom-0 w-8 -ml-4 z-20 cursor-ew-resize flex items-center justify-center hover:scale-110 transition-transform touch-none"
           style={{ left: `${endPercent}%` }}
         >
            <div className="h-4/5 w-4 bg-white rounded-r shadow-lg flex items-center justify-center">
               <div className="w-0.5 h-3 bg-gray-400"></div>
            </div>
         </div>
       </div>
    </div>
  );
}
