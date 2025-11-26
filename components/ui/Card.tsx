
import React from 'react';

export const Card: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void }> = ({ 
  children, 
  className = '',
  onClick
}) => (
  <div 
    onClick={onClick}
    className={`bg-black/90 border-2 border-slate-700 p-4 relative backdrop-blur-sm
    shadow-retro transition-all duration-200
    ${onClick ? 'cursor-pointer hover:border-retro-cyan hover:scale-[1.01] hover:shadow-[0_0_20px_rgba(34,211,238,0.2)] active:scale-99 active:translate-y-1 active:shadow-none z-10' : ''}
    ${className}`}
  >
    {/* Diegetic Corner Accents */}
    <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-white opacity-50"></div>
    <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-white opacity-50"></div>
    <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-white opacity-50"></div>
    <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-white opacity-50"></div>
    
    {children}
  </div>
);
