
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Difficulty, AIQuestion, GameResult, GameMode } from '../../types';
import { generateRiddle } from '../../services/geminiService';
import { startMusic, stopMusic, playSound } from '../../services/audioService';
import { Button, Card, Badge, NeuralLoader } from '../Shared';
import { TutorialOverlay } from '../TutorialOverlay';
import { QuitModal } from '../QuitModal';
import { Confetti } from '../Confetti';
import { CountdownBar } from '../CountdownBar';
import { GameIntro } from '../GameIntro';
import { CheckCircle, XCircle, Lightbulb, HelpCircle, Zap, Brain, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';

interface LogicGameProps {
  difficulty: Difficulty;
  onEndGame: (result: GameResult) => void;
  onBack: () => void;
  isQuickMode?: boolean;
  isPracticeMode?: boolean;
}

type GamePhase = 'LOADING' | 'WAITING_FOR_INPUT' | 'PROCESSING' | 'FEEDBACK' | 'FINISHED';

const LogicGame: React.FC<LogicGameProps> = ({ difficulty, onEndGame, onBack, isQuickMode = false, isPracticeMode = false }) => {
  const [phase, setPhase] = useState<GamePhase>('LOADING');
  const [introFinished, setIntroFinished] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<AIQuestion | null>(null);
  const [score, setScore] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showQuitModal, setShowQuitModal] = useState(false);
  
  const getTimeLimit = () => difficulty === Difficulty.BEGINNER ? 90 : difficulty === Difficulty.INTERMEDIATE ? 60 : 45;
  const TOTAL_TIME = getTimeLimit();
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const isMountedRef = useRef(true);
  const phaseRef = useRef<GamePhase>(phase);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  const fetchNextQuestion = useCallback(async () => {
    setPhase('LOADING'); setSelectedOption(null); setShowConfetti(false); setShowExplanation(false);
    try { const q = await generateRiddle(difficulty); if (isMountedRef.current) { setCurrentQuestion(q); setPhase('WAITING_FOR_INPUT'); } } catch (err) { console.error(err); }
  }, [difficulty]);

  useEffect(() => { isMountedRef.current = true; startMusic('FOCUS'); fetchNextQuestion(); return () => { isMountedRef.current = false; stopMusic(); if (timerIntervalRef.current) clearInterval(timerIntervalRef.current); if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current); }; }, []);
  useEffect(() => { if (!isPracticeMode && phase !== 'FINISHED' && introFinished && !showTutorial && !showQuitModal && timeLeft > 0) { timerIntervalRef.current = setInterval(() => { setTimeLeft((prev) => { const newVal = Math.max(0, prev - (isQuickMode ? 0.2 : 0.1)); if (newVal <= 0) { handleFinish(); return 0; } return newVal; }); }, 100); } else { if (timerIntervalRef.current) clearInterval(timerIntervalRef.current); } return () => { if (timerIntervalRef.current) clearInterval(timerIntervalRef.current); }; }, [phase, introFinished, showTutorial, showQuitModal, timeLeft, isPracticeMode, isQuickMode]);

  const handleNext = () => { if (!isPracticeMode && timeLeft <= 0) handleFinish(); else fetchNextQuestion(); };
  const handleAnswer = (index: number) => {
    if (phase !== 'WAITING_FOR_INPUT') return;
    if (!isPracticeMode && timeLeft <= 0) return;
    setPhase('PROCESSING'); setSelectedOption(index); setQuestionsAnswered(prev => prev + 1);
    if (currentQuestion && index === currentQuestion.correctAnswerIndex) { setScore(s => s + 100); playSound('correct'); setShowConfetti(true); } else { playSound('wrong'); }
    setPhase('FEEDBACK');
    feedbackTimerRef.current = setTimeout(() => { if (isMountedRef.current && phaseRef.current !== 'FINISHED') handleNext(); }, 2000); 
  };
  const handleToggleExplanation = () => { if (!showExplanation && feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current); setShowExplanation(prev => !prev); };
  const handleFinish = () => { if (!isMountedRef.current || phase === 'FINISHED') return; setPhase('FINISHED'); playSound('win'); stopMusic(); onEndGame({ score, totalQuestions: questionsAnswered, correctAnswers: score / 100, accuracy: questionsAnswered > 0 ? (score / 100) / questionsAnswered * 100 : 0, duration: (TOTAL_TIME - timeLeft) * 1000, difficulty, gameMode: GameMode.PROBLEM }); };
  const handleBackRequest = () => { playSound('click'); if (isPracticeMode) handleFinish(); else setShowQuitModal(true); };

  if (phase === 'FINISHED') return null;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-3 relative">
      {!introFinished && <GameIntro gameMode={GameMode.PROBLEM} onStart={() => { playSound('click'); setIntroFinished(true); setShowTutorial(true); }} />}
      {showConfetti && <Confetti />}
      <TutorialOverlay isOpen={showTutorial} onClose={() => setShowTutorial(false)} title="Logika Masalah" content={["Pecahkan teka-teki.", "Pikir Out-of-the-box."]} icon={<Lightbulb className="w-6 h-6" />} />
      <QuitModal isOpen={showQuitModal} onConfirm={() => { setShowQuitModal(false); onBack(); }} onCancel={() => setShowQuitModal(false)} />

      <div className="flex flex-row justify-between items-center gap-2">
        <div className="flex gap-2"><Button variant="ghost" onClick={handleBackRequest} className="!px-2 text-xs md:text-sm">&larr; Keluar</Button><Button variant="ghost" onClick={() => setShowTutorial(true)} className="!px-2 text-neuro-400 hover:text-white text-xs md:text-sm"><HelpCircle className="w-4 h-4 mr-1" /> Info</Button></div>
        <div className="flex gap-2 items-center">{isQuickMode && <Badge color="bg-yellow-500 animate-pulse text-black"><Zap className="w-3 h-3 mr-1 inline" /> SPEED</Badge>}<Badge color="bg-emerald-500">Pts: {score}</Badge></div>
      </div>

      <div className="relative min-h-[400px]">
        <Card className="mb-4 py-2 px-3 bg-slate-800 border-slate-700">
           <CountdownBar totalTime={TOTAL_TIME} timeLeft={timeLeft} isPracticeMode={isPracticeMode} />
           {!isPracticeMode && <div className="text-center font-mono font-bold text-2xl md:text-3xl text-white mt-1">{timeLeft.toFixed(1)}s</div>}
        </Card>

        {phase === 'LOADING' ? <Card className="flex flex-col items-center justify-center h-64 animate-pulse"><NeuralLoader message="LOADING DATA..." /></Card> : currentQuestion ? (
          <div key={currentQuestion.question} className="animate-fade-in-up">
            <div className="bg-black border-4 border-white p-5 md:p-6 mb-4 relative shadow-[8px_8px_0px_0px_rgba(50,50,50,1)]">
              <div className="absolute -top-3 left-4 bg-black px-2 text-retro-cyan font-pixel text-xs flex items-center gap-1 border border-retro-cyan"><Brain className="w-3 h-3" /> QUERY_DATA</div>
              <h3 className="text-lg md:text-xl font-mono text-white leading-relaxed mt-2">{currentQuestion.question}</h3>
            </div>
            <div className="grid gap-3">
              {currentQuestion.options.map((option, idx) => {
                let btnClass = "text-left p-4 border-b-4 rounded-xl transition-all text-sm md:text-base font-bold font-pixel relative group active:translate-y-1 active:border-b-0 ";
                if (selectedOption !== null) {
                  if (idx === currentQuestion.correctAnswerIndex) btnClass += "bg-emerald-900 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]";
                  else if (idx === selectedOption) btnClass += "bg-red-900 border-red-400 text-white";
                  else btnClass += "bg-slate-900 border-slate-800 opacity-40";
                } else { btnClass += "bg-slate-800 border-slate-950 text-slate-300 hover:bg-slate-700 hover:border-retro-cyan hover:text-white"; }
                return (
                  <button key={idx} onClick={() => handleAnswer(idx)} disabled={phase !== 'WAITING_FOR_INPUT'} className={btnClass}>
                    <div className="flex items-center justify-between"><span className="mr-2">{option}</span>{selectedOption !== null && idx === currentQuestion.correctAnswerIndex && <CheckCircle className="w-5 h-5 text-emerald-400" />}{selectedOption !== null && idx === selectedOption && idx !== currentQuestion.correctAnswerIndex && <XCircle className="w-5 h-5 text-red-400" />}</div>
                  </button>
                );
              })}
            </div>
            {phase === 'FEEDBACK' && (
              <div className="mt-4 animate-fade-in">
                <div className={`p-4 border-2 font-mono text-sm shadow-[4px_4px_0_0_rgba(0,0,0,0.5)] ${selectedOption === currentQuestion.correctAnswerIndex ? 'bg-emerald-950 border-emerald-500 text-emerald-200' : 'bg-red-950 border-red-500 text-red-200'}`}>
                   <div className="flex items-center justify-between gap-2">
                       <span className="font-bold font-pixel text-xs mt-0.5">{selectedOption === currentQuestion.correctAnswerIndex ? '[CORRECT]' : '[ERROR]'}</span>
                       <button onClick={handleToggleExplanation} className="flex items-center gap-1 text-[10px] uppercase font-bold border border-white/20 px-2 py-1 hover:bg-white/10 transition-colors">{showExplanation ? 'Tutup Penjelasan' : 'Lihat Penjelasan'} {showExplanation ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}</button>
                   </div>
                   {showExplanation && (<div className="mt-3 border-t border-white/10 pt-2 animate-fade-in"><div className="flex items-start gap-2 mb-3"><Lightbulb className="w-4 h-4 shrink-0 mt-0.5 opacity-70" /><span className="leading-relaxed">{currentQuestion.explanation}</span></div><div className="flex justify-end"><button onClick={handleNext} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded text-xs font-bold transition-colors">LANJUT <ArrowRight className="w-3 h-3" /></button></div></div>)}
                </div>
              </div>
            )}
          </div>
        ) : <div className="text-center text-red-400 font-pixel mt-10">Error loading data.</div>}
      </div>
    </div>
  );
};
export default LogicGame;
