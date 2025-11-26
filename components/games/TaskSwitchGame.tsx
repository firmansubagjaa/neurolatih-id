
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Difficulty, GameResult, GameMode } from '../../types';
import { startMusic, stopMusic, playSound } from '../../services/audioService';
import { Button, Card, Badge, Tooltip } from '../Shared';
import { TutorialOverlay } from '../TutorialOverlay';
import { QuitModal } from '../QuitModal';
import { Confetti } from '../Confetti';
import { CountdownBar } from '../CountdownBar';
import { GameIntro } from '../GameIntro';
import { Shuffle, HelpCircle, Check, X, Type, Hash } from 'lucide-react';

interface TaskSwitchGameProps {
  difficulty: Difficulty;
  onEndGame: (result: GameResult) => void;
  onBack: () => void;
  isQuickMode?: boolean;
  isPracticeMode?: boolean;
}

type RuleType = 'VOWEL' | 'EVEN';

const TaskSwitchGame: React.FC<TaskSwitchGameProps> = ({ difficulty, onEndGame, onBack, isQuickMode = false, isPracticeMode = false }) => {
  const [introFinished, setIntroFinished] = useState(false);
  const [gameActive, setGameActive] = useState(true);
  const [currentRule, setCurrentRule] = useState<RuleType>('VOWEL');
  const [char, setChar] = useState('');
  const [num, setNum] = useState(0);
  const [score, setScore] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showQuitModal, setShowQuitModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [feedback, setFeedback] = useState<'CORRECT' | 'WRONG' | null>(null);

  const getTimeLimit = () => difficulty === Difficulty.BEGINNER ? 45 : difficulty === Difficulty.INTERMEDIATE ? 35 : 25;
  const TOTAL_TIME = getTimeLimit();
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const isMountedRef = useRef(true);
  const mistakeTracker = useRef<string[]>([]);

  useEffect(() => {
    isMountedRef.current = true;
    startMusic('SWITCH');
    generateNext();
    return () => { isMountedRef.current = false; stopMusic(); };
  }, []);

  const generateNext = () => {
    const vowels = ['A', 'E', 'I', 'U', 'O'];
    const consonants = ['B', 'C', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'R', 'S', 'T'];
    const newChar = Math.random() > 0.5 ? vowels[Math.floor(Math.random() * vowels.length)] : consonants[Math.floor(Math.random() * consonants.length)];
    const newNum = Math.floor(Math.random() * 9) + 1;
    setChar(newChar); setNum(newNum); setFeedback(null);
    const flipChance = difficulty === Difficulty.BEGINNER ? 0.2 : difficulty === Difficulty.INTERMEDIATE ? 0.5 : 0.8;
    if (Math.random() < flipChance) { playSound('switch'); setCurrentRule(prev => prev === 'VOWEL' ? 'EVEN' : 'VOWEL'); }
  };

  const handleFinish = useCallback(() => {
    if (!isMountedRef.current) return;
    setGameActive(false); playSound('win'); stopMusic();
    onEndGame({ score, totalQuestions: questionsAnswered, correctAnswers, accuracy: questionsAnswered > 0 ? (correctAnswers / questionsAnswered) * 100 : 0, duration: (TOTAL_TIME - timeLeft) * 1000, difficulty, gameMode: GameMode.TASK_SWITCH, mistakePatterns: mistakeTracker.current });
  }, [questionsAnswered, correctAnswers, score, timeLeft, difficulty, onEndGame]);

  useEffect(() => { if (!isPracticeMode && introFinished && gameActive && !showTutorial && !showQuitModal && timeLeft > 0) { const timer = setInterval(() => setTimeLeft(t => Math.max(0, t - 0.1)), 100); return () => clearInterval(timer); } }, [introFinished, gameActive, showTutorial, showQuitModal, timeLeft, isPracticeMode]);
  useEffect(() => { if (!isPracticeMode && timeLeft <= 0 && gameActive && introFinished) handleFinish(); }, [timeLeft, gameActive, introFinished, handleFinish, isPracticeMode]);

  const handleAnswer = (userSaysYes: boolean) => {
    if (!gameActive) return;
    setQuestionsAnswered(p => p + 1);
    let isCorrect = false;
    if (currentRule === 'VOWEL') isCorrect = userSaysYes === ['A', 'E', 'I', 'U', 'O'].includes(char);
    else isCorrect = userSaysYes === (num % 2 === 0);

    if (isCorrect) { setScore(s => s + 100 + (difficulty === Difficulty.ADVANCED ? 25 : 0)); setCorrectAnswers(c => c + 1); playSound('pop'); setFeedback('CORRECT'); if (Math.random() > 0.9) setShowConfetti(true); } 
    else { playSound('wrong'); setScore(s => Math.max(0, s - 30)); setFeedback('WRONG'); mistakeTracker.current.push("Switch Error"); }
    setTimeout(() => { if(isMountedRef.current) generateNext(); }, 200);
  };

  return (
    <div className="w-full max-w-lg mx-auto relative">
      {!introFinished && <GameIntro gameMode={GameMode.TASK_SWITCH} onStart={() => { playSound('click'); setIntroFinished(true); setShowTutorial(true); }} />}
      {showConfetti && <Confetti />}
      <TutorialOverlay isOpen={showTutorial} onClose={() => setShowTutorial(false)} title="Quantum Switch" content={["Perhatikan PERINTAH di atas.", "Jawab YA/TIDAK sesuai aturan aktif.", "Aturan bisa berubah tiba-tiba!"]} icon={<Shuffle className="w-6 h-6" />} />
      <QuitModal isOpen={showQuitModal} onConfirm={() => { setShowQuitModal(false); onBack(); }} onCancel={() => setShowQuitModal(false)} />

      <div className="flex justify-between items-center mb-6">
         <div className="flex gap-2"><Button variant="ghost" onClick={() => isPracticeMode ? handleFinish() : setShowQuitModal(true)} className="!px-3 text-sm">&larr; Exit</Button><Tooltip text="ATURAN MAIN"><Button variant="ghost" onClick={() => setShowTutorial(true)} className="!px-3 text-neuro-400"><HelpCircle className="w-5 h-5" /></Button></Tooltip></div>
         <Badge color="bg-retro-cyan">Score: {score}</Badge>
      </div>

      <Card className="flex flex-col items-center min-h-[450px] p-6 md:p-8">
         <CountdownBar totalTime={TOTAL_TIME} timeLeft={timeLeft} isPracticeMode={isPracticeMode} />
         
         <div className={`w-full py-5 mb-8 rounded-lg border-4 shadow-lg flex items-center justify-center gap-3 transition-colors duration-300 ${currentRule === 'VOWEL' ? 'bg-blue-900 border-blue-400 text-blue-300' : 'bg-orange-900 border-orange-400 text-orange-300'}`}>
             {currentRule === 'VOWEL' ? <Type className="w-8 h-8" /> : <Hash className="w-8 h-8" />}
             <span className="font-pixel text-xl md:text-2xl animate-pulse tracking-wider shadow-glow">{currentRule === 'VOWEL' ? 'HURUF VOKAL?' : 'ANGKA GENAP?'}</span>
         </div>

         <div className="relative w-64 h-64 bg-slate-800 rounded-2xl border-4 border-white flex items-center justify-center mb-10 shadow-[0_0_30px_rgba(255,255,255,0.2)]">
             <div className="text-8xl font-black text-white font-mono tracking-widest flex gap-4">
                 <span className={currentRule === 'VOWEL' ? 'text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.8)]' : 'text-slate-600 blur-[2px]'}>{char}</span>
                 <span className={currentRule === 'EVEN' ? 'text-orange-400 drop-shadow-[0_0_10px_rgba(251,146,60,0.8)]' : 'text-slate-600 blur-[2px]'}>{num}</span>
             </div>
             {feedback && <div className={`absolute inset-0 flex items-center justify-center rounded-xl bg-black/60 backdrop-blur-sm animate-scale-in z-20`}>{feedback === 'CORRECT' ? <Check className="w-32 h-32 text-emerald-500 drop-shadow-lg" /> : <X className="w-32 h-32 text-red-500 drop-shadow-lg" />}</div>}
         </div>

         <div className="grid grid-cols-2 gap-6 w-full mt-auto">
            <Button variant="danger" className="h-24 text-2xl border-b-8 active:border-b-0 active:translate-y-2 rounded-xl" onClick={() => handleAnswer(false)}><X className="w-8 h-8 mr-3" /> TIDAK</Button>
            <Button variant="primary" className="h-24 text-2xl border-b-8 active:border-b-0 active:translate-y-2 rounded-xl bg-emerald-600 border-emerald-800 hover:bg-emerald-500" onClick={() => handleAnswer(true)}><Check className="w-8 h-8 mr-3" /> YA</Button>
         </div>
      </Card>
    </div>
  );
};
export default TaskSwitchGame;
