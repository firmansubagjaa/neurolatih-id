import React, { useEffect, useState } from 'react';
import { Terminal, X } from 'lucide-react';

interface RetroToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  type?: 'info' | 'success' | 'warning';
}

export const RetroToast: React.FC<RetroToastProps> = ({ message, isVisible, onClose, type = 'info' }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        setTimeout(onClose, 300); // Wait for animation
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible && !show) return null;

  const borderColor = type === 'success' ? 'border-retro-green' : type === 'warning' ? 'border-retro-yellow' : 'border-retro-cyan';
  const textColor = type === 'success' ? 'text-retro-green' : type === 'warning' ? 'text-retro-yellow' : 'text-retro-cyan';

  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[150] transition-all duration-300 transform ${show ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'}`}>
      <div className={`bg-black border-2 ${borderColor} px-6 py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] flex items-center gap-3 min-w-[280px]`}>
         <div className={`p-1 bg-slate-800 ${textColor}`}>
            <Terminal className="w-5 h-5" />
         </div>
         <div className="flex-1">
            <p className={`font-pixel text-[10px] uppercase ${textColor} mb-0.5`}>SISTEM ALERT</p>
            <p className="font-mono text-sm text-white">{message}</p>
         </div>
      </div>
    </div>
  );
};