
import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Database, Power } from 'lucide-react';
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

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart, onAbout, text }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [bootSequence, setBootSequence] = useState(true);
  const fullText = text.welcome;

  useEffect(() => {
    let currentIndex = 0;
    const typeChar = () => {
      if (currentIndex < fullText.length) {
        setDisplayedText(fullText.substring(0, currentIndex + 1));
        currentIndex++;
        setTimeout(typeChar, 30);
      } else {
          setBootSequence(false);
      }
    };
    setTimeout(typeChar, 500);
  }, [fullText]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] text-center px-4 relative">
      
      {/* Hero Title with Glitch */}
      <div className="mb-16 relative z-10 w-full max-w-5xl">
          <div className="absolute inset-0 bg-retro-green opacity-20 blur-3xl animate-pulse"></div>
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-8xl font-pixel text-white mb-4 text-shadow-retro leading-tight tracking-tighter animate-glitch break-words sm:break-normal" style={{ textShadow: '4px 4px 0px #000' }}>
            NEUROLATIH
          </h1>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
            <span className="text-[10px] sm:text-xs md:text-sm font-mono text-retro-green bg-black px-2 border border-retro-green shadow-sm">SYS.VER.8.3.0</span>
            <span className="text-[10px] sm:text-xs md:text-sm font-mono text-retro-pink bg-black px-2 border border-retro-pink shadow-sm">NEURAL_READY</span>
          </div>
      </div>
      
      {/* Typing Terminal */}
      <div className="h-12 mb-8 font-mono text-retro-cyan text-sm sm:text-lg md:text-xl px-2">
          <span className="mr-2">{">"}</span>
          {displayedText}
          <span className={`inline-block w-2 h-4 sm:w-3 sm:h-5 bg-retro-cyan ml-1 ${bootSequence ? 'animate-blink' : 'opacity-0'}`}></span>
      </div>

      {/* Main Action */}
      <div className={`flex flex-col gap-4 w-full max-w-xs transition-all duration-1000 transform ${bootSequence ? 'translate-y-10 opacity-0' : 'translate-y-0 opacity-100'}`}>
        <Button onClick={onStart} className="text-lg sm:text-xl md:text-2xl py-4 sm:py-6 border-4 border-retro-green hover:border-white shadow-[0_0_20px_rgba(74,222,128,0.4)] animate-pulse-fast">
            <Power className="w-5 h-5 sm:w-6 sm:h-6 mr-2" /> {text.startSystem}
        </Button>
        <Button onClick={() => { playSound('click'); onAbout(); }} variant="secondary" className="py-3 sm:py-4 border-2 text-sm sm:text-base">
            <Database className="w-4 h-4 mr-2" /> {text.aboutSystem}
        </Button>
      </div>
    </div>
  );
};
