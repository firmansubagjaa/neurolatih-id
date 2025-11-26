
import React from 'react';

export const Badge: React.FC<{ children: React.ReactNode; color?: string }> = ({ 
  children, 
  color = 'bg-slate-800 text-slate-300' 
}) => (
  <span className={`border border-black ${color} px-2 py-0.5 text-[10px] md:text-xs font-pixel uppercase truncate shadow-sm flex items-center gap-1 whitespace-nowrap`}>
    {children}
  </span>
);
