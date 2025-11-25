
import React from 'react';
import { Button } from '../ui/Button';
import { Database } from 'lucide-react';
import { playSound } from '../../services/audioService';
import { Language } from '../../types';

interface WelcomeScreenProps {
  onStart: () => void;
  onAbout: () => void;
  language?: Language; 
  text: {
    welcome: string;
    startSystem: string;
    aboutSystem?: string;
  };
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart, onAbout, text, language = 'ID' }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center animate-fade-in px-4">
      
      <div className="mb-12 relative group">
          <div className="bg-black border-4 border-white p-6 md:p-10 shadow-retro-lg transform group-hover:-translate-y-2 transition-transform">
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-pixel text-retro-green mb-4 text-shadow-retro leading-none">
              NEUROLATIH
            </h1>
            <div className="inline-block bg-retro-red px-3 py-1 border-2 border-white">
              <p className="text-sm md:text-lg font-pixel text-white font-bold tracking-[0.5em]">8-BIT EDITION</p>
            </div>
          </div>
      </div>
      
      <div className="max-w-md text-slate-300 mb-10 font-mono text-base md:text-xl leading-relaxed bg-black border-2 border-slate-600 p-6 w-full shadow-retro text-left">
        <span className="text-retro-green mr-2">$</span>
        <span className="typing-effect">{text.welcome}</span>
        <span className="animate-blink inline-block w-3 h-5 bg-retro-green ml-1 align-middle"></span>
      </div>

      <div className="flex flex-col gap-4 w-full max-w-xs">
        <Button onClick={onStart} className="text-xl md:text-2xl py-5 px-10 border-4 animate-pulse-fast hover:animate-none w-full">
            {text.startSystem}
        </Button>
        <Button 
            onClick={() => { playSound('click'); onAbout(); }} 
            variant="secondary" 
            className="w-full py-3 border-2 text-sm"
        >
            <Database className="w-4 h-4 mr-2" /> {text.aboutSystem || "DATA / ABOUT"}
        </Button>
      </div>
    </div>
  );
};
