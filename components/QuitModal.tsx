
import React from 'react';
import { Button } from './Shared';
import { AlertTriangle } from 'lucide-react';
import { getTranslation } from '../services/languageService';
import { Language } from '../types';

interface QuitModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  language?: Language;
}

export const QuitModal: React.FC<QuitModalProps> = ({ isOpen, onConfirm, onCancel, language = 'ID' }) => {
  if (!isOpen) return null;
    const t = (k: string) => getTranslation(language as Language, k);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm bg-black border-4 border-white shadow-[8px_8px_0_0_rgba(255,255,255,0.2)] p-1 transform transition-all scale-100">
        <div className="border-2 border-dashed border-slate-700 p-6 flex flex-col items-center text-center">
            
            <div className="mb-4 text-retro-red animate-bounce">
                <AlertTriangle className="w-12 h-12" />
            </div>

            <h2 className="text-xl md:text-2xl font-pixel text-white mb-2 uppercase text-shadow-retro leading-tight">
                {t('quitTitle')}
            </h2>
            
            <div className="w-full h-px bg-slate-700 my-4"></div>

            <p className="font-mono text-slate-300 text-sm md:text-base mb-8 leading-relaxed">
              {t('quitConfirm')}
            </p>

            <div className="grid grid-cols-2 gap-4 w-full">
              <Button 
                variant="secondary" 
                onClick={onCancel} 
                className="justify-center border-slate-500 text-slate-300 hover:text-white"
              >
                {t('cancel')}
              </Button>
              <Button 
                variant="danger" 
                onClick={onConfirm} 
                className="justify-center"
              >
                {t('exit')}
              </Button>
            </div>

        </div>
      </div>
    </div>
  );
};
