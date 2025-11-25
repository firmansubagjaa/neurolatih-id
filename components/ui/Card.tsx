
import React from 'react';

export const Card: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void }> = ({ 
  children, 
  className = '',
  onClick
}) => (
  <div 
    onClick={onClick}
    className={`bg-black border-2 border-slate-600 p-4 relative 
    shadow-retro
    ${onClick ? 'cursor-pointer hover:border-white active:translate-y-1 active:shadow-none transition-none' : ''}
    ${className}`}
  >
    {children}
  </div>
);
