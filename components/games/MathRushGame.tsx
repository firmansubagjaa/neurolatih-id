import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Difficulty, GameResult, GameMode } from '../../types';
import { startMusic, stopMusic, playSound } from '../../services/audioService';
import { Button, Card, Badge, Tooltip } from '../Shared';
import { TutorialOverlay } from '../TutorialOverlay';
import { QuitModal } from '../QuitModal';
import { Confetti } from '../Confetti';
import { CountdownBar } from '../CountdownBar';
import { GameIntro } from '../GameIntro';
import { Calculator, HelpCircle } from 'lucide-react';

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
  const [problem, setProblem] = useState({ text: "", answer: 0 });
  const [options, setOptions] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  
  const [showTutorial, setShowTutorial] = useState(false);
  const [showQuitModal, setShowQuitModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Reaction Time Tracking
  const questionStartTimeRef = useRef<number>(0);
  const reactionTimesRef = useRef<number[]>([]);

  // Difficulty Scaling: Time Limit
  const getTimeLimit = () => {
    switch (difficulty) {
      case Difficulty.BEGINNER: return 60;
      case Difficulty.INTERMEDIATE: return 45;
      case Difficulty.ADVANCED: return 30;
      default: return 60;
    }
  };
  const TOTAL_TIME = getTimeLimit(); 
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    startMusic('FOCUS');
    generateProblem();
    return () => {
      isMountedRef.current = false;
      stopMusic();
    };
  }, []);

  const generateProblem = () => {
    // Record start time for agility calculation
    questionStartTimeRef.current = Date.now();

    let num1, num2, op, ans;
    
    // Difficulty Scaling: Operations and Number Range
    let ops = ['+', '-'];
    if (difficulty === Difficulty.INTERMEDIATE) ops = ['+', '-', '*'];
    if (difficulty === Difficulty.ADVANCED) ops = ['+', '-', '*', '/'];

    const limit = difficulty === Difficulty.BEGINNER ? 10 : difficulty === Difficulty.INTERMEDIATE ? 50 : 100;
    
    op = ops[Math.floor(Math.random() * ops.length)];
    
    num1 = Math.floor(Math.random() * limit) + 2;
    num2 = Math.floor(Math.random() * limit) + 2;

    if (op === '-') {
        if (num1 < num2) [num1, num2] = [num2, num1]; // Ensure positive
    }
    if (op === '*') {
        const multLimit = difficulty === Difficulty.INTERMEDIATE ? 10 : 12;
        num1 = Math.floor(Math.random() * multLimit) + 2; 
        num2 = Math.floor(Math.random() * multLimit) + 2;
    }
    if (op === '/') {
        // Create clean division
        num2 = Math.floor(Math.random() * 12) + 2;
        const result = Math.floor(Math.random() * 10) + 2;
        num1 = num2 * result;
    }

    switch(op) {
        case '+': ans = num1 + num2; break;
        case '-': ans = num1 - num2; break;
        case '*': ans = num1 * num2; break;
        case '/': ans = num1 / num2; break;
        default: ans = 0;
    }

    setProblem({ text: `${num1} ${op} ${num2}`, answer: ans });

    // Generate Distractors
    const opts = new Set<number>();
    opts.add(ans);
    while (opts.size < 4) {
        let fake = ans + (Math.floor(Math.random() * 10) - 5);
        if (fake === ans) fake = ans + 1;
        opts.add(fake);
    }
    setOptions(Array.from(opts).sort(() => Math.random() - 0.5));
  };

  const handleFinish = useCallback(() => {
    if (!isMountedRef.current) return;
    setGameActive(false);
    playSound(score > 500 ? 'win' : 'click');
    stopMusic();
    
    const accuracy = questionsAnswered > 0 ? (correctAnswers / questionsAnswered) * 100 : 0;

    // Calculate Average Reaction Time
    let avgReaction = 0;
    if (reactionTimesRef.current.length > 0) {
        const sum = reactionTimesRef.current.reduce((a, b) => a + b, 0);
        avgReaction = sum / reactionTimesRef.current.length;
    }

    onEndGame({
      score: score,
      totalQuestions: questionsAnswered,
      correctAnswers: correctAnswers,
      accuracy: accuracy,
      duration: (TOTAL_TIME - timeLeft) * 1000,
      difficulty: difficulty,
      gameMode: GameMode.MATH_RUSH,
      averageReactionTime: avgReaction // Send to result logic
    });
  }, [questionsAnswered, correctAnswers, score, timeLeft, difficulty, onEndGame, TOTAL_TIME]);

  useEffect(() => {
    if (!isPracticeMode && introFinished && gameActive && !showTutorial && !showQuitModal && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(t => Math.max(0, t - 0.1));
      }, 100);
      return () => clearInterval(timer);
    }
  }, [introFinished, gameActive, showTutorial, showQuitModal, timeLeft, isPracticeMode]);

  useEffect(() => {
    if (!isPracticeMode && timeLeft <= 0 && gameActive && introFinished) {
      handleFinish();
    }
  }, [timeLeft, gameActive, introFinished, handleFinish, isPracticeMode]);

  const handleAnswer = (val: number) => {
    if (!gameActive) return;
    
    // Calculate Agility
    const reactionTime = Date.now() - questionStartTimeRef.current;
    reactionTimesRef.current.push(reactionTime);

    setQuestionsAnswered(p => p + 1);
    
    if (val === problem.answer) {
        setScore(s => s + 50 + (difficulty === Difficulty.ADVANCED ? 50 : 0));
        setCorrectAnswers(c => c + 1);
        playSound('pop');
        if (Math.random() > 0.8) setShowConfetti(true);
    } else {
        playSound('wrong');
        setScore(s => Math.max(0, s - 20)); // Penalty
    }
    generateProblem();
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
    <div className="w-full max-w-xl mx-auto relative">
      {!introFinished && (
        <GameIntro 
          gameMode={GameMode.MATH_RUSH} 
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
        title="Cara Bermain: Math Rush"
        content={[
          "Hitung secepat kilat.",
          "Waktu sangat terbatas.",
          ...(isQuickMode ? ["MODE CEPAT: Waktu menipis 2x lebih cepat!"] : []),
          "Kecepatan Anda diukur!",
        ]}
        icon={<Calculator className="w-6 h-6" />}
      />
      <QuitModal isOpen={showQuitModal} onConfirm={() => { setShowQuitModal(false); onBack(); }} onCancel={() => setShowQuitModal(false)} />

      <div className="flex justify-between items-center mb-6">
         <div className="flex gap-2">
            <Button variant="ghost" onClick={handleBackRequest} className="!px-3 text-sm">&larr; {isPracticeMode ? "Selesai" : "Keluar"}</Button>
            <Tooltip text="ATURAN MAIN">
                <Button variant="ghost" onClick={() => setShowTutorial(true)} className="!px-3 text-neuro-400"><HelpCircle className="w-5 h-5" /></Button>
            </Tooltip>
         </div>
         <Badge color="bg-retro-cyan">Score: {score}</Badge>
      </div>

      <Card className="flex flex-col items-center p-6 md:p-8">
         <CountdownBar totalTime={TOTAL_TIME} timeLeft={timeLeft} isPracticeMode={isPracticeMode} />
         
         <div className="flex-1 w-full flex flex-col items-center justify-center min-h-[180px] mb-8 bg-slate-800 rounded-xl border-4 border-slate-600 relative overflow-hidden">
            <div className="text-6xl md:text-8xl font-black text-white font-mono tracking-widest">{problem.text}</div>
            <div className="text-base text-slate-500 mt-4 font-pixel">CALCULATE_NOW</div>
         </div>

         <div className="grid grid-cols-2 gap-4 md:gap-6 w-full">
            {options.map((opt, idx) => (
                <button
                    key={idx}
                    onClick={() => handleAnswer(opt)}
                    className="py-6 md:py-8 rounded-xl bg-slate-800 border-b-4 border-slate-900 active:border-b-0 active:translate-y-1 hover:bg-slate-700 text-3xl md:text-5xl font-mono font-bold text-retro-cyan transition-colors"
                >
                    {opt}
                </button>
            ))}
         </div>
      </Card>
    </div>
  );
};

export default MathRushGame;
