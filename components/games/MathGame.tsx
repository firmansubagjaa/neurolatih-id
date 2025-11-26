
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Difficulty, AIQuestion, GameResult, GameMode } from '../../types';
import { generateSequencePuzzle } from '../../services/geminiService';
import { startMusic, stopMusic, playSound } from '../../services/audioService';
import { Button, Card, Badge, NeuralLoader } from '../Shared';
import { TutorialOverlay } from '../TutorialOverlay';
import { QuitModal } from '../QuitModal';
import { Confetti } from '../Confetti';
import { CountdownBar } from '../CountdownBar';
import { GameIntro } from '../GameIntro';
import { Network, CheckCircle, HelpCircle, XCircle, Zap, TrendingUp, Layers, Shuffle } from 'lucide-react';

interface SequenceGameProps {
  difficulty: Difficulty;
  onEndGame: (result: GameResult) => void;
  onBack: () => void;
  isQuickMode?: boolean;
  isPracticeMode?: boolean;
}

type LogicMode = 'LINEAR' | 'COMPLEX' | 'CHAOS';
type GamePhase = 'LOADING' | 'WAITING_FOR_INPUT' | 'PROCESSING' | 'FEEDBACK' | 'FINISHED';

const SequenceGame: React.FC<SequenceGameProps> = ({ difficulty, onEndGame, onBack, isQuickMode = false, isPracticeMode = false }) => {
  const [viewState, setViewState] = useState<'SELECT' | 'GAME'>('SELECT');
  const [logicMode, setLogicMode] = useState<LogicMode>('LINEAR');
  const [phase, setPhase] = useState<GamePhase>('LOADING');
  const [introFinished, setIntroFinished] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<AIQuestion | null>(null);
  const [score, setScore] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showQuitModal, setShowQuitModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const getTimeLimit = () => difficulty === Difficulty.BEGINNER ? 60 : difficulty === Difficulty.INTERMEDIATE ? 45 : 30;
  const TOTAL_TIME = getTimeLimit();
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);

  const isMountedRef = useRef(true);
  const phaseRef = useRef<GamePhase>(phase);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchNextQuestion = useCallback(async () => {
    setPhase('LOADING'); setSelectedOption(null); setShowConfetti(false);
    try { const q = await generateSequencePuzzle(difficulty, logicMode); if (isMountedRef.current) { setCurrentQuestion(q); setPhase('WAITING_FOR_INPUT'); } } catch (err) { console.error(err); } 
  }, [difficulty, logicMode]);

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { isMountedRef.current = true; startMusic('FOCUS'); return () => { isMountedRef.current = false; stopMusic(); if (timerIntervalRef.current) clearInterval(timerIntervalRef.current); }; }, []);
  useEffect(() => { if (viewState === 'GAME' && !isPracticeMode && phase !== 'FINISHED' && introFinished && !showTutorial && !showQuitModal && timeLeft > 0) { timerIntervalRef.current = setInterval(() => { setTimeLeft((prev) => { const decrement = isQuickMode ? 0.2 : 0.1; const newVal = Math.max(0, prev - decrement); if (newVal <= 0) { handleFinish(); return 0; } return newVal; }); }, 100); } else { if (timerIntervalRef.current) clearInterval(timerIntervalRef.current); } return () => { if (timerIntervalRef.current) clearInterval(timerIntervalRef.current); }; }, [viewState, phase, introFinished, showTutorial, showQuitModal, timeLeft, isPracticeMode, isQuickMode]);

  const startGame = (mode: LogicMode) => { setLogicMode(mode); setViewState('GAME'); setIntroFinished(false); setTimeLeft(TOTAL_TIME); fetchNextQuestion(); };
  const handleAnswer = (index: number) => {
    if (phase !== 'WAITING_FOR_INPUT') return;
    if (!isPracticeMode && timeLeft <= 0) return;
    setPhase('PROCESSING'); setSelectedOption(index); setQuestionsAnswered(prev => prev + 1);
    if (currentQuestion && index === currentQuestion.correctAnswerIndex) { setScore(s => s + 100); playSound('correct'); setShowConfetti(true); } else { playSound('wrong'); }
    setPhase('FEEDBACK');
    setTimeout(() => { if (isMountedRef.current && phaseRef.current !== 'FINISHED') { if (!isPracticeMode && timeLeft <= 0) handleFinish(); else fetchNextQuestion(); } }, 1500); 
  };

  const handleFinish = () => { if (!isMountedRef.current || phase === 'FINISHED') return; setPhase('FINISHED'); playSound('win'); stopMusic(); onEndGame({ score, totalQuestions: questionsAnswered, correctAnswers: score / 100, accuracy: questionsAnswered > 0 ? (score / 100) / questionsAnswered * 100 : 0, duration: (TOTAL_TIME - timeLeft) * 1000, difficulty, gameMode: GameMode.SEQUENCE }); };

  if (phase === 'FINISHED') return null;

  if (viewState === 'SELECT') return (
        <div className="w-full max-w-2xl mx-auto space-y-4 animate-fade-in h-[calc(100vh-100px)] flex flex-col justify-center">
             <div className="flex justify-between items-center mb-4"><Button variant="ghost" onClick={onBack}>&larr; LOGIC MODULES</Button><Badge color="bg-retro-green">SEQUENCE</Badge></div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 {[{ id: 'LINEAR', name: "LINEAR", sub: "Aritmatika", icon: <TrendingUp />, desc: "+, -, x." }, { id: 'COMPLEX', name: "COMPLEX", sub: "Abstrak", icon: <Layers />, desc: "Fibonacci." }, { id: 'CHAOS', name: "CHAOS", sub: "Multilayer", icon: <Shuffle />, desc: "Interleaved." }].map((m) => (
                     <Card key={m.id} onClick={() => startGame(m.id as LogicMode)} className="cursor-pointer hover:border-retro-green hover:-translate-y-1 transition-all group"><div className="flex items-center gap-3 mb-2"><div className="text-retro-green">{m.icon}</div><div><h3 className="font-pixel text-sm">{m.name}</h3></div></div></Card>
                 ))}
             </div>
        </div>
  );

  return (
    <div className="w-full max-w-3xl mx-auto relative h-[calc(100vh-100px)] flex flex-col">
      {!introFinished && <GameIntro gameMode={GameMode.SEQUENCE} onStart={() => { playSound('click'); setIntroFinished(true); setShowTutorial(true); }} />}
      {showConfetti && <Confetti />}
      <TutorialOverlay isOpen={showTutorial} onClose={() => setShowTutorial(false)} title={`Cara Bermain: ${logicMode}`} content={["Analisis deret.", "Temukan pola.", "Pilih angka."]} icon={<Network className="w-6 h-6" />} />
      <QuitModal isOpen={showQuitModal} onConfirm={() => { setShowQuitModal(false); onBack(); }} onCancel={() => setShowQuitModal(false)} />

      <div className="flex justify-between items-center mb-4 shrink-0">
        <div className="flex gap-2"><Button variant="ghost" onClick={() => { playSound('click'); isPracticeMode ? handleFinish() : setShowQuitModal(true); }} className="!px-2 text-xs">&larr; Mode</Button><Button variant="ghost" onClick={() => setShowTutorial(true)} className="!px-2 text-neuro-400 text-xs"><HelpCircle className="w-4 h-4" /></Button></div>
        <div className="flex gap-2"><Badge color="bg-emerald-500">{logicMode}</Badge><Badge color="bg-cyan-500">Skor: {score}</Badge></div>
      </div>

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="mb-4 shrink-0"><CountdownBar totalTime={TOTAL_TIME} timeLeft={timeLeft} isPracticeMode={isPracticeMode} /></div>
        {phase === 'LOADING' ? <Card className="flex-1 flex flex-col items-center justify-center animate-pulse border-none bg-transparent"><NeuralLoader message="GENERATING..." /></Card> : currentQuestion ? (
          <div className="flex-1 flex flex-col animate-fade-in-up">
            <div className="flex-1 flex flex-col items-center justify-center text-center bg-slate-800 rounded-xl border-4 border-slate-600 p-4 mb-4 relative shadow-retro-lg">
               <div className="absolute top-2 left-2 p-2 bg-emerald-900/30 rounded-full"><Network className="w-6 h-6 text-emerald-400" /></div>
               <h3 className="text-3xl md:text-5xl font-mono font-bold text-white leading-relaxed break-words w-full tracking-wider">{currentQuestion.question}</h3>
            </div>
            <div className="grid grid-cols-2 gap-3 md:gap-6 shrink-0 mb-4">
              {currentQuestion.options.map((option, idx) => {
                let stateClass = "border-slate-950 bg-slate-800 text-slate-300 hover:border-white hover:bg-slate-700 hover:text-white"; 
                if (selectedOption !== null) { if (idx === currentQuestion.correctAnswerIndex) stateClass = "border-emerald-500 bg-emerald-500/20 text-emerald-100 glow-success"; else if (idx === selectedOption) stateClass = "border-red-500 bg-red-500/20 text-red-100"; else stateClass = "border-white/5 opacity-30"; }
                return <button key={idx} onClick={() => handleAnswer(idx)} disabled={phase !== 'WAITING_FOR_INPUT'} className={`p-4 md:p-8 rounded-xl border-b-8 transition-all flex items-center justify-center gap-2 text-2xl md:text-4xl font-bold font-mono relative overflow-hidden active:translate-y-2 active:border-b-0 ${stateClass}`}>{option}{selectedOption !== null && idx === currentQuestion.correctAnswerIndex && <CheckCircle className="w-6 h-6" />}{selectedOption !== null && idx === selectedOption && idx !== currentQuestion.correctAnswerIndex && <XCircle className="w-6 h-6 text-red-400" />}</button>;
              })}
            </div>
            {phase === 'FEEDBACK' && (<div className="animate-fade-in shrink-0 min-h-[60px]"><div className={`p-3 rounded-lg text-sm md:text-base text-center border-2 ${selectedOption === currentQuestion.correctAnswerIndex ? 'bg-emerald-900/20 border-emerald-500/30 text-emerald-200' : 'bg-red-900/20 border-red-500/30 text-red-200'}`}>{currentQuestion.explanation}</div></div>)}
          </div>
        ) : <div className="text-center text-red-400 mt-10">Error.</div>}
      </div>
    </div>
  );
};
export default SequenceGame;
