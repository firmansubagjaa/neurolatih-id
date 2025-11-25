
import React, { useState, useEffect } from 'react';
import { Button } from './Shared';
import { X, Volume2, Music, Type, Languages } from 'lucide-react';
import { getMusicVolume, getSfxVolume, setMusicVolume, setSfxVolume, playSound } from '../services/audioService';
import { FontSize, Language } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, language, setLanguage, t }) => {
  const [localMusicVol, setLocalMusicVol] = useState(0.5);
  const [localSfxVol, setLocalSfxVol] = useState(0.5);
  const [fontSize, setFontSize] = useState<FontSize>('MEDIUM');

  useEffect(() => {
    if (isOpen) {
      setLocalMusicVol(getMusicVolume());
      setLocalSfxVol(getSfxVolume());
      
      const savedSize = localStorage.getItem('neuro_font_size') as FontSize;
      if (savedSize) setFontSize(savedSize);
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

  const handleSfxRelease = () => {
    playSound('pop');
  };

  const changeFontSize = (size: FontSize) => {
      setFontSize(size);
      playSound('click');
      localStorage.setItem('neuro_font_size', size);
      
      const sizeMap: Record<FontSize, string> = {
          'SMALL': '14px',
          'MEDIUM': '16px',
          'LARGE': '20px'
      };
      
      document.documentElement.style.fontSize = sizeMap[size];
  };

  const toggleLanguage = () => {
      const newLang = language === 'ID' ? 'EN' : 'ID';
      setLanguage(newLang);
      playSound('click');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-none animate-fade-in">
      {/* Retro Window Style */}
      <div className="w-full max-w-sm bg-black border-4 border-white p-1 shadow-[12px_12px_0_0_rgba(0,0,0,0.5)] transform transition-all scale-100">
        <div className="border-2 border-slate-700 p-6 flex flex-col">
          
          <div className="flex justify-between items-center mb-6 border-b-2 border-slate-700 pb-4">
            <h2 className="text-xl font-pixel text-white flex items-center gap-2">
               {t('settings')}
            </h2>
            <button onClick={onClose} className="text-slate-400 hover:text-red-500 transition-colors">
               <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6 mb-8">
            
            {/* Language Settings */}
            <div className="flex justify-between items-center">
                 <div className="flex items-center gap-2 font-pixel text-xs text-slate-300">
                     <Languages className="w-4 h-4" /> {t('language')}
                 </div>
                 <button 
                    onClick={toggleLanguage}
                    className="flex items-center gap-2 bg-slate-800 border-2 border-slate-600 px-2 py-1 hover:border-retro-green active:translate-y-1"
                 >
                     <span className={`text-xs font-bold ${language === 'ID' ? 'text-white' : 'text-slate-500'}`}>🇮🇩 ID</span>
                     <span className="text-slate-600">|</span>
                     <span className={`text-xs font-bold ${language === 'EN' ? 'text-white' : 'text-slate-500'}`}>🇺🇸 EN</span>
                 </button>
            </div>

            <div className="w-full h-px bg-slate-700"></div>

            {/* Music Volume */}
            <div className="space-y-3">
               <div className="flex justify-between items-center text-slate-300">
                  <div className="flex items-center gap-2 font-pixel text-xs">
                      <Music className="w-4 h-4" /> {t('bgm')}
                  </div>
                  <span className="text-xs font-mono bg-slate-800 px-2 py-1 border border-slate-600 text-white">
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
                  className="w-full h-4 bg-slate-800 border-2 border-slate-600 appearance-none cursor-pointer accent-retro-green rounded-none"
               />
            </div>

            {/* SFX Volume */}
            <div className="space-y-3">
               <div className="flex justify-between items-center text-slate-300">
                  <div className="flex items-center gap-2 font-pixel text-xs">
                      <Volume2 className="w-4 h-4" /> {t('sfx')}
                  </div>
                  <span className="text-xs font-mono bg-slate-800 px-2 py-1 border border-slate-600 text-white">
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
                  className="w-full h-4 bg-slate-800 border-2 border-slate-600 appearance-none cursor-pointer accent-retro-cyan rounded-none"
               />
            </div>

            <div className="w-full h-px bg-slate-700"></div>

            {/* Font Size Settings */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-slate-300">
                   <div className="flex items-center gap-2 font-pixel text-xs">
                      <Type className="w-4 h-4" /> {t('fontSize')}
                   </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                  {(['SMALL', 'MEDIUM', 'LARGE'] as FontSize[]).map((size) => (
                    <button 
                      key={size}
                      onClick={() => changeFontSize(size)}
                      className={`py-2 px-1 border-2 font-pixel text-[10px] transition-all active:translate-y-1 ${
                        fontSize === size 
                          ? 'bg-retro-pink text-black border-white' 
                          : 'bg-black text-slate-400 border-slate-700 hover:border-white'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
              </div>
            </div>
          </div>

          <Button onClick={onClose} className="w-full justify-center">
            {t('saveExit')}
          </Button>
        </div>
      </div>
    </div>
  );
};
