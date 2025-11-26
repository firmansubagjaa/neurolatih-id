
import React from 'react';
import { GameResult } from '../../types';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Confetti } from '../Confetti';
import { Trophy, Star, Terminal, RotateCcw, Home } from 'lucide-react';

interface ResultScreenProps {
  lastResult: GameResult | null;
  aiFeedback: string;
  isFeedbackLoading: boolean;
  onMenu: () => void;
  onRetry: () => void;
  t: (key: string) => string;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({ lastResult, aiFeedback, isFeedbackLoading, onMenu, onRetry, t }) => {
  return (
    <div className="w-full max-w-lg mx-auto animate-fade-in text-center px-4 pt-4 md:pt-10 h-full flex flex-col justify-center">
      <Confetti />
      
      <div className="mb-4 md:mb-8 relative shrink-0">
          <div className="absolute inset-0 bg-retro-green opacity-20 blur-2xl animate-pulse"></div>
          <Trophy className="w-16 h-16 md:w-24 md:h-24 text-retro-yellow mx-auto mb-4 animate-bounce drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]" />
          <h2 className="text-3xl sm:text-4xl md:text-6xl font-pixel text-white mb-2 text-shadow-retro leading-tight tracking-tight break-words">{t('missionClear')}</h2>
          <div className="inline-block bg-slate-900 px-4 py-1 md:px-6 border-2 border-slate-600 text-retro-cyan font-pixel text-xs md:text-sm uppercase tracking-widest whitespace-nowrap">
            {lastResult?.gameMode} // {lastResult?.difficulty}
          </div>
      </div>

      {lastResult?.isNewBest && (
          <div className="mb-6 md:mb-8 animate-scale-in shrink-0">
              <div className="inline-flex items-center gap-2 bg-retro-yellow text-black px-4 py-2 md:px-6 md:py-3 font-pixel font-bold border-4 border-white transform -rotate-2 shadow-lg text-xs md:text-base">
                  <Star className="w-4 h-4 md:w-5 md:h-5 fill-current" /> NEW RECORD! <Star className="w-4 h-4 md:w-5 md:h-5 fill-current" />
              </div>
          </div>
      )}

      <Card className="mb-4 md:mb-8 bg-black border-4 border-retro-green p-0 overflow-hidden shadow-retro-lg w-full">
          <div className="bg-retro-green p-2 text-black font-pixel text-center text-xs md:text-sm font-bold flex items-center justify-center gap-2">
            <Terminal className="w-3 h-3 md:w-4 md:h-4" /> PERFORMANCE REPORT
          </div>
          
          <div className="p-4 md:p-8">
              <div className="grid grid-cols-2 gap-4 md:gap-8 mb-4 md:mb-8 border-b-2 border-dashed border-slate-800 pb-4 md:pb-8">
                  <div>
                      <p className="text-[10px] md:text-xs text-slate-500 uppercase tracking-widest mb-1 md:mb-2 font-bold font-pixel">{t('totalScore')}</p>
                      <p className="text-3xl md:text-5xl font-bold text-white font-mono">{lastResult?.score}</p>
                      {lastResult?.xpGained && <p className="text-[10px] md:text-xs text-retro-cyan mt-1 font-mono font-bold">+ {lastResult.xpGained} XP</p>}
                  </div>
                  <div>
                      <p className="text-[10px] md:text-xs text-slate-500 uppercase tracking-widest mb-1 md:mb-2 font-bold font-pixel">{t('accuracy')}</p>
                      <p className={`text-3xl md:text-5xl font-bold font-mono ${lastResult?.accuracy && lastResult.accuracy > 80 ? 'text-retro-green' : 'text-retro-red'}`}>
                          {lastResult?.accuracy.toFixed(0)}%
                      </p>
                  </div>
              </div>

              <div className="bg-slate-900/50 p-3 md:p-4 border-l-4 border-retro-yellow text-left mb-6 md:mb-8">
                  <div className="flex items-center gap-2 mb-2 text-retro-yellow font-bold text-[10px] md:text-xs font-pixel">
                      <Terminal className="w-3 h-3" /> SYSTEM_ANALYSIS
                  </div>
                  {isFeedbackLoading ? (
                      <div className="flex gap-1 items-center text-slate-500 font-mono text-xs">
                          <span className="animate-pulse">{t('processing')}</span>
                      </div>
                  ) : (
                      <p className="text-slate-300 font-mono text-xs md:text-sm leading-relaxed">{aiFeedback}</p>
                  )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                  <Button onClick={onMenu} variant="secondary" className="flex-1 py-3 md:py-4 justify-center text-xs md:text-sm">
                      <Home className="w-4 h-4 mr-2" /> {t('menu')}
                  </Button>
                  <Button onClick={onRetry} className="flex-1 py-3 md:py-4 justify-center text-xs md:text-sm">
                      <RotateCcw className="w-4 h-4 mr-2" /> {t('retry')}
                  </Button>
              </div>
          </div>
      </Card>
    </div>
  );
};
