
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Difficulty, GameResult, GameMode } from '../../types';
import { startMusic, stopMusic, playSound } from '../../services/audioService';
import { Button, Card, Badge, Tooltip } from '../Shared';
import { TutorialOverlay } from '../TutorialOverlay';
import { QuitModal } from '../QuitModal';
import { Confetti } from '../Confetti';
import { CountdownBar } from '../CountdownBar';
import { GameIntro } from '../GameIntro';
import { Scan, HelpCircle } from 'lucide-react';

interface VisualSearchGameProps {
  difficulty: Difficulty;
  onEndGame: (result: GameResult) => void;
  onBack: () => void;
  isQuickMode?: boolean;
  isPracticeMode?: boolean;
}

const EMOJI_SETS = [
    { common: '😐', odd: '😶' },
    { common: 'O', odd: '0' },
    { common: '6', odd: '9' },
    { common: 'E', odd: 'F' },
    { common: 'mw', odd: 'mv' },
    { common: 'db', odd: 'dp' },
    { common: 'II', odd: 'll' },
    { common: 'VV', odd: 'W' },
];

const VisualSearchGame: React.FC<VisualSearchGameProps> = ({ difficulty, onEndGame, onBack, isQuickMode = false, isPracticeMode = false }) => {
  const [introFinished, setIntroFinished] = useState(false);
  const [gameActive, setGameActive] = useState(true);
  
  const [gridSize, setGridSize] = useState(4);
  const [items, setItems] = useState<string[]>([]);
  const [oddIndex, setOddIndex] = useState(-1);
  const [level, setLevel] = useState(1);
  
  const [score, setScore] = useState(0);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showQuitModal, setShowQuitModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const TOTAL_TIME = 40;
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    startMusic('FOCUS');
    startLevel();
    return () => {
      isMountedRef.current = false;
      stopMusic();
    };
  }, []);

  const startLevel = () => {
    const size = difficulty === Difficulty.BEGINNER ? 4 : difficulty === Difficulty.INTERMEDIATE ? 5 : 6;
    setGridSize(size);
    
    const set = EMOJI_SETS[Math.floor(Math.random() * EMOJI_SETS.length)];
    const total = size * size;
    const odd = Math.floor(Math.random() * total);
    setOddIndex(odd);
    
    const newItems = Array(total).fill(set.common);
    newItems[odd] = set.odd;
    setItems(newItems);
  };

  const handleFinish = useCallback(() => {
    if (!isMountedRef.current) return;
    setGameActive(false);
    playSound('win');
    stopMusic();
    
    onEndGame({
      score: score,
      totalQuestions: level,
      correctAnswers: level - 1, // simplified
      accuracy: 100, 
      duration: (TOTAL_TIME - timeLeft) * 1000,
      difficulty: difficulty,
      gameMode: GameMode.VISUAL_SEARCH
    });
  }, [level, score, timeLeft, difficulty, onEndGame]);

  useEffect(() => {
    if (!isPracticeMode && introFinished && gameActive && !showTutorial && !showQuitModal && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(t => Math.max(0, t - 0.1)), 100);
      return () => clearInterval(timer);
    }
  }, [introFinished, gameActive, showTutorial, showQuitModal, timeLeft, isPracticeMode]);

  useEffect(() => {
    if (!isPracticeMode && timeLeft <= 0 && gameActive && introFinished) {
      handleFinish();
    }
  }, [timeLeft, gameActive, introFinished, handleFinish, isPracticeMode]);

  const handleClick = (index: number) => {
    if (index === oddIndex) {
        playSound('pop');
        setScore(s => s + 50 * (difficulty === Difficulty.ADVANCED ? 2 : 1));
        setLevel(l => l + 1);
        if (Math.random() > 0.8) setShowConfetti(true);
        startLevel();
    } else {
        playSound('wrong');
        setScore(s => Math.max(0, s - 20)); // Penalty
    }
  };

  const handleBackRequest = () => {
    playSound('click');
    if (isPracticeMode) {
      handleFinish();
    } else {
      setShowQuitModal(true);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto relative">
      {!introFinished && (
        <GameIntro 
          gameMode={GameMode.VISUAL_SEARCH} 
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
        title="Cara Bermain: Mata Elang"
        content={["Cari satu simbol yang berbeda.", "Grid akan semakin padat.", "Kecepatan adalah kunci."]}
        icon={<Scan className="w-6 h-6" />}
      />
      <QuitModal isOpen={showQuitModal} onConfirm={() => { setShowQuitModal(false); onBack(); }} onCancel={() => setShowQuitModal(false)} />

      <div className="flex justify-between items-center mb-4">
         <div className="flex gap-2">
            <Button variant="ghost" onClick={handleBackRequest} className="!px-2">&larr; {isPracticeMode ? "Selesai" : "Keluar"}</Button>
            <Tooltip text="ATURAN MAIN">
                <Button variant="ghost" onClick={() => setShowTutorial(true)} className="!px-2 text-neuro-400"><HelpCircle className="w-5 h-5" /></Button>
            </Tooltip>
         </div>
         <Badge color="bg-retro-green">Lvl {level}</Badge>
      </div>

      <Card className="flex flex-col items-center">
         <CountdownBar totalTime={TOTAL_TIME} timeLeft={timeLeft} isPracticeMode={isPracticeMode} />
         
         <div 
            className="grid gap-1 bg-slate-900 p-2 rounded-xl border border-slate-700 w-full aspect-square max-w-[350px]"
            style={{ 
                gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
                gridTemplateRows: `repeat(${gridSize}, 1fr)`
            }}
         >
            {items.map((item, i) => (
                <button 
                    key={i} 
                    onClick={() => handleClick(i)}
                    className="w-full h-full bg-slate-800 hover:bg-slate-700 rounded flex items-center justify-center font-mono text-lg md:text-2xl text-white transition-colors active:scale-95"
                >
                    {item}
                </button>
            ))}
         </div>
      </Card>
    </div>
  );
};

export default VisualSearchGame;
