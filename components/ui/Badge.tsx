
import React from 'react';

export const Badge: React.FC<{ children: React.ReactNode; color?: string }> = ({ 
  children, 
  color = 'bg-slate-800 text-slate-300' 
}) => (
  <span className={`border-2 border-black ${color} px-2 py-1 text-[10px] md:text-xs font-pixel uppercase truncate max-w-[140px] shadow-retro-sm`}>
    {children}
  </span>
);
