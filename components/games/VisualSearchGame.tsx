
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Difficulty, GameResult, GameMode } from '../../types';
import { startMusic, stopMusic, playSound } from '../../services/audioService';
import { Button, Card, Badge, Tooltip } from '../Shared';
import { TutorialOverlay } from '../TutorialOverlay';
import { QuitModal } from '../QuitModal';
import { Confetti } from '../Confetti';
import { CountdownBar } from '../CountdownBar';
import { GameIntro } from '../GameIntro';
import { Scan, HelpCircle, Square, Circle, Triangle, Hexagon } from 'lucide-react';

interface VisualSearchGameProps {
  difficulty: Difficulty;
  onEndGame: (result: GameResult) => void;
  onBack: () => void;
  isQuickMode?: boolean;
  isPracticeMode?: boolean;
}

type ShapeType = 'SQUARE' | 'CIRCLE' | 'TRIANGLE' | 'HEXAGON';
type ColorType = 'RED' | 'BLUE' | 'GREEN' | 'YELLOW';
interface Item { id: number; shape: ShapeType; color: ColorType; isTarget: boolean; }

const VisualSearchGame: React.FC<VisualSearchGameProps> = ({ difficulty, onEndGame, onBack, isQuickMode = false, isPracticeMode = false }) => {
  const [introFinished, setIntroFinished] = useState(false);
  const [gameActive, setGameActive] = useState(true);
  const [gridSize, setGridSize] = useState(4);
  const [items, setItems] = useState<Item[]>([]);
  const [targetSpec, setTargetSpec] = useState<{shape: ShapeType, color: ColorType} | null>(null);
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showQuitModal, setShowQuitModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const getTimeLimit = () => difficulty === Difficulty.BEGINNER ? 60 : difficulty === Difficulty.INTERMEDIATE ? 45 : 30;
  const TOTAL_TIME = getTimeLimit();
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true; startMusic('FOCUS'); startLevel();
    return () => { isMountedRef.current = false; stopMusic(); };
  }, []);

  const getShapeIcon = (s: ShapeType, className: string) => {
      switch(s) {
          case 'SQUARE': return <Square className={className} fill="currentColor" />;
          case 'CIRCLE': return <Circle className={className} fill="currentColor" />;
          case 'TRIANGLE': return <Triangle className={className} fill="currentColor" />;
          case 'HEXAGON': return <Hexagon className={className} fill="currentColor" />;
      }
  };
  const getColorClass = (c: ColorType) => {
      switch(c) {
          case 'RED': return 'text-red-500 drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]';
          case 'BLUE': return 'text-blue-500 drop-shadow-[0_0_5px_rgba(59,130,246,0.5)]';
          case 'GREEN': return 'text-green-500 drop-shadow-[0_0_5px_rgba(34,197,94,0.5)]';
          case 'YELLOW': return 'text-yellow-500 drop-shadow-[0_0_5px_rgba(234,179,8,0.5)]';
      }
  };

  const startLevel = () => {
    const baseSize = difficulty === Difficulty.BEGINNER ? 3 : 4;
    const growth = Math.floor((level - 1) / 2);
    const size = Math.min(7, baseSize + growth);
    setGridSize(size);
    const shapes: ShapeType[] = ['SQUARE', 'CIRCLE', 'TRIANGLE'];
    const colors: ColorType[] = ['RED', 'BLUE', 'GREEN'];
    const targetShape = shapes[Math.floor(Math.random() * shapes.length)];
    const targetColor = colors[Math.floor(Math.random() * colors.length)];
    setTargetSpec({ shape: targetShape, color: targetColor });
    const totalItems = size * size;
    const targetIndex = Math.floor(Math.random() * totalItems);
    const newItems: Item[] = [];
    for (let i = 0; i < totalItems; i++) {
        if (i === targetIndex) { newItems.push({ id: i, shape: targetShape, color: targetColor, isTarget: true }); } 
        else {
            const shareColor = Math.random() > 0.5;
            let dShape = targetShape; let dColor = targetColor;
            if (shareColor) while(dShape === targetShape) dShape = shapes[Math.floor(Math.random() * shapes.length)];
            else while(dColor === targetColor) dColor = colors[Math.floor(Math.random() * colors.length)];
            newItems.push({ id: i, shape: dShape, color: dColor, isTarget: false });
        }
    }
    setItems(newItems);
  };

  const handleFinish = useCallback(() => {
    if (!isMountedRef.current) return;
    setGameActive(false); playSound('win'); stopMusic();
    onEndGame({ score, totalQuestions: level, correctAnswers: level - 1, accuracy: 100, duration: (TOTAL_TIME - timeLeft) * 1000, difficulty, gameMode: GameMode.VISUAL_SEARCH });
  }, [level, score, timeLeft, difficulty, onEndGame]);

  useEffect(() => { if (!isPracticeMode && introFinished && gameActive && !showTutorial && !showQuitModal && timeLeft > 0) { const timer = setInterval(() => setTimeLeft(t => Math.max(0, t - 0.1)), 100); return () => clearInterval(timer); } }, [introFinished, gameActive, showTutorial, showQuitModal, timeLeft, isPracticeMode]);
  useEffect(() => { if (!isPracticeMode && timeLeft <= 0 && gameActive && introFinished) handleFinish(); }, [timeLeft, gameActive, introFinished, handleFinish, isPracticeMode]);

  const handleClick = (item: Item) => {
    if (item.isTarget) { playSound('pop'); setScore(s => s + 50 + (level * 5)); setLevel(l => l + 1); if (Math.random() > 0.8) setShowConfetti(true); startLevel(); } 
    else { playSound('wrong'); setScore(s => Math.max(0, s - 30)); }
  };

  return (
    <div className="w-full max-w-lg mx-auto relative">
      {!introFinished && <GameIntro gameMode={GameMode.VISUAL_SEARCH} onStart={() => { playSound('click'); setIntroFinished(true); setShowTutorial(true); }} />}
      {showConfetti && <Confetti />}
      <TutorialOverlay isOpen={showTutorial} onClose={() => setShowTutorial(false)} title="Conjunction Search" content={["Cari Target (Bentuk + Warna).", "Abaikan pengalih.", "Cepat!"]} icon={<Scan className="w-6 h-6" />} />
      <QuitModal isOpen={showQuitModal} onConfirm={() => { setShowQuitModal(false); onBack(); }} onCancel={() => setShowQuitModal(false)} />

      <div className="flex justify-between items-center mb-6">
         <div className="flex gap-2"><Button variant="ghost" onClick={() => isPracticeMode ? handleFinish() : setShowQuitModal(true)} className="!px-3 text-sm">&larr; Exit</Button><Tooltip text="ATURAN MAIN"><Button variant="ghost" onClick={() => setShowTutorial(true)} className="!px-3 text-neuro-400"><HelpCircle className="w-5 h-5" /></Button></Tooltip></div>
         <Badge color="bg-retro-green">Lvl {level}</Badge>
      </div>

      <Card className="flex flex-col items-center p-6 md:p-8">
         <CountdownBar totalTime={TOTAL_TIME} timeLeft={timeLeft} isPracticeMode={isPracticeMode} />
         
         {targetSpec && (
             <div className="mb-6 bg-slate-800 px-6 py-3 rounded-full border-2 border-white flex items-center gap-4 shadow-lg animate-pulse">
                 <span className="text-xs text-slate-400 uppercase font-pixel tracking-widest">FIND:</span>
                 <div className={`flex items-center gap-3 ${getColorClass(targetSpec.color)}`}>
                     {getShapeIcon(targetSpec.shape, "w-8 h-8")}
                     <span className="font-bold text-lg font-mono tracking-tight">{targetSpec.color} {targetSpec.shape}</span>
                 </div>
             </div>
         )}

         <div className="grid gap-2 bg-slate-900 p-4 rounded-xl border-2 border-slate-700 w-full aspect-square max-w-[400px] shadow-inner" style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)`, gridTemplateRows: `repeat(${gridSize}, 1fr)` }}>
            {items.map((item) => (
                <button 
                    key={item.id} 
                    onClick={() => handleClick(item)}
                    className={`w-full h-full bg-slate-800 hover:bg-slate-700 border border-transparent rounded-lg flex items-center justify-center transition-all duration-100 active:scale-90 ${getColorClass(item.color)}`}
                >
                    {getShapeIcon(item.shape, "w-3/4 h-3/4")}
                </button>
            ))}
         </div>
      </Card>
    </div>
  );
};
export default VisualSearchGame;
