
import React from 'react';
import { Timer, AlertTriangle, Infinity as InfinityIcon } from 'lucide-react';

interface CountdownBarProps {
  totalTime: number; 
  timeLeft: number;  
  isPracticeMode?: boolean;
  className?: string;
}

export const CountdownBar: React.FC<CountdownBarProps> = React.memo(({ totalTime, timeLeft, isPracticeMode = false, className = "mb-6" }) => {
  if (isPracticeMode) {
    return (
      <div className={`w-full border-2 border-retro-cyan bg-black p-2 ${className}`}>
         <div className="flex justify-between items-center mb-1 font-pixel text-[10px] text-retro-cyan">
            <span>SIMULATION MODE</span>
            <InfinityIcon className="w-4 h-4 animate-pulse" />
         </div>
         <div className="w-full h-4 bg-retro-cyan/20 animate-pulse relative overflow-hidden">
             <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(34,211,238,0.1)_10px,rgba(34,211,238,0.1)_20px)]"></div>
         </div>
      </div>
    );
  }

  const percentage = (timeLeft / totalTime) * 100;
  const totalSegments = 20;
  const filledSegments = Math.ceil((percentage / 100) * totalSegments);

  const getStatus = () => {
    if (percentage > 50) return { color: 'bg-retro-green', text: 'text-retro-green', animate: '' };
    if (percentage > 20) return { color: 'bg-retro-yellow', text: 'text-retro-yellow', animate: '' };
    return { color: 'bg-retro-red', text: 'text-retro-red', animate: 'animate-pulse' };
  };

  const status = getStatus();

  return (
    <div className={`w-full border-4 border-slate-700 bg-black p-1 transition-colors duration-200 ${percentage < 20 ? 'border-retro-red shadow-[0_0_15px_rgba(239,68,68,0.5)]' : ''} ${className}`}>
      <div className="flex justify-between items-center mb-2 px-1">
        <div className={`flex items-center gap-2 font-pixel text-[10px] ${status.text}`}>
            {percentage < 20 ? <AlertTriangle className="w-3 h-3 animate-bounce" /> : <Timer className="w-3 h-3" />}
            <span className={percentage < 20 ? 'animate-blink' : ''}>{percentage < 20 ? 'CRITICAL' : 'TIME'}</span>
        </div>
        <span className={`font-mono text-xl font-bold ${status.text} ${percentage < 10 ? 'animate-glitch' : ''}`}>
            {timeLeft.toFixed(1).padStart(4, '0')}s
        </span>
      </div>
      
      <div className="flex gap-1 h-6 w-full relative">
        {percentage < 15 && (
            <div className="absolute inset-0 bg-retro-red/20 animate-[glitch_0.1s_infinite] pointer-events-none z-10 mix-blend-overlay"></div>
        )}
        {Array.from({ length: totalSegments }).map((_, i) => (
            <div 
                key={i}
                className={`flex-1 transition-all duration-300 ${i < filledSegments ? status.color : 'bg-slate-900'} ${i < filledSegments ? 'shadow-[0_0_5px_currentColor]' : ''}`}
                style={{ opacity: i < filledSegments ? 1 : 0.2 }}
            ></div>
        ))}
      </div>
    </div>
  );
});
