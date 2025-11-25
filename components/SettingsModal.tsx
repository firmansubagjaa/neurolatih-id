import React, { useState, useEffect } from 'react';
import { Button, Tooltip } from './Shared';
import { X, Volume2, Music, Check } from 'lucide-react';
import { getMusicVolume, getSfxVolume, setMusicVolume, setSfxVolume, playSound } from '../services/audioService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [localMusicVol, setLocalMusicVol] = useState(0.5);
  const [localSfxVol, setLocalSfxVol] = useState(0.5);

  useEffect(() => {
    if (isOpen) {
      setLocalMusicVol(getMusicVolume());
      setLocalSfxVol(getSfxVolume());
    }
  }, [isOpen]);

  const handleMusicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setLocalMusicVol(val);
    setMusicVolume(val);
  };

  const handleSfxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setLocalSfxVol(val);
    setSfxVolume(val);
  };

  // Test sound when releasing SFX slider
  const handleSfxRelease = () => {
    playSound('pop');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel w-full max-w-sm rounded-2xl p-6 border border-white/10 shadow-2xl transform transition-all scale-100">
        <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
             Pengaturan
          </h2>
          <Tooltip text="TUTUP">
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
          </Tooltip>
        </div>

        <div className="space-y-8 mb-8">
          {/* Music Volume */}
          <div className="space-y-3">
             <div className="flex justify-between items-center text-slate-300">
                <div className="flex items-center gap-2">
                    <Music className="w-5 h-5 text-neuro-400" />
                    <span className="font-medium text-sm">Musik Latar</span>
                </div>
                <span className="text-xs font-mono bg-slate-800 px-2 py-1 rounded text-neuro-300">
                    {(localMusicVol * 100).toFixed(0)}%
                </span>
             </div>
             <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.05"
                value={localMusicVol}
                onChange={handleMusicChange}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-neuro-500 hover:accent-neuro-400 focus:outline-none focus:ring-2 focus:ring-neuro-500/50"
             />
          </div>

          {/* SFX Volume */}
          <div className="space-y-3">
             <div className="flex justify-between items-center text-slate-300">
                <div className="flex items-center gap-2">
                    <Volume2 className="w-5 h-5 text-accent-400" />
                    <span className="font-medium text-sm">Efek Suara</span>
                </div>
                <span className="text-xs font-mono bg-slate-800 px-2 py-1 rounded text-accent-300">
                    {(localSfxVol * 100).toFixed(0)}%
                </span>
             </div>
             <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.05"
                value={localSfxVol}
                onChange={handleSfxChange}
                onMouseUp={handleSfxRelease}
                onTouchEnd={handleSfxRelease}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-accent-500 hover:accent-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-500/50"
             />
          </div>
        </div>

        <Button onClick={onClose} className="w-full">
          <Check className="w-4 h-4 mr-2" /> Simpan
        </Button>
      </div>
    </div>
  );
};