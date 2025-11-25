import React from 'react';
import { Timer, Infinity as InfinityIcon } from 'lucide-react';

interface CountdownBarProps {
  totalTime: number; 
  timeLeft: number;  
  isPracticeMode?: boolean;
}

export const CountdownBar: React.FC<CountdownBarProps> = React.memo(({ totalTime, timeLeft, isPracticeMode = false }) => {
  
  if (isPracticeMode) {
    return (
      <div className="w-full mb-6 border-2 border-retro-cyan bg-black p-2">
         <div className="flex justify-between items-center mb-1 font-pixel text-[10px] text-retro-cyan">
            <span>MODE: LATIHAN</span>
            <InfinityIcon className="w-4 h-4 animate-pulse" />
         </div>
         <div className="flex gap-1 h-4 overflow-hidden">
            {/* Animated Marquee Pattern */}
            <div className="w-full h-full bg-[repeating-linear-gradient(45deg,#00ffff,#00ffff_10px,#000_10px,#000_20px)] animate-[glitch_2s_infinite]"></div>
         </div>
      </div>
    );
  }

  const percentage = (timeLeft / totalTime) * 100;
  // Calculate segments (20 segments total)
  const totalSegments = 20;
  const filledSegments = Math.ceil((percentage / 100) * totalSegments);

  const getColorClass = () => {
    if (percentage > 60) return 'bg-retro-green';
    if (percentage > 30) return 'bg-retro-yellow';
    return 'bg-retro-red animate-blink'; // Blinking when critical
  };

  return (
    <div className="w-full mb-6 border-4 border-slate-700 bg-black p-1">
      <div className="flex justify-between items-center mb-2 px-1">
        <div className="flex items-center gap-2 text-white font-pixel text-[10px]">
            <Timer className="w-3 h-3" />
            <span>TIME</span>
        </div>
        <span className={`font-mono text-xl ${timeLeft <= 10 ? 'text-retro-red' : 'text-retro-green'}`}>
            {timeLeft.toFixed(1).padStart(4, '0')}
        </span>
      </div>
      
      {/* Segmented Bar */}
      <div className="flex gap-1 h-6 w-full">
        {Array.from({ length: totalSegments }).map((_, i) => (
            <div 
                key={i}
                className={`flex-1 ${i < filledSegments ? getColorClass() : 'bg-slate-800'}`}
            ></div>
        ))}
      </div>
    </div>
  );
});