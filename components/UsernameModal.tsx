
import React, { useState } from 'react';
import { Button } from './Shared';
import { Terminal, User, ChevronRight } from 'lucide-react';
import { playSound } from '../services/audioService';

interface UsernameModalProps {
  isOpen: boolean;
  onSubmit: (username: string) => void;
}

export const UsernameModal: React.FC<UsernameModalProps> = ({ isOpen, onSubmit }) => {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) {
        setError('IDENTITAS TIDAK BOLEH KOSONG');
        playSound('wrong');
        return;
    }
    if (input.length > 12) {
        setError('MAKSIMAL 12 KARAKTER');
        playSound('wrong');
        return;
    }
    playSound('correct');
    onSubmit(input.trim().toUpperCase());
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-sm bg-black border-4 border-retro-green p-1 shadow-[0_0_50px_rgba(74,222,128,0.2)]">
        <div className="border-2 border-dashed border-slate-700 p-8 flex flex-col items-center">
            
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-6 border-2 border-retro-green animate-pulse">
                <User className="w-8 h-8 text-retro-green" />
            </div>

            <h2 className="text-xl font-pixel text-white mb-2 text-center uppercase">
                IDENTIFIKASI OPERATOR
            </h2>
            <p className="text-xs font-mono text-slate-400 mb-6 text-center">
                Masukkan codename untuk mengakses Neuro-Link.
            </p>

            <form onSubmit={handleSubmit} className="w-full">
                <div className="relative mb-6 group">
                    <Terminal className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-retro-green transition-colors" />
                    <input 
                        type="text" 
                        autoFocus
                        value={input}
                        onChange={(e) => { setInput(e.target.value); setError(''); }}
                        className="w-full bg-slate-900 border-2 border-slate-600 p-4 pl-10 text-white font-mono uppercase focus:border-retro-green focus:outline-none focus:shadow-[0_0_15px_rgba(74,222,128,0.3)] transition-all placeholder:text-slate-600"
                        placeholder="CODENAME..."
                    />
                </div>

                {error && (
                    <div className="text-retro-red text-xs font-pixel mb-4 text-center animate-shake">
                        [ERROR]: {error}
                    </div>
                )}

                <Button className="w-full py-4 text-lg justify-center group-hover:animate-pulse">
                    AKSES SISTEM <ChevronRight className="w-5 h-5 ml-1" />
                </Button>
            </form>
        </div>
      </div>
    </div>
  );
};
