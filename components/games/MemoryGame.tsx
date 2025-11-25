import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Difficulty, GameResult, GameMode } from '../../types';
import { startMusic, stopMusic, playSound } from '../../services/audioService';
import { Button, Card, Badge, Tooltip } from '../Shared';
import { TutorialOverlay } from '../TutorialOverlay';
import { QuitModal } from '../QuitModal';
import { Confetti } from '../Confetti';
import { CountdownBar } from '../CountdownBar';
import { GameIntro } from '../GameIntro';
import { Grid, HelpCircle, Gauge } from 'lucide-react';

interface MemoryGameProps {
  difficulty: Difficulty;
  onEndGame: (result: GameResult) => void;
  onBack: () => void;
  isQuickMode?: boolean;
  isPracticeMode?: boolean;
}

type SpeedOption = 'LAMBAT' | 'SEDANG' | 'CEPAT';

const MemoryGame: React.FC<MemoryGameProps> = ({ difficulty, onEndGame, onBack, isQuickMode = false, isPracticeMode = false }) => {
  const [introFinished, setIntroFinished] = useState(false);
  const [gridSize, setGridSize] = useState(3);
  const [targetCells, setTargetCells] = useState<number[]>([]);
  const [selectedCells, setSelectedCells] = useState<number[]>([]);
  const [gameState, setGameState] = useState<'PREPARE' | 'MEMORIZE' | 'RECALL' | 'RESULT'>('PREPARE');
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(3); 
  const [score, setScore] = useState(0);
  // Change: Tutorial starts immediately after Intro finishes
  const [showTutorial, setShowTutorial] = useState(false);
  const [showQuitModal, setShowQuitModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<SpeedOption>('SEDANG');

  // GLOBAL TIMER STATE (Reduced to 30s for intensity)
  const TOTAL_TIME = 30;
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);

  // MISTAKE TRACKER for AI Feedback
  const mistakeTracker = useRef<string[]>([]);

  const isMountedRef = useRef(true);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const safeSetTimeout = (callback: () => void, ms: number) => {
    const timerId = setTimeout(() => {
      if (isMountedRef.current) callback();
      timersRef.current = timersRef.current.filter(t => t !== timerId);
    }, ms);
    timersRef.current.push(timerId);
  };

  const getGridSize = (diff: Difficulty) => {
    if (diff === Difficulty.BEGINNER) return 3;
    if (diff === Difficulty.INTERMEDIATE) return 4;
    return 5;
  };

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    startMusic('MEMORY');
    return () => {
      isMountedRef.current = false;
      stopMusic();
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  // Handle Finish Logic (Memoized to prevent stale closures)
  const handleFinish = useCallback((completed: boolean) => {
    if (!isMountedRef.current) return;
    
    // Safety check: stop timer immediately
    if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
    }

    setGameState('RESULT');
    // In practice mode, finishing is always a "win" (session completed)
    playSound((isPracticeMode || (lives > 0 && score > 0)) ? 'win' : 'wrong');
    stopMusic();
    
    // Calculate final time used
    const timeUsed = Math.max(0, TOTAL_TIME - timeLeft);

    onEndGame({
      score: score,
      totalQuestions: level, 
      correctAnswers: level - 1,
      accuracy: level > 1 ? 100 : 0, 
      duration: timeUsed * 1000,
      difficulty: difficulty,
      gameMode: GameMode.MEMORY,
      mistakePatterns: mistakeTracker.current
    });
  }, [isPracticeMode, lives, score, level, difficulty, onEndGame, timeLeft]);

  // Timer Logic: Runs only during RECALL phase and when tutorial is closed
  useEffect(() => {
    if (!isPracticeMode && gameState === 'RECALL' && timeLeft > 0 && !showTutorial && !showQuitModal && introFinished) {
      timerIntervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          const newVal = Math.max(0, prev - 0.1);
          if (newVal <= 0) {
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            return 0;
          }
          return newVal;
        });
      }, 100);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [gameState, showTutorial, showQuitModal, timeLeft, introFinished, isPracticeMode]);

  // Trigger finish when time hits 0
  useEffect(() => {
     if (!isPracticeMode && timeLeft <= 0 && gameState === 'RECALL') {
         handleFinish(false);
     }
  }, [timeLeft, isPracticeMode, gameState, handleFinish]);

  // Init game logic after intro AND Tutorial
  useEffect(() => {
    if (introFinished && !showTutorial) {
        const size = getGridSize(difficulty);
        setGridSize(size);
        // Only start level if not already started to avoid resets on re-renders
        if (gameState === 'PREPARE' && level === 1 && targetCells.length === 0) {
            startLevel(1);
        }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [introFinished, showTutorial, difficulty]);

  const startLevel = (currentLevel: number) => {
    setGameState('PREPARE');
    setSelectedCells([]);
    setShowConfetti(false);
    
    const currentGridSize = getGridSize(difficulty);
    setGridSize(currentGridSize); 

    const maxCells = (currentGridSize * currentGridSize);
    const baseCells = difficulty === Difficulty.BEGINNER ? 2 : 3;
    const cellCount = Math.min(Math.floor(currentLevel / 2) + baseCells, maxCells - 1);
    
    const newTargetCells: number[] = [];
    while (newTargetCells.length < cellCount) {
      const cell = Math.floor(Math.random() * maxCells);
      if (!newTargetCells.includes(cell)) newTargetCells.push(cell);
    }
    
    setTargetCells(newTargetCells);

    safeSetTimeout(() => {
      setGameState('MEMORIZE');
      playSound('pop'); 
      
      const baseShowTime = Math.max(500, 1500 - (currentLevel * 100));
      let speedMultiplier = 1;
      
      switch(playbackSpeed) {
        case 'LAMBAT': speedMultiplier = 1.5; break;
        case 'SEDANG': speedMultiplier = 1.0; break;
        case 'CEPAT': speedMultiplier = 0.6; break;
      }
      
      const finalShowTime = baseShowTime * speedMultiplier;
      
      safeSetTimeout(() => {
        setGameState('RECALL');
      }, finalShowTime);
    }, 800);
  };

  const handleCellClick = (index: number) => {
    if (gameState !== 'RECALL' || selectedCells.includes(index) || showQuitModal) return;

    if (targetCells.includes(index)) {
      const newSelected = [...selectedCells, index];
      setSelectedCells(newSelected);
      playSound('pop'); 
      
      const correctHits = newSelected.filter(id => targetCells.includes(id)).length;
      
      if (correctHits === targetCells.length) {
        playSound('correct'); 
        setScore(s => s + (targetCells.length * 10 * (difficulty === Difficulty.ADVANCED ? 2 : 1)));
        setShowConfetti(true);
        
        // Go to next level immediately
        safeSetTimeout(() => {
           // Ensure we don't proceed if game ended or time ran out in the interim
           if ((isPracticeMode || timeLeft > 0) && isMountedRef.current) {
             const nextLevel = level + 1;
             setLevel(nextLevel);
             startLevel(nextLevel);
           }
        }, 800);
      }
    } else {
      playSound('wrong');
      const newSelected = [...selectedCells, index];
      setSelectedCells(newSelected);
      
      mistakeTracker.current.push("Salah Pilih Lokasi (Spatial Error)");

      if (!isPracticeMode) {
        setLives(l => {
          const newLives = l - 1;
          if (newLives <= 0) {
            handleFinish(false); 
          }
          return newLives;
        });
      }
    }
  };

  const handleBackRequest = () => {
    playSound('click');
    if (isPracticeMode) {
      handleFinish(true);
    } else {
      setShowQuitModal(true);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto relative flex flex-col items-center">
      {!introFinished && (
        <GameIntro 
          gameMode={GameMode.MEMORY} 
          onStart={() => {
            playSound('click');
            setIntroFinished(true);
            setShowTutorial(true);
          }} 
        />
      )}

      {showConfetti && <Confetti />}
      <TutorialOverlay 
        isOpen={showTutorial} 
        onClose={() => setShowTutorial(false)}
        title="Cara Bermain: Memori Pola"
        content={[
          "Anda punya waktu total 30 Detik (Kecuali Mode Latihan).",
          "Waktu HANYA berjalan saat fase Ulangi (Recall).",
          "Ingat posisi kotak yang menyala.",
          isPracticeMode ? "Mode Santai: Nyawa tidak terbatas." : "Hati-hati: Salah 3x = Game Over!"
        ]}
        icon={<Grid className="w-6 h-6" />}
      />

      <QuitModal 
        isOpen={showQuitModal}
        onConfirm={() => { setShowQuitModal(false); onBack(); }}
        onCancel={() => setShowQuitModal(false)}
      />

      <div className="flex flex-col md:flex-row justify-between items-center mb-4 w-full gap-2 md:gap-4">
        <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-start">
          <Button variant="ghost" onClick={handleBackRequest} className="!px-2 text-xs">&larr; {isPracticeMode ? "Selesai" : "Keluar"}</Button>
          
          <div className="flex items-center gap-2">
            <Tooltip text="ATURAN MAIN">
                <Button variant="ghost" onClick={() => setShowTutorial(true)} className="!px-2 text-neuro-400">
                    <HelpCircle className="w-4 h-4" />
                </Button>
            </Tooltip>
            
            <div className="flex items-center gap-1 bg-slate-800/50 p-1 pl-2 rounded-lg border border-white/10">
                <Gauge className="w-3 h-3 text-neuro-400" />
                <select 
                value={playbackSpeed}
                onChange={(e) => setPlaybackSpeed(e.target.value as SpeedOption)}
                className="bg-transparent text-[10px] font-bold text-slate-300 focus:outline-none cursor-pointer hover:text-white"
                disabled={gameState === 'MEMORIZE'}
                >
                <option value="LAMBAT" className="bg-slate-800">Lambat</option>
                <option value="SEDANG" className="bg-slate-800">Sedang</option>
                <option value="CEPAT" className="bg-slate-800">Cepat</option>
                </select>
            </div>
          </div>
        </div>

        <div className="flex gap-2 w-full md:w-auto justify-end">
           <Badge color="bg-pink-500">Lvl {level}</Badge>
           <Badge color="bg-neuro-500">{isPracticeMode ? '∞' : '❤️'.repeat(Math.max(0, lives))}</Badge>
        </div>
      </div>

      <Card className="flex flex-col items-center relative overflow-hidden w-full">
        <CountdownBar totalTime={TOTAL_TIME} timeLeft={timeLeft} isPracticeMode={isPracticeMode} />

        <div className="mb-4 text-center z-10 w-full">
          <h3 className={`text-xl md:text-2xl font-bold transition-colors ${gameState === 'MEMORIZE' ? 'text-neuro-400 animate-pulse' : 'text-white'}`}>
            {gameState === 'PREPARE' && "Siap..."}
            {gameState === 'MEMORIZE' && "Hafalkan!"}
            {gameState === 'RECALL' && "Ulangi!"}
            {gameState === 'RESULT' && "Selesai"}
          </h3>
          <p className="text-slate-400 text-xs">
            {gameState === 'RECALL' ? "Ketuk kotak." : gameState === 'MEMORIZE' ? "Waktu Jeda" : "..."}
          </p>
        </div>

        {/* Responsive Grid Container */}
        <div 
          className="grid gap-1.5 md:gap-2 bg-slate-800 p-2 rounded-xl border border-slate-700 shadow-2xl transition-all duration-300 relative z-10 w-full max-w-[min(90vw,350px)] aspect-square"
          style={{ 
            gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${gridSize}, minmax(0, 1fr))`
          }}
        >
          {Array.from({ length: gridSize * gridSize }).map((_, i) => {
            let cellClass = "w-full h-full rounded-md md:rounded-lg transition-all duration-200 border-2 ";
            
            if (gameState === 'MEMORIZE') {
              if (targetCells.includes(i)) cellClass += "bg-white border-white shadow-[0_0_15px_rgba(255,255,255,0.8)] scale-105 z-10";
              else cellClass += "bg-slate-700 border-slate-600 opacity-50";
            } else if (gameState === 'RECALL') {
              if (selectedCells.includes(i)) {
                if (targetCells.includes(i)) cellClass += "bg-emerald-500 border-emerald-400 shadow-lg scale-95 glow-success";
                else cellClass += "bg-red-500 border-red-400 shake";
              } else {
                 cellClass += "bg-slate-700 border-slate-600 hover:border-neuro-500 cursor-pointer active:scale-95";
              }
            } else {
               cellClass += "bg-slate-700 border-slate-600";
            }

            return (
              <div 
                key={i} 
                className={cellClass}
                onClick={() => handleCellClick(i)}
              />
            );
          })}
        </div>
      </Card>
    </div>
  );
};

export default MemoryGame;