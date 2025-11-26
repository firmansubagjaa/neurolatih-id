
import React from 'react';

export const Tooltip: React.FC<{ text: string; children: React.ReactNode; position?: 'top' | 'bottom'; className?: string }> = ({ text, children, position = 'bottom', className = '' }) => (
  <div className={`group relative flex items-center justify-center ${className}`}>
    {children}
    <div className={`pointer-events-none absolute ${position === 'bottom' ? 'top-full mt-2' : 'bottom-full mb-2'} left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 z-[200] whitespace-nowrap transition-opacity duration-150`}>
       <div className="bg-slate-900 border border-retro-cyan px-2 py-1 text-[10px] font-pixel text-retro-cyan shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
         {text}
       </div>
    </div>
  </div>
);
