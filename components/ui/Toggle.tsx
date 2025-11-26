
import React from 'react';
import { playSound, resumeAudio } from '../../services/audioService';

export const Toggle: React.FC<{ checked: boolean; onChange: (val: boolean) => void; label?: string }> = ({ checked, onChange, label }) => (
  <div 
    className="flex items-center gap-3 cursor-pointer group select-none font-mono py-1"
    onClick={() => {
        resumeAudio();
        playSound('switch'); // Mechanical click sound
        onChange(!checked);
    }}
  >
    <div className={`w-8 h-4 border-2 relative transition-colors ${checked ? 'border-retro-green bg-retro-green/20' : 'border-slate-600 bg-black'}`}>
        <div className={`absolute top-[-2px] bottom-[-2px] w-4 border-2 border-white bg-slate-800 transition-all shadow-retro-sm ${checked ? 'left-[calc(100%-14px)] bg-retro-green' : 'left-[-2px]'}`}></div>
    </div>
    {label && <span className={`text-xs md:text-sm uppercase tracking-wide font-pixel transition-colors ${checked ? 'text-retro-green text-shadow-glow' : 'text-slate-500'}`}>{label}</span>}
  </div>
);
