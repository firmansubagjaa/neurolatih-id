
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
  
  // Game State
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

  const TOTAL_TIME = 45;
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const isMountedRef = useRef(true);

  // Analysis
  const mistakeTracker = useRef<string[]>([]);

  useEffect(() => {
    isMountedRef.current = true;
    startMusic('FOCUS'); // Intense music
    generateNext();
    return () => {
      isMountedRef.current = false;
      stopMusic();
    };
  }, []);

  const generateNext = () => {
    // Generate Stimulus
    const vowels = ['A', 'E', 'I', 'U', 'O'];
    const consonants = ['B', 'C', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'R', 'S', 'T'];
    
    // 50% chance for vowel, 50% consonant
    const newChar = Math.random() > 0.5 
        ? vowels[Math.floor(Math.random() * vowels.length)] 
        : consonants[Math.floor(Math.random() * consonants.length)];
        
    const newNum = Math.floor(Math.random() * 9) + 1; // 1-9
    
    setChar(newChar);
    setNum(newNum);
    setFeedback(null);

    // Determine Rule
    // Difficulty Logic:
    // Beginner: Rule stays same for longer runs
    // Advanced: Rule flips almost every turn
    const flipChance = difficulty === Difficulty.BEGINNER ? 0.2 : difficulty === Difficulty.INTERMEDIATE ? 0.5 : 0.8;
    
    if (Math.random() < flipChance) {
        setCurrentRule(prev => prev === 'VOWEL' ? 'EVEN' : 'VOWEL');
    }
  };

  const handleFinish = useCallback(() => {
    if (!isMountedRef.current) return;
    setGameActive(false);
    playSound('win');
    stopMusic();
    
    const accuracy = questionsAnswered > 0 ? (correctAnswers / questionsAnswered) * 100 : 0;

    onEndGame({
      score: score,
      totalQuestions: questionsAnswered,
      correctAnswers: correctAnswers,
      accuracy: accuracy,
      duration: (TOTAL_TIME - timeLeft) * 1000,
      difficulty: difficulty,
      gameMode: GameMode.TASK_SWITCH,
      mistakePatterns: mistakeTracker.current
    });
  }, [questionsAnswered, correctAnswers, score, timeLeft, difficulty, onEndGame]);

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

  const handleAnswer = (userSaysYes: boolean) => {
    if (!gameActive) return;
    setQuestionsAnswered(p => p + 1);

    let isCorrect = false;
    let correctAnswer = false;

    if (currentRule === 'VOWEL') {
        const isVowel = ['A', 'E', 'I', 'U', 'O'].includes(char);
        correctAnswer = isVowel;
    } else {
        const isEven = num % 2 === 0;
        correctAnswer = isEven;
    }

    isCorrect = userSaysYes === correctAnswer;

    if (isCorrect) {
        setScore(s => s + 100 + (difficulty === Difficulty.ADVANCED ? 25 : 0));
        setCorrectAnswers(c => c + 1);
        playSound('pop');
        setFeedback('CORRECT');
        if (Math.random() > 0.9) setShowConfetti(true);
    } else {
        playSound('wrong');
        setScore(s => Math.max(0, s - 30));
        setFeedback('WRONG');
        
        if (currentRule === 'VOWEL') {
             mistakeTracker.current.push("Gagal Aturan Huruf");
        } else {
             mistakeTracker.current.push("Gagal Aturan Angka");
        }
    }
    
    // Slight delay for feedback visibility
    setTimeout(() => {
        if(isMountedRef.current) generateNext();
    }, 200);
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
          gameMode={GameMode.TASK_SWITCH} 
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
        title="Cara Bermain: Quantum Switch"
        content={[
          "Perhatikan PERINTAH di atas kartu.",
          "Jika perintahnya 'HURUF VOKAL?', jawab YA jika hurufnya A/I/U/E/O.",
          "Jika perintahnya 'ANGKA GENAP?', jawab YA jika angkanya 2/4/6/8.",
          "Waspada! Perintah berubah tiba-tiba."
        ]}
        icon={<Shuffle className="w-6 h-6" />}
      />
      <QuitModal isOpen={showQuitModal} onConfirm={() => { setShowQuitModal(false); onBack(); }} onCancel={() => setShowQuitModal(false)} />

      <div className="flex justify-between items-center mb-4">
         <div className="flex gap-2">
            <Button variant="ghost" onClick={handleBackRequest} className="!px-2">&larr; {isPracticeMode ? "Selesai" : "Keluar"}</Button>
            <Tooltip text="ATURAN MAIN">
                <Button variant="ghost" onClick={() => setShowTutorial(true)} className="!px-2 text-neuro-400"><HelpCircle className="w-5 h-5" /></Button>
            </Tooltip>
         </div>
         <Badge color="bg-retro-cyan">Score: {score}</Badge>
      </div>

      <Card className="flex flex-col items-center min-h-[400px]">
         <CountdownBar totalTime={TOTAL_TIME} timeLeft={timeLeft} isPracticeMode={isPracticeMode} />
         
         {/* RULE INDICATOR */}
         <div className={`w-full py-4 mb-6 rounded-lg border-2 flex items-center justify-center gap-3 transition-colors duration-300 ${
             currentRule === 'VOWEL' 
             ? 'bg-blue-900/40 border-blue-400 text-blue-300' 
             : 'bg-orange-900/40 border-orange-400 text-orange-300'
         }`}>
             {currentRule === 'VOWEL' ? <Type className="w-6 h-6" /> : <Hash className="w-6 h-6" />}
             <span className="font-pixel text-sm md:text-lg animate-pulse">
                 {currentRule === 'VOWEL' ? 'HURUF VOKAL?' : 'ANGKA GENAP?'}
             </span>
         </div>

         {/* STIMULUS CARD */}
         <div className="relative w-48 h-48 md:w-56 md:h-56 bg-slate-800 rounded-2xl border-4 border-slate-600 flex items-center justify-center mb-8 shadow-2xl">
             <div className="text-6xl md:text-7xl font-black text-white font-mono tracking-widest flex gap-4">
                 <span className={currentRule === 'VOWEL' ? 'text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.8)]' : 'text-slate-500'}>{char}</span>
                 <span className={currentRule === 'EVEN' ? 'text-orange-400 drop-shadow-[0_0_10px_rgba(251,146,60,0.8)]' : 'text-slate-500'}>{num}</span>
             </div>
             
             {feedback && (
                <div className={`absolute inset-0 flex items-center justify-center rounded-xl bg-black/60 backdrop-blur-sm animate-fade-in z-10`}>
                    {feedback === 'CORRECT' 
                        ? <Check className="w-24 h-24 text-emerald-500 drop-shadow-lg" />
                        : <X className="w-24 h-24 text-red-500 drop-shadow-lg" />
                    }
                </div>
             )}
         </div>

         {/* CONTROLS */}
         <div className="grid grid-cols-2 gap-4 w-full mt-auto">
            <Button 
                variant="danger" 
                className="h-16 text-lg border-red-500/50 bg-red-900/20 hover:bg-red-900/40 text-red-100"
                onClick={() => handleAnswer(false)}
            >
                <X className="w-5 h-5 mr-2" /> TIDAK
            </Button>
            <Button 
                variant="primary" 
                className="h-16 text-lg border-emerald-500/50 bg-emerald-900/20 hover:bg-emerald-900/40 text-emerald-100"
                onClick={() => handleAnswer(true)}
            >
                <Check className="w-5 h-5 mr-2" /> YA
            </Button>
         </div>
         
         <p className="text-xs text-slate-500 mt-4 text-center">
             Jawab sesuai aturan yang sedang aktif di atas.
         </p>
      </Card>
    </div>
  );
};

export default TaskSwitchGame;
