
import React, { useState, useEffect } from 'react';
import { playSound, resumeAudio } from '../services/audioService';
import { Loader2 } from 'lucide-react';

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
  // Compact UI: Reduced padding (py-3 -> py-2, px-4 -> px-3)
  const baseStyle = "px-3 py-2 md:py-3 font-pixel text-[10px] md:text-xs uppercase tracking-widest transition-transform duration-75 active:translate-y-1 retro-btn border-2 md:border-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2";
  
  const variants = {
    primary: "bg-retro-green text-black border-retro-green hover:bg-white hover:text-black hover:border-white shadow-[2px_2px_0px_0px_rgba(0,255,0,0.3)] md:shadow-[4px_4px_0px_0px_rgba(0,255,0,0.3)]",
    secondary: "bg-black text-retro-cyan border-retro-cyan hover:bg-retro-cyan hover:text-black shadow-[2px_2px_0px_0px_rgba(0,255,255,0.3)] md:shadow-[4px_4px_0px_0px_rgba(0,255,255,0.3)]",
    danger: "bg-retro-red text-white border-retro-red hover:bg-white hover:text-retro-red shadow-[2px_2px_0px_0px_rgba(255,0,0,0.3)] md:shadow-[4px_4px_0px_0px_rgba(255,0,0,0.3)]",
    ghost: "bg-transparent text-slate-400 hover:text-retro-yellow border-transparent hover:border-retro-yellow",
    outline: "bg-transparent text-white border-slate-500 hover:border-white hover:bg-white/10 shadow-[2px_2px_0px_0px_rgba(255,255,255,0.1)]"
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Try to wake up audio engine on any button click
    resumeAudio();
    
    if (!disabled && !isLoading) {
      playSound('click');
    }
    onClick?.(e);
  };

  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${className}`} 
      disabled={disabled || isLoading}
      onClick={handleClick}
      {...props}
    >
      {isLoading ? (
        <span className="animate-blink mr-2">[{'>'}]</span>
      ) : null}
      {children}
    </button>
  );
};

export const Toggle: React.FC<{ checked: boolean; onChange: (val: boolean) => void; label?: string }> = ({ checked, onChange, label }) => (
  <div 
    className="flex items-center gap-2 cursor-pointer group select-none font-mono"
    onClick={() => {
        resumeAudio();
        playSound('click');
        onChange(!checked);
    }}
  >
    <div className={`w-10 h-5 border-2 flex items-center p-0.5 transition-colors ${checked ? 'border-retro-green bg-retro-green/20' : 'border-slate-600 bg-black'}`}>
        <div className={`w-3 h-3 bg-current transition-transform duration-0 ${checked ? 'translate-x-5 text-retro-green' : 'translate-x-0 text-slate-600'}`}></div>
    </div>
    {label && <span className={`text-[10px] md:text-xs uppercase tracking-wide ${checked ? 'text-retro-green text-shadow-glow' : 'text-slate-500'}`}>{label}</span>}
  </div>
);

export const Card: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void }> = ({ 
  children, 
  className = '',
  onClick
}) => (
  <div 
    onClick={onClick}
    // Compact UI: Reduced padding (p-4/p-6 -> p-3/p-5)
    className={`bg-black border-2 md:border-4 border-slate-700 p-3 md:p-5 shadow-[4px_4px_0px_0px_rgba(30,30,30,1)] md:shadow-[8px_8px_0px_0px_rgba(30,30,30,1)] ${className}`}
  >
    {children}
  </div>
);

export const Badge: React.FC<{ children: React.ReactNode; color?: string }> = ({ 
  children, 
  color = 'border-slate-500 text-slate-300' 
}) => (
  <span className={`border ${color} px-1.5 py-0.5 text-[8px] md:text-[10px] font-pixel uppercase bg-black`}>
    {children}
  </span>
);

export const Tooltip: React.FC<{ text: string; children: React.ReactNode; position?: 'top' | 'bottom'; className?: string }> = ({ text, children, position = 'bottom', className = '' }) => (
  <div className={`group relative flex items-center justify-center ${className}`}>
    {children}
    <div className={`pointer-events-none absolute ${position === 'bottom' ? 'top-full mt-2' : 'bottom-full mb-2'} left-1/2 -translate-x-1/2 opacity-0 transition-opacity duration-200 group-hover:opacity-100 z-[200] whitespace-nowrap`}>
       <div className="bg-black border border-white px-2 py-1 text-[10px] font-pixel text-white shadow-[2px_2px_0px_0px_rgba(255,255,255,0.5)]">
         {text}
       </div>
    </div>
  </div>
);

interface NeuralLoaderProps {
  message?: string;
}

export const NeuralLoader: React.FC<NeuralLoaderProps> = ({ message = "MEMUAT..." }) => {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
        setDots(prev => prev.length < 3 ? prev + "." : "");
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-6 animate-fade-in font-mono">
      <div className="text-retro-green text-3xl mb-3 animate-bounce font-pixel">
        👾
      </div>
      <p className="text-lg text-retro-green text-shadow-glow uppercase tracking-widest">
        {message}{dots}
      </p>
      <div className="w-32 h-2 border border-retro-green mt-3 p-0.5">
         <div className="h-full bg-retro-green animate-[shimmer_2s_infinite]"></div>
      </div>
    </div>
  );
};
