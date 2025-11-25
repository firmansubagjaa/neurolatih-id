
import React from 'react';
import { X, Brain } from 'lucide-react';
import { Card } from './ui/Card';
import { BrainVisualizer } from './BrainVisualizer';
import { playSound } from '../services/audioService';

interface BrainModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeRegion: string | null;
}

export const BrainModal: React.FC<BrainModalProps> = ({ isOpen, onClose, activeRegion }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md animate-scale-in">
        <Card className="bg-black border-4 border-retro-cyan p-6 relative shadow-[0_0_50px_rgba(34,211,238,0.3)]">
            <div className="flex justify-between items-center mb-6 border-b-2 border-slate-700 pb-4">
                <div className="flex items-center gap-2">
                    <Brain className="w-6 h-6 text-retro-cyan animate-pulse" />
                    <h2 className="font-pixel text-white text-lg">NEURO_VISUALIZER</h2>
                </div>
                <button onClick={() => { playSound('click'); onClose(); }} className="text-slate-400 hover:text-white">
                    <X className="w-6 h-6" />
                </button>
            </div>

            <div className="mb-6 flex justify-center">
                <BrainVisualizer activeRegion={activeRegion} />
            </div>

            <div className="text-center border-t-2 border-slate-800 pt-4">
                <p className="font-pixel text-sm text-retro-green mb-2 uppercase tracking-widest">
                    {activeRegion || "STANDBY"}
                </p>
                <p className="font-mono text-[10px] text-slate-500">
                    *Visualisasi skematik area aktivasi otak.
                </p>
            </div>
        </Card>
      </div>
    </div>
  );
};
