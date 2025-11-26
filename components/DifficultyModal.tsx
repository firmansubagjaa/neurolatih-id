
import React from 'react';
import { Difficulty } from '../types';
import { X, Sword, Shield, Skull } from 'lucide-react';
import { playSound } from '../services/audioService';
import { Tooltip } from './ui/Tooltip';

interface DifficultyModalProps { isOpen: boolean; onClose: () => void; onSelect: (diff: Difficulty) => void; }

export const DifficultyModal: React.FC<DifficultyModalProps> = ({ isOpen, onClose, onSelect }) => {
  if (!isOpen) return null;
  const handleSelect = (diff: Difficulty) => { playSound('correct'); onSelect(diff); };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-black border-4 border-white p-1 shadow-[10px_10px_0px_0px_rgba(255,255,255,0.2)] transform transition-all scale-100">
        <div className="border-2 border-dashed border-slate-700 p-6 flex flex-col">
            <div className="flex justify-between items-start mb-6">
                <div className="flex-1"><h2 className="text-xl md:text-2xl font-pixel text-white mb-1 uppercase text-shadow-retro">Select Difficulty</h2><p className="font-mono text-slate-400 text-xs">CHOOSE YOUR FATE</p></div>
                <Tooltip text="TUTUP"><button onClick={() => { playSound('click'); onClose(); }} className="text-slate-500 hover:text-red-500 p-1 transition-colors"><X className="w-6 h-6" /></button></Tooltip>
            </div>
            <div className="space-y-4">
                <button onClick={() => handleSelect(Difficulty.BEGINNER)} className="w-full group relative bg-black border-4 border-retro-green p-4 hover:bg-retro-green hover:text-black transition-all active:translate-y-1">
                    <div className="flex items-center justify-between"><div className="flex items-center gap-4"><Shield className="w-8 h-8 text-retro-green group-hover:text-black" /><div className="text-left"><div className="font-pixel text-xs md:text-sm uppercase">{Difficulty.BEGINNER}</div><div className="font-mono text-[10px] opacity-70">FOR NOOBS</div></div></div><span className="font-pixel text-lg opacity-0 group-hover:opacity-100 animate-blink">{'>'}</span></div>
                </button>
                <button onClick={() => handleSelect(Difficulty.INTERMEDIATE)} className="w-full group relative bg-black border-4 border-retro-yellow p-4 hover:bg-retro-yellow hover:text-black transition-all active:translate-y-1">
                    <div className="flex items-center justify-between"><div className="flex items-center gap-4"><Sword className="w-8 h-8 text-retro-yellow group-hover:text-black" /><div className="text-left"><div className="font-pixel text-xs md:text-sm uppercase">{Difficulty.INTERMEDIATE}</div><div className="font-mono text-[10px] opacity-70">NORMAL MODE</div></div></div><span className="font-pixel text-lg opacity-0 group-hover:opacity-100 animate-blink">{'>'}</span></div>
                </button>
                <button onClick={() => handleSelect(Difficulty.ADVANCED)} className="w-full group relative bg-black border-4 border-retro-red p-4 hover:bg-retro-red hover:text-white transition-all active:translate-y-1">
                    <div className="flex items-center justify-between"><div className="flex items-center gap-4"><Skull className="w-8 h-8 text-retro-red group-hover:text-white" /><div className="text-left"><div className="font-pixel text-xs md:text-sm uppercase">{Difficulty.ADVANCED}</div><div className="font-mono text-[10px] opacity-70">HARDCORE</div></div></div><span className="font-pixel text-lg opacity-0 group-hover:opacity-100 animate-blink">{'>'}</span></div>
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
