
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Difficulty, GameResult, GameMode } from '../../types';
import { startMusic, stopMusic, playSound } from '../../services/audioService';
import { Button, Card, Badge, Tooltip } from '../Shared';
import { TutorialOverlay } from '../TutorialOverlay';
import { QuitModal } from '../QuitModal';
import { Confetti } from '../Confetti';
import { CountdownBar } from '../CountdownBar';
import { GameIntro } from '../GameIntro';
import { BrainCircuit, HelpCircle, Ear, Eye, Layers } from 'lucide-react';

interface NBackGameProps {
  difficulty: Difficulty;
  onEndGame: (result: GameResult) => void;
  onBack: () => void;
  isQuickMode?: boolean;
  isPracticeMode?: boolean;
}

const GridItem = React.memo(({ isActive }: { isActive: boolean }) => (
  <div className={`relative rounded-xl transition-all duration-100 flex items-center justify-center ${isActive ? 'bg-retro-green shadow-[0_0_20px_rgba(74,222,128,0.8)] scale-100 z-10 border-2 border-white' : 'bg-slate-800/40 border-2 border-slate-700 scale-90'}`}>
    {isActive && <div className="absolute inset-0 bg-white/50 animate-pulse rounded-xl"></div>}
  </div>
));

const NBackGame: React.FC<NBackGameProps> = ({ difficulty, onEndGame, onBack, isQuickMode = false, isPracticeMode = false }) => {
  const [introFinished, setIntroFinished] = useState(false);
  const [gameActive, setGameActive] = useState(true);
  const N_VALUE = difficulty === Difficulty.BEGINNER ? 1 : difficulty === Difficulty.INTERMEDIATE ? 2 : 3;
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [score, setScore] = useState(0);
  const [currentGridPos, setCurrentGridPos] = useState<number | null>(null);
  const [currentAudioChar, setCurrentAudioChar] = useState<string | null>(null);
  const [visualPressed, setVisualPressed] = useState(false);
  const [audioPressed, setAudioPressed] = useState(false);
  const positionHistory = useRef<number[]>([]);
  const audioHistory = useRef<string[]>([]);
  const turnIndexRef = useRef(-1);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showQuitModal, setShowQuitModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const TOTAL_TIME = 60;
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const LETTERS = ['A', 'B', 'C', 'D', 'H', 'K', 'L', 'M', 'P'];
  const getStimulusDuration = () => difficulty === Difficulty.BEGINNER ? 2500 : difficulty === Difficulty.INTERMEDIATE ? 2200 : 2000;
  const STIMULUS_DURATION = getStimulusDuration();
  const ITERATION_COUNT = 20 + N_VALUE;
  const gameLoopRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { startMusic('MEMORY'); return () => { stopMusic(); if (gameLoopRef.current) clearTimeout(gameLoopRef.current); }; }, []);

  const speakLetter = (letter: string) => { if ('speechSynthesis' in window) { const u = new SpeechSynthesisUtterance(letter); u.lang = 'en-US'; u.rate = 1.5; window.speechSynthesis.speak(u); } };
  const handleFinish = useCallback(() => { if (gameLoopRef.current) clearTimeout(gameLoopRef.current); setGameActive(false); playSound('win'); stopMusic(); const totalTurns = turnIndexRef.current - N_VALUE; const accuracy = Math.min(100, Math.max(0, score / (totalTurns > 0 ? totalTurns * 2 : 1))); onEndGame({ score, totalQuestions: Math.max(0, totalTurns), correctAnswers: 0, accuracy, duration: (TOTAL_TIME - timeLeft) * 1000, difficulty, gameMode: GameMode.N_BACK }); }, [score, timeLeft, difficulty, onEndGame, N_VALUE]);
  useEffect(() => { if (!isPracticeMode && introFinished && gameActive && !showTutorial && !showQuitModal && timeLeft > 0) { const timer = setInterval(() => setTimeLeft(t => Math.max(0, t - 0.1)), 100); return () => clearInterval(timer); } else if (timeLeft <= 0 && gameActive) handleFinish(); }, [timeLeft, gameActive, introFinished, isPracticeMode, showTutorial, showQuitModal, handleFinish]);

  const runGameStep = () => {
    if (!gameActive || turnIndexRef.current >= ITERATION_COUNT) { handleFinish(); return; }
    if (turnIndexRef.current >= N_VALUE) {
        const idx = turnIndexRef.current;
        if (positionHistory.current[idx - N_VALUE] === positionHistory.current[idx] && !visualPressed) setScore(s => Math.max(0, s - 20));
        if (audioHistory.current[idx - N_VALUE] === audioHistory.current[idx] && !audioPressed) setScore(s => Math.max(0, s - 20));
    }
    setVisualPressed(false); setAudioPressed(false);
    const shouldMatchPos = Math.random() < 0.3 && turnIndexRef.current >= N_VALUE - 1;
    const shouldMatchAudio = Math.random() < 0.3 && turnIndexRef.current >= N_VALUE - 1;
    let nextPos = shouldMatchPos ? positionHistory.current[turnIndexRef.current + 1 - N_VALUE] : Math.floor(Math.random() * 9);
    let nextAudio = shouldMatchAudio ? audioHistory.current[turnIndexRef.current + 1 - N_VALUE] : LETTERS[Math.floor(Math.random() * LETTERS.length)];
    positionHistory.current.push(nextPos); audioHistory.current.push(nextAudio);
    turnIndexRef.current += 1;
    setCurrentIndex(turnIndexRef.current); setCurrentGridPos(nextPos); setCurrentAudioChar(nextAudio); speakLetter(nextAudio);
    gameLoopRef.current = setTimeout(runGameStep, STIMULUS_DURATION);
  };
  useEffect(() => { if (introFinished && gameActive && !showTutorial && !showQuitModal && turnIndexRef.current === -1) runGameStep(); }, [introFinished, gameActive, showTutorial, showQuitModal]);

  const handleVisualInput = () => { if (visualPressed) return; setVisualPressed(true); const idx = turnIndexRef.current; if (idx < N_VALUE) { setScore(s => Math.max(0, s - 10)); playSound('wrong'); return; } if (positionHistory.current[idx] === positionHistory.current[idx - N_VALUE]) { setScore(s => s + 50); playSound('pop'); setShowConfetti(true); setTimeout(() => setShowConfetti(false), 500); } else { setScore(s => Math.max(0, s - 20)); playSound('wrong'); } };
  const handleAudioInput = () => { if (audioPressed) return; setAudioPressed(true); const idx = turnIndexRef.current; if (idx < N_VALUE) { setScore(s => Math.max(0, s - 10)); playSound('wrong'); return; } if (audioHistory.current[idx] === audioHistory.current[idx - N_VALUE]) { setScore(s => s + 50); playSound('pop'); setShowConfetti(true); setTimeout(() => setShowConfetti(false), 500); } else { setScore(s => Math.max(0, s - 20)); playSound('wrong'); } };

  return (
    <div className="w-full max-w-xl mx-auto relative">
      {!introFinished && <GameIntro gameMode={GameMode.N_BACK} onStart={() => { playSound('click'); setIntroFinished(true); setShowTutorial(true); }} />}
      {showConfetti && <Confetti />}
      <TutorialOverlay isOpen={showTutorial} onClose={() => setShowTutorial(false)} title={`Dual ${N_VALUE}-Back`} content={[`Ingat POSISI & SUARA ${N_VALUE} langkah lalu.`, "Tekan tombol jika cocok."]} icon={<Layers className="w-6 h-6" />} />
      <QuitModal isOpen={showQuitModal} onConfirm={() => { setShowQuitModal(false); onBack(); }} onCancel={() => setShowQuitModal(false)} />

      <div className="flex justify-between items-center mb-6">
         <div className="flex gap-2"><Button variant="ghost" onClick={() => isPracticeMode ? handleFinish() : setShowQuitModal(true)} className="!px-3 text-sm">&larr; Exit</Button><Tooltip text="ATURAN MAIN"><Button variant="ghost" onClick={() => setShowTutorial(true)} className="!px-3 text-neuro-400"><HelpCircle className="w-5 h-5" /></Button></Tooltip></div>
         <Badge color="bg-purple-500">Dual {N_VALUE}-Back</Badge>
      </div>

      <Card className="flex flex-col items-center p-6 md:p-8">
        <CountdownBar totalTime={TOTAL_TIME} timeLeft={timeLeft} isPracticeMode={isPracticeMode} />
        
        <div className="mb-4 h-12 flex items-center justify-center">
             {isPracticeMode || difficulty === Difficulty.BEGINNER ? <div className="text-4xl font-bold text-retro-yellow animate-pulse font-mono">{currentAudioChar || "..."}</div> : <Ear className={`w-8 h-8 transition-colors ${currentAudioChar ? 'text-retro-yellow animate-pulse' : 'text-slate-800'}`} />}
        </div>

        <div className="grid grid-cols-3 gap-3 md:gap-4 bg-slate-900 p-6 rounded-2xl border-4 border-slate-700 shadow-inner mb-8 relative w-full max-w-[300px] mx-auto aspect-square">
           {Array.from({ length: 9 }).map((_, i) => <GridItem key={i} isActive={i === currentGridPos} />)}
        </div>

        <div className="grid grid-cols-2 gap-6 w-full">
           <Button variant={visualPressed ? 'primary' : 'outline'} className={`h-24 text-lg flex flex-col items-center justify-center border-b-8 active:border-b-0 active:translate-y-2 rounded-xl transition-all ${visualPressed ? 'bg-white text-black border-slate-300' : 'bg-slate-800 border-slate-950 text-white hover:border-retro-green'}`} disabled={turnIndexRef.current < N_VALUE} onClick={handleVisualInput}>
             <Eye className="w-8 h-8 mb-2" /> <span className="text-xs font-bold uppercase tracking-widest">POSISI SAMA</span>
           </Button>
           <Button variant={audioPressed ? 'primary' : 'outline'} className={`h-24 text-lg flex flex-col items-center justify-center border-b-8 active:border-b-0 active:translate-y-2 rounded-xl transition-all ${audioPressed ? 'bg-white text-black border-slate-300' : 'bg-slate-800 border-slate-950 text-white hover:border-retro-yellow'}`} disabled={turnIndexRef.current < N_VALUE} onClick={handleAudioInput}>
             <Ear className="w-8 h-8 mb-2" /> <span className="text-xs font-bold uppercase tracking-widest">SUARA SAMA</span>
           </Button>
        </div>
      </Card>
    </div>
  );
};
export default NBackGame;
