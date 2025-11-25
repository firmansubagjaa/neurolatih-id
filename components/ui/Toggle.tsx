
import React from 'react';
import { playSound, resumeAudio } from '../../services/audioService';

export const Toggle: React.FC<{ checked: boolean; onChange: (val: boolean) => void; label?: string }> = ({ checked, onChange, label }) => (
  <div 
    className="flex items-center gap-3 cursor-pointer group select-none font-mono py-1"
    onClick={() => {
        resumeAudio();
        playSound('click');
        onChange(!checked);
    }}
  >
    <div className={`w-6 h-6 border-2 flex items-center justify-center ${checked ? 'border-retro-green bg-black' : 'border-slate-600 bg-black'}`}>
        {checked && <div className="w-3 h-3 bg-retro-green animate-blink"></div>}
    </div>
    {label && <span className={`text-xs md:text-sm uppercase tracking-wide font-pixel ${checked ? 'text-retro-green' : 'text-slate-500'}`}>{label}</span>}
  </div>
);
