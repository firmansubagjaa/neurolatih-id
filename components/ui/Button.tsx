
import React from 'react';
import { playSound, resumeAudio } from '../../services/audioService';

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
