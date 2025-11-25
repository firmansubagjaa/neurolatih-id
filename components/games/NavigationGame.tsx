
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Difficulty, GameResult, GameMode } from '../../types';
import { startMusic, stopMusic, playSound } from '../../services/audioService';
import { Button, Card, Badge, Tooltip } from '../Shared';
import { TutorialOverlay } from '../TutorialOverlay';
import { QuitModal } from '../QuitModal';
import { Confetti } from '../Confetti';
import { CountdownBar } from '../CountdownBar';
import { GameIntro } from '../GameIntro';
import { Compass, HelpCircle, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

interface NavigationGameProps {
  difficulty: Difficulty;
  onEndGame: (result: GameResult) => void;
  onBack: () => void;
  isQuickMode?: boolean;
  isPracticeMode?: boolean;
}

type Direction = 'U' | 'S' | 'T' | 'B'; // Utara, Selatan, Timur, Barat

const NavigationGame: React.FC<NavigationGameProps> = ({ difficulty, onEndGame, onBack, isQuickMode = false, isPracticeMode = false }) => {
  const [introFinished, setIntroFinished] = useState(false);
  const [gameActive, setGameActive] = useState(true);
  
  const [startDir, setStartDir] = useState<Direction>('U');
  const [moves, setMoves] = useState<string[]>([]);
  const [finalDir, setFinalDir] = useState<Direction>('U');
  
  const [score, setScore] = useState(0);
  const [rounds, setRounds] = useState(0);
  
  const [showTutorial, setShowTutorial] = useState(false);
  const [showQuitModal, setShowQuitModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const TOTAL_TIME = 60;
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    startMusic('FOCUS');
    nextRound();
    return () => {
      isMountedRef.current = false;
      stopMusic();
    };
  }, []);

  const getRotation = (curr: Direction, move: string): Direction => {
    const dirs: Direction[] = ['U', 'T', 'S', 'B']; // Clockwise
    let idx = dirs.indexOf(curr);
    if (move === 'Kanan') idx = (idx + 1) % 4;
    if (move === 'Kiri') idx = (idx - 1 + 4) % 4;
    if (move === 'Balik') idx = (idx + 2) % 4;
    return dirs[idx];
  };

  const nextRound = () => {
    const dirs: Direction[] = ['U', 'T', 'S', 'B'];
    const start = dirs[Math.floor(Math.random() * 4)];
    setStartDir(start);

    const moveCount = difficulty === Difficulty.BEGINNER ? 2 : difficulty === Difficulty.INTERMEDIATE ? 3 : 5;
    const possibleMoves = ['Kanan', 'Kiri', 'Balik'];
    
    const newMoves = [];
    let curr = start;
    
    for (let i = 0; i < moveCount; i++) {
        const m = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
        newMoves.push(m);
        curr = getRotation(curr, m);
    }
    
    setMoves(newMoves);
    setFinalDir(curr);
  };

  const handleFinish = useCallback(() => {
    if (!isMountedRef.current) return;
    setGameActive(false);
    playSound('win');
    stopMusic();
    
    onEndGame({
      score: score,
      totalQuestions: rounds,
      correctAnswers: score / 100,
      accuracy: 100, 
      duration: (TOTAL_TIME - timeLeft) * 1000,
      difficulty: difficulty,
      gameMode: GameMode.NAVIGATION
    });
  }, [rounds, score, timeLeft, difficulty, onEndGame]);

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

  const handleAnswer = (dir: Direction) => {
    setRounds(r => r + 1);
    if (dir === finalDir) {
        playSound('pop');
        setScore(s => s + 100);
        if (Math.random() > 0.8) setShowConfetti(true);
        nextRound();
    } else {
        playSound('wrong');
        setScore(s => Math.max(0, s - 50));
        // Keep same round until correct or time out? Let's just next round to keep flow
        nextRound();
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

  const dirName = (d: Direction) => {
      switch(d) {
          case 'U': return 'UTARA';
          case 'S': return 'SELATAN';
          case 'T': return 'TIMUR';
          case 'B': return 'BARAT';
      }
  };

  return (
    <div className="w-full max-w-lg mx-auto relative">
      {!introFinished && (
        <GameIntro 
          gameMode={GameMode.NAVIGATION} 
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
        title="Cara Bermain: Navigasi"
        content={["Mulai menghadap arah awal.", "Ikuti instruksi belok dalam pikiran.", "Tentukan arah hadap TERAKHIR."]}
        icon={<Compass className="w-6 h-6" />}
      />
      <QuitModal isOpen={showQuitModal} onConfirm={() => { setShowQuitModal(false); onBack(); }} onCancel={() => setShowQuitModal(false)} />

      <div className="flex justify-between items-center mb-4">
         <div className="flex gap-2">
            <Button variant="ghost" onClick={handleBackRequest} className="!px-2">&larr; {isPracticeMode ? "Selesai" : "Keluar"}</Button>
            <Tooltip text="ATURAN MAIN">
                <Button variant="ghost" onClick={() => setShowTutorial(true)} className="!px-2 text-neuro-400"><HelpCircle className="w-5 h-5" /></Button>
            </Tooltip>
         </div>
         <Badge color="bg-indigo-500">Rounds: {rounds}</Badge>
      </div>

      <Card className="flex flex-col items-center">
         <CountdownBar totalTime={TOTAL_TIME} timeLeft={timeLeft} isPracticeMode={isPracticeMode} />
         
         <div className="flex flex-col items-center justify-center w-full mb-6 gap-4">
             <div className="bg-slate-800 p-4 rounded-xl border border-slate-600 text-center w-full">
                 <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">MULAI MENGHADAP</div>
                 <div className="text-3xl font-bold text-retro-yellow">{dirName(startDir)}</div>
             </div>
             
             <div className="flex flex-col gap-2 w-full bg-slate-900/50 p-4 rounded-xl border border-white/5">
                 {moves.map((m, i) => (
                     <div key={i} className="flex items-center gap-3 text-white font-mono border-b border-white/5 pb-2 last:border-0 last:pb-0">
                         <span className="text-slate-500 text-xs w-6">{i+1}.</span>
                         {m === 'Kanan' && <ArrowRight className="w-4 h-4 text-retro-cyan" />}
                         {m === 'Kiri' && <ArrowLeft className="w-4 h-4 text-retro-cyan" />}
                         {m === 'Balik' && <ArrowDown className="w-4 h-4 text-retro-pink" />}
                         <span className="uppercase">{m}</span>
                     </div>
                 ))}
             </div>
         </div>

         <div className="text-xs text-slate-500 mb-2 uppercase">AKHIRNYA MENGHADAP KE MANA?</div>
         <div className="grid grid-cols-2 gap-3 w-full">
            <Button variant="outline" onClick={() => handleAnswer('U')} className="border-indigo-500 bg-indigo-500/20 text-indigo-100 hover:text-white"><ArrowUp className="w-4 h-4 mr-2" /> UTARA</Button>
            <Button variant="outline" onClick={() => handleAnswer('S')} className="border-indigo-500 bg-indigo-500/20 text-indigo-100 hover:text-white"><ArrowDown className="w-4 h-4 mr-2" /> SELATAN</Button>
            <Button variant="outline" onClick={() => handleAnswer('B')} className="border-indigo-500 bg-indigo-500/20 text-indigo-100 hover:text-white"><ArrowLeft className="w-4 h-4 mr-2" /> BARAT</Button>
            <Button variant="outline" onClick={() => handleAnswer('T')} className="border-indigo-500 bg-indigo-500/20 text-indigo-100 hover:text-white"><ArrowRight className="w-4 h-4 mr-2" /> TIMUR</Button>
         </div>
      </Card>
    </div>
  );
};

export default NavigationGame;
