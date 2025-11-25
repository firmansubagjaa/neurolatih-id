
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Difficulty, GameResult, GameMode } from '../../types';
import { startMusic, stopMusic, playSound } from '../../services/audioService';
import { Button, Card, Badge, Tooltip } from '../Shared';
import { TutorialOverlay } from '../TutorialOverlay';
import { QuitModal } from '../QuitModal';
import { Confetti } from '../Confetti';
import { GameIntro } from '../GameIntro';
import { Grid, HelpCircle, Gauge, BrainCircuit, ListOrdered, Camera, Zap } from 'lucide-react';

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
  const [viewState, setViewState] = useState<'SELECT' | 'GAME'>('SELECT');
  const [subMode, setSubMode] = useState<MemorySubMode>('SPATIAL');
  const [introFinished, setIntroFinished] = useState(false);
  const [gridSize, setGridSize] = useState(3);
  const [targetCells, setTargetCells] = useState<number[]>([]);
  const [displayIndex, setDisplayIndex] = useState<number>(-1);
  const [selectedCells, setSelectedCells] = useState<number[]>([]);
  const [gameState, setGameState] = useState<'PREPARE' | 'MEMORIZE' | 'RECALL' | 'RESULT'>('PREPARE');
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(3); 
  const [score, setScore] = useState(0);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showQuitModal, setShowQuitModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<SpeedOption>('SEDANG');

  // Timer Logic
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
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (sequenceIntervalRef.current) clearInterval(sequenceIntervalRef.current);
    };
  }, []);

  const handleFinish = useCallback((completed: boolean) => {
    if (!isMountedRef.current) return;
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setGameState('RESULT');
    playSound((isPracticeMode || (lives > 0 && score > 0)) ? 'win' : 'wrong');
    stopMusic();
    
    onEndGame({
      score, totalQuestions: level, correctAnswers: level - 1, accuracy: level > 1 ? 100 : 0, 
      duration: (TOTAL_TIME - timeLeft) * 1000, difficulty, gameMode: GameMode.MEMORY, mistakePatterns: mistakeTracker.current
    });
  }, [isPracticeMode, lives, score, level, difficulty, onEndGame, timeLeft, TOTAL_TIME]);

  useEffect(() => {
    if (viewState === 'GAME' && !isPracticeMode && gameState === 'RECALL' && timeLeft > 0 && !showTutorial && !showQuitModal && introFinished) {
      timerIntervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          const decrement = isQuickMode ? 0.2 : 0.1;
          const newVal = Math.max(0, prev - decrement);
          if (newVal <= 0) { clearInterval(timerIntervalRef.current!); return 0; }
          return newVal;
        });
      }, 100);
    } else { if (timerIntervalRef.current) clearInterval(timerIntervalRef.current); }
    return () => { if (timerIntervalRef.current) clearInterval(timerIntervalRef.current); };
  }, [viewState, gameState, showTutorial, showQuitModal, timeLeft, introFinished, isPracticeMode, isQuickMode]);

  useEffect(() => {
     if (!isPracticeMode && timeLeft <= 0 && gameState === 'RECALL' && viewState === 'GAME') handleFinish(false);
  }, [timeLeft, isPracticeMode, gameState, viewState, handleFinish]);

  useEffect(() => {
    if (viewState === 'GAME' && introFinished && !showTutorial) {
        setGridSize(getGridSize(difficulty));
        if (gameState === 'PREPARE' && level === 1 && targetCells.length === 0) startLevel(1);
    }
  }, [viewState, introFinished, showTutorial, difficulty]);

  const startGame = (mode: MemorySubMode) => {
      setSubMode(mode); setViewState('GAME'); setIntroFinished(false); startMusic('MEMORY'); setTimeLeft(TOTAL_TIME);
  };

  const startLevel = (currentLevel: number) => {
    setGameState('PREPARE'); setSelectedCells([]); setShowConfetti(false); setDisplayIndex(-1);
    const currentGridSize = getGridSize(difficulty); setGridSize(currentGridSize); 
    const maxCells = (currentGridSize * currentGridSize);
    const baseCells = difficulty === Difficulty.BEGINNER ? 3 : difficulty === Difficulty.INTERMEDIATE ? 4 : 5;
    const cellCount = Math.min(baseCells + Math.floor(currentLevel / 2), maxCells - 1);
    
    const newTargetCells: number[] = [];
    while (newTargetCells.length < cellCount) {
        const cell = Math.floor(Math.random() * maxCells);
        if (!newTargetCells.includes(cell)) newTargetCells.push(cell);
    }
    setTargetCells(newTargetCells);

    safeSetTimeout(() => {
      setGameState('MEMORIZE');
      if (subMode === 'SERIAL') {
          let step = 0;
          let speedMs = playbackSpeed === 'CEPAT' ? 600 : playbackSpeed === 'LAMBAT' ? 1400 : 1000;
          if (isQuickMode) speedMs -= 200;
          sequenceIntervalRef.current = setInterval(() => {
              if (step < newTargetCells.length) { playSound('pop'); setDisplayIndex(step); step++; } 
              else { clearInterval(sequenceIntervalRef.current!); setDisplayIndex(-1); setGameState('RECALL'); }
          }, speedMs);
      } else {
          playSound('pop'); 
          let showTime = 2000;
          if (subMode === 'FLASH') showTime = difficulty === Difficulty.BEGINNER ? 800 : difficulty === Difficulty.INTERMEDIATE ? 500 : 250;
          else showTime = Math.max(500, (difficulty === Difficulty.BEGINNER ? 2500 : 1500) - (currentLevel * 50));
          safeSetTimeout(() => setGameState('RECALL'), showTime);
      }
    }, 800);
  };

  const handleCellClick = (index: number) => {
    if (gameState !== 'RECALL' || showQuitModal) return;
    if (subMode !== 'SERIAL' && selectedCells.includes(index)) return;

    let isCorrect = false, isMistake = false;
    if (subMode === 'SERIAL') {
        if (targetCells[selectedCells.length] === index) isCorrect = true; else isMistake = true;
    } else {
        if (targetCells.includes(index)) isCorrect = true; else isMistake = true;
    }

    if (isCorrect) {
        playSound('pop'); const newSelected = [...selectedCells, index]; setSelectedCells(newSelected);
        if (newSelected.length === targetCells.length) {
            playSound('correct'); setScore(s => s + (targetCells.length * 10)); setShowConfetti(true);
            safeSetTimeout(() => { if (isMountedRef.current) startLevel(level + 1); setLevel(l=>l+1); }, 800);
        }
    } else if (isMistake) {
        playSound('wrong'); setSelectedCells([...selectedCells, index]);
        mistakeTracker.current.push(subMode === 'SERIAL' ? "Serial Order Error" : "Spatial Location Error");
        if (!isPracticeMode) setLives(l => { if (l - 1 <= 0) handleFinish(false); return l - 1; });
    }
  };

  if (viewState === 'SELECT') {
      return (
        <div className="w-full max-w-2xl mx-auto space-y-4 animate-fade-in h-[calc(100vh-100px)] flex flex-col justify-center">
             <div className="flex justify-between items-center mb-4">
                 <Button variant="ghost" onClick={onBack}>&larr; MEMORY MODULES</Button>
                 <Badge color="bg-retro-pink">PATTERN RECALL</Badge>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 {[{ id: 'SPATIAL', name: "SPATIAL", icon: <Grid />, desc: "Simultaneous pattern" }, { id: 'SERIAL', name: "SERIAL", icon: <ListOrdered />, desc: "Sequential order" }, { id: 'FLASH', name: "FLASH", icon: <Camera />, desc: "Quick exposure" }].map((m) => (
                     <Card key={m.id} onClick={() => startGame(m.id as MemorySubMode)} className="cursor-pointer hover:border-retro-pink hover:-translate-y-1 transition-all group p-6 border-4">
                         <div className="flex flex-col items-center gap-3 text-center">
                             <div className="p-3 bg-slate-800 rounded-full text-retro-pink group-hover:scale-110 transition-transform">{m.icon}</div>
                             <div>
                                <h3 className="font-pixel text-lg text-white mb-1">{m.name}</h3>
                                <p className="text-xs text-slate-400 font-mono uppercase">{m.desc}</p>
                             </div>
                         </div>
                     </Card>
                 ))}
             </div>
        </div>
      );
  }

  return (
    <div className="w-full h-[calc(100vh-80px)] flex flex-col max-w-4xl mx-auto px-2 md:px-0 relative">
      {!introFinished && <GameIntro gameMode={GameMode.MEMORY} onStart={() => { playSound('click'); setIntroFinished(true); setShowTutorial(true); }} />}
      {showConfetti && <Confetti />}
      <TutorialOverlay isOpen={showTutorial} onClose={() => setShowTutorial(false)} title={`Cara Bermain: ${subMode}`} content={["Hafalkan pola.", "Ulangi pola.", "Jangan sampai salah."]} icon={<BrainCircuit className="w-6 h-6" />} />
      <QuitModal isOpen={showQuitModal} onConfirm={() => { setShowQuitModal(false); onBack(); }} onCancel={() => setShowQuitModal(false)} />

      {/* HEADER BAR */}
      <div className="flex justify-between items-center mb-2 p-3 bg-slate-900/90 border-b-2 border-slate-700 rounded-t-xl backdrop-blur-sm shadow-md z-20 shrink-0">
        <div className="flex gap-3 items-center">
          <Button variant="ghost" onClick={() => isPracticeMode ? handleFinish(true) : setShowQuitModal(true)} className="!px-2 text-xs !py-1 text-slate-400 hover:text-white">&larr; EXIT</Button>
          <div className="h-4 w-px bg-slate-700"></div>
          {subMode !== 'FLASH' && !isQuickMode && (
             <div className="hidden md:flex items-center gap-1">
                <Gauge className="w-3 h-3 text-slate-500" />
                <select value={playbackSpeed} onChange={(e) => setPlaybackSpeed(e.target.value as SpeedOption)} className="bg-transparent text-[10px] font-bold text-slate-400 focus:outline-none font-pixel uppercase cursor-pointer hover:text-white">
                  <option value="LAMBAT" className="bg-black">SLOW</option>
                  <option value="SEDANG" className="bg-black">NORM</option>
                  <option value="CEPAT" className="bg-black">FAST</option>
                </select>
             </div>
          )}
        </div>
        
        <div className="flex gap-4 items-center">
           <Badge color="bg-pink-500 text-black border-pink-700">LVL {level}</Badge>
           <div className="flex gap-1 items-center bg-black/40 px-2 py-1 rounded-full border border-slate-700">
             {Array.from({length: 3}).map((_, i) => (
                <div key={i} className={`w-3 h-3 rounded-full transition-all duration-300 ${i < lives ? 'bg-retro-red shadow-[0_0_8px_rgba(248,113,113,0.8)]' : 'bg-slate-800'}`}></div>
             ))}
           </div>
        </div>
      </div>

      {/* MAIN GAME AREA (Neural Grid) */}
      <div className="flex-1 relative bg-black border-x-2 border-b-2 border-slate-800 rounded-b-xl overflow-hidden flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)] z-10">
        
        {/* Background Grid Texture */}
        <div className="absolute inset-0 opacity-20 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
        </div>

        {/* Progress Line */}
        <div className="w-full h-1 bg-slate-900 relative">
            <div className="h-full bg-gradient-to-r from-retro-pink to-purple-500 transition-all duration-300 shadow-[0_0_10px_rgba(236,72,153,0.5)]" style={{ width: `${(timeLeft / TOTAL_TIME) * 100}%` }}></div>
        </div>

        {/* Status Text */}
        <div className="text-center py-4 shrink-0 z-10 relative">
          <h3 className={`text-2xl md:text-3xl font-pixel tracking-widest transition-all duration-300 ${
              gameState === 'MEMORIZE' ? 'text-white animate-pulse drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]' : 
              gameState === 'RECALL' ? 'text-retro-pink drop-shadow-[0_0_8px_rgba(244,114,182,0.8)]' : 'text-slate-500'
          }`}>
            {gameState === 'PREPARE' && "INITIALIZING..."}
            {gameState === 'MEMORIZE' && (subMode === 'SERIAL' ? "OBSERVE SEQUENCE" : "MEMORIZE PATTERN")}
            {gameState === 'RECALL' && "RECALL PATTERN"}
            {gameState === 'RESULT' && "COMPLETE"}
          </h3>
        </div>

        {/* Responsive Grid Container */}
        <div className="flex-1 flex items-center justify-center p-4 min-h-0 z-10 relative">
            <div 
                className="grid gap-2 md:gap-3 transition-all duration-300 ease-out"
                style={{ 
                    // This logic maximizes the grid size based on available space while maintaining aspect ratio
                    width: 'min(100%, 65vh)', 
                    height: 'min(100%, 65vh)',
                    aspectRatio: '1 / 1',
                    gridTemplateColumns: `repeat(${gridSize}, 1fr)`, 
                    gridTemplateRows: `repeat(${gridSize}, 1fr)` 
                }}
            >
            {Array.from({ length: gridSize * gridSize }).map((_, i) => {
                let cellStyle = "relative w-full h-full rounded-lg border transition-all duration-150 flex items-center justify-center font-pixel text-xl md:text-3xl ";
                let content = null;
                const isTarget = subMode === 'SERIAL' ? targetCells[displayIndex] === i : targetCells.includes(i);
                
                if (gameState === 'MEMORIZE') {
                    if (isTarget) {
                        cellStyle += "bg-white border-white shadow-[0_0_20px_rgba(255,255,255,0.9)] scale-95 md:scale-100 z-20"; 
                        if (subMode === 'SERIAL') content = <span className="text-black font-bold">{targetCells.indexOf(i) + 1}</span>;
                    } else {
                        cellStyle += "bg-slate-900/50 border-slate-700 opacity-50"; 
                    }
                } else if (gameState === 'RECALL') {
                    if (selectedCells.includes(i)) {
                        const isCorrect = targetCells.includes(i); 
                        if (isCorrect) {
                             cellStyle += "bg-retro-green border-emerald-400 shadow-[0_0_25px_rgba(74,222,128,0.6)] z-20 scale-105 text-black";
                             if (subMode === 'SERIAL') content = <span className="font-bold">{selectedCells.indexOf(i) + 1}</span>;
                             else content = <div className="w-1/2 h-1/2 bg-black/20 rounded-full animate-ping"></div>;
                        } else {
                             cellStyle += "bg-retro-red border-red-400 shadow-[0_0_25px_rgba(248,113,113,0.6)] animate-shake z-20 text-white";
                             content = "X";
                        }
                    } else {
                        // Interactive cell styling
                        cellStyle += "bg-slate-900/80 border-slate-600 hover:border-retro-pink hover:bg-slate-800 cursor-pointer active:scale-95 hover:shadow-[0_0_15px_rgba(244,114,182,0.3)]";
                    }
                } else {
                    cellStyle += "bg-slate-900 border-slate-800";
                }

                return (
                    <button 
                        key={i} 
                        className={cellStyle} 
                        onClick={() => handleCellClick(i)}
                        disabled={gameState !== 'RECALL'}
                    >
                        {content}
                    </button>
                );
            })}
            </div>
        </div>
      </div>
    </div>
  );
};

export default MemoryGame;
