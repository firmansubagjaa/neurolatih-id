
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
                 {[{ id: 'SPATIAL', name: "SPATIAL", icon: <Grid /> }, { id: 'SERIAL', name: "SERIAL", icon: <ListOrdered /> }, { id: 'FLASH', name: "FLASH", icon: <Camera /> }].map((m) => (
                     <Card key={m.id} onClick={() => startGame(m.id as MemorySubMode)} className="cursor-pointer hover:border-retro-pink hover:-translate-y-1 transition-all group">
                         <div className="flex items-center gap-3 mb-2">
                             <div className="text-retro-pink">{m.icon}</div>
                             <h3 className="font-pixel text-sm">{m.name}</h3>
                         </div>
                     </Card>
                 ))}
             </div>
        </div>
      );
  }

  return (
    <div className="w-full max-w-xl mx-auto relative h-[calc(100vh-100px)] flex flex-col">
      {!introFinished && <GameIntro gameMode={GameMode.MEMORY} onStart={() => { playSound('click'); setIntroFinished(true); setShowTutorial(true); }} />}
      {showConfetti && <Confetti />}
      <TutorialOverlay isOpen={showTutorial} onClose={() => setShowTutorial(false)} title={`Cara Bermain: ${subMode}`} content={["Hafalkan pola.", "Ulangi pola.", "Jangan sampai salah."]} icon={<BrainCircuit className="w-6 h-6" />} />
      <QuitModal isOpen={showQuitModal} onConfirm={() => { setShowQuitModal(false); onBack(); }} onCancel={() => setShowQuitModal(false)} />

      <div className="flex justify-between items-center mb-2 shrink-0">
        <div className="flex gap-1 items-center">
          <Button variant="ghost" onClick={() => isPracticeMode ? handleFinish(true) : setShowQuitModal(true)} className="!px-2 text-xs">&larr; Mode</Button>
          <Button variant="ghost" onClick={() => setShowTutorial(true)} className="!px-2 text-neuro-400"><HelpCircle className="w-4 h-4" /></Button>
          {subMode !== 'FLASH' && !isQuickMode && (
             <div className="hidden md:flex items-center gap-1 bg-slate-900/50 p-1 px-2 border border-white/10">
                <Gauge className="w-3 h-3 text-neuro-400" />
                <select value={playbackSpeed} onChange={(e) => setPlaybackSpeed(e.target.value as SpeedOption)} className="bg-transparent text-xs font-bold text-slate-300 focus:outline-none">
                  <option value="LAMBAT" className="bg-slate-800">Lambat</option>
                  <option value="SEDANG" className="bg-slate-800">Sedang</option>
                  <option value="CEPAT" className="bg-slate-800">Cepat</option>
                </select>
             </div>
          )}
        </div>
        <div className="flex gap-1">
           <Badge color="bg-pink-500">Lvl {level}</Badge>
           <Badge color="bg-neuro-500">{isPracticeMode ? '∞' : '❤️'.repeat(Math.max(0, lives))}</Badge>
        </div>
      </div>

      <Card className="flex-1 flex flex-col items-center relative overflow-hidden w-full p-4 bg-black border-2 border-slate-700 min-h-0">
        <div className="w-full shrink-0"><CountdownBar totalTime={TOTAL_TIME} timeLeft={timeLeft} isPracticeMode={isPracticeMode} /></div>

        <div className="mb-2 text-center shrink-0">
          <h3 className={`text-xl md:text-3xl font-pixel transition-colors text-shadow-retro ${gameState === 'MEMORIZE' ? 'text-retro-green animate-pulse' : 'text-white'}`}>
            {gameState === 'PREPARE' && "READY..."}
            {gameState === 'MEMORIZE' && "MEMORIZE"}
            {gameState === 'RECALL' && "REPEAT"}
          </h3>
        </div>

        {/* Responsive Grid Container */}
        <div className="flex-1 w-full flex items-center justify-center min-h-0 overflow-hidden">
            <div 
            className="grid gap-1 md:gap-2 bg-slate-900 p-2 border-2 border-slate-600 aspect-square h-full max-h-full"
            style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)`, gridTemplateRows: `repeat(${gridSize}, 1fr)` }}
            >
            {Array.from({ length: gridSize * gridSize }).map((_, i) => {
                let cellClass = "w-full h-full transition-all duration-100 border border-slate-600/50 ";
                let content = null;
                
                if (gameState === 'MEMORIZE') {
                    const isTarget = subMode === 'SERIAL' ? targetCells[displayIndex] === i : targetCells.includes(i);
                    if (isTarget) cellClass += "bg-white border-white shadow-[0_0_10px_white] z-10 scale-95";
                    else cellClass += "bg-slate-800 opacity-40";
                } else if (gameState === 'RECALL') {
                    if (selectedCells.includes(i)) {
                        const isCorrect = targetCells.includes(i); 
                        cellClass += isCorrect ? "bg-emerald-500 border-emerald-300" : "bg-red-500 border-red-300 animate-shake";
                        if (subMode === 'SERIAL' && isCorrect) content = <span className="font-pixel text-black font-bold text-lg">{selectedCells.indexOf(i) + 1}</span>;
                    } else {
                        cellClass += "bg-slate-800 hover:bg-slate-700 active:bg-slate-600 cursor-pointer";
                    }
                } else cellClass += "bg-slate-800";

                return <div key={i} className={`flex items-center justify-center ${cellClass}`} onClick={() => handleCellClick(i)}>{content}</div>;
            })}
            </div>
        </div>
      </Card>
    </div>
  );
};

export default MemoryGame;
