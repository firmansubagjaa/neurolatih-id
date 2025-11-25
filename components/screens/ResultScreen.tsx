
import React from 'react';
import { GameMode, GameResult } from '../../types';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Confetti } from '../Confetti';
import { Trophy, Star, Terminal } from 'lucide-react';

interface ResultScreenProps {
  lastResult: GameResult | null;
  aiFeedback: string;
  isFeedbackLoading: boolean;
  onMenu: () => void;
  onRetry: () => void;
  t: (key: string) => string;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({
  lastResult,
  aiFeedback,
  isFeedbackLoading,
  onMenu,
  onRetry,
  t
}) => {
  return (
    <div className="w-full max-w-lg mx-auto animate-fade-in text-center px-4">
      <Confetti />
      <div className="mb-8">
          <Trophy className="w-20 h-20 text-retro-yellow mx-auto mb-4 animate-bounce drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]" />
          <h2 className="text-3xl md:text-5xl font-pixel text-white mb-2 text-shadow-retro">{t('missionClear')}</h2>
          <div className="inline-block bg-slate-900 px-4 py-1 border-2 border-slate-700 text-retro-cyan font-pixel text-xs uppercase tracking-widest">
            {lastResult?.gameMode} // {lastResult?.difficulty}
          </div>
      </div>

      {lastResult?.isNewBest && (
          <div className="mb-6 animate-pulse">
              <div className="inline-flex items-center gap-2 bg-retro-yellow text-black px-4 py-2 font-pixel font-bold border-2 border-white transform rotate-2">
                  <Star className="w-5 h-5 fill-current" /> NEW BEST SCORE! <Star className="w-5 h-5 fill-current" />
              </div>
          </div>
      )}

      <Card className="mb-8 bg-black border-4 border-retro-green p-0 relative overflow-hidden">
          <div className="bg-retro-green p-2 text-black font-pixel text-center text-sm font-bold">REPORT CARD</div>
          <div className="p-6">
              <div className="grid grid-cols-2 gap-6 mb-6 border-b-2 border-dashed border-slate-700 pb-6">
                  <div className="text-center">
                      <p className="text-xs text-slate-500 uppercase tracking-widest mb-2 font-bold font-pixel">{t('totalScore')}</p>
                      <p className="text-4xl font-bold text-white font-mono">{lastResult?.score}</p>
                      {lastResult?.xpGained && (
                          <p className="text-xs text-retro-cyan mt-1">+ {lastResult.xpGained} XP</p>
                      )}
                  </div>
                  <div className="text-center">
                      <p className="text-xs text-slate-500 uppercase tracking-widest mb-2 font-bold font-pixel">{t('accuracy')}</p>
                      <p className={`text-4xl font-bold font-mono ${lastResult?.accuracy && lastResult.accuracy > 80 ? 'text-retro-green' : 'text-retro-red'}`}>
                          {lastResult?.accuracy.toFixed(0)}%
                      </p>
                  </div>
              </div>

              <div className="bg-slate-900 p-4 border-l-4 border-retro-yellow text-left mb-6">
                  <div className="flex items-center gap-2 mb-2 text-retro-yellow font-bold text-xs font-pixel">
                      <Terminal className="w-3 h-3" /> {t('aiAnalysis')}
                  </div>
                  {isFeedbackLoading ? (
                      <div className="flex gap-1 items-center text-slate-500 font-mono text-xs">
                          <span className="animate-pulse">{t('processing')}</span>
                      </div>
                  ) : (
                      <p className="text-slate-300 font-mono text-sm leading-relaxed tracking-tight">
                      {aiFeedback}
                      </p>
                  )}
              </div>

              <div className="flex gap-3">
                  <Button onClick={onMenu} variant="secondary" className="flex-1">
                      {t('menu')}
                  </Button>
                  <Button onClick={onRetry} className="flex-1">
                      {t('retry')}
                  </Button>
              </div>
          </div>
      </Card>
    </div>
  );
};
