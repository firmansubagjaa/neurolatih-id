
import React from 'react';
import { playSound, resumeAudio, playHover } from '../../services/audioService';

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
  onMouseEnter,
  ...props 
}) => {
  // Visceral Design: 3D press effect, hover brightness, shadows
  const baseStyle = "relative font-pixel text-xs md:text-sm uppercase tracking-wider transition-all duration-100 border-2 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:translate-y-1 active:shadow-none shadow-retro hover:brightness-110 hover:-translate-y-0.5 z-10 select-none";
  
  const variants = {
    primary: "bg-retro-green text-black border-white hover:border-retro-green hover:shadow-[0_0_15px_rgba(74,222,128,0.6)]",
    secondary: "bg-slate-800 text-retro-cyan border-slate-500 hover:border-retro-cyan hover:text-white hover:shadow-[0_0_15px_rgba(34,211,238,0.4)]",
    danger: "bg-retro-red text-white border-white hover:bg-white hover:text-retro-red hover:border-retro-red hover:shadow-[0_0_15px_rgba(248,113,113,0.6)]",
    ghost: "bg-transparent text-slate-400 border-transparent shadow-none active:translate-y-0 hover:text-white hover:bg-white/10 hover:scale-105 !border-0",
    outline: "bg-black text-white border-white hover:bg-white hover:text-black hover:shadow-[0_0_15px_rgba(255,255,255,0.5)]"
  };

  const padding = variant === 'ghost' ? 'p-2' : 'px-6 py-3';

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    resumeAudio();
    if (!disabled && !isLoading) {
      playSound('click'); // Visceral Auditory Feedback
    }
    onClick?.(e);
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
     if (!disabled) {
         playHover(); // Micro-interaction
     }
     onMouseEnter?.(e);
  };

  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${padding} ${className}`} 
      disabled={disabled || isLoading}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      {...props}
    >
      {isLoading && <span className="animate-spin mr-2">⟳</span>}
      {children}
    </button>
  );
};
