
import React, { useState, useEffect } from 'react';
import { playSound, resumeAudio } from '../services/audioService';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  isLoading = false,
  disabled,
  onClick,
  ...props 
}) => {
  // STRICT 8-BIT BUTTON STYLE
  // No radius, solid borders, pixel shift on active
  
  const baseStyle = "relative font-pixel text-xs md:text-sm uppercase tracking-wider transition-none border-2 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:translate-y-1 active:shadow-none shadow-retro hover:brightness-110";
  
  const variants = {
    primary: "bg-retro-green text-black border-white hover:bg-white hover:border-retro-green",
    secondary: "bg-slate-800 text-retro-cyan border-slate-500 hover:border-retro-cyan hover:text-white",
    danger: "bg-retro-red text-white border-white hover:bg-white hover:text-retro-red hover:border-retro-red",
    ghost: "bg-transparent text-slate-400 border-transparent shadow-none active:translate-y-0 hover:text-white hover:bg-white/10 !border-0",
    outline: "bg-black text-white border-white hover:bg-white hover:text-black"
  };

  const padding = variant === 'ghost' ? 'p-2' : 'px-4 py-3';

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    resumeAudio();
    if (!disabled && !isLoading) {
      playSound('click');
    }
    onClick?.(e);
  };

  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${padding} ${className}`} 
      disabled={disabled || isLoading}
      onClick={handleClick}
      {...props}
    >
      {isLoading ? (
        <span className="animate-blink mr-2">{'>'}</span>
      ) : null}
      {children}
    </button>
  );
};

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

export const Badge: React.FC<{ children: React.ReactNode; color?: string }> = ({ 
  children, 
  color = 'bg-slate-800 text-slate-300' 
}) => (
  <span className={`border-2 border-black ${color} px-2 py-1 text-[10px] md:text-xs font-pixel uppercase truncate max-w-[140px] shadow-retro-sm`}>
    {children}
  </span>
);

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

interface NeuralLoaderProps {
  message?: string;
}

export const NeuralLoader: React.FC<NeuralLoaderProps> = ({ message = "LOADING" }) => {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
        setDots(prev => prev.length < 3 ? prev + "." : "");
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-8 animate-fade-in font-mono border-2 border-dashed border-slate-700 m-4">
      <div className="text-retro-green text-4xl mb-4 animate-bounce font-pixel">
        👾
      </div>
      <p className="text-xl text-retro-green uppercase tracking-widest text-center font-pixel animate-pulse">
        {message}{dots}
      </p>
      {/* 8-bit Loading Bar */}
      <div className="w-48 h-6 border-2 border-white mt-6 p-1 bg-black">
         <div className="h-full bg-retro-green animate-[scanline_2s_infinite]"></div>
      </div>
    </div>
  );
};
