
import React, { useState, useEffect } from 'react';

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
