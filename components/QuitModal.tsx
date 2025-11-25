import React from 'react';
import { Button } from './Shared';
import { AlertTriangle } from 'lucide-react';

interface QuitModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const QuitModal: React.FC<QuitModalProps> = ({ isOpen, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-800 border border-white/10 rounded-2xl max-w-sm w-full p-6 shadow-2xl transform transition-all scale-100 text-center animate-fade-in-up">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/30">
           <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Keluar Permainan?</h2>
        <p className="text-slate-400 text-sm mb-6 leading-relaxed">
          Apakah kamu yakin? Progres permainan saat ini tidak akan disimpan.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onCancel} className="flex-1 justify-center bg-slate-700 hover:bg-slate-600">
            Tidak
          </Button>
          <Button variant="danger" onClick={onConfirm} className="flex-1 justify-center shadow-lg shadow-red-900/20">
            Ya, Keluar
          </Button>
        </div>
      </div>
    </div>
  );
};