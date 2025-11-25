import React from 'react';
import { Button } from './Shared';
import { X, Play } from 'lucide-react';

interface TutorialOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: (string | React.ReactNode)[];
  icon?: React.ReactNode;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ isOpen, onClose, title, content, icon }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border-2 border-retro-cyan rounded-xl max-w-sm w-full p-5 shadow-[0_0_30px_rgba(0,255,255,0.2)] transform transition-all scale-100">
        <div className="flex justify-between items-start mb-4 border-b border-white/10 pb-3">
           <div className="flex items-center gap-3">
              {icon && <div className="p-1.5 bg-retro-cyan/20 rounded text-retro-cyan">{icon}</div>}
              <h2 className="text-lg font-bold text-white font-pixel leading-tight">{title}</h2>
           </div>
           <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
             <X className="w-5 h-5" />
           </button>
        </div>
        
        <div className="space-y-3 mb-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
           {content.map((step, idx) => (
             <div key={idx} className="flex gap-3">
                <div className="flex-shrink-0 w-5 h-5 rounded bg-slate-800 flex items-center justify-center text-xs font-bold text-retro-cyan border border-slate-700 font-pixel">
                  {idx + 1}
                </div>
                <div className="text-slate-300 text-sm leading-snug w-full">
                  {step}
                </div>
             </div>
           ))}
        </div>

        <Button onClick={onClose} variant="secondary" className="w-full py-3 bg-retro-cyan text-black hover:bg-white hover:text-black font-bold">
          <Play className="w-4 h-4 mr-2 text-black" /> <span className="font-pixel text-black">MULAI MISI</span>
        </Button>
      </div>
    </div>
  );
};