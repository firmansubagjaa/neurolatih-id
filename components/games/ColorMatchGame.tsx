
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Difficulty, GameResult, GameMode } from '../../types';
import { startMusic, stopMusic, playSound } from '../../services/audioService';
import { Button, Card, Badge, Tooltip } from '../Shared';
import { TutorialOverlay } from '../TutorialOverlay';
import { QuitModal } from '../QuitModal';
import { Confetti } from '../Confetti';
import { CountdownBar } from '../CountdownBar';
import { GameIntro } from '../GameIntro';
import { Eye, HelpCircle } from 'lucide-react';

interface ColorMatchGameProps {
  difficulty: Difficulty;
  onEndGame: (result: GameResult) => void;
  onBack: () => void;
  isQuickMode?: boolean;
  isPracticeMode?: boolean;
}

const COLORS = [
  { name: 'MERAH', value: '#ef4444', label: 'red' },
  { name: 'BIRU', value: '#3b82f6', label: 'blue' },
  { name: 'HIJAU', value: '#10b981', label: 'green' },
  { name: 'KUNING', value: '#f59e0b', label: 'yellow' },
  { name: 'UNGU', value: '#8b5cf6', label: 'purple' },
];

const ColorMatchGame: React.FC<ColorMatchGameProps> = ({ difficulty, onEndGame, onBack, isQuickMode = false, isPracticeMode = false }) => {
  const [introFinished, setIntroFinished] = useState(false);
  const [gameActive, setGameActive] = useState(true);
  
  const [currentWord, setCurrentWord] = useState(COLORS[0]);
  const [inkColor, setInkColor] = useState(COLORS[1]);
  const [options, setOptions] = useState<typeof COLORS>([]);
  
  const [score, setScore] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  
  const [showTutorial, setShowTutorial] = useState(false);
  const [showQuitModal, setShowQuitModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // MISTAKE TRACKER
  const mistakeTracker = useRef<string[]>([]);

  // Timer
  const TOTAL_TIME = 45;
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  
  // Audio & Timer Refs
  const isMountedRef = useRef(true);

  // 1. Setup & Music
  useEffect(() => {
    isMountedRef.current = true;
    startMusic('PLAYFUL');
    nextRound();
    return () => {
      isMountedRef.current = false;
      stopMusic();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Handle Finish Logic (Memoized)
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
      gameMode: GameMode.COLOR_MATCH,
      mistakePatterns: mistakeTracker.current
    });
  }, [questionsAnswered, correctAnswers, score, timeLeft, difficulty, onEndGame]);

  // 3. Timer Tick
  useEffect(() => {
    // Disabled in Practice Mode
    if (!isPracticeMode && introFinished && gameActive && !showTutorial && !showQuitModal && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => Math.max(0, prev - 0.1));
      }, 100);
      return () => clearInterval(timer);
    }
  }, [introFinished, gameActive, showTutorial, showQuitModal, timeLeft, isPracticeMode]);

  // 4. Watch for Time Over
  useEffect(() => {
    if (!isPracticeMode && timeLeft <= 0 && gameActive && introFinished) {
      handleFinish();
    }
  }, [timeLeft, gameActive, introFinished, handleFinish, isPracticeMode]);

  const nextRound = () => {
    const wordIdx = Math.floor(Math.random() * COLORS.length);
    let colorIdx = Math.floor(Math.random() * COLORS.length);
    
    // Ensure Stroop effect (mismatch) happens frequently for training
    if (Math.random() > 0.2 && colorIdx === wordIdx) {
        colorIdx = (colorIdx + 1) % COLORS.length;
    }

    const correct = COLORS[colorIdx];
    
    // Generate Options
    let roundOptions = [correct];
    while (roundOptions.length < 4) {
        const r = COLORS[Math.floor(Math.random() * COLORS.length)];
        if (!roundOptions.find(o => o.label === r.label)) {
            roundOptions.push(r);
        }
    }
    // Shuffle options
    roundOptions = roundOptions.sort(() => Math.random() - 0.5);

    setCurrentWord(COLORS[wordIdx]);
    setInkColor(COLORS[colorIdx]);
    setOptions(roundOptions);
  };

  const handleAnswer = (selectedColorLabel: string) => {
    if (!gameActive || (!isPracticeMode && timeLeft <= 0)) return;
    setQuestionsAnswered(prev => prev + 1);

    if (selectedColorLabel === inkColor.label) {
      // Correct
      setScore(s => s + 100 + (difficulty === Difficulty.ADVANCED ? 50 : 0));
      setCorrectAnswers(c => c + 1);
      playSound('pop');
      if (Math.random() > 0.8) setShowConfetti(true);
    } else {
      // Wrong
      playSound('wrong');
      setScore(s => Math.max(0, s - 50));
      
      // Analyze Mistake Type
      if (selectedColorLabel === currentWord.label) {
          mistakeTracker.current.push("Stroop Interference (Membaca Teks)");
      } else {
          mistakeTracker.current.push("Salah Identifikasi Warna");
      }
    }
    
    nextRound();
  };

  const handleBackRequest = () => {
    playSound('click');
    if (isPracticeMode) {
      handleFinish();
    } else {
      setShowQuitModal(true);
    }
  };

  if (!gameActive) return null;

  return (
    <div className="w-full max-w-lg mx-auto relative">
      {!introFinished && (
        <GameIntro 
          gameMode={GameMode.COLOR_MATCH} 
          onStart={() => {
            playSound('click');
            setIntroFinished(true);
            setShowTutorial(true); // Tutorial triggered
          }} 
        />
      )}

      {showConfetti && <Confetti />}
      <TutorialOverlay 
        isOpen={showTutorial} 
        onClose={() => setShowTutorial(false)}
        title="Cara Bermain: Fokus Warna (Stroop)"
        content={[
          "Abaikan TULISAN katanya.",
          "Fokus pada WARNA tintanya.",
          "Jika tulisan 'MERAH' tapi berwarna BIRU, tekan tombol BIRU.",
          "Melatih Inhibisi (menekan respon otomatis)."
        ]}
        icon={<Eye className="w-6 h-6" />}
      />

      <QuitModal 
        isOpen={showQuitModal}
        onConfirm={() => { setShowQuitModal(false); onBack(); }}
        onCancel={() => setShowQuitModal(false)}
      />

       <div className="flex justify-between items-center mb-4 md:mb-6">
         <div className="flex gap-2">
            <Button variant="ghost" onClick={handleBackRequest} className="!px-2 text-sm">&larr; {isPracticeMode ? "Selesai" : "Keluar"}</Button>
            <Tooltip text="ATURAN MAIN">
                <Button variant="ghost" onClick={() => setShowTutorial(true)} className="!px-2 text-neuro-400">
                    <HelpCircle className="w-5 h-5" />
                </Button>
            </Tooltip>
         </div>
         <Badge color="bg-pink-500">Stroop</Badge>
      </div>

      <Card className="flex flex-col items-center">
         <CountdownBar totalTime={TOTAL_TIME} timeLeft={timeLeft} isPracticeMode={isPracticeMode} />

         {!isPracticeMode && (
           <div className="flex justify-center mb-6">
             <div className={`text-5xl md:text-6xl font-mono font-bold tracking-tighter transition-all duration-300 ${
                timeLeft <= 10 ? 'text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)] animate-pulse scale-110' : 
                timeLeft <= 20 ? 'text-yellow-400' : 'text-white'
             }`}>
               {timeLeft.toFixed(1)}
             </div>
          </div>
         )}

         <div className="flex-1 w-full flex flex-col items-center justify-center min-h-[160px] md:min-h-[200px] mb-6 bg-slate-800/50 rounded-2xl border border-white/5 relative overflow-hidden px-2">
             <div className="text-[10px] md:text-xs text-slate-500 uppercase tracking-widest font-bold mb-4">Warna Apa Ini?</div>
             <h1 
                className="text-5xl sm:text-6xl md:text-8xl font-black tracking-tight drop-shadow-2xl transition-all duration-200 transform hover:scale-105 break-all text-center"
                style={{ color: inkColor.value, textShadow: `0 0 30px ${inkColor.value}40` }}
             >
                {currentWord.name}
             </h1>
         </div>

         <div className="grid grid-cols-2 gap-3 w-full">
            {options.map((opt, idx) => (
                <button
                    key={idx}
                    onClick={() => handleAnswer(opt.label)}
                    disabled={(!isPracticeMode && timeLeft <= 0)}
                    className="py-4 md:py-6 rounded-xl bg-slate-800 border-2 border-slate-700 hover:border-white/50 hover:bg-slate-700 transition-all active:scale-95 font-bold text-sm md:text-lg text-white shadow-lg relative overflow-hidden group"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 transform -translate-x-full group-hover:translate-x-full transition-transform duration-500"></div>
                    {opt.name}
                </button>
            ))}
         </div>
         
         <div className="mt-4 md:mt-6 flex justify-between w-full text-[10px] md:text-xs text-slate-500 px-2">
            <span>Benar: {correctAnswers}</span>
            <span>Total: {questionsAnswered}</span>
         </div>
      </Card>
    </div>
  );
};

export default ColorMatchGame;
