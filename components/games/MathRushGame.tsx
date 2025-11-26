
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Difficulty, GameResult, GameMode } from '../../types';
import { startMusic, stopMusic, playSound, playCombo } from '../../services/audioService';
import { Button, Card, Badge, Tooltip } from '../Shared';
import { TutorialOverlay } from '../TutorialOverlay';
import { QuitModal } from '../QuitModal';
import { Confetti } from '../Confetti';
import { CountdownBar } from '../CountdownBar';
import { GameIntro } from '../GameIntro';
import { Calculator, HelpCircle, Link as LinkIcon, ArrowRight, Zap, RefreshCw } from 'lucide-react';

interface MathRushGameProps {
  difficulty: Difficulty;
  onEndGame: (result: GameResult) => void;
  onBack: () => void;
  isQuickMode?: boolean;
  isPracticeMode?: boolean;
}

const MathRushGame: React.FC<MathRushGameProps> = ({ difficulty, onEndGame, onBack, isQuickMode = false, isPracticeMode = false }) => {
  const [introFinished, setIntroFinished] = useState(false);
  const [gameActive, setGameActive] = useState(true);
  const [previousAnswer, setPreviousAnswer] = useState<number | null>(null);
  const [currentProblem, setCurrentProblem] = useState<{ str: string, ans: number } | null>(null);
  const [options, setOptions] = useState<number[]>([]);
  const [chainLength, setChainLength] = useState(0);
  const [score, setScore] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showQuitModal, setShowQuitModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const getTimeLimit = () => difficulty === Difficulty.BEGINNER ? 60 : difficulty === Difficulty.INTERMEDIATE ? 45 : 30;
  const TOTAL_TIME = getTimeLimit(); 
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const isMountedRef = useRef(true);

  const getOps = () => difficulty === Difficulty.BEGINNER ? ['+', '-'] : ['+', '-', '*'];

  useEffect(() => {
    isMountedRef.current = true; startMusic('FOCUS'); generateProblem(null);
    return () => { isMountedRef.current = false; stopMusic(); };
  }, []);

  const generateProblem = (prev: number | null) => {
    let n1, n2, ans, op;
    const ops = getOps();
    op = ops[Math.floor(Math.random() * ops.length)];
    if (prev === null) n1 = Math.floor(Math.random() * 10) + 1; else n1 = prev;

    if (op === '+') { n2 = Math.floor(Math.random() * 10) + 1; ans = n1 + n2; } 
    else if (op === '-') { const maxN2 = difficulty === Difficulty.ADVANCED ? n1 + 10 : n1; n2 = Math.floor(Math.random() * maxN2) + 1; ans = n1 - n2; } 
    else { const maxFactor = difficulty === Difficulty.BEGINNER ? 2 : 5; n2 = Math.floor(Math.random() * maxFactor) + 2; if (n1 > 50) { op = '-'; n2 = Math.floor(Math.random() * 20) + 5; ans = n1 - n2; } else { ans = n1 * n2; } }

    const problemStr = prev === null ? `${n1} ${op} ${n2}` : `${op} ${n2}`;
    setCurrentProblem({ str: problemStr, ans });
    setPreviousAnswer(prev);

    const newOptions = new Set<number>(); newOptions.add(ans);
    while (newOptions.size < 4) { const offset = Math.floor(Math.random() * 10) - 5; const fake = ans + offset; if (fake !== ans) newOptions.add(fake); }
    setOptions(Array.from(newOptions).sort(() => Math.random() - 0.5));
  };

  const handleFinish = useCallback(() => {
    if (!isMountedRef.current) return;
    setGameActive(false); playSound('win'); stopMusic();
    onEndGame({ score, totalQuestions: questionsAnswered, correctAnswers, accuracy: questionsAnswered > 0 ? (correctAnswers / questionsAnswered) * 100 : 0, duration: (TOTAL_TIME - timeLeft) * 1000, difficulty, gameMode: GameMode.MATH_RUSH });
  }, [questionsAnswered, correctAnswers, score, timeLeft, difficulty, onEndGame]);

  useEffect(() => { if (!isPracticeMode && introFinished && gameActive && !showTutorial && !showQuitModal && timeLeft > 0) { const timer = setInterval(() => setTimeLeft(t => Math.max(0, t - 0.1)), 100); return () => clearInterval(timer); } }, [introFinished, gameActive, showTutorial, showQuitModal, timeLeft, isPracticeMode]);
  useEffect(() => { if (!isPracticeMode && timeLeft <= 0 && gameActive && introFinished) handleFinish(); }, [timeLeft, gameActive, introFinished, handleFinish, isPracticeMode]);

  const handleAnswer = (val: number) => {
    if (!gameActive || !currentProblem) return;
    setQuestionsAnswered(p => p + 1);
    if (val === currentProblem.ans) {
        const chainBonus = chainLength * 10; 
        setScore(s => s + 100 + chainBonus); 
        setCorrectAnswers(c => c + 1); 
        setChainLength(c => c + 1); 
        
        // Dynamic Audio: Play ascending pitch based on chain length
        playCombo(chainLength); 
        
        if (chainLength > 0 && chainLength % 5 === 0) setShowConfetti(true); 
        generateProblem(val);
    } else {
        playSound('wrong'); 
        setScore(s => Math.max(0, s - 50)); 
        setChainLength(0); 
        generateProblem(null);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto relative">
      {!introFinished && <GameIntro gameMode={GameMode.MATH_RUSH} onStart={() => { playSound('click'); setIntroFinished(true); setShowTutorial(true); }} />}
      {showConfetti && <Confetti />}
      <TutorialOverlay isOpen={showTutorial} onClose={() => setShowTutorial(false)} title="Chained Arithmetic" content={["Jawab soal.", "Jawaban jadi soal berikutnya.", "Jangan putus rantai!"]} icon={<Calculator className="w-6 h-6" />} />
      <QuitModal isOpen={showQuitModal} onConfirm={() => { setShowQuitModal(false); onBack(); }} onCancel={() => setShowQuitModal(false)} />

      <div className="flex justify-between items-center mb-6">
         <div className="flex gap-2"><Button variant="ghost" onClick={() => isPracticeMode ? handleFinish() : setShowQuitModal(true)} className="!px-3 text-sm">&larr; Exit</Button><Tooltip text="ATURAN MAIN"><Button variant="ghost" onClick={() => setShowTutorial(true)} className="!px-3 text-neuro-400"><HelpCircle className="w-5 h-5" /></Button></Tooltip></div>
         <Badge color="bg-retro-cyan">Score: {score}</Badge>
      </div>

      <Card className="flex flex-col items-center p-4 md:p-8">
         <CountdownBar totalTime={TOTAL_TIME} timeLeft={timeLeft} isPracticeMode={isPracticeMode} />

         <div className="flex items-center gap-2 mb-4 md:mb-6 bg-slate-900 px-4 py-1 rounded-full border border-slate-700">
             <LinkIcon className={`w-4 h-4 ${chainLength > 0 ? 'text-retro-cyan' : 'text-slate-600'}`} />
             <span className={`font-pixel text-xs ${chainLength > 0 ? 'text-white' : 'text-slate-500'}`}>CHAIN: {chainLength}</span>
             {chainLength > 4 && <Zap className="w-3 h-3 text-yellow-400 animate-pulse ml-1" />}
         </div>

         <div className="flex flex-col items-center justify-center gap-2 mb-6 md:mb-8 w-full min-h-[120px] relative">
             {previousAnswer === null && (
                 <div className="absolute -top-6 bg-black px-2 border border-slate-700 text-[10px] text-slate-500 font-pixel uppercase z-10">
                     New Chain
                 </div>
             )}

             <div className="flex items-center justify-center gap-2 md:gap-4 w-full">
                {previousAnswer !== null && (
                    <div className="flex items-center animate-fade-in-right opacity-50 scale-75 shrink-0">
                        <div className="text-2xl md:text-4xl font-mono font-bold text-retro-cyan border-b-2 border-retro-cyan/50 px-2">{previousAnswer}</div>
                    </div>
                )}

                {currentProblem && (
                    <div className="flex items-center gap-2 md:gap-4 animate-fade-in bg-slate-800 p-3 md:p-6 rounded-xl border-2 border-slate-600 shadow-lg">
                        <div className="text-4xl sm:text-5xl md:text-7xl font-mono font-black text-white tracking-widest whitespace-nowrap">
                            {currentProblem.str}
                        </div>
                        <ArrowRight className="w-5 h-5 md:w-8 md:h-8 text-slate-500 shrink-0" />
                        <div className="w-12 h-12 md:w-20 md:h-20 border-2 md:border-4 border-dashed border-slate-500 rounded-lg flex items-center justify-center bg-black shrink-0">
                            <span className="text-xl md:text-3xl text-slate-500 font-bold">?</span>
                        </div>
                    </div>
                )}
             </div>
         </div>

         <div className="grid grid-cols-2 gap-3 md:gap-4 w-full">
            {options.map((opt, idx) => (
                <button key={idx} onClick={() => handleAnswer(opt)} className="h-20 sm:h-24 md:h-28 bg-slate-800 border-b-4 md:border-b-8 border-slate-950 rounded-xl text-2xl sm:text-3xl md:text-5xl font-mono font-bold text-white hover:bg-slate-700 hover:border-retro-cyan hover:text-retro-cyan active:translate-y-2 active:border-b-0 transition-all flex items-center justify-center shadow-lg">
                    {opt}
                </button>
            ))}
         </div>
      </Card>
    </div>
  );
};
export default MathRushGame;
