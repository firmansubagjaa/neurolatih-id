
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Difficulty, GameResult, GameMode } from '../../types';
import { startMusic, stopMusic, playSound } from '../../services/audioService';
import { Button, Card, Badge, Tooltip } from '../Shared';
import { TutorialOverlay } from '../TutorialOverlay';
import { QuitModal } from '../QuitModal';
import { Confetti } from '../Confetti';
import { CountdownBar } from '../CountdownBar';
import { GameIntro } from '../GameIntro';
import { Grid, HelpCircle, Gauge, Zap, BrainCircuit, ListOrdered, Camera } from 'lucide-react';

interface MemoryGameProps {
  difficulty: Difficulty;
  onEndGame: (result: GameResult) => void;
  onBack: () => void;
  isQuickMode?: boolean;
  isPracticeMode?: boolean;
}

type SpeedOption = 'LAMBAT' | 'SEDANG' | 'CEPAT';
type MemorySubMode = 'SPATIAL' | 'SERIAL' | 'FLASH';

const MemoryGame: React.FC<MemoryGameProps> = ({ difficulty, onEndGame, onBack, isQuickMode = false, isPracticeMode = false }) => {
  // View State
  const [viewState, setViewState] = useState<'SELECT' | 'GAME'>('SELECT');
  const [subMode, setSubMode] = useState<MemorySubMode>('SPATIAL');

  const [introFinished, setIntroFinished] = useState(false);
  const [gridSize, setGridSize] = useState(3);
  const [targetCells, setTargetCells] = useState<number[]>([]);
  const [displayIndex, setDisplayIndex] = useState<number>(-1); // For Serial Mode visualization
  const [selectedCells, setSelectedCells] = useState<number[]>([]);
  const [gameState, setGameState] = useState<'PREPARE' | 'MEMORIZE' | 'RECALL' | 'RESULT'>('PREPARE');
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(3); 
  const [score, setScore] = useState(0);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showQuitModal, setShowQuitModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<SpeedOption>('SEDANG');

  // Difficulty Scaling: Total Time
  const getTimeLimit = () => {
      switch (difficulty) {
          case Difficulty.BEGINNER: return 45;
          case Difficulty.INTERMEDIATE: return 35;
          case Difficulty.ADVANCED: return 25;
          default: return 45;
      }
  };
  const TOTAL_TIME = getTimeLimit();
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const mistakeTracker = useRef<string[]>([]);
  const isMountedRef = useRef(true);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const sequenceIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  useEffect(() => {
    isMountedRef.current = true;
    startMusic('MENU');
    return () => {
      isMountedRef.current = false;
      stopMusic();
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (sequenceIntervalRef.current) clearInterval(sequenceIntervalRef.current);
    };
  }, []);

  const handleFinish = useCallback((completed: boolean) => {
    if (!isMountedRef.current) return;
    if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
    }
    setGameState('RESULT');
    playSound((isPracticeMode || (lives > 0 && score > 0)) ? 'win' : 'wrong');
    stopMusic();
    
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
  }, [isPracticeMode, lives, score, level, difficulty, onEndGame, timeLeft, TOTAL_TIME]);

  // Timer Logic
  useEffect(() => {
    if (viewState === 'GAME' && !isPracticeMode && gameState === 'RECALL' && timeLeft > 0 && !showTutorial && !showQuitModal && introFinished) {
      timerIntervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          const decrement = isQuickMode ? 0.2 : 0.1;
          const newVal = Math.max(0, prev - decrement);
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
  }, [viewState, gameState, showTutorial, showQuitModal, timeLeft, introFinished, isPracticeMode, isQuickMode]);

  useEffect(() => {
     if (!isPracticeMode && timeLeft <= 0 && gameState === 'RECALL' && viewState === 'GAME') {
         handleFinish(false);
     }
  }, [timeLeft, isPracticeMode, gameState, viewState, handleFinish]);

  // Initial Level Start Trigger
  useEffect(() => {
    if (viewState === 'GAME' && introFinished && !showTutorial) {
        const size = getGridSize(difficulty);
        setGridSize(size);
        if (gameState === 'PREPARE' && level === 1 && targetCells.length === 0) {
            startLevel(1);
        }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewState, introFinished, showTutorial, difficulty]);

  const startGame = (mode: MemorySubMode) => {
      setSubMode(mode);
      setViewState('GAME');
      setIntroFinished(false); // Reset to show intro again if needed, or skip
      startMusic('MEMORY');
      setTimeLeft(TOTAL_TIME);
  };

  const startLevel = (currentLevel: number) => {
    setGameState('PREPARE');
    setSelectedCells([]);
    setShowConfetti(false);
    setDisplayIndex(-1);
    
    const currentGridSize = getGridSize(difficulty);
    setGridSize(currentGridSize); 

    const maxCells = (currentGridSize * currentGridSize);
    // Adjust cell count base on difficulty
    const baseCells = difficulty === Difficulty.BEGINNER ? 3 : difficulty === Difficulty.INTERMEDIATE ? 4 : 5;
    const increment = Math.floor(currentLevel / 2);
    const cellCount = Math.min(baseCells + increment, maxCells - 1);
    
    const newTargetCells: number[] = [];
    
    if (subMode === 'SERIAL') {
        // Unique positions but order matters.
        while (newTargetCells.length < cellCount) {
            const cell = Math.floor(Math.random() * maxCells);
            if (!newTargetCells.includes(cell)) newTargetCells.push(cell);
        }
    } else {
        while (newTargetCells.length < cellCount) {
            const cell = Math.floor(Math.random() * maxCells);
            if (!newTargetCells.includes(cell)) newTargetCells.push(cell);
        }
    }
    
    setTargetCells(newTargetCells);

    // Start Sequence
    safeSetTimeout(() => {
      setGameState('MEMORIZE');
      
      // LOGIC FOR DIFFERENT MODES
      if (subMode === 'SERIAL') {
          let step = 0;
          // Speed settings
          let speedMs = 1000;
          if (playbackSpeed === 'CEPAT') speedMs = 600;
          if (playbackSpeed === 'LAMBAT') speedMs = 1400;
          if (isQuickMode) speedMs -= 200;

          sequenceIntervalRef.current = setInterval(() => {
              if (step < newTargetCells.length) {
                  playSound('pop');
                  setDisplayIndex(step);
                  step++;
              } else {
                  if (sequenceIntervalRef.current) clearInterval(sequenceIntervalRef.current);
                  setDisplayIndex(-1);
                  setGameState('RECALL');
              }
          }, speedMs);

      } else {
          // SPATIAL & FLASH
          playSound('pop'); 
          
          let showTime = 2000; 
          
          // Refined Difficulty Scaling for Show Time
          if (subMode === 'FLASH') {
              if (difficulty === Difficulty.BEGINNER) showTime = 800;
              else if (difficulty === Difficulty.INTERMEDIATE) showTime = 500;
              else showTime = 250;
              
              if (isQuickMode) showTime *= 0.8;
          } else {
              // Spatial
              const baseTime = difficulty === Difficulty.BEGINNER ? 2500 : difficulty === Difficulty.INTERMEDIATE ? 2000 : 1500;
              showTime = Math.max(500, baseTime - (currentLevel * (difficulty === Difficulty.BEGINNER ? 50 : 100)));
              
              if (playbackSpeed === 'CEPAT') showTime *= 0.6;
              if (playbackSpeed === 'LAMBAT') showTime *= 1.5;
              if (isQuickMode) showTime *= 0.7;
          }

          safeSetTimeout(() => {
            setGameState('RECALL');
          }, showTime);
      }

    }, 800);
  };

  const handleCellClick = (index: number) => {
    if (gameState !== 'RECALL' || showQuitModal) return;

    // Prevent double clicking same cell in SPATIAL/FLASH mode (set logic)
    if (subMode !== 'SERIAL' && selectedCells.includes(index)) return;

    // LOGIC BY MODE
    let isCorrectStep = false;
    let isMistake = false;

    if (subMode === 'SERIAL') {
        // Order matters!
        const currentStep = selectedCells.length;
        if (targetCells[currentStep] === index) {
            isCorrectStep = true;
        } else {
            isMistake = true;
        }
    } else {
        // Order doesn't matter, just membership
        if (targetCells.includes(index)) {
            isCorrectStep = true;
        } else {
            isMistake = true;
        }
    }

    if (isCorrectStep) {
        playSound('pop');
        const newSelected = [...selectedCells, index];
        setSelectedCells(newSelected);
        
        // Check Completion
        if (newSelected.length === targetCells.length) {
            playSound('correct'); 
            setScore(s => s + (targetCells.length * 10 * (difficulty === Difficulty.ADVANCED ? 2 : 1)));
            setShowConfetti(true);
            safeSetTimeout(() => {
               if ((isPracticeMode || timeLeft > 0) && isMountedRef.current) {
                 const nextLevel = level + 1;
                 setLevel(nextLevel);
                 startLevel(nextLevel);
               }
            }, 800);
        }
    } else if (isMistake) {
        playSound('wrong');
        const newSelected = [...selectedCells, index];
        setSelectedCells(newSelected); // Show the wrong selection
        
        if (subMode === 'SERIAL') mistakeTracker.current.push("Serial Order Error");
        else mistakeTracker.current.push("Spatial Location Error");

        if (!isPracticeMode) {
            setLives(l => {
              const newLives = l - 1;
              if (newLives <= 0) handleFinish(false);
              return newLives;
            });
        }
    }
  };

  const handleBackRequest = () => {
    playSound('click');
    if (isPracticeMode) handleFinish(true);
    else setShowQuitModal(true);
  };

  const getTutorialContent = () => {
      if (subMode === 'SERIAL') return [
          "Mode: BERURUTAN (Serial).",
          "Kotak akan menyala SATU per SATU.",
          "Ingat URUTANNYA.",
          "Ulangi pola dari PERTAMA sampai TERAKHIR."
      ];
      if (subMode === 'FLASH') return [
          "Mode: KILAT (Iconic).",
          "Pola muncul sangat cepat (< 0.5 detik).",
          "Andalkan 'after-image' di mata Anda.",
          "Jangan berkedip!"
      ];
      return [
          "Mode: KLASIK (Spatial).",
          "Ingat posisi kotak yang menyala.",
          "Urutan klik TIDAK masalah.",
          "Waktu HANYA berjalan saat fase Ulangi (Recall)."
      ];
  };

  // --- RENDER SELECTION SCREEN ---
  if (viewState === 'SELECT') {
      return (
        <div className="w-full max-w-2xl mx-auto space-y-4 animate-fade-in">
             <div className="flex justify-between items-center mb-4">
                 <Button variant="ghost" onClick={onBack}>&larr; MEMORY MODULES</Button>
                 <Badge color="bg-retro-pink">PATTERN RECALL</Badge>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 {[
                     { id: 'SPATIAL', name: "SPATIAL", sub: "Klasik", icon: <Grid />, desc: "Ingat posisi pola sekaligus." },
                     { id: 'SERIAL', name: "SERIAL", sub: "Berurutan", icon: <ListOrdered />, desc: "Ingat urutan kemunculan." },
                     { id: 'FLASH', name: "FLASH", sub: "Kilat", icon: <Camera />, desc: "Pola muncul sekejap mata." },
                 ].map((m) => (
                     <Card 
                        key={m.id} 
                        onClick={() => startGame(m.id as MemorySubMode)} 
                        className="cursor-pointer hover:border-retro-pink hover:-translate-y-1 transition-all group"
                     >
                         <div className="flex items-center gap-3 mb-2">
                             <div className="text-retro-pink group-hover:scale-110 transition-transform">{m.icon}</div>
                             <div>
                                <h3 className="font-pixel text-sm">{m.name}</h3>
                                <span className="text-[10px] bg-slate-800 px-1 rounded text-slate-300">{m.sub}</span>
                             </div>
                         </div>
                         <p className="text-xs text-slate-400 font-mono leading-tight">{m.desc}</p>
                     </Card>
                 ))}
             </div>
        </div>
      );
  }

  // --- RENDER GAME SCREEN ---
  return (
    <div className="w-full max-w-xl mx-auto relative flex flex-col items-center">
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
        title={`Cara Bermain: ${subMode}`}
        content={getTutorialContent()}
        icon={<BrainCircuit className="w-6 h-6" />}
      />

      <QuitModal 
        isOpen={showQuitModal} 
        onConfirm={() => { setShowQuitModal(false); onBack(); }}
        onCancel={() => setShowQuitModal(false)}
      />

      <div className="flex justify-between items-center mb-4 w-full gap-2">
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={handleBackRequest} className="!px-2 text-xs md:text-sm">&larr; Pilih Mode</Button>
          <Button variant="ghost" onClick={() => setShowTutorial(true)} className="!px-2 text-neuro-400">
             <HelpCircle className="w-4 h-4" />
          </Button>
          
          {subMode !== 'FLASH' && !isQuickMode && (
             <div className="hidden md:flex items-center gap-1 bg-slate-900/50 p-1 px-2 border border-white/10">
                <Gauge className="w-3 h-3 text-neuro-400" />
                <select 
                  value={playbackSpeed}
                  onChange={(e) => setPlaybackSpeed(e.target.value as SpeedOption)}
                  className="bg-transparent text-xs font-bold text-slate-300 focus:outline-none cursor-pointer hover:text-white"
                  disabled={gameState === 'MEMORIZE'}
                >
                  <option value="LAMBAT" className="bg-slate-800">Lambat</option>
                  <option value="SEDANG" className="bg-slate-800">Sedang</option>
                  <option value="CEPAT" className="bg-slate-800">Cepat</option>
                </select>
             </div>
          )}
        </div>

        <div className="flex gap-1 md:gap-2">
           {isQuickMode && <Badge color="bg-yellow-500 animate-pulse text-black"><Zap className="w-3 h-3 mr-1 inline" /> SPEED</Badge>}
           <Badge color="bg-pink-500">Lvl {level}</Badge>
           <Badge color="bg-neuro-500">{isPracticeMode ? '∞' : '❤️'.repeat(Math.max(0, lives))}</Badge>
        </div>
      </div>

      <Card className="flex flex-col items-center relative overflow-hidden w-full p-4 md:p-6 bg-black border-2 md:border-4 border-slate-700">
        <CountdownBar totalTime={TOTAL_TIME} timeLeft={timeLeft} isPracticeMode={isPracticeMode} />

        <div className="mb-4 text-center z-10 w-full flex flex-col items-center">
          <div className="flex items-center gap-2 mb-1 text-slate-400 font-pixel text-xs uppercase tracking-widest">
             <BrainCircuit className="w-3 h-3" /> MODE: {subMode}
          </div>
          <h3 className={`text-2xl md:text-3xl font-pixel transition-colors text-shadow-retro ${gameState === 'MEMORIZE' ? 'text-retro-green animate-pulse' : 'text-white'}`}>
            {gameState === 'PREPARE' && "READY..."}
            {gameState === 'MEMORIZE' && (subMode === 'SERIAL' ? "WATCH SEQUENCE" : "MEMORIZE")}
            {gameState === 'RECALL' && (subMode === 'SERIAL' ? "REPEAT ORDER" : "REPEAT PATTERN")}
            {gameState === 'RESULT' && "DONE"}
          </h3>
        </div>

        {/* Improved Retro Grid */}
        <div 
          className="grid gap-2 bg-slate-900 p-2 md:p-3 border-2 border-slate-600 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] transition-all duration-300 relative z-10 w-full max-w-[320px] aspect-square"
          style={{ 
            gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${gridSize}, minmax(0, 1fr))`
          }}
        >
          {Array.from({ length: gridSize * gridSize }).map((_, i) => {
            let cellClass = "w-full h-full transition-all duration-100 border-2 ";
            let content = null;
            
            if (gameState === 'MEMORIZE') {
              if (subMode === 'SERIAL') {
                  // Only show the specific index in the sequence
                  const isCurrent = targetCells[displayIndex] === i;
                  if (isCurrent) {
                      cellClass += "bg-white border-white shadow-[0_0_15px_rgba(255,255,255,0.9)] z-10 scale-95";
                  } else {
                      cellClass += "bg-slate-800 border-slate-700 opacity-40";
                  }
              } else {
                  // Spatial/Flash: Show all targets
                  if (targetCells.includes(i)) cellClass += "bg-white border-white shadow-[0_0_15px_rgba(255,255,255,0.9)] z-10 scale-95";
                  else cellClass += "bg-slate-800 border-slate-700 opacity-40";
              }

            } else if (gameState === 'RECALL') {
              // Logic for showing user selection
              if (selectedCells.includes(i)) {
                  let isCorrect = false;
                  // In Serial Mode, we check correctness implicitly by click order.
                  // For display, if it's a target cell, we show green/number.
                  if (targetCells.includes(i)) isCorrect = true;

                  if (isCorrect) {
                      cellClass += "bg-emerald-500 border-emerald-300 shadow-[inset_0_0_10px_rgba(0,0,0,0.3)]";
                      if (subMode === 'SERIAL') {
                          content = <span className="font-pixel text-black font-bold text-lg">{selectedCells.indexOf(i) + 1}</span>;
                      }
                  } else {
                      cellClass += "bg-red-500 border-red-300 animate-shake";
                  }
              } else {
                 cellClass += "bg-slate-800 border-slate-700 hover:border-neuro-400 hover:bg-slate-700 cursor-pointer active:bg-slate-600 active:border-slate-500";
              }
            } else {
               cellClass += "bg-slate-800 border-slate-700";
            }

            return (
              <div 
                key={i} 
                className={`flex items-center justify-center ${cellClass}`}
                onClick={() => handleCellClick(i)}
              >
                  {content}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

export default MemoryGame;
