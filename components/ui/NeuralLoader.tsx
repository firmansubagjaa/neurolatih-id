
import React, { useState, useEffect } from 'react';
import { Cpu } from 'lucide-react';

interface NeuralLoaderProps {
  message?: string;
}

export const NeuralLoader: React.FC<NeuralLoaderProps> = ({ message = "LOADING" }) => {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
        setDots(prev => prev.length < 3 ? prev + "." : "");
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-8 animate-fade-in font-mono m-4">
      <Cpu className="w-12 h-12 text-retro-green animate-pulse mb-4" />
      <p className="text-xl text-retro-green uppercase tracking-widest text-center font-pixel text-shadow-retro">
        {message}{dots}
      </p>
      {/* Retro Loading Bar */}
      <div className="w-48 h-4 border-2 border-slate-700 mt-6 p-0.5 bg-black relative overflow-hidden">
         <div className="h-full bg-retro-green animate-[scanline_1.5s_infinite]"></div>
      </div>
    </div>
  );
};
