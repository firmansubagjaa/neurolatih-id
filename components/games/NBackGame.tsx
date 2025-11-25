
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Difficulty, GameResult, GameMode } from '../../types';
import { startMusic, stopMusic, playSound } from '../../services/audioService';
import { Button, Card, Badge, Tooltip } from '../Shared';
import { TutorialOverlay } from '../TutorialOverlay';
import { QuitModal } from '../QuitModal';
import { Confetti } from '../Confetti';
import { CountdownBar } from '../CountdownBar';
import { GameIntro } from '../GameIntro';
import { BrainCircuit, HelpCircle, Check, X } from 'lucide-react';

interface NBackGameProps {
  difficulty: Difficulty;
  onEndGame: (result: GameResult) => void;
  onBack: () => void;
  isQuickMode?: boolean;
  isPracticeMode?: boolean;
}

const GridItem = React.memo(({ isActive }: { isActive: boolean }) => (
  <div 
    className={`relative rounded-xl transition-all duration-300 flex items-center justify-center
      ${isActive 
        ? 'bg-gradient-to-br from-neuro-400 to-neuro-600 shadow-[0_0_20px_rgba(14,165,233,0.5)] scale-100 z-10 ring-1 ring-white/50' 
        : 'bg-slate-800/40 border border-white/5 scale-95'
      }
    `}
  >
    {isActive && (
       <div className="absolute inset-0 bg-white/20 animate-pulse rounded-xl"></div>
    )}
    {!isActive && (
       <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-slate-700/50"></div>
    )}
  </div>
));

const NBackGame: React.FC<NBackGameProps> = ({ difficulty, onEndGame, onBack, isQuickMode = false, isPracticeMode = false }) => {
  const [introFinished, setIntroFinished] = useState(false);
  const [gameActive, setGameActive] = useState(true);
  const [sequence, setSequence] = useState<number[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [score, setScore] = useState(0);
  const [correctHits, setCorrectHits] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showQuitModal, setShowQuitModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [feedback, setFeedback] = useState<'CORRECT' | 'WRONG' | null>(null);

  const mistakeTracker = useRef<string[]>([]);

  const N_VALUE = difficulty === Difficulty.BEGINNER ? 1 : difficulty === Difficulty.INTERMEDIATE ? 2 : 3;
  const TOTAL_TIME = 60;
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  
  // Difficulty Scaling: Stimulus Duration
  const getStimulusDuration = () => {
      switch (difficulty) {
          case Difficulty.BEGINNER: return 2500;
          case Difficulty.INTERMEDIATE: return 2000;
          case Difficulty.ADVANCED: return 1500;
          default: return 2500;
      }
  };
  const STIMULUS_DURATION = getStimulusDuration();
  
  const stimulusTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    startMusic('MEMORY');
    return () => {
      isMountedRef.current = false;
      stopMusic();
      if (stimulusTimerRef.current) clearInterval(stimulusTimerRef.current);
    };
  }, []);

  const handleFinish = useCallback(() => {
    if (!isMountedRef.current) return;
    setGameActive(false);
    playSound('win');
    stopMusic();
    
    if (stimulusTimerRef.current) {
        clearInterval(stimulusTimerRef.current);
        stimulusTimerRef.current = null;
    }
    
    const accuracy = totalAttempts > 0 ? (correctHits / totalAttempts) * 100 : 0;

    onEndGame({
      score: score,
      totalQuestions: totalAttempts,
      correctAnswers: correctHits,
      accuracy: accuracy,
      duration: (TOTAL_TIME - timeLeft) * 1000,
      difficulty: difficulty,
      gameMode: GameMode.N_BACK,
      mistakePatterns: mistakeTracker.current
    });
  }, [totalAttempts, correctHits, score, timeLeft, difficulty, onEndGame]);

  useEffect(() => {
    // Timer is DISABLED in Practice Mode
    if (!isPracticeMode && introFinished && gameActive && !showTutorial && !showQuitModal && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(t => Math.max(0, t - 0.1));
      }, 100);
      return () => clearInterval(timer);
    }
  }, [introFinished, gameActive, showTutorial, showQuitModal, timeLeft, isPracticeMode]);

  useEffect(() => {
    if (!isPracticeMode && timeLeft <= 0 && gameActive && introFinished) {
        handleFinish();
    }
  }, [timeLeft, gameActive, introFinished, handleFinish, isPracticeMode]);

  useEffect(() => {
    if (introFinished && gameActive && !showTutorial && !showQuitModal) {
      if (!stimulusTimerRef.current) {
        stimulusTimerRef.current = setInterval(() => {
          setFeedback(null);
          setCurrentIndex(prev => {
            const next = prev + 1;
            const newItem = Math.floor(Math.random() * 9); 
            
            const shouldMatch = Math.random() < 0.3 && next >= N_VALUE;
            let finalItem = newItem;
            
            setSequence(prevSeq => {
               if (shouldMatch) {
                 finalItem = prevSeq[prevSeq.length - N_VALUE];
               }
               return [...prevSeq, finalItem];
            });
            
            return next;
          });
        }, STIMULUS_DURATION);
      }
    } else {
        if (stimulusTimerRef.current) {
            clearInterval(stimulusTimerRef.current);
            stimulusTimerRef.current = null;
        }
    }
    
    return () => {
        if (stimulusTimerRef.current) {
            clearInterval(stimulusTimerRef.current);
            stimulusTimerRef.current = null;
        }
    };
  }, [introFinished, gameActive, showTutorial, showQuitModal, N_VALUE, STIMULUS_DURATION]);

  const handleResponse = (isMatch: boolean) => {
    if (currentIndex < N_VALUE || feedback !== null || (!isPracticeMode && timeLeft <= 0)) return;

    setTotalAttempts(prev => prev + 1);
    
    const currentItem = sequence[currentIndex];
    const nBackItem = sequence[currentIndex - N_VALUE];
    const actuallyMatch = currentItem === nBackItem;

    if (isMatch === actuallyMatch) {
      setScore(s => s + 100);
      setCorrectHits(c => c + 1);
      setFeedback('CORRECT');
      playSound('pop');
      if (score > 0 && score % 500 === 0) setShowConfetti(true);
    } else {
      setFeedback('WRONG');
      playSound('wrong');
      setScore(s => Math.max(0, s - 50));

      if (isMatch && !actuallyMatch) {
          mistakeTracker.current.push("False Positive (Salah mengira ada kesamaan)");
      } else {
          mistakeTracker.current.push("False Negative (Melewatkan kesamaan)");
      }
    }
  };

  const currentGridPos = sequence[currentIndex];

  const handleBackRequest = () => {
    playSound('click');
    if (isPracticeMode) {
      handleFinish();
    } else {
      setShowQuitModal(true);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto relative">
      {!introFinished && (
        <GameIntro 
          gameMode={GameMode.N_BACK} 
          onStart={() => {
            playSound('click');
            setIntroFinished(true);
            setShowTutorial(true); // Tutorial triggered
          }} 
        />
      )}

      {showConfetti && <Confetti />}
      <TutorialOverlay 
        isOpen={showTutorial} 
        onClose={() => setShowTutorial(false)}
        title={`Cara Bermain: ${N_VALUE}-Back Memory`}
        content={[
          `Mode: ${N_VALUE}-Back (Working Memory).`,
          `Sebuah kotak akan menyala secara berurutan.`,
          `Tekan "SAMA" jika posisi kotak SAMA dengan posisi ${N_VALUE} langkah sebelumnya.`,
          `Tekan "BEDA" jika berbeda.`,
          ...(isQuickMode ? ["MODE CEPAT: Waktu berkurang lebih cepat!"] : []), // Fixed bug
          `Jangan hafalkan semua, cukup "Working Memory" jangka pendek.`
        ]}
        icon={<BrainCircuit className="w-6 h-6" />}
      />

      <QuitModal 
        isOpen={showQuitModal}
        onConfirm={() => { setShowQuitModal(false); onBack(); }}
        onCancel={() => setShowQuitModal(false)}
      />

      <div className="flex justify-between items-center mb-6">
         <div className="flex gap-2">
            <Button variant="ghost" onClick={handleBackRequest} className="!px-3 text-sm">&larr; {isPracticeMode ? "Selesai" : "Keluar"}</Button>
            <Tooltip text="ATURAN MAIN">
                <Button variant="ghost" onClick={() => setShowTutorial(true)} className="!px-3 text-neuro-400">
                    <HelpCircle className="w-5 h-5" />
                </Button>
            </Tooltip>
         </div>
         <Badge color="bg-purple-500">Target: {N_VALUE}-Back</Badge>
      </div>

      <Card className="flex flex-col items-center p-6 md:p-8">
        <CountdownBar totalTime={TOTAL_TIME} timeLeft={timeLeft} isPracticeMode={isPracticeMode} />
        
        {!isPracticeMode && (
          <div className="flex justify-center mb-6">
             <div className={`text-6xl md:text-8xl font-mono font-bold tracking-tighter transition-all duration-300 ${
                timeLeft <= 10 ? 'text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)] animate-pulse scale-110' : 
                timeLeft <= 20 ? 'text-yellow-400' : 'text-white'
             }`}>
               {timeLeft.toFixed(1)}
             </div>
          </div>
        )}
        
        <div className="mb-6 text-center">
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-2">
                {currentIndex < N_VALUE ? "Perhatikan..." : "Bandingkan!"}
            </h3>
            <p className="text-slate-400 text-base md:text-lg">
                Apakah sama dengan {N_VALUE} langkah lalu?
            </p>
        </div>

        {/* Optimized Grid Render */}
        <div className="grid grid-cols-3 gap-3 md:gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-700 shadow-inner mb-8 relative w-full max-w-[350px] mx-auto aspect-square">
           {Array.from({ length: 9 }).map((_, i) => (
             <GridItem key={i} isActive={i === currentGridPos} />
           ))}
           
           {feedback && (
             <div className={`absolute inset-0 z-20 flex flex-col items-center justify-center rounded-2xl backdrop-blur-sm transition-all duration-300 animate-fade-in
                ${feedback === 'CORRECT' ? 'bg-emerald-950/80' : 'bg-red-950/80'}
             `}>
                <div className={`p-5 rounded-full mb-4 shadow-2xl ${feedback === 'CORRECT' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'} transform scale-110`}>
                    {feedback === 'CORRECT' ? (
                        <Check className="w-16 h-16" />
                    ) : (
                        <X className="w-16 h-16" />
                    )}
                </div>
                <span className={`text-4xl md:text-5xl font-black tracking-widest uppercase drop-shadow-md ${feedback === 'CORRECT' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {feedback === 'CORRECT' ? 'Tepat!' : 'Salah!'}
                </span>
             </div>
           )}
        </div>

        <div className="grid grid-cols-2 gap-4 md:gap-6 w-full">
           <Button 
             variant="danger" 
             className="h-20 text-xl !text-white !border-white/20"
             disabled={currentIndex < N_VALUE || feedback !== null || (!isPracticeMode && timeLeft <= 0)}
             onClick={() => handleResponse(false)}
           >
             <X className="w-6 h-6 mr-3" /> BEDA
           </Button>
           <Button 
             variant="primary" 
             className="h-20 text-xl bg-emerald-600 hover:bg-emerald-500 border-emerald-400 !text-white"
             disabled={currentIndex < N_VALUE || feedback !== null || (!isPracticeMode && timeLeft <= 0)}
             onClick={() => handleResponse(true)}
           >
             <Check className="w-6 h-6 mr-3" /> SAMA
           </Button>
        </div>
        
        <div className="mt-6 text-sm text-slate-500">
           Skor: {score} | Langkah: {currentIndex + 1}
        </div>
      </Card>
    </div>
  );
};

export default NBackGame;
