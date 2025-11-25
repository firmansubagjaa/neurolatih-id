
import React from 'react';

export const Tooltip: React.FC<{ text: string; children: React.ReactNode; position?: 'top' | 'bottom'; className?: string }> = ({ text, children, position = 'bottom', className = '' }) => (
  <div className={`group relative flex items-center justify-center ${className}`}>
    {children}
    <div className={`pointer-events-none absolute ${position === 'bottom' ? 'top-full mt-2' : 'bottom-full mb-2'} left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 z-[200] whitespace-nowrap`}>
       <div className="bg-black border-2 border-white px-2 py-1 text-[10px] font-pixel text-white shadow-retro">
         {text}
       </div>
    </div>
  </div>
);
